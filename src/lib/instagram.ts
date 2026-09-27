export interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  account_type: string;
  profile_picture_url?: string;
}

export interface PublishingLimit {
  quota_total: number;
  quota_usage: number;
  quota_duration: number;
  remaining: number;
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  insights?: {
    views?: number;
    reach?: number;
    saved?: number;
    shares?: number;
    total_interactions?: number;
  };
}

const DEFAULT_IG_TOKEN = process.env.IG_ACCESS_TOKEN || '';
const DEFAULT_IG_USER_ID = process.env.IG_USER_ID || '38399200766389884';
const BASE_URL = 'https://graph.instagram.com/v21.0';

export async function validateInstagramToken(token: string): Promise<InstagramAccount | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${BASE_URL}/me?fields=id,username,name,account_type&access_token=${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('validateInstagramToken failed:', res.status, errText);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('validateInstagramToken network error:', err);
    return null;
  }
}

export async function getAccountInfo(userId?: string, token?: string): Promise<InstagramAccount | null> {
  const activeToken = token || DEFAULT_IG_TOKEN;
  const activeUserId = userId || DEFAULT_IG_USER_ID;
  if (!activeToken) return null;

  try {
    const res = await fetch(
      `${BASE_URL}/${activeUserId}?fields=id,username,name,account_type,profile_picture_url&access_token=${activeToken}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) {
      console.error('IG getAccountInfo failed:', res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('IG getAccountInfo error:', err);
    return null;
  }
}

export async function getPublishingLimit(userId?: string, token?: string): Promise<PublishingLimit> {
  const activeToken = token || DEFAULT_IG_TOKEN;
  const activeUserId = userId || DEFAULT_IG_USER_ID;

  if (!activeToken) {
    return { quota_total: 100, quota_usage: 0, quota_duration: 86400, remaining: 100 };
  }
  try {
    const res = await fetch(
      `${BASE_URL}/${activeUserId}/content_publishing_limit?fields=config,quota_usage&access_token=${activeToken}`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      const row = data.data?.[0];
      if (row) {
        const quota_total = row.config?.quota_total || 100;
        const quota_usage = row.quota_usage || 0;
        const quota_duration = row.config?.quota_duration || 86400;
        return {
          quota_total,
          quota_usage,
          quota_duration,
          remaining: Math.max(0, quota_total - quota_usage),
        };
      }
    }
  } catch (err) {
    console.error('IG getPublishingLimit error:', err);
  }
  return { quota_total: 100, quota_usage: 0, quota_duration: 86400, remaining: 100 };
}

export async function getRecentMedia(userId?: string, token?: string): Promise<InstagramMediaItem[]> {
  const activeToken = token || DEFAULT_IG_TOKEN;
  const activeUserId = userId || DEFAULT_IG_USER_ID;

  if (!activeToken) return [];
  try {
    const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count';
    const res = await fetch(`${BASE_URL}/${activeUserId}/media?fields=${fields}&access_token=${activeToken}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) {
      console.error('IG getRecentMedia failed:', res.status, await res.text());
      return [];
    }
    const json = await res.json();
    const items: InstagramMediaItem[] = json.data || [];

    // Fetch insights for recent reels (parallel, up to 5 items to preserve quota)
    const enriched = await Promise.all(
      items.slice(0, 5).map(async (item) => {
        try {
          const insightRes = await fetch(
            `${BASE_URL}/${item.id}/insights?metric=views,reach,saved,shares,total_interactions&access_token=${activeToken}`,
            { next: { revalidate: 300 } }
          );
          if (insightRes.ok) {
            const insData = await insightRes.json();
            const metrics: Record<string, number> = {};
            for (const m of insData.data || []) {
              metrics[m.name] = m.values?.[0]?.value ?? 0;
            }
            return {
              ...item,
              insights: {
                views: metrics.views || 0,
                reach: metrics.reach || 0,
                saved: metrics.saved || 0,
                shares: metrics.shares || 0,
                total_interactions: metrics.total_interactions || 0,
              },
            };
          }
        } catch {
          // Insights might fail for very newly published posts
        }
        return item;
      })
    );

    return enriched;
  } catch (err) {
    console.error('IG getRecentMedia error:', err);
    return [];
  }
}
