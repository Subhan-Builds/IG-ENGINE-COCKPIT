import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { triggerWorkflow } from '@/lib/github';
import { getAccountById } from '@/lib/accounts';
import { publishReelDirectly } from '@/lib/instagram';

export const dynamic = 'force-dynamic';

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

        return NextResponse.json({
          success: true,
          published_direct: true,
          media_id: mediaId,
          video_id: videoToPublish.id,
          account_id: account.id,
          account_handle: account.handle,
          filename: videoToPublish.drive_filename,
          message: `Reel successfully published directly to @${account.handle}! Media ID: ${mediaId}`,
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

    return NextResponse.json({
      success: true,
      published_direct: false,
      video_id: videoToPublish.id,
      account_id: account.id,
      account_handle: account.handle,
      filename: videoToPublish.drive_filename,
      github: ghResult,
      message: `Video '${videoToPublish.drive_filename}' marked due immediately for @${account.handle} and GitHub Actions publisher launched.`,
    });
  } catch (err: any) {
    console.error('Publish-now route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
