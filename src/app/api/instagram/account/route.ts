import { NextResponse } from 'next/server';
import { getAccountInfo } from '@/lib/instagram';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const account = await getAccountInfo();
    return NextResponse.json({ account });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
