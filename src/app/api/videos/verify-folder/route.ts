import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAccountById } from '@/lib/accounts';
import { publishReelDirectly } from '@/lib/instagram';
import { listDriveVideos, downloadDriveFileStream } from '@/lib/drive';

import { triggerWorkflow } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { accountId } = await req.json();
    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const account = await getAccountById(accountId);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (!account.drive_folder_id) {
      return NextResponse.json(
        { error: `Account @${account.handle} has no Google Drive folder mapped.` },
        { status: 400 }
      );
    }

    // 1. Check if account already has an ingested video ready to publish
    const { data: readyVideos } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('account_id', account.id)
      .in('status', ['hf_ready', 'scheduled'])
      .is('instagram_media_id', null)
      .order('created_at', { ascending: false })
      .limit(1);

    let targetVideo = readyVideos?.[0] || null;

    if (!targetVideo) {
      // Automatically dispatch the GitHub Actions Importer to pull videos from Drive to Hugging Face
      try {
        await triggerWorkflow('importer.yml');
      } catch (triggerErr) {
        console.warn('Failed to trigger importer automatically:', triggerErr);
      }

      return NextResponse.json(
        {
          error: `No ready videos in buffer for @${account.handle}. We just dispatched the Importer to ingest the first batch from folder '${account.drive_folder_name || account.drive_folder_id}' into Hugging Face. Please try Verify again in 1-2 minutes.`,
        },
        { status: 400 }
      );
    }

    if (!targetVideo.hf_url) {
      return NextResponse.json(
        { error: `Video '${targetVideo.drive_filename}' does not have a valid HF URL.` },
        { status: 400 }
      );
    }

    // 2. Publish directly to Instagram
    const nowIso = new Date().toISOString();
    const caption =
      targetVideo.caption ||
      account.caption_template ||
      `Verification Reel for @${account.handle} #test #reels`;

    console.log(`[Verify-Folder] Publishing verification reel '${targetVideo.drive_filename}' to @${account.handle}...`);
    const { mediaId } = await publishReelDirectly(
      account.platform_account_id,
      account.access_token || '',
      targetVideo.hf_url,
      caption
    );

    // 3. Mark video as published in Supabase
    await supabaseAdmin
      .from('videos')
      .update({
        status: 'published',
        instagram_media_id: mediaId,
        published_at: nowIso,
        updated_at: nowIso,
        last_error: null,
      })
      .eq('id', targetVideo.id);

    await supabaseAdmin.from('publish_intents').insert({
      video_id: targetVideo.id,
      outcome: 'published_verification',
      instagram_media_id: mediaId,
    });

    return NextResponse.json({
      success: true,
      mediaId,
      filename: targetVideo.drive_filename,
      handle: account.handle,
      message: `Verification Reel '${targetVideo.drive_filename}' posted live to @${account.handle}! Media ID: ${mediaId}`,
    });
  } catch (err: any) {
    console.error('Verify-folder error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
