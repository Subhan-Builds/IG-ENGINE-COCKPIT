import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const IG_APP_ID = process.env.IG_APP_ID || '1759208211969030';
  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/instagram/callback`;

  // Cryptographic CSRF state validation token
  const state = crypto.randomBytes(24).toString('hex');

  // Scopes per Meta Instagram Platform specifications (Business Login for Instagram)
  const scopes = ['instagram_business_basic', 'instagram_business_content_publish'].join(',');

  // Meta standard authorization URL for Instagram Login
  const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${IG_APP_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state}`;

  const response = NextResponse.redirect(authUrl);

  // Store state in secure HTTP-only cookie (10 minute expiry)
  response.cookies.set('ig_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return response;
}
