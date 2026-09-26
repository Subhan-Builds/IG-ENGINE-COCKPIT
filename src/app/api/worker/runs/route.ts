import { NextResponse } from 'next/server';
import { getWorkerUsage } from '@/lib/github';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch GitHub Actions usage report
    const ghUsage = await getWorkerUsage();

    // 2. Fetch Supabase worker runs history
    const { data: dbRuns, error } = await supabaseAdmin
      .from('runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('Supabase runs fetch warning:', error.message);
    }

    return NextResponse.json({
      github: ghUsage,
      dbRuns: dbRuns || [],
    });
  } catch (err: any) {
    console.error('Worker runs API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
