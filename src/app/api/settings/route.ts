import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('settings').select('*');
    if (error) throw error;

    const map: Record<string, string> = {};
    for (const item of data || []) {
      map[item.key] = item.value;
    }

    return NextResponse.json({ settings: map, raw: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.settings && typeof body.settings === 'object') {
      // Batch update
      for (const [key, value] of Object.entries(body.settings)) {
        await supabaseAdmin
          .from('settings')
          .upsert({ key, value: String(value), updated_at: new Date().toISOString() });
      }
      return NextResponse.json({ success: true });
    } else if (body.key && body.value !== undefined) {
      // Single update
      const { error } = await supabaseAdmin
        .from('settings')
        .upsert({ key: body.key, value: String(body.value), updated_at: new Date().toISOString() });
      if (error) throw error;
      return NextResponse.json({ success: true, key: body.key, value: body.value });
    }

    return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
