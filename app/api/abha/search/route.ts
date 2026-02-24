import { NextRequest, NextResponse } from 'next/server';
import { searchPatients } from '@/lib/abha';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get('query') || searchParams.get('search') || '';

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    const results = await searchPatients(q.trim());

    // Return normalized patient array. The frontend expects an array of objects
    // with fields like id, uhid, first_name, last_name, date_of_birth, phone, email.
    return NextResponse.json(results);
  } catch (err: any) {
    console.error('ABHA search error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to search ABHA' }, { status: 500 });
  }
}
