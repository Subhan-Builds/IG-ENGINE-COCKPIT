import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
  drive_folder_id?: string;
  drive_folder_name?: string;
  previous_drive_folder_id?: string;
  created_at: string;
  last_synced_at?: string;
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
    drive_folder_id: process.env.DRIVE_FOLDER_ID || '1VC5hQbbCsNk9LN1CbHshvDZ6CwxxmmOi',
    drive_folder_name: 'Reels Format Video 1 - 100 Videos',
    caption_template:
      'Follow for daily motivation! #motivation #mindset #success #dailymotivation #inspirationalquotes #lifefuel #reels',
    created_at: '2026-09-25T12:00:00Z',
    last_synced_at: new Date().toISOString(),
  },
];

export async function getStoredAccounts(): Promise<EngineAccount[]> {
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'accounts_store')
      .single();

    if (data?.value) {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('getStoredAccounts error:', err);
  }
  return DEFAULT_ACCOUNTS;
}

export async function getAccountById(accountId?: string | null): Promise<EngineAccount | null> {
  const accounts = await getStoredAccounts();
  if (!accountId || accountId === 'all') {
    return accounts.find((a) => a.is_default) || accounts[0] || null;
  }
  return (
    accounts.find((a) => a.id === accountId || a.handle === accountId || a.platform_account_id === accountId) ||
    accounts[0] ||
    null
  );
}

export async function saveStoredAccounts(accounts: EngineAccount[]): Promise<void> {
  await supabaseAdmin.from('settings').upsert({
    key: 'accounts_store',
    value: JSON.stringify(accounts),
    description: 'Multi-account configuration and platform credentials registry',
    updated_at: new Date().toISOString(),
  });
}
