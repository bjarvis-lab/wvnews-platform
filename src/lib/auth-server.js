// Server-side helpers for reading the current admin session. Session is a
// Firebase session cookie (long-lived, verified server-side).
//
//   getSessionUser() → decoded token + user doc, or null
//   requireAdmin()   → same, but redirect to /admin/signin if missing
//
// Session cookies are created by firebase-admin's auth().createSessionCookie()
// in /api/auth/session from a freshly-signed-in ID token. They're set HTTPOnly
// so JS can't read them, Secure on HTTPS, and carry up to 14 days.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from 'firebase-admin/auth';
import { app, db } from './firebase-admin';
import { SESSION_COOKIE, SESSION_MAX_AGE } from './auth-server.constants';

// Re-export so existing imports from '@/lib/auth-server' keep working.
export { SESSION_COOKIE, SESSION_MAX_AGE };

// Domains whose Google logins are auto-approved for admin. Everyone else needs
// an existing entry in the `users` collection with active=true. Adjust as you
// onboard more properties.
const AUTO_ALLOW_DOMAINS = new Set(['wvnews.com', 'theet.com', 'dominionpost.com']);

export async function getSessionUser() {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await getAuth(app).verifySessionCookie(cookie, true /* checkRevoked */);
    const profile = await loadProfile(decoded);
    if (!profile) return null;
    return { ...decoded, profile };
  } catch {
    return null;
  }
}

async function loadProfile(decoded) {
  const email = (decoded.email || '').toLowerCase();
  const domain = email.split('@')[1] || '';
  const userRef = db.collection('users').doc(decoded.uid);
  const snap = await userRef.get();

  if (snap.exists) {
    const data = snap.data();
    if (data.active === false) return null;
    return { ...data, source: 'users-collection' };
  }

  // First-time sign-in from a trusted domain: auto-provision a user doc with
  // default editor role. Matches the CRM's /users collection schema.
  if (AUTO_ALLOW_DOMAINS.has(domain)) {
    const profile = {
      uid: decoded.uid,
      email,
      name: decoded.name || email.split('@')[0],
      photo: decoded.picture || '',
      role: 'editor',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      provisionedBy: 'wvnews-platform auto-allow',
    };
    await userRef.set(profile, { merge: true });
    return { ...profile, source: 'auto-provisioned' };
  }

  return null;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) redirect('/admin/signin');
  return user;
}
