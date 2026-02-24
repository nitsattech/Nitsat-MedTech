import { NextRequest, NextResponse } from 'next/server';
import { runQuery, runInsert, initializeDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const search = request.nextUrl.searchParams.get('search');
    let query = 'SELECT * FROM doctors WHERE is_active = 1';
    const params: any[] = [];
    if (search) {
      query += ' AND (name LIKE ? OR specialization LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY name';
    const doctors = await runQuery(query, params);
    return NextResponse.json(doctors);
  } catch (error: any) {
    if (error?.message?.includes('no such table')) return NextResponse.json([]);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { name, specialization, qualification, phone, email, registration_number } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const id = await runInsert(
      'INSERT INTO doctors (name, specialization, qualification, phone, email, registration_number) VALUES (?,?,?,?,?,?)',
      [name, specialization||null, qualification||null, phone||null, email||null, registration_number||null]
    );
    const docs = await runQuery('SELECT * FROM doctors WHERE id = ?', [id]);
    return NextResponse.json(docs[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}