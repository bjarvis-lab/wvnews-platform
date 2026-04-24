'use client';
// Admin sign-in page. Uses Firebase Auth client SDK for the Google SSO flow,
// then posts the ID token to /api/auth/session which sets the HttpOnly cookie.
//
// This route is the one admin page that isn't gated — hitting it bypasses the
// middleware redirect loop.

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase-client';
import Logo from '@/components/public/Logo';

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/admin';
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken(true);
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign-in rejected');
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Sign-in failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-ink-200 overflow-hidden">
        <div className="px-8 pt-8 pb-6 text-center border-b border-ink-100">
          <div className="flex justify-center mb-4">
            <Logo height={48} variant="icon" className="rounded-full" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">WV News Platform</h1>
          <p className="text-sm text-ink-600 mt-1">Admin sign-in</p>
        </div>
        <div className="p-8 space-y-4">
          <button
            onClick={signIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-ink-300 rounded-lg hover:bg-ink-50 disabled:opacity-50 font-semibold text-ink-800"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">
              {error}
            </div>
          )}

          <p className="text-xs text-ink-500 text-center leading-relaxed">
            Restricted to WV News staff emails.{' '}
            Not you? <Link href="/" className="text-brand-700 hover:underline">Return to site</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
