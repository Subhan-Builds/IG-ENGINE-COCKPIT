import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorReason = url.searchParams.get('error_reason');
  const errorDescription = url.searchParams.get('error_description');

  if (error || !code) {
    const errorMsg = errorDescription || errorReason || error || 'Authorization was cancelled or failed.';
    console.error('Instagram OAuth Callback Error:', errorMsg);
    return NextResponse.redirect(
      new URL(`/?oauth_error=${encodeURIComponent(errorMsg)}&tab=accounts`, url.origin)
    );
  }

  const cleanCode = code.replace(/#_$/, '');
  const IG_APP_ID = process.env.IG_APP_ID || '1759208211969030';
  const IG_APP_SECRET = process.env.IG_APP_SECRET || '665a7ba009ec41e8ab2a4f4d2ef98174';
  const redirectUri = `${url.origin}/api/auth/instagram/callback`;

  try {
    // 1. Exchange authorization code for short-lived access token
    const tokenForm = new URLSearchParams();
    tokenForm.append('client_id', IG_APP_ID);
    tokenForm.append('client_secret', IG_APP_SECRET);
    tokenForm.append('grant_type', 'authorization_code');
    tokenForm.append('redirect_uri', redirectUri);
    tokenForm.append('code', cleanCode);

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenForm.toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Failed to exchange code for token:', errBody);
      return NextResponse.redirect(
        new URL(`/?oauth_error=${encodeURIComponent('Token exchange failed: ' + errBody)}&tab=accounts`, url.origin)
      );
    }

    const tokenData = await tokenRes.json();
    let accessToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // 2. Exchange short-lived token for long-lived (60-day) token
    try {
      const longLivedRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${IG_APP_SECRET}&access_token=${accessToken}`
      );
      if (longLivedRes.ok) {
        const longLivedData = await longLivedRes.json();
        if (longLivedData.access_token) {
          accessToken = longLivedData.access_token;
        }
      }
    } catch (e) {
      console.warn('Long-lived token exchange warning (continuing with short-lived):', e);
    }

    // 3. Query user profile from Meta Graph API
    const userRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username,name,account_type&access_token=${accessToken}`
    );
    const userData = userRes.ok ? await userRes.json() : { id: userId, username: `user_${userId}` };

    // 4. Update Supabase accounts_store
    const { data: storeRow } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'accounts_store')
      .single();

    let accounts: any[] = [];
    if (storeRow?.value) {
      try {
        accounts = JSON.parse(storeRow.value);
      } catch (e) {}
    }

    const existingIdx = accounts.findIndex(
      (a: any) => a.platform_account_id === String(userData.id) || a.handle === userData.username
    );

    const newAccount = {
      id: existingIdx >= 0 ? accounts[existingIdx].id : `acc_ig_${Date.now().toString(36)}`,
      name: userData.name || userData.username || 'Instagram Account #2',
      handle: userData.username,
      platform: 'instagram',
      platform_account_id: String(userData.id),
      access_token: accessToken,
      account_type: userData.account_type || 'BUSINESS',
      status: 'connected',
      is_default: existingIdx === 0,
      posting_frequency: 3,
      posting_times: ['09:00', '15:00', '20:00'],
      posting_enabled: true,
      caption_template:
        accounts[0]?.caption_template ||
        'Follow for daily motivation! #motivation #success #reels',
      created_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      accounts[existingIdx] = newAccount;
    } else {
      accounts.push(newAccount);
    }

    await supabaseAdmin.from('settings').upsert({
      key: 'accounts_store',
      value: JSON.stringify(accounts),
      description: 'Multi-account configuration and platform credentials registry',
      updated_at: new Date().toISOString(),
    });

    return NextResponse.redirect(
      new URL(`/?connected=success&account=${encodeURIComponent(userData.username)}&tab=accounts`, url.origin)
    );
  } catch (err: any) {
    console.error('OAuth callback exception:', err);
    return NextResponse.redirect(
      new URL(`/?oauth_error=${encodeURIComponent(err.message)}&tab=accounts`, url.origin)
    );
  }
}
