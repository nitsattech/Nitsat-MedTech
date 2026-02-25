import { NextRequest, NextResponse } from 'next/server';
import { runQuery, runInsert, initializeDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const sp = request.nextUrl.searchParams;
    const patientId = sp.get('patientId');
    const status = sp.get('status');
    const type = sp.get('type');
    const date = sp.get('date');
    const limit = sp.get('limit') || '200';

    let query = `SELECT 
  pr.*, 
  p.uhid, 
  p.first_name, 
  p.last_name, 
  p.phone, 
  p.gender, 
  p.blood_group,
  p.date_of_birth, 
  p.address, 
  p.city, 
  p.state,
  d.name as dept_name,
  pr.consultant_name as doctor_name,  -- 🔥 USE SAFE FIELD (NO JOIN DEPENDENCY)
  NULL as doctor_spec
  FROM patient_registrations pr
  LEFT JOIN patients p ON pr.patient_id = p.id
  LEFT JOIN departments d ON pr.department_id = d.id`;
    const params: any[] = [];
    const where: string[] = [];

    if (patientId) where.push('pr.patient_id = ?'), params.push(patientId);
    if (status) where.push('pr.status = ?'), params.push(status);
    if (type) where.push('pr.registration_type = ?'), params.push(type);
    if (date) where.push('pr.admission_date = ?'), params.push(date);
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ` ORDER BY pr.created_at DESC LIMIT ${parseInt(limit)}`;

    const regs = await runQuery(query, params);
    return NextResponse.json(regs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const {
      patient_id, registration_type='OPD', doctor_id, department_id,
      admission_date, admission_time, status='Active',
      provisional_diagnosis, procedure_treatment, comments,
      guardian_name, guardian_relation, guardian_phone,
      insurance_company, insurance_number, rate_list='COMMON',
      admission_source, room_type, bed_number,
      consultant_name, referred_by, additional_consultant,
      nationality, religion, occupation, marital_status,
      id_document_type, id_document_number, tpa_name, category
    } = body;

    if (!patient_id || !admission_date)
      return NextResponse.json({ error: 'Patient ID and admission date required' }, { status: 400 });

    const regId = await runInsert(
      `INSERT INTO patient_registrations (
        patient_id, registration_type, doctor_id, department_id, admission_date, admission_time,
        status, provisional_diagnosis, procedure_treatment, comments,
        guardian_name, guardian_relation, guardian_phone,
        insurance_company, insurance_number, rate_list, admission_source, room_type, bed_number,
        consultant_name, referred_by, additional_consultant,
        nationality, religion, occupation, marital_status,
        id_document_type, id_document_number, tpa_name, category
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [patient_id, registration_type, doctor_id||null, department_id||null,
       admission_date, admission_time||null, status,
       provisional_diagnosis||null, procedure_treatment||null, comments||null,
       guardian_name||null, guardian_relation||null, guardian_phone||null,
       insurance_company||null, insurance_number||null, rate_list,
       admission_source||null, room_type||null, bed_number||null,
       consultant_name||null, referred_by||null, additional_consultant||null,
       nationality||'India', religion||null, occupation||null, marital_status||null,
       id_document_type||null, id_document_number||null, tpa_name||null, category||'Cash']
    );

   const regs = await runQuery(
  `SELECT 
     pr.*, 
     p.uhid, 
     p.first_name, 
     p.last_name, 
     p.phone, 
     p.gender, 
     p.blood_group,
     d.name as dept_name,
     pr.consultant_name as doctor_name
   FROM patient_registrations pr
   LEFT JOIN patients p ON pr.patient_id = p.id
   LEFT JOIN departments d ON pr.department_id = d.id
   WHERE pr.id = ?`,
  [regId]
);
    return NextResponse.json(regs[0], { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}