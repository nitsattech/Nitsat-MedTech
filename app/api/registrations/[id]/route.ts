import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, runQuery, runUpdate } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const body = await request.json();

    const status = body.status || 'Discharged';
    const dischargeDate = body.discharge_date || new Date().toISOString().slice(0, 10);

    const existingRegs = await runQuery<any>('SELECT * FROM patient_registrations WHERE id = ?', [id]);
    if (!existingRegs.length) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Professional discharge rule: discharge only after all dues are fully cleared.
    const bills = await runQuery<any>('SELECT * FROM billing WHERE registration_id = ? ORDER BY created_at DESC LIMIT 1', [id]);
    if (!bills.length) {
      return NextResponse.json(
        { error: 'Bill is not created for this patient. Please create and settle the bill before discharge.' },
        { status: 400 }
      );
    }

    const bill = bills[0];
    const amountDue = Number(bill.amount_due || 0);
    if (amountDue > 0) {
      return NextResponse.json(
        {
          error: `Pending due ₹${amountDue.toFixed(2)}. Please collect full payment before discharge.`,
          due_amount: amountDue,
          bill_number: bill.bill_number,
        },
        { status: 400 }
      );
    }

    await runUpdate(
      'UPDATE patient_registrations SET status = ?, discharge_date = ? WHERE id = ?',
      [status, dischargeDate, id]
    );

    const updated = await runQuery(
      `SELECT pr.*, p.uhid, p.first_name, p.last_name, p.phone,
              b.bill_number, b.total_amount as bill_total_amount,
              b.deposit_paid as bill_deposit_paid, b.amount_due as bill_amount_due, b.status as bill_status
       FROM patient_registrations pr
       LEFT JOIN patients p ON p.id = pr.patient_id
       LEFT JOIN billing b ON b.registration_id = pr.id
       WHERE pr.id = ?`,
      [id]
    );

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
  }
}
