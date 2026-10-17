import { NextRequest, NextResponse } from 'next/server';
import { getPublishingLimit } from '@/lib/instagram';
import { getAccountById } from '@/lib/accounts';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account_id') || searchParams.get('accountId');

    const account = await getAccountById(accountId);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const quota = await getPublishingLimit(account.platform_account_id, account.access_token);
    return NextResponse.json({ quota, accountId: account.id, handle: account.handle });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
