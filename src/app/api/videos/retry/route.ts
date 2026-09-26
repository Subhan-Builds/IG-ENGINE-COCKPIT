import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { video_id } = body;

    if (video_id) {
      // Single video retry
      const { data: video, error: fetchErr } = await supabaseAdmin
        .from('videos')
        .select('*')
        .eq('id', video_id)
        .single();

      if (fetchErr || !video) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 });
      }

      const nextStatus = video.status === 'import_failed' ? 'discovered' : 'scheduled';
      const { data, error } = await supabaseAdmin
        .from('videos')
        .update({
          status: nextStatus,
          publish_attempts: 0,
          last_error: null,
        })
        .eq('id', video_id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, video: data });
    } else {
      // Retry all failed
      const { data: publishFailed } = await supabaseAdmin
        .from('videos')
        .update({ status: 'scheduled', publish_attempts: 0, last_error: null })
        .eq('status', 'publish_failed')
        .select();

      const { data: importFailed } = await supabaseAdmin
        .from('videos')
        .update({ status: 'discovered', publish_attempts: 0, last_error: null })
        .eq('status', 'import_failed')
        .select();

      const totalRetried = (publishFailed?.length || 0) + (importFailed?.length || 0);
      return NextResponse.json({
        success: true,
        message: `Retried ${totalRetried} failed items.`,
        retriedCount: totalRetried,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
