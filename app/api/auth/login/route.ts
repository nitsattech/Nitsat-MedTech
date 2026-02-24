import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { initializeDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Demo mode - accept any credentials for UI exploration
    const demoUser = {
      id: '1',
      email: email,
      full_name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      role: 'admin',
      is_active: 1
    };

    const response = NextResponse.json({
      success: true,
      user: demoUser
    });

    response.cookies.set('userId', demoUser.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    response.cookies.set('userRole', demoUser.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    response.cookies.set('userEmail', demoUser.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error) {
    console.error('[v0] Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
