import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, runQuery, runInsert } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    // Check if admin user exists
    const users = await runQuery('SELECT COUNT(*) as count FROM users');
    
    if (users.length === 0 || (users[0] as any).count === 0) {
      const adminPasswordHash = await hashPassword('admin123');
      
      try {
        await runInsert(
          `INSERT INTO users (email, password_hash, full_name, role, is_active) 
           VALUES (?, ?, ?, ?, ?)`,
          ['admin@nitsat.com', adminPasswordHash, 'Administrator', 'admin', 1]
        );
      } catch (error) {
        console.log('Admin user likely already exists');
      }
    }

    // Check if departments exist
    const depts = await runQuery('SELECT COUNT(*) as count FROM departments');
    
    if (depts.length === 0 || (depts[0] as any).count === 0) {
      const departments = [
        ['OPD', 'Out Patient Department', 'user', 1],
        ['IPD', 'In Patient Department', 'home', 1],
        ['Medicines', 'Pharmacy', 'pill', 1],
        ['Services', 'Services', 'service', 1],
        ['Investigation', 'Laboratory', 'microscope', 1],
        ['Payment', 'Payment', 'credit-card', 1],
        ['O.T.', 'Operation Theater', 'activity', 1],
        ['Discharge', 'Discharge', 'log-out', 1],
        ['Billing', 'Billing', 'file-text', 1],
        ['File', 'File Management', 'folder', 1],
        ['MIS', 'Management Info System', 'bar-chart-2', 1],
        ['Pathology', 'Pathology', 'microscope', 1],
        ['Sonography', 'Sonography', 'radio', 1],
        ['Radiology', 'Radiology', 'radio', 1],
        ['Cardiology', 'Cardiology', 'heart', 1],
        ['Gastrology', 'Gastrology', 'activity', 1],
      ];

      for (const dept of departments) {
        try {
          await runInsert(
            `INSERT INTO departments (name, description, icon, is_active) VALUES (?, ?, ?, ?)`,
            dept
          );
        } catch (error) {
          // Department may already exist
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized',
      credentials: {
        email: 'admin@nitsat.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: 'Initialization failed' },
      { status: 500 }
    );
  }
}
