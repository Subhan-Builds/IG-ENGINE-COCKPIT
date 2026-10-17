import { NextRequest, NextResponse } from 'next/server';
import { getRecentMedia } from '@/lib/instagram';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAccountById, getStoredAccounts } from '@/lib/accounts';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account_id') || searchParams.get('accountId');

    let targetAccounts = [];
    if (accountId && accountId !== 'all') {
      const acc = await getAccountById(accountId);
      if (acc) targetAccounts.push(acc);
    } else {
      targetAccounts = await getStoredAccounts();
    }

    // 1. Fetch live media from Meta Graph API for target accounts
    const allLiveMedia = [];
    for (const acc of targetAccounts) {
      if (acc.platform === 'instagram' && acc.access_token) {
        const media = await getRecentMedia(acc.platform_account_id, acc.access_token);
        for (const m of media) {
          allLiveMedia.push({
            ...m,
            account_id: acc.id,
            account_handle: acc.handle,
          });
        }
      }
    }

    // 2. Fetch published records from Supabase
    let query = supabaseAdmin
      .from('videos')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (accountId && accountId !== 'all') {
      query = query.eq('account_id', accountId);
    }

    const { data: dbVideos } = await query;

    // 3. Merge live media metrics with Supabase database records
    const merged = (dbVideos || []).map((dbVid) => {
      const live = allLiveMedia.find((m) => m.id === dbVid.instagram_media_id);
      return {
        ...dbVid,
        liveMetrics: live
          ? {
              like_count: live.like_count ?? 0,
              comments_count: live.comments_count ?? 0,
              views: live.insights?.views ?? 0,
              reach: live.insights?.reach ?? 0,
              saved: live.insights?.saved ?? 0,
              shares: live.insights?.shares ?? 0,
              total_interactions: live.insights?.total_interactions ?? 0,
              permalink: live.permalink,
            }
          : null,
      };
    });

    return NextResponse.json({
      posts: merged,
      rawLiveMedia: allLiveMedia,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
