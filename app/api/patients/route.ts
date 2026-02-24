import { NextRequest, NextResponse } from 'next/server';
import { runQuery, runInsert, Patient } from '@/lib/db';
import { initializeDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
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
      blood_group
    } = body;

    if (!first_name) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    // Generate sequential UHID
    const countResult = await runQuery<{ count: number }>('SELECT COUNT(*) as count FROM patients');
    const count = (countResult[0]?.count ?? 0) + 1;
    const year = new Date().getFullYear();
    const uhid = `UHID-${year}-${String(count).padStart(4, '0')}`;

    const patientId = await runInsert(
      `INSERT INTO patients (uhid, first_name, last_name, date_of_birth, gender, phone, email, address, city, state, country, pin_code, blood_group)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uhid, first_name, last_name || null, date_of_birth || null, gender || null, phone || null, email || null, address || null, city || null, state || null, country, pin_code || null, blood_group || null]
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