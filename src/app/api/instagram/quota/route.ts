import { NextResponse } from 'next/server';
import { getPublishingLimit } from '@/lib/instagram';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const quota = await getPublishingLimit();
    return NextResponse.json({ quota });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
