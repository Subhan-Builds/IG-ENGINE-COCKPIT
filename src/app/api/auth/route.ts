import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();
    const correctPasscode = process.env.DASHBOARD_PASSCODE || 'lifefuel2026';

    if (passcode === correctPasscode) {
      const res = NextResponse.json({ success: true });
      res.cookies.set('ig_cockpit_auth', 'authenticated', {
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
  const authCookie = req.cookies.get('ig_cockpit_auth');
  const isAuthenticated = authCookie?.value === 'authenticated';
  return NextResponse.json({ authenticated: isAuthenticated });
}
