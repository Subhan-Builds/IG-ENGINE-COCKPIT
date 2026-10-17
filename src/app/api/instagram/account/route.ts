import { NextRequest, NextResponse } from 'next/server';
import { getAccountInfo } from '@/lib/instagram';
import { getAccountById } from '@/lib/accounts';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account_id') || searchParams.get('accountId');

    const acc = await getAccountById(accountId);
    if (!acc) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const info = await getAccountInfo(acc.platform_account_id, acc.access_token);
    return NextResponse.json({ account: info, accountId: acc.id, handle: acc.handle });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
