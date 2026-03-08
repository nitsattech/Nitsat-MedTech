import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'data', 'hospital.db');

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const db = new sqlite3.Database(dbPath);

    const user = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email],
        async (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}