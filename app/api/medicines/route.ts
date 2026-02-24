import { NextRequest, NextResponse } from 'next/server';
import { runQuery, runInsert, runUpdate, Medicine } from '@/lib/db';
import { initializeDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let query = 'SELECT * FROM medicines WHERE is_active = 1';
    let params: any[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR generic_name LIKE ? OR batch_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params = [searchTerm, searchTerm, searchTerm];
    }

    query += ' ORDER BY name';

    const medicines = await runQuery<Medicine>(query, params);
    return NextResponse.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medicines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const {
      name,
      generic_name,
      batch_number,
      expiry_date,
      rate,
      unit = 'Tablet',
      quantity_in_stock = 0
    } = body;

    if (!name || !rate) {
      return NextResponse.json(
        { error: 'Name and rate are required' },
        { status: 400 }
      );
    }

    const medicineId = await runInsert(
      `INSERT INTO medicines (name, generic_name, batch_number, expiry_date, rate, unit, quantity_in_stock, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, generic_name || null, batch_number || null, expiry_date || null, rate, unit, quantity_in_stock, 1]
    );

    const medicines = await runQuery<Medicine>(
      'SELECT * FROM medicines WHERE id = ?',
      [medicineId]
    );

    return NextResponse.json(medicines[0], { status: 201 });
  } catch (error) {
    console.error('Error creating medicine:', error);
    return NextResponse.json(
      { error: 'Failed to create medicine' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const { id, quantity_in_stock } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Medicine ID is required' },
        { status: 400 }
      );
    }

    await runUpdate(
      'UPDATE medicines SET quantity_in_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity_in_stock, id]
    );

    const medicines = await runQuery<Medicine>(
      'SELECT * FROM medicines WHERE id = ?',
      [id]
    );

    return NextResponse.json(medicines[0]);
  } catch (error) {
    console.error('Error updating medicine:', error);
    return NextResponse.json(
      { error: 'Failed to update medicine' },
      { status: 500 }
    );
  }
}
