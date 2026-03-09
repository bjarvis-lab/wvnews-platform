'use client';
import { useState } from 'react';

export default function RegistrationWall({ onClose }) {
  const [mode, setMode] = useState('register'); // register | login
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [zip, setZip] = useState('');

  return (
    <div className="fixed inset-0 z-50 reg-wall-overlay flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-brand-950 px-6 py-5 text-center">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-display font-bold text-lg">WV</span>
          </div>
          <h2 className="font-display text-xl font-bold text-white">
            {mode === 'register' ? 'Create Your Free Account' : 'Welcome Back'}
          </h2>
          <p className="text-white/70 text-sm mt-1">
            {mode === 'register'
              ? 'Register to read 5 free articles per month'
              : 'Sign in to continue reading'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* OAuth buttons */}
          <div className="space-y-2 mb-4">
            <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-ink-200 rounded-lg text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-ink-200 rounded-lg text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Continue with Facebook
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-ink-200" />
            <span className="text-xs text-ink-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-ink-200" />
          </div>

          {/* Form */}
          <div className="space-y-3">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-ink-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-ink-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
            {mode === 'register' && (
              <input
                type="text"
                placeholder="ZIP Code"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-full px-3 py-2.5 bg-ink-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            )}
            <input
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2.5 bg-ink-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
            {mode === 'register' && (
              <label className="flex items-start gap-2 text-xs text-ink-500">
                <input type="checkbox" className="mt-0.5" defaultChecked />
                <span>Subscribe to the WVNews Daily Digest newsletter (you can unsubscribe anytime)</span>
              </label>
            )}
            <button className="w-full py-2.5 bg-brand-950 text-white text-sm font-bold rounded-lg hover:bg-brand-800 transition-colors">
              {mode === 'register' ? 'Create Free Account' : 'Sign In'}
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-ink-500">
            {mode === 'register' ? (
              <>Already have an account? <button onClick={() => setMode('login')} className="text-brand-700 font-medium hover:underline">Sign In</button></>
            ) : (
              <>Don&apos;t have an account? <button onClick={() => setMode('register')} className="text-brand-700 font-medium hover:underline">Register Free</button></>
            )}
          </div>

          {/* Upgrade CTA */}
          <div className="mt-4 p-3 bg-gold-400/10 rounded-lg border border-gold-400/30 text-center">
            <p className="text-xs text-ink-600 font-medium">Want unlimited access?</p>
            <a href="/subscribe" className="text-sm font-bold text-brand-950 hover:underline">Subscribe from $6.99/month →</a>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
