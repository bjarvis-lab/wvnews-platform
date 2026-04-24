'use client';
// Interactive bits of the homepage sidebar. Extracted so the homepage itself
// can be a server component that fetches stories directly from Firestore.

import { useState } from 'react';

export function WeatherWidget() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-ink-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">Weather</h3>
        <span className="text-[10px] text-ink-400">Clarksburg, WV</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-3xl">☁️</span>
        <div>
          <div className="text-2xl font-bold text-ink-900">47°F</div>
          <div className="text-xs text-ink-500">Partly Cloudy · H: 54° L: 38°</div>
        </div>
      </div>
    </div>
  );
}

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="bg-brand-950 rounded-lg p-5 text-white">
      <h3 className="font-display text-lg font-bold mb-1">Daily News Digest</h3>
      <p className="text-white/70 text-sm mb-3">Get the top WV stories delivered to your inbox every morning.</p>
      {submitted ? (
        <div className="text-green-300 text-sm font-medium">✓ You&apos;re signed up! Check your inbox.</div>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 rounded text-sm text-ink-900 bg-white placeholder-ink-400 outline-none focus:ring-2 focus:ring-gold-400"
          />
          <button
            onClick={() => setSubmitted(true)}
            className="px-4 py-2 bg-gold-500 text-brand-950 text-sm font-bold rounded hover:bg-gold-400 transition-colors"
          >
            Subscribe
          </button>
        </div>
      )}
    </div>
  );
}
