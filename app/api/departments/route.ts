import { NextRequest, NextResponse } from 'next/server';
import { runQuery, Department } from '@/lib/db';
import { initializeDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const departments = await runQuery<Department>(
      'SELECT * FROM departments WHERE is_active = 1 ORDER BY name'
    );
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
