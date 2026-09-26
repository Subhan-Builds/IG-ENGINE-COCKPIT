import { NextResponse } from 'next/server';
import { getRecentMedia } from '@/lib/instagram';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch live media from Meta Graph API
    const liveMedia = await getRecentMedia();

    // 2. Fetch published records from Supabase
    const { data: dbVideos } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    // 3. Merge live media metrics with Supabase database records
    const merged = (dbVideos || []).map((dbVid) => {
      const live = liveMedia.find((m) => m.id === dbVid.instagram_media_id);
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
      rawLiveMedia: liveMedia,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
