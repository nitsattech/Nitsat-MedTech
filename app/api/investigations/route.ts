import { NextRequest, NextResponse } from 'next/server';
import { runQuery, runInsert, Investigation, InvestigationDetail } from '@/lib/db';
import { initializeDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'list' or 'details'
    const registrationId = searchParams.get('registrationId');

    if (type === 'details' && registrationId) {
      const details = await runQuery<InvestigationDetail>(
        'SELECT * FROM investigation_details WHERE registration_id = ? ORDER BY entry_date DESC',
        [registrationId]
      );
      return NextResponse.json(details);
    }

    const investigations = await runQuery<Investigation>(
      'SELECT * FROM investigations WHERE is_active = 1 ORDER BY name'
    );
    return NextResponse.json(investigations);
  } catch (error) {
    console.error('Error fetching investigations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investigations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const action = body.action;

    if (action === 'add-detail') {
      const { registration_id, investigation_id, quantity = 1 } = body;

      if (!registration_id || !investigation_id) {
        return NextResponse.json(
          { error: 'Registration ID and Investigation ID are required' },
          { status: 400 }
        );
      }

      const investigation = await runQuery<Investigation>(
        'SELECT * FROM investigations WHERE id = ?',
        [investigation_id]
      );

      if (investigation.length === 0) {
        return NextResponse.json(
          { error: 'Investigation not found' },
          { status: 404 }
        );
      }

      const rate = investigation[0].rate;
      const amount = rate * quantity;

      const detailId = await runInsert(
        `INSERT INTO investigation_details (registration_id, investigation_id, quantity, rate, amount, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [registration_id, investigation_id, quantity, rate, amount, 'Pending']
      );

      const details = await runQuery<InvestigationDetail>(
        'SELECT * FROM investigation_details WHERE id = ?',
        [detailId]
      );

      return NextResponse.json(details[0], { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating investigation detail:', error);
    return NextResponse.json(
      { error: 'Failed to create investigation detail' },
      { status: 500 }
    );
  }
}
