'use client';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import Link from 'next/link';

export default function EEditionPublicPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-ink-900 mb-2">E-Edition</h1>
          <p className="text-ink-600">Read today&apos;s newspaper exactly as it appears in print — from any device.</p>
        </div>

        {/* Today's edition preview */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden mb-8">
          <div className="aspect-[3/4] max-h-[500px] bg-ink-100 flex items-center justify-center relative">
            <div className="text-center">
              <div className="text-6xl mb-4">📰</div>
              <div className="font-display text-xl font-bold text-ink-700">Today&apos;s Edition</div>
              <div className="text-ink-500 text-sm">March 9, 2026 · 32 Pages</div>
            </div>
            {/* Paywall overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-12">
              <div className="text-center">
                <h3 className="font-display text-lg font-bold text-ink-900 mb-2">Subscribe to Read the E-Edition</h3>
                <p className="text-sm text-ink-500 mb-4">Access today&apos;s edition and the full archive</p>
                <Link href="/subscribe" className="inline-block px-6 py-3 bg-brand-950 text-white font-bold rounded-lg hover:bg-brand-800 transition-colors">
                  Subscribe from $6.99/mo
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Archive */}
        <h2 className="font-display text-xl font-bold text-ink-900 mb-4">Recent Editions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }, (_, i) => ({
            date: `Mar ${9-i}`,
            day: ['Sun', 'Sat', 'Fri', 'Thu', 'Wed', 'Tue', 'Mon'][i],
            pages: [32, 28, 24, 28, 24, 24, 36][i],
          })).map((ed, i) => (
            <div key={i} className="bg-white rounded-lg border border-ink-200 p-3 text-center hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-xs text-ink-500">{ed.day}</div>
              <div className="font-display font-bold text-ink-900">{ed.date}</div>
              <div className="text-[10px] text-ink-400">{ed.pages} pages</div>
              <div className="w-full h-20 bg-ink-100 rounded mt-2" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
