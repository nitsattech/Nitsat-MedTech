import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'hospital.db');

function getDB() {
  return new sqlite3.Database(dbPath);
}

// GET: fetch investigations by registration
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const registrationId = searchParams.get('registrationId');

  const db = getDB();

  return new Promise((resolve) => {
    db.all(
      `SELECT * FROM investigation_details WHERE registration_id = ? ORDER BY id DESC`,
      [registrationId],
      (err, rows) => {
        if (err) {
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(rows));
        }
        db.close();
      }
    );
  });
}

// POST: add new investigation (Doctor orders lab test)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { registration_id, investigation_id, quantity, rate, amount } = body;

  const db = getDB();

  return new Promise((resolve) => {
    db.run(
      `INSERT INTO investigation_details 
       (registration_id, investigation_id, quantity, rate, amount, status) 
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [registration_id, investigation_id, quantity, rate, amount],
      function (err) {
        if (err) {
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        } else {
          resolve(
            NextResponse.json({
              id: this.lastID,
              registration_id,
              investigation_id,
              quantity,
              rate,
              amount,
              status: 'Pending',
              entry_date: new Date().toISOString(),
            })
          );
        }
        db.close();
      }
    );
  });
}