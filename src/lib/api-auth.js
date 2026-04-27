// Shared authorizer for the cross-app API routes (subscribers, etc).
//
// Three accepted auth styles, in priority order:
//
//   1. Cookie session                  — admin UIs on platform itself
//   2. x-internal-token: <secret>      — server-to-server scripts (bulk
//                                         import, scheduled jobs)
//   3. Authorization: Bearer <idToken> — cross-origin browser calls from
//                                         another wvnews app (CRM,
//                                         PrintManager). The bearer is a
//                                         Firebase Auth ID token; we
//                                         verify it and look up the
//                                         caller's `users/{uid}` doc to
//                                         resolve their role.
//
// Returns one of:
//   null                                — unauthorized
//   { kind: 'session', user }           — user is the full session shape
//   { kind: 'internal' }                — system / script
//   { kind: 'bearer', user }            — user.profile carries role
//
// requiredPerm gates session + bearer paths through hasPermission. The
// internal token path is unconditional — only handed out to trusted
// callers via env var.

import { getAuth } from 'firebase-admin/auth';
import { app, db } from './firebase-admin';
import { getSessionUser } from './auth-server';
import { hasPermission } from './permissions';

export async function authorize(request, requiredPerm) {
  // (2) internal token
  const headerToken = request.headers.get('x-internal-token');
  const expected = process.env.INTERNAL_API_TOKEN;
  if (expected && headerToken && headerToken === expected) {
    return { kind: 'internal' };
  }

  // (3) bearer ID token
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7).trim();
    try {
      const decoded = await getAuth(app).verifyIdToken(idToken, true);
      const profile = await loadProfile(decoded);
      if (!profile) return null;
      if (requiredPerm && !hasPermission(profile, requiredPerm)) return null;
      return { kind: 'bearer', user: { ...decoded, profile } };
    } catch {
      return null;
    }
  }

  // (1) cookie session
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    if (requiredPerm && !hasPermission(sessionUser.profile, requiredPerm)) return null;
    return { kind: 'session', user: sessionUser };
  }

  return null;
}

async function loadProfile(decoded) {
  // Primary lookup: users keyed by Firebase UID (canonical per SCHEMAS.md).
  let snap = await db.collection('users').doc(decoded.uid).get();
  // Fallback for legacy data: PrintManager (and old CRM rows) used email
  // as the doc id. Once those roll over to uid we can drop the fallback.
  if (!snap.exists && decoded.email) {
    snap = await db.collection('users').doc(decoded.email.toLowerCase()).get();
  }
  if (!snap.exists) return null;
  const data = snap.data();
  if (data.active === false) return null;
  return data;
}

// CORS — allow our other admin apps to call the cross-app endpoints.
// Add hosts here as new modules come online. We deliberately don't allow
// '*' since these endpoints accept credentialed requests.
const ALLOWED_ORIGINS = new Set([
  'https://printmanager.vercel.app',
  'https://wvnews-crm.vercel.app',
  'http://localhost:3000', // platform dev
  'http://localhost:3001', // printmanager dev (PORT=3001 in README)
  'http://localhost:5173', // crm dev (vite default)
]);

export function corsHeaders(request) {
  const origin = request.headers.get('origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-internal-token',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

export function preflight(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// Wraps a NextResponse.json() with CORS. Convenience so route handlers
// don't have to thread the request into every response site.
export function withCors(response, request) {
  const headers = corsHeaders(request);
  for (const [k, v] of Object.entries(headers)) {
    response.headers.set(k, v);
  }
  return response;
}
