import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { triggerWorkflow } from '@/lib/github';
import { getAccountById } from '@/lib/accounts';
import { publishReelDirectly } from '@/lib/instagram';

export const dynamic = 'force-dynamic';

async function refillVacatedSlot(accountId: string, vacatedSlot: string | null) {
  if (!vacatedSlot) return null;
  const nowIso = new Date().toISOString();

  try {
    // 1. Look for any buffered video ready in 'hf_ready' for this account
    const { data: readyCandidates } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('account_id', accountId)
      .eq('status', 'hf_ready')
      .is('instagram_media_id', null)
      .order('created_at', { ascending: true })
      .limit(1);

    if (readyCandidates && readyCandidates.length > 0) {
      const candidate = readyCandidates[0];
      await supabaseAdmin
        .from('videos')
        .update({
          status: 'scheduled',
          scheduled_at: vacatedSlot,
          updated_at: nowIso,
        })
        .eq('id', candidate.id);

      return {
        refilled: true,
        method: 'buffer_fill',
        filename: candidate.drive_filename,
        slot: vacatedSlot,
      };
    }

    // 2. If no hf_ready, pull forward the earliest subsequent scheduled video so the calendar has no gap
    const { data: futureScheduled } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('account_id', accountId)
      .eq('status', 'scheduled')
      .gt('scheduled_at', vacatedSlot)
      .is('instagram_media_id', null)
      .order('scheduled_at', { ascending: true });

    if (futureScheduled && futureScheduled.length > 0) {
      const nextCandidate = futureScheduled[0];
      await supabaseAdmin
        .from('videos')
        .update({
          scheduled_at: vacatedSlot,
          updated_at: nowIso,
        })
        .eq('id', nextCandidate.id);

      // Trigger importer to replenish queue tail from Drive
      try {
        await triggerWorkflow('importer.yml');
      } catch (e) {
        console.warn('Could not dispatch importer after refill:', e);
      }

      return {
        refilled: true,
        method: 'promoted_future',
        filename: nextCandidate.drive_filename,
        slot: vacatedSlot,
      };
    }

    // Depleted queue: Trigger importer to fetch new files from Drive
    try {
      await triggerWorkflow('importer.yml');
    } catch {}

    return null;
  } catch (err) {
    console.error('[Slot-Refill] Error refilling vacated slot:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const nowIso = new Date().toISOString();
    let videoIdToPublish: string | null = null;
    let targetAccountId: string | null = null;
    let publishDirect = true; // Attempt direct publish first for instant feedback

    try {
      const body = await req.json();
      if (body?.video_id) videoIdToPublish = body.video_id;
      if (body?.account_id || body?.accountId) targetAccountId = body.account_id || body.accountId;
      if (body?.direct !== undefined) publishDirect = Boolean(body.direct);
    } catch {
      // Empty body
    }

    // Resolve target account
    const account = await getAccountById(targetAccountId);
    if (!account) {
      return NextResponse.json({ error: 'Target account not found' }, { status: 404 });
    }

    // Find candidate video strictly for this account
    let videoToPublish: any = null;

    if (videoIdToPublish) {
      const { data, error } = await supabaseAdmin
        .from('videos')
        .select('*')
        .eq('id', videoIdToPublish)
        .single();
      if (error) throw error;
      videoToPublish = data;
    } else {
      let query = supabaseAdmin
        .from('videos')
        .select('*')
        .eq('account_id', account.id)
        .in('status', ['scheduled', 'hf_ready'])
        .is('instagram_media_id', null)
        .order('scheduled_at', { ascending: true })
        .limit(1);

      const { data, error } = await query;
      if (error) throw error;
      if (data && data.length > 0) {
        videoToPublish = data[0];
      }
    }

    if (!videoToPublish) {
      return NextResponse.json(
        {
          error: `No queued or ready videos found for @${account.handle}. Ensure videos are ingested from its folder first.`,
        },
        { status: 400 }
      );
    }

    // Check HF URL presence
    if (!videoToPublish.hf_url) {
      return NextResponse.json(
        {
          error: `Video '${videoToPublish.drive_filename}' does not have a ready Hugging Face URL. Ingestion is still processing.`,
        },
        { status: 400 }
      );
    }

    const vacatedSlot = videoToPublish.scheduled_at;
    const caption =
      videoToPublish.caption ||
      account.caption_template ||
      'Follow for daily updates! #reels #explore';

    // 1. Attempt Direct Publish via Instagram Graph API
    if (publishDirect && account.access_token && account.platform_account_id) {
      try {
        console.log(`[Publish-Now] Direct publishing video '${videoToPublish.drive_filename}' to @${account.handle}...`);
        const { mediaId } = await publishReelDirectly(
          account.platform_account_id,
          account.access_token,
          videoToPublish.hf_url,
          caption
        );

        // Update database record
        await supabaseAdmin
          .from('videos')
          .update({
            status: 'published',
            instagram_media_id: mediaId,
            published_at: nowIso,
            updated_at: nowIso,
            last_error: null,
          })
          .eq('id', videoToPublish.id);

        // Record intent
        await supabaseAdmin.from('publish_intents').insert({
          video_id: videoToPublish.id,
          outcome: 'published_direct',
          instagram_media_id: mediaId,
        });

        // Refill the vacated slot with the next ready reel
        const refillResult = await refillVacatedSlot(account.id, vacatedSlot);

        let successMsg = `Reel successfully published directly to @${account.handle}! (Media ID: ${mediaId})`;
        if (refillResult?.refilled) {
          successMsg += ` Schedule slot was automatically refilled with '${refillResult.filename}'.`;
        }

        return NextResponse.json({
          success: true,
          published_direct: true,
          media_id: mediaId,
          video_id: videoToPublish.id,
          account_id: account.id,
          account_handle: account.handle,
          filename: videoToPublish.drive_filename,
          refill: refillResult,
          message: successMsg,
        });
      } catch (directErr: any) {
        console.warn(`[Publish-Now] Direct publish failed (${directErr.message}). Falling back to GitHub Actions runner...`);
      }
    }

    // 2. Fallback: Advance scheduled_at and dispatch GitHub Actions runner
    await supabaseAdmin
      .from('videos')
      .update({
        scheduled_at: nowIso,
        status: 'scheduled',
        updated_at: nowIso,
      })
      .eq('id', videoToPublish.id);

    const ghResult = await triggerWorkflow('publisher.yml');
    const refillResult = await refillVacatedSlot(account.id, vacatedSlot);

    return NextResponse.json({
      success: true,
      published_direct: false,
      video_id: videoToPublish.id,
      account_id: account.id,
      account_handle: account.handle,
      filename: videoToPublish.drive_filename,
      github: ghResult,
      refill: refillResult,
      message: `Video '${videoToPublish.drive_filename}' marked due for @${account.handle} and publisher launched.`,
    });
  } catch (err: any) {
    console.error('Publish-now route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
