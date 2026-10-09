import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { triggerWorkflow } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const nowIso = new Date().toISOString();
    let videoIdToPublish: string | null = null;

    // Check optional video_id in body
    try {
      const body = await req.json();
      if (body?.video_id) {
        videoIdToPublish = body.video_id;
      }
    } catch {
      // No JSON body provided, find next eligible candidate
    }

    if (videoIdToPublish) {
      // Set the specified video to due immediately
      const { data, error } = await supabaseAdmin
        .from('videos')
        .update({
          scheduled_at: nowIso,
          status: 'scheduled',
          updated_at: nowIso,
        })
        .eq('id', videoIdToPublish)
        .select()
        .single();

      if (error) throw error;
    } else {
      // Check if any video is already due
      const { data: dueVideos, error: dueErr } = await supabaseAdmin
        .from('videos')
        .select('id')
        .eq('status', 'scheduled')
        .lte('scheduled_at', nowIso)
        .is('instagram_media_id', null)
        .limit(1);

      if (dueErr) throw dueErr;

      if (!dueVideos || dueVideos.length === 0) {
        // No video is currently due — find the next scheduled or hf_ready video and advance its slot
        const { data: nextCandidate, error: candidateErr } = await supabaseAdmin
          .from('videos')
          .select('id, drive_filename')
          .in('status', ['scheduled', 'hf_ready'])
          .is('instagram_media_id', null)
          .order('scheduled_at', { ascending: true })
          .limit(1);

        if (candidateErr) throw candidateErr;

        if (nextCandidate && nextCandidate.length > 0) {
          const candidate = nextCandidate[0];
          videoIdToPublish = candidate.id;

          await supabaseAdmin
            .from('videos')
            .update({
              scheduled_at: nowIso,
              status: 'scheduled',
              updated_at: nowIso,
            })
            .eq('id', candidate.id);
        }
      } else {
        videoIdToPublish = dueVideos[0].id;
      }
    }

    // Dispatch the publisher workflow on GitHub Actions
    const ghResult = await triggerWorkflow('publisher.yml');

    return NextResponse.json({
      success: true,
      video_id: videoIdToPublish,
      dispatched: true,
      github: ghResult,
      message: videoIdToPublish
        ? `Video marked due immediately and publisher dispatched.`
        : `Publisher dispatched.`,
    });
  } catch (err: any) {
    console.error('Publish-now error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
