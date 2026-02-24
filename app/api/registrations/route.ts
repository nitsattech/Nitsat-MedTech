import { NextRequest, NextResponse } from 'next/server';
import { runQuery, runInsert, PatientRegistration } from '@/lib/db';
import { initializeDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    let query = 'SELECT * FROM patient_registrations';
    let params: any[] = [];

    if (patientId) {
      query += ' WHERE patient_id = ?';
      params.push(patientId);
    }

    if (status) {
      if (params.length > 0) query += ' AND';
      else query += ' WHERE';
      query += ' status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const registrations = await runQuery<PatientRegistration>(query, params);
    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const {
      patient_id,
      registration_type = 'IPD',
      doctor_id,
      department_id,
      admission_date,
      admission_time,
      status = 'Active',
      provisional_diagnosis,
      procedure_treatment,
      comments,
      guardian_name,
      guardian_relation,
      guardian_phone,
      insurance_company,
      insurance_number,
      rate_list = 'COMMON',
      admission_source,
      room_type
    } = body;

    if (!patient_id || !admission_date) {
      return NextResponse.json(
        { error: 'Patient ID and admission date are required' },
        { status: 400 }
      );
    }

    const registrationId = await runInsert(
      `INSERT INTO patient_registrations (
        patient_id, registration_type, doctor_id, department_id, admission_date, admission_time,
        status, provisional_diagnosis, procedure_treatment, comments, guardian_name, guardian_relation,
        guardian_phone, insurance_company, insurance_number, rate_list, admission_source, room_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id, registration_type, doctor_id || null, department_id || null, admission_date, admission_time || null,
        status, provisional_diagnosis || null, procedure_treatment || null, comments || null, guardian_name || null,
        guardian_relation || null, guardian_phone || null, insurance_company || null, insurance_number || null,
        rate_list, admission_source || null, room_type || null
      ]
    );

    const registrations = await runQuery<PatientRegistration>(
      'SELECT * FROM patient_registrations WHERE id = ?',
      [registrationId]
    );

    return NextResponse.json(registrations[0], { status: 201 });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}
