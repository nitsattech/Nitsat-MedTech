import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'hospital.db');

function getUserByEmail(email: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email],
      (err, row) => {
        db.close();
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });

    // 🔥 CRITICAL: Global cookies for HMS auth
    response.cookies.set('userId', String(user.id), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    response.cookies.set('userRole', user.role, {
      path: '/', // VERY IMPORTANT (fixes investigation login issue)
      httpOnly: false,
      sameSite: 'lax',
    });

    response.cookies.set('userEmail', user.email, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}