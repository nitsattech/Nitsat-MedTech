import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, runInsert, runQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const sp = request.nextUrl.searchParams;
    const patientId = sp.get('patientId');
    const visitType = sp.get('visitType');
    const status = sp.get('status');
    const activeOnly = sp.get('activeOnly') === '1';

    let query = `SELECT pr.*, p.uhid, p.first_name, p.last_name, p.gender, p.date_of_birth,
                        d.name as dept_name,
                        b.total_amount as bill_total_amount,
                        b.deposit_paid as bill_deposit_paid,
                        b.amount_due as bill_amount_due,
                        b.status as bill_status
                 FROM patient_registrations pr
                 LEFT JOIN patients p ON p.id = pr.patient_id
                 LEFT JOIN departments d ON d.id = pr.department_id
                 LEFT JOIN billing b ON b.registration_id = pr.id
                 WHERE 1=1`;

    const params: any[] = [];
    if (patientId) {
      query += ` AND pr.patient_id = ?`;
      params.push(Number(patientId));
    }
    if (visitType) {
      query += ` AND pr.registration_type = ?`;
      params.push(visitType);
    }
    if (activeOnly) query += ` AND pr.status = 'Active'`;
    if (status) {
      query += ` AND pr.status = ?`;
      params.push(status);
    }
    query += ' ORDER BY pr.created_at DESC';

    const rows = await runQuery<any>(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('visits GET error', error);
    return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const {
      patient_id,
      registration_type = 'OPD',
      doctor_id,
      department_id,
      admission_date,
      admission_time,
      consultant_name,
      ward,
      bed_number,
      status = 'Active',
    } = body;

    if (!patient_id || !admission_date) {
      return NextResponse.json({ error: 'patient_id and admission_date are required' }, { status: 400 });
    }

    const id = await runInsert(
      `INSERT INTO patient_registrations (
        patient_id, registration_type, doctor_id, department_id,
        admission_date, admission_time, consultant_name,
        room_type, bed_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id,
        registration_type,
        doctor_id || null,
        department_id || null,
        admission_date,
        admission_time || null,
        consultant_name || null,
        ward || null,
        bed_number || null,
        status,
      ]
    );

    const rows = await runQuery<any>('SELECT * FROM patient_registrations WHERE id = ?', [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error('visits POST error', error);
    return NextResponse.json({ error: error?.message || 'Failed to create visit' }, { status: 500 });
  }
}
