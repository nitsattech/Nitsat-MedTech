import { NextRequest, NextResponse } from 'next/server';
import { runQuery, runInsert, runUpdate, Patient } from '@/lib/db';
import { initializeDatabase } from '@/lib/db';

async function ensurePatientSchema() {
  const columns = await runQuery<{ name: string }>('PRAGMA table_info(patients)');
  const names = new Set(columns.map((column) => column.name));

  if (!names.has('abha_number')) {
    await runUpdate('ALTER TABLE patients ADD COLUMN abha_number TEXT');
  }

  if (!names.has('abha_address')) {
    await runUpdate('ALTER TABLE patients ADD COLUMN abha_address TEXT');
  }

  if (!names.has('abha_linked')) {
    await runUpdate('ALTER TABLE patients ADD COLUMN abha_linked INTEGER DEFAULT 0');
  }
}

const ALLOWED_GENDERS = new Set(['Male', 'Female', 'Other']);

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    await ensurePatientSchema();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let query = 'SELECT * FROM patients';
    let params: any[] = [];

    if (search) {
      query += ' WHERE uhid LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?';
      const searchTerm = `%${search}%`;
      params = [searchTerm, searchTerm, searchTerm, searchTerm];
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const patients = await runQuery<Patient>(query, params);
    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    await ensurePatientSchema();

    const body = await request.json();
    const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      city,
      state,
      country = 'India',
      pin_code,
      blood_group,
      abha_number,
      abha_address,
      abha_linked,
    } = body;

    if (!first_name) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    if (phone && !/^\d{10}$/.test(String(phone))) {
      return NextResponse.json({ error: 'Phone must be 10 digits' }, { status: 400 });
    }

    if (gender && !ALLOWED_GENDERS.has(gender)) {
      return NextResponse.json({ error: 'Gender must be Male, Female, or Other' }, { status: 400 });
    }

    let normalizedDob: string | null = null;
    if (date_of_birth) {
      const parsedDob = new Date(date_of_birth);
      if (Number.isNaN(parsedDob.getTime())) {
        return NextResponse.json({ error: 'Invalid date_of_birth format' }, { status: 400 });
      }
      normalizedDob = parsedDob.toISOString().split('T')[0];
    }

    // Generate sequential UHID
    const countResult = await runQuery<{ count: number }>('SELECT COUNT(*) as count FROM patients');
    const count = (countResult[0]?.count ?? 0) + 1;
    const year = new Date().getFullYear();
    const uhid = `UHID-${year}-${String(count).padStart(4, '0')}`;

    const patientId = await runInsert(
      `INSERT INTO patients (uhid, first_name, last_name, date_of_birth, gender, phone, email, address, city, state, country, pin_code, blood_group, abha_number, abha_address, abha_linked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uhid,
        first_name,
        last_name || null,
        normalizedDob,
        gender || null,
        phone || null,
        email || null,
        address || null,
        city || null,
        state || null,
        country,
        pin_code || null,
        blood_group || null,
        abha_number || null,
        abha_address || null,
        abha_linked ? 1 : 0,
      ]
    );

    const patients = await runQuery<Patient>(
      'SELECT * FROM patients WHERE id = ?',
      [patientId]
    );

    return NextResponse.json(patients[0], { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
