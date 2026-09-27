import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { validateInstagramToken, getPublishingLimit } from '@/lib/instagram';

export const dynamic = 'force-dynamic';

export interface EngineAccount {
  id: string;
  name: string;
  handle: string;
  platform: 'instagram' | 'facebook' | 'youtube' | 'tiktok';
  platform_account_id: string;
  access_token?: string;
  account_type?: string;
  profile_picture_url?: string;
  status: 'connected' | 'disconnected' | 'token_expired' | 'error';
  is_default: boolean;
  posting_frequency: number;
  posting_times: string[];
  posting_enabled: boolean;
  caption_template?: string;
  created_at: string;
  last_synced_at?: string;
  quota?: {
    quota_total: number;
    quota_usage: number;
    remaining: number;
  };
}

const DEFAULT_ACCOUNTS: EngineAccount[] = [
  {
    id: 'acc_lifefuel_01',
    name: 'Life Fuel | Daily Motivation',
    handle: 'lifefuel.global',
    platform: 'instagram',
    platform_account_id: process.env.IG_USER_ID || '38399200766389884',
    access_token: process.env.IG_ACCESS_TOKEN || '',
    account_type: 'MEDIA_CREATOR',
    status: 'connected',
    is_default: true,
    posting_frequency: 4,
    posting_times: ['09:00', '13:00', '17:00', '21:00'],
    posting_enabled: true,
    caption_template:
      'Follow for daily motivation! #motivation #mindset #success #dailymotivation #inspirationalquotes #lifefuel #reels #reelsinsta #reelsinstagram #fyp #explorepage',
    created_at: '2026-09-25T12:00:00Z',
    last_synced_at: new Date().toISOString(),
  },
];

async function getStoredAccounts(): Promise<EngineAccount[]> {
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'accounts_store')
      .single();

    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing accounts_store:', e);
      }
    }
  } catch (err) {
    console.error('getStoredAccounts error:', err);
  }
  return DEFAULT_ACCOUNTS;
}

async function saveStoredAccounts(accounts: EngineAccount[]) {
  await supabaseAdmin.from('settings').upsert({
    key: 'accounts_store',
    value: JSON.stringify(accounts),
    description: 'Multi-account configuration and platform credentials registry',
    updated_at: new Date().toISOString(),
  });
}

export async function GET() {
  try {
    const accounts = await getStoredAccounts();

    // Enrich accounts with live quota and sanitize sensitive tokens from client response
    const enriched = await Promise.all(
      accounts.map(async (acc) => {
        let quota = { quota_total: 100, quota_usage: 0, remaining: 100 };
        if (acc.platform === 'instagram' && acc.status === 'connected' && acc.access_token) {
          quota = await getPublishingLimit(acc.platform_account_id, acc.access_token);
        }

        return {
          ...acc,
          access_token: acc.access_token ? `***${acc.access_token.slice(-6)}` : undefined,
          has_token: !!acc.access_token,
          quota,
        };
      })
    );

    return NextResponse.json({ accounts: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const currentAccounts = await getStoredAccounts();

    if (action === 'validate_and_connect') {
      const { token, nameOverride, frequency, times } = body;
      if (!token) {
        return NextResponse.json({ error: 'Instagram access token is required' }, { status: 400 });
      }

      // Live verification with Meta Graph API
      const liveUser = await validateInstagramToken(token);
      if (!liveUser) {
        return NextResponse.json(
          {
            error:
              'Could not validate token with Meta Graph API (v21.0). Please verify the token is valid and has instagram_business_basic scope.',
          },
          { status: 400 }
        );
      }

      // Check if account already exists
      const existingIdx = currentAccounts.findIndex(
        (a) => a.platform_account_id === liveUser.id || a.handle === liveUser.username
      );

      const newAccount: EngineAccount = {
        id: existingIdx >= 0 ? currentAccounts[existingIdx].id : `acc_ig_${Date.now().toString(36)}`,
        name: nameOverride || liveUser.name || liveUser.username,
        handle: liveUser.username,
        platform: 'instagram',
        platform_account_id: liveUser.id,
        access_token: token,
        account_type: liveUser.account_type || 'BUSINESS',
        status: 'connected',
        is_default: existingIdx === 0,
        posting_frequency: frequency || 3,
        posting_times: times || ['09:00', '15:00', '20:00'],
        posting_enabled: true,
        caption_template:
          currentAccounts[0]?.caption_template ||
          'Follow for daily motivation! #motivation #success #reels',
        created_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      };

      let updated: EngineAccount[];
      if (existingIdx >= 0) {
        updated = [...currentAccounts];
        updated[existingIdx] = newAccount;
      } else {
        updated = [...currentAccounts, newAccount];
      }

      await saveStoredAccounts(updated);

      return NextResponse.json({
        success: true,
        account: {
          ...newAccount,
          access_token: `***${newAccount.access_token?.slice(-6)}`,
        },
      });
    }

    if (action === 'update_schedule') {
      const { accountId, posting_frequency, posting_times, caption_template } = body;
      const updated = currentAccounts.map((acc) => {
        if (acc.id === accountId) {
          return {
            ...acc,
            posting_frequency: posting_frequency ?? acc.posting_frequency,
            posting_times: posting_times ?? acc.posting_times,
            caption_template: caption_template ?? acc.caption_template,
            last_synced_at: new Date().toISOString(),
          };
        }
        return acc;
      });

      await saveStoredAccounts(updated);

      // If updating default account, also sync global settings for backwards compatibility
      const target = updated.find((a) => a.id === accountId);
      if (target?.is_default) {
        if (posting_frequency) {
          await supabaseAdmin
            .from('settings')
            .upsert({ key: 'posting_frequency', value: String(posting_frequency) });
        }
        if (posting_times) {
          await supabaseAdmin
            .from('settings')
            .upsert({ key: 'posting_times', value: posting_times.join(',') });
        }
        if (caption_template) {
          await supabaseAdmin
            .from('settings')
            .upsert({ key: 'caption_template', value: caption_template });
        }
      }

      return NextResponse.json({ success: true, accounts: updated });
    }

    if (action === 'toggle_status') {
      const { accountId } = body;
      const updated = currentAccounts.map((acc) => {
        if (acc.id === accountId) {
          return {
            ...acc,
            posting_enabled: !acc.posting_enabled,
            last_synced_at: new Date().toISOString(),
          };
        }
        return acc;
      });

      await saveStoredAccounts(updated);
      return NextResponse.json({ success: true, accounts: updated });
    }

    if (action === 'disconnect') {
      const { accountId } = body;
      if (currentAccounts.find((a) => a.id === accountId)?.is_default) {
        return NextResponse.json(
          { error: 'Cannot disconnect the primary default account (Account #1).' },
          { status: 400 }
        );
      }

      const updated = currentAccounts.filter((a) => a.id !== accountId);
      await saveStoredAccounts(updated);
      return NextResponse.json({ success: true, accounts: updated });
    }

    return NextResponse.json({ error: 'Unknown account action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
