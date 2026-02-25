import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, runQuery, runUpdate } from '@/lib/db';


async function ensureDischargeWorkflowColumns() {
  const columns = await runQuery<{ name: string }>(`PRAGMA table_info(patient_registrations)`);
  const names = new Set(columns.map((column) => column.name));

  if (!names.has('pharmacy_clearance')) {
    await runUpdate(`ALTER TABLE patient_registrations ADD COLUMN pharmacy_clearance INTEGER DEFAULT 0`);
  }

  if (!names.has('doctor_summary_complete')) {
    await runUpdate(`ALTER TABLE patient_registrations ADD COLUMN doctor_summary_complete INTEGER DEFAULT 0`);
  }
}


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    await ensureDischargeWorkflowColumns();

    const { id } = await params;
    const body = await request.json();

    const existingRegs = await runQuery<any>('SELECT * FROM patient_registrations WHERE id = ?', [id]);
    if (!existingRegs.length) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (body.action === 'update-clearance') {
      const pharmacyClearance = body.pharmacy_clearance ? 1 : 0;
      const doctorSummaryComplete = body.doctor_summary_complete ? 1 : 0;

      await runUpdate(
        `UPDATE patient_registrations
         SET pharmacy_clearance = ?, doctor_summary_complete = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [pharmacyClearance, doctorSummaryComplete, id]
      );

      const updatedClearance = await runQuery(
        `SELECT pr.id, pr.status, pr.pharmacy_clearance, pr.doctor_summary_complete,
                b.bill_number, b.status as bill_status, b.amount_due
         FROM patient_registrations pr
         LEFT JOIN billing b ON b.registration_id = pr.id
         WHERE pr.id = ?
         ORDER BY b.created_at DESC
         LIMIT 1`,
        [id]
      );

      return NextResponse.json(updatedClearance[0]);
    }

    const status = body.status || 'Discharged';
    const dischargeDate = body.discharge_date || new Date().toISOString().slice(0, 10);

    const registration = existingRegs[0];
    const pharmacyClearance = Number(registration.pharmacy_clearance || 0) === 1;
    const doctorSummaryComplete = Number(registration.doctor_summary_complete || 0) === 1;

    const bills = await runQuery<any>(
      'SELECT * FROM billing WHERE registration_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    if (!bills.length) {
      return NextResponse.json(
        { error: 'Bill is not created for this patient. Please create and settle the bill before discharge.' },
        { status: 400 }
      );
    }

    const bill = bills[0];
    const amountDue = Number(bill.amount_due || 0);
    const billingPaid = bill.status === 'Paid' && amountDue <= 0;

    if (!pharmacyClearance || !doctorSummaryComplete || !billingPaid) {
      return NextResponse.json(
        {
          error: 'Discharge checklist incomplete. Please complete pharmacy clearance, doctor summary, and full billing payment.',
          checklist: {
            pharmacy_clearance: pharmacyClearance,
            doctor_summary_complete: doctorSummaryComplete,
            billing_status: bill.status,
            amount_due: amountDue,
          },
        },
        { status: 400 }
      );
    }

    await runUpdate(
      'UPDATE patient_registrations SET status = ?, discharge_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, dischargeDate, id]
    );

    const updated = await runQuery(
      `SELECT pr.*, p.uhid, p.first_name, p.last_name, p.phone,
              b.bill_number, b.total_amount as bill_total_amount,
              b.deposit_paid as bill_deposit_paid, b.amount_due as bill_amount_due, b.status as bill_status
       FROM patient_registrations pr
       LEFT JOIN patients p ON p.id = pr.patient_id
       LEFT JOIN billing b ON b.registration_id = pr.id
       WHERE pr.id = ?
       ORDER BY b.created_at DESC
       LIMIT 1`,

      [id]
    );

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
  }
}
