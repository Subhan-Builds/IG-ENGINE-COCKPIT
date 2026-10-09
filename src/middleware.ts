import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from './lib/auth';

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

const PUBLIC_API_PREFIXES = [
  '/api/auth', // Login & status verification
  '/api/health', // System health probe
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const passcodeSecret = process.env.DASHBOARD_PASSCODE;

  // If passcode secret is not configured in env, deny access to avoid default open access
  if (!passcodeSecret) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Server misconfiguration: DASHBOARD_PASSCODE environment variable is required.' },
        { status: 500 }
      );
    }
  }

  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isLoginPage = pathname === '/login';

  // Check session cookie
  const sessionCookie = req.cookies.get('ig_cockpit_auth')?.value;
  const isAuthenticated = passcodeSecret
    ? await verifySessionToken(sessionCookie, passcodeSecret)
    : false;

  // If user is already authenticated and visits /login, redirect to dashboard
  if (isLoginPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Allow public API endpoints
  if (isPublicApi) {
    return NextResponse.next();
  }

  // If unauthenticated:
  if (!isAuthenticated) {
    // API routes return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid cockpit session required' },
        { status: 401 }
      );
    }

    // Page routes redirect to login
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
