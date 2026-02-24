import { NextRequest, NextResponse } from 'next/server';
import { runQuery, runInsert, runUpdate, initializeDatabase } from '@/lib/db';

// ── Helper: recalculate & update bill totals ──────────────────────────────────
async function recalcBill(billId: number) {
  const items = await runQuery<any>('SELECT * FROM bill_items WHERE bill_id = ?', [billId]);
  let medicine = 0, lab = 0, bed = 0, doctor = 0, other = 0;
  for (const item of items) {
    switch (item.category) {
      case 'medicine':   medicine += item.amount; break;
      case 'lab':        lab      += item.amount; break;
      case 'bed':        bed      += item.amount; break;
      case 'doctor':     doctor   += item.amount; break;
      default:           other    += item.amount; break;
    }
  }
  const subtotal = medicine + lab + bed + doctor + other;
  const bill = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [billId]);
  if (!bill.length) return;
  const gst_amount = parseFloat(((subtotal * (bill[0].gst_percent || 0)) / 100).toFixed(2));
  const total = parseFloat((subtotal + gst_amount).toFixed(2));
  const paid = bill[0].deposit_paid || 0;
  const due = parseFloat((total - paid).toFixed(2));
  const status = due <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
  await runUpdate(
    `UPDATE billing SET
       total_medicine_amount=?, total_investigation_amount=?, total_bed_amount=?,
       total_doctor_amount=?, total_other_amount=?, subtotal=?, gst_amount=?,
       total_amount=?, amount_due=?, status=?
     WHERE id=?`,
    [medicine, lab, bed, doctor, other, subtotal, gst_amount, total, Math.max(0, due), status, billId]
  );
  return await runQuery<any>('SELECT * FROM billing WHERE id = ?', [billId]);
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const sp = request.nextUrl.searchParams;
    const registrationId = sp.get('registrationId');
    const billId = sp.get('billId');

    if (billId) {
      const bills = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [billId]);
      if (!bills.length) return NextResponse.json(null);
      const items = await runQuery<any>('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY category, created_at', [billId]);
      const payments = await runQuery<any>('SELECT * FROM payments WHERE bill_id = ? ORDER BY payment_date', [billId]);
      return NextResponse.json({ bill: bills[0], items, payments });
    }

    if (registrationId) {
      const bills = await runQuery<any>('SELECT * FROM billing WHERE registration_id = ? ORDER BY created_at DESC', [registrationId]);
      return NextResponse.json(bills);
    }

    const bills = await runQuery<any>('SELECT * FROM billing ORDER BY created_at DESC LIMIT 50');
    return NextResponse.json(bills);
  } catch (error) {
    console.error('Billing GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { action } = body;

    // ── Create Bill ──────────────────────────────────────────────────────────
    if (action === 'create-bill') {
      const { registration_id, initial_deposit = 0, gst_percent = 0 } = body;
      if (!registration_id) return NextResponse.json({ error: 'Registration ID required' }, { status: 400 });

      // Check if bill already exists for this registration
      const existing = await runQuery<any>('SELECT id FROM billing WHERE registration_id = ?', [registration_id]);
      if (existing.length) return NextResponse.json({ error: 'Bill already exists for this registration. Use the existing bill.' }, { status: 400 });

      const count = await runQuery<any>('SELECT COUNT(*) as c FROM billing');
      const num = (count[0]?.c || 0) + 1;
      const year = new Date().getFullYear();
      const bill_number = `BILL-${year}-${String(num).padStart(4, '0')}`;
      const bill_date = new Date().toISOString().split('T')[0];

      const billId = await runInsert(
        `INSERT INTO billing (registration_id, bill_number, bill_date, gst_percent, deposit_paid,
           total_medicine_amount, total_investigation_amount, total_bed_amount, total_doctor_amount,
           total_other_amount, subtotal, gst_amount, total_amount, amount_due, status)
         VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?)`,
        [registration_id, bill_number, bill_date, gst_percent, initial_deposit,
         initial_deposit, Math.max(0, -initial_deposit), initial_deposit > 0 ? 'Partial' : 'Unpaid']
      );

      const bills = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [billId]);
      return NextResponse.json(bills[0], { status: 201 });
    }

    // ── Add Bill Item ────────────────────────────────────────────────────────
    if (action === 'add-item') {
      const {
        bill_id, category, name, description,
        quantity = 1, unit = '', rate, batch_number, expiry_date
      } = body;
      if (!bill_id || !name || !category || rate === undefined)
        return NextResponse.json({ error: 'bill_id, category, name, rate required' }, { status: 400 });

      const amount = parseFloat((parseFloat(quantity) * parseFloat(rate)).toFixed(2));
      const itemId = await runInsert(
        `INSERT INTO bill_items (bill_id, category, name, description, quantity, unit, rate, amount, batch_number, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [bill_id, category, name, description || null, quantity, unit, parseFloat(rate), amount,
         batch_number || null, expiry_date || null]
      );

      await recalcBill(bill_id);
      const item = await runQuery<any>('SELECT * FROM bill_items WHERE id = ?', [itemId]);
      const bill = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [bill_id]);
      return NextResponse.json({ item: item[0], bill: bill[0] }, { status: 201 });
    }

    // ── Edit Bill Item ───────────────────────────────────────────────────────
    if (action === 'edit-item') {
      const { item_id, name, description, quantity, unit, rate, batch_number, expiry_date } = body;
      if (!item_id) return NextResponse.json({ error: 'item_id required' }, { status: 400 });

      const existing = await runQuery<any>('SELECT * FROM bill_items WHERE id = ?', [item_id]);
      if (!existing.length) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

      const q = parseFloat(quantity ?? existing[0].quantity);
      const r = parseFloat(rate ?? existing[0].rate);
      const amount = parseFloat((q * r).toFixed(2));

      await runUpdate(
        `UPDATE bill_items SET name=?, description=?, quantity=?, unit=?, rate=?, amount=?, batch_number=?, expiry_date=? WHERE id=?`,
        [name ?? existing[0].name, description ?? existing[0].description, q, unit ?? existing[0].unit,
         r, amount, batch_number ?? existing[0].batch_number, expiry_date ?? existing[0].expiry_date, item_id]
      );

      await recalcBill(existing[0].bill_id);
      const bill = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [existing[0].bill_id]);
      const item = await runQuery<any>('SELECT * FROM bill_items WHERE id = ?', [item_id]);
      return NextResponse.json({ item: item[0], bill: bill[0] });
    }

    // ── Delete Bill Item ─────────────────────────────────────────────────────
    if (action === 'delete-item') {
      const { item_id } = body;
      if (!item_id) return NextResponse.json({ error: 'item_id required' }, { status: 400 });
      const existing = await runQuery<any>('SELECT * FROM bill_items WHERE id = ?', [item_id]);
      if (!existing.length) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      await runUpdate('DELETE FROM bill_items WHERE id = ?', [item_id]);
      await recalcBill(existing[0].bill_id);
      const bill = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [existing[0].bill_id]);
      return NextResponse.json({ success: true, bill: bill[0] });
    }

    // ── Add Payment ──────────────────────────────────────────────────────────
    if (action === 'add-payment') {
      const { bill_id, amount, payment_mode = 'Cash', reference_number } = body;
      if (!bill_id || !amount) return NextResponse.json({ error: 'bill_id and amount required' }, { status: 400 });

      const payment_date = new Date().toISOString().split('T')[0];
      const paymentId = await runInsert(
        `INSERT INTO payments (bill_id, amount, payment_mode, payment_date, reference_number) VALUES (?, ?, ?, ?, ?)`,
        [bill_id, parseFloat(amount), payment_mode, payment_date, reference_number || null]
      );

      const bill = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [bill_id]);
      if (bill.length) {
        const newPaid = parseFloat(bill[0].deposit_paid) + parseFloat(amount);
        const total = parseFloat(bill[0].total_amount);
        const newDue = Math.max(0, total - newPaid);
        const status = newDue <= 0 ? 'Paid' : 'Partial';
        await runUpdate('UPDATE billing SET deposit_paid=?, amount_due=?, status=? WHERE id=?',
          [newPaid, newDue, status, bill_id]);
      }

      const updatedBill = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [bill_id]);
      const payment = await runQuery<any>('SELECT * FROM payments WHERE id = ?', [paymentId]);
      return NextResponse.json({ payment: payment[0], bill: updatedBill[0] }, { status: 201 });
    }

    // ── Update GST ───────────────────────────────────────────────────────────
    if (action === 'update-gst') {
      const { bill_id, gst_percent } = body;
      if (bill_id === undefined) return NextResponse.json({ error: 'bill_id required' }, { status: 400 });
      await runUpdate('UPDATE billing SET gst_percent=? WHERE id=?', [parseFloat(gst_percent)||0, bill_id]);
      const updated = await recalcBill(bill_id);
      return NextResponse.json({ bill: updated?.[0] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Billing POST error:', error);
    return NextResponse.json({ error: 'Failed to process billing' }, { status: 500 });
  }
}