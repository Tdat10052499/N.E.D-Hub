import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes requiring authentication
const protectedRoutes = [
  '/',
  '/hub',
  '/users',
  '/relayer',
  '/system',
  '/miniapps',
  '/business',
  '/marketing',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check for authentication cookies
  const hasNedSession = request.cookies.get('ned_auth_session')?.value;
  const hasSbAccessToken = request.cookies.get('sb-access-token')?.value;

  // Check if any cookie starts with 'sb-'
  const allCookies = request.cookies.getAll();
  const hasSupabaseCookie = allCookies.some(
    (c) => c.name.startsWith('sb-') && c.value.length > 5
  );

  const isAuthenticated = Boolean(hasNedSession || hasSbAccessToken || hasSupabaseCookie);

  // 2. If visiting /login and already logged in, redirect to /hub
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/hub', request.url));
    }
    return NextResponse.next();
  }

  // 3. If accessing protected routes without session, redirect to /login
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/hub/:path*',
    '/users/:path*',
    '/relayer/:path*',
    '/system/:path*',
    '/miniapps/:path*',
    '/business/:path*',
    '/marketing/:path*',
    '/login',
  ],
};
