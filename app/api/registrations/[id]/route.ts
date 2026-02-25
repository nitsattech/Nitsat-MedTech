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

    const changes = await runUpdate(
      'UPDATE patient_registrations SET status = ?, discharge_date = ? WHERE id = ?',
      [status, dischargeDate, id]
    );

    if (!changes) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const updated = await runQuery(
      `SELECT pr.*, p.uhid, p.first_name, p.last_name, p.phone
       FROM patient_registrations pr
       LEFT JOIN patients p ON p.id = pr.patient_id
       WHERE pr.id = ?`,
      [id]
    );

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
  }
}
