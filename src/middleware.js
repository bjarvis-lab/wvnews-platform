// Gate /admin/* with a presence-only cookie check. Middleware runs in the
// Edge runtime and can't use firebase-admin, so we don't verify the session
// cookie here — we only confirm one exists. The real cryptographic check
// happens in src/app/admin/layout.js via requireAdmin() (Node runtime), which
// redirects/302s if the cookie is missing, expired, or revoked.
//
// Cheap early redirect keeps unauthenticated visitors out of admin pages
// entirely and avoids hitting firebase-admin for obvious bots.

import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth-server.constants';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Pass the pathname down so the admin layout (server component) can
  // short-circuit rendering the shell + auth check on the signin page
  // without needing a route group.
  const res = NextResponse.next();
  res.headers.set('x-pathname', pathname);

  // Only protect /admin/* — the signin page itself must stay reachable.
  if (!pathname.startsWith('/admin') || pathname.startsWith('/admin/signin')) {
    return res;
  }

  const hasSession = req.cookies.get(SESSION_COOKIE);
  if (hasSession) return res;

  const url = req.nextUrl.clone();
  url.pathname = '/admin/signin';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*'],
};
