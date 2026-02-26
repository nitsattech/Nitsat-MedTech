import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, runInsert, runQuery, runUpdate } from '@/lib/db';

async function ensureFilesTable() {
  await runUpdate(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      visit_id INTEGER,
      file_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      uploaded_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    await ensureFilesTable();

    const sp = request.nextUrl.searchParams;
    const patientId = sp.get('patientId');
    const visitId = sp.get('visitId');
    const fileType = sp.get('fileType');

    let query = 'SELECT * FROM files WHERE 1=1';
    const params: any[] = [];

    if (patientId) {
      query += ' AND patient_id = ?';
      params.push(Number(patientId));
    }

    if (visitId) {
      query += ' AND visit_id = ?';
      params.push(Number(visitId));
    }

    if (fileType) {
      query += ' AND file_type = ?';
      params.push(fileType);
    }

    query += ' ORDER BY created_at DESC';
    const rows = await runQuery<any>(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('files GET error', error);
    return NextResponse.json({ error: 'Failed to load files' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    await ensureFilesTable();

    const body = await request.json();
    const { patientId, visitId, fileType, fileName, fileUrl, uploadedBy } = body;

    if (!patientId || !fileType || !fileName || !fileUrl) {
      return NextResponse.json({ error: 'patientId, fileType, fileName and fileUrl are required' }, { status: 400 });
    }

    const id = await runInsert(
      `INSERT INTO files (patient_id, visit_id, file_type, file_name, file_url, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [Number(patientId), visitId ? Number(visitId) : null, fileType, fileName, fileUrl, uploadedBy || 'operator']
    );

    const rows = await runQuery<any>('SELECT * FROM files WHERE id = ?', [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('files POST error', error);
    return NextResponse.json({ error: 'Failed to create file record' }, { status: 500 });
  }
}
