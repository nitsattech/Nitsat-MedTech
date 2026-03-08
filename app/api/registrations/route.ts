import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'hospital.db');

export async function POST(req: Request) {
  const body = await req.json();
  const { patient_id, registration_type, admission_date, status } = body;

  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve) => {
    db.run(
      `INSERT INTO patient_registrations 
       (patient_id, registration_type, admission_date, status)
       VALUES (?, ?, ?, ?)`,
      [patient_id, registration_type, admission_date, status],
      function (err) {
        if (err) {
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        } else {
          resolve(
            NextResponse.json({
              id: this.lastID,
              patient_id,
              registration_type,
            })
          );
        }
      }
    );
  });
}