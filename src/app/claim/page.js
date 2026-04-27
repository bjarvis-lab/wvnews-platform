'use client';
// Landing page for the subscriber claim email. Reader arrives here after
// clicking the link in the welcome email. URL shape:
//
//   /claim?subscriberId=ABC&email=foo@bar.com
//   &mode=signIn&oobCode=...&apiKey=...   ← appended by Firebase
//
// We:
//   1. detect the Firebase email-link via isSignInWithEmailLink()
//   2. complete signInWithEmailLink() to authenticate the reader
//   3. POST /api/subscribers/{id}/claim with the resulting ID token
//   4. show a success state and a link to wvnews.com / their account
//
// If the link is bad / expired / consumed, we offer a "send me a new
// link" button that hits POST /api/subscribers/{id}/send-claim?force=1
// — anonymous, but the email it goes to is the one already on file.

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

function ClaimInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subscriberId = searchParams.get('subscriberId');
  const email = searchParams.get('email');
  const [status, setStatus] = useState('working'); // working | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (!subscriberId || !email) {
          throw new Error('Missing subscriberId or email in link.');
        }
        const href = window.location.href;
        if (!isSignInWithEmailLink(auth, href)) {
          throw new Error('This link is not a valid sign-in link. It may have already been used.');
        }
        const userCred = await signInWithEmailLink(auth, email, href);
        const idToken = await userCred.user.getIdToken();
        const res = await fetch(`/api/subscribers/${encodeURIComponent(subscriberId)}/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Claim failed (${res.status})`);
        }
        if (!cancelled) setStatus('success');
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(err.message);
        }
      }
    }
    run();
    return () => { cancelled = true; };
  }, [subscriberId, email]);

  return (
    <main style={{ maxWidth: 520, margin: '64px auto', padding: '0 16px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', lineHeight: 1.55, color: '#222' }}>
      <h1 style={{ fontSize: 22, color: '#0e2a47', margin: '0 0 16px' }}>
        {status === 'working' && 'Activating your digital access…'}
        {status === 'success' && 'You’re all set'}
        {status === 'error' && 'We hit a snag'}
      </h1>

      {status === 'working' && (
        <p style={{ color: '#555' }}>One moment while we link your subscription.</p>
      )}

      {status === 'success' && (
        <>
          <p>Your wvnews.com digital access is now active. You’re signed in on this device.</p>
          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button
              onClick={() => router.push('/')}
              style={{ padding: '10px 18px', background: '#0e2a47', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
            >
              Read wvnews.com
            </button>
            <button
              onClick={() => router.push('/account')}
              style={{ padding: '10px 18px', background: '#fff', color: '#0e2a47', border: '1px solid #0e2a47', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
            >
              My account
            </button>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <p style={{ color: '#7a1e1e' }}>{errorMsg}</p>
          <p style={{ color: '#555', fontSize: 14 }}>
            Need a fresh link? Email <a href="mailto:circulation@wvnews.com" style={{ color: '#0e2a47' }}>circulation@wvnews.com</a> and we'll resend it.
          </p>
        </>
      )}
    </main>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<main style={{ padding: 64, textAlign: 'center' }}>Loading…</main>}>
      <ClaimInner />
    </Suspense>
  );
}
