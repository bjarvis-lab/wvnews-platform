'use client';
import { useState } from 'react';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';

export default function AccountPage() {
  const [tab, setTab] = useState('profile');
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'newsletters', label: 'Newsletters' },
    { id: 'billing', label: 'Billing' },
    { id: 'reading', label: 'Reading History' },
    { id: 'saved', label: 'Saved Articles' },
  ];

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">My Account</h1>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${tab === t.id ? 'bg-brand-950 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-ink-100">
          {tab === 'profile' && (
            <div className="space-y-4 max-w-md">
              <div><label className="text-xs text-ink-500 block mb-1">Full Name</label><input className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" defaultValue="Robert Johnson" /></div>
              <div><label className="text-xs text-ink-500 block mb-1">Email</label><input className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" defaultValue="rjohnson@gmail.com" /></div>
              <div><label className="text-xs text-ink-500 block mb-1">ZIP Code</label><input className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" defaultValue="26301" /></div>
              <div><label className="text-xs text-ink-500 block mb-1">Password</label><button className="text-sm text-brand-700 hover:underline">Change Password</button></div>
              <div><label className="text-xs text-ink-500 block mb-1">Topic Preferences</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['News', 'Sports', 'Politics', 'Business', 'Education'].map(t => (
                    <label key={t} className="flex items-center gap-1.5 text-sm text-ink-700"><input type="checkbox" defaultChecked={t === 'News' || t === 'Sports'} />{t}</label>
                  ))}
                </div>
              </div>
              <button className="px-4 py-2 bg-brand-700 text-white text-sm rounded-lg hover:bg-brand-600">Save Changes</button>
            </div>
          )}
          {tab === 'subscription' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-bold text-green-700">Digital All-Access — Active</div>
                <div className="text-xs text-green-600">$9.99/month · Renews April 15, 2026</div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white text-ink-700 text-sm rounded-lg border border-ink-200 hover:bg-ink-50">Upgrade Plan</button>
                <button className="px-4 py-2 bg-white text-ink-700 text-sm rounded-lg border border-ink-200 hover:bg-ink-50">Pause Subscription</button>
                <button className="px-4 py-2 bg-white text-red-600 text-sm rounded-lg border border-ink-200 hover:bg-red-50">Cancel</button>
              </div>
              <div className="text-xs text-ink-500">Manage your payment method and view invoices through our secure payment portal.</div>
              <button className="px-4 py-2 bg-brand-700 text-white text-sm rounded-lg hover:bg-brand-600">Open Payment Portal (Stripe)</button>
            </div>
          )}
          {tab === 'newsletters' && (
            <div className="space-y-3">
              {[
                { name: 'Daily News Digest', desc: 'Top stories every morning at 6 AM', on: true },
                { name: 'Breaking News Alerts', desc: 'Instant alerts for major stories', on: true },
                { name: 'Sports Wrap', desc: 'Weekly sports roundup every Sunday', on: false },
                { name: 'Business Report', desc: 'Weekly business news digest', on: false },
              ].map(nl => (
                <label key={nl.name} className="flex items-center justify-between py-3 border-b border-ink-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-ink-800">{nl.name}</div>
                    <div className="text-xs text-ink-500">{nl.desc}</div>
                  </div>
                  <input type="checkbox" defaultChecked={nl.on} className="rounded w-5 h-5" />
                </label>
              ))}
            </div>
          )}
          {tab === 'billing' && (
            <div className="space-y-4">
              <p className="text-sm text-ink-600">Your billing is managed securely through Stripe. Click below to manage payment methods, view invoices, or download receipts.</p>
              <button className="px-4 py-2 bg-brand-700 text-white text-sm rounded-lg hover:bg-brand-600">Open Stripe Customer Portal</button>
              <div className="text-xs text-ink-400">You can also pay advertising or subscription bills through our payment portal.</div>
            </div>
          )}
          {tab === 'reading' && (
            <div className="text-sm text-ink-500">Your recent reading history will appear here. This helps us recommend stories you might enjoy.</div>
          )}
          {tab === 'saved' && (
            <div className="text-sm text-ink-500">Articles you save will appear here. Look for the bookmark icon on any story to save it.</div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
