import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const IG_APP_ID = process.env.IG_APP_ID || '1759208211969030';
  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/instagram/callback`;

  // Scopes per Meta Instagram Platform specifications (updated 2025/2026)
  const scopes = ['instagram_business_basic', 'instagram_business_content_publish'].join(',');

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${IG_APP_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scopes)}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
