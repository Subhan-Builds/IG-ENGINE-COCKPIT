import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, verifySessionToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();
    const correctPasscode = process.env.DASHBOARD_PASSCODE;

    if (!correctPasscode) {
      return NextResponse.json(
        { error: 'Server misconfiguration: DASHBOARD_PASSCODE is not set in environment.' },
        { status: 500 }
      );
    }

    if (passcode && passcode === correctPasscode) {
      const token = await createSessionToken(correctPasscode);
      const res = NextResponse.json({ success: true });
      res.cookies.set('ig_cockpit_auth', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      return res;
    }

    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const correctPasscode = process.env.DASHBOARD_PASSCODE;
  if (!correctPasscode) {
    return NextResponse.json({ authenticated: false });
  }

  const authCookie = req.cookies.get('ig_cockpit_auth')?.value;
  const isAuthenticated = await verifySessionToken(authCookie, correctPasscode);
  return NextResponse.json({ authenticated: isAuthenticated });
}
