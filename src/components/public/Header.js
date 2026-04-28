'use client';
// Boston Globe-style header. Three stacked rows:
//   1. Top utility bar — date + publications/contests/e-edition/subscribe links
//   2. Main nav row — hamburger, small icon, horizontal section nav, search,
//      sign-in, prominent SUBSCRIBE NOW button
//   3. (homepage only) Centered masthead — the publication's full wordmark
//      logo at large size, centered
//   4. (homepage only) TRENDING strip — red label + pipe-separated topics
//
// Inner pages (article, section) skip rows 3 + 4 to keep more screen
// real estate for the editorial content.

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { sections, sites } from '@/data/mock';
import Logo from './Logo';

export default function PublicHeader({
  publicationId = null,
  showMasthead = false,
  trendingTopics = [],
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [today, setToday] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  }, []);

  const currentSlug = pathname?.startsWith('/section/') ? pathname.slice('/section/'.length).split('/')[0] : null;

  let resolvedPubId = publicationId;
  if (!resolvedPubId && pathname?.startsWith('/p/')) {
    const pSlug = pathname.slice('/p/'.length).split('/')[0];
    const site = sites.find(s => s.slug === pSlug);
    if (site) resolvedPubId = site.id;
  }
  const currentPub = resolvedPubId ? sites.find(s => s.id === resolvedPubId) : null;

  return (
    <header className="bg-white border-b border-ink-200 sticky top-0 z-50">
      {/* Row 1: Top utility bar */}
      <div className="bg-brand-950 text-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-8 text-[11px]">
          <div className="flex items-center gap-3 text-white/70 font-body">
            <span suppressHydrationWarning>{today || ' '}</span>
            <span className="text-white/30 hidden sm:inline">|</span>
            <span className="text-white/60 hidden sm:inline">West Virginia</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 font-body">
            <Link href="/p" className="text-white/80 hover:text-gold-400 transition-colors">Publications</Link>
            <Link href="/contests" className="text-white/80 hover:text-gold-400 transition-colors">Contests</Link>
            <Link href="/e-edition" className="text-white/80 hover:text-gold-400 transition-colors">E-Edition</Link>
            <Link href="/account" className="text-white/80 hover:text-gold-400 transition-colors">Sign In</Link>
            <Link href="/admin" className="text-white/40 hover:text-white transition-colors">Admin</Link>
          </div>
        </div>
      </div>

      {/* Row 2: Main nav (hamburger + small icon + horizontal sections + search + subscribe) */}
      <div className="border-b border-ink-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 h-12">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-1.5 -ml-1.5 text-ink-700 hover:text-ink-900"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 7h16M4 12h16M4 17h16"} />
              </svg>
              <span className="block text-[8px] uppercase tracking-eyebrow text-ink-700 mt-0.5">Menu</span>
            </button>

            {/* Small home icon — links back to umbrella */}
            <Link href="/" aria-label="WV News home" className="flex-shrink-0 mr-2">
              <Logo height={28} variant="icon" className="rounded-sm" />
            </Link>

            {/* Horizontal section nav — Globe-style, separated by thin pipes */}
            <nav className="hidden lg:flex items-center flex-1 min-w-0 overflow-hidden">
              {sections.slice(0, 10).map((section, i) => {
                const isCurrent = section.slug === currentSlug;
                return (
                  <span key={section.id} className="flex items-center">
                    {i > 0 && <span className="px-2 text-ink-300 text-xs">|</span>}
                    <Link
                      href={`/section/${section.slug}`}
                      className={`text-[11px] font-bold uppercase tracking-eyebrow font-body whitespace-nowrap transition-colors ${
                        isCurrent ? 'text-red-700' : 'text-ink-900 hover:text-red-700'
                      }`}
                    >
                      {section.name}
                    </Link>
                  </span>
                );
              })}
            </nav>

            {/* Right side: search + sign-in + subscribe CTA */}
            <div className="flex items-center gap-3 ml-auto flex-shrink-0">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-1.5 text-ink-700 hover:text-ink-900 transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <Link href="/account" className="hidden sm:flex items-center gap-1 text-[11px] font-bold uppercase tracking-eyebrow text-ink-700 hover:text-ink-900">
                Sign In <span aria-hidden>↗</span>
              </Link>
              <Link
                href="/subscribe"
                className="hidden sm:flex flex-col items-center px-4 md:px-5 py-1.5 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors leading-tight"
              >
                <span className="text-[11px] font-bold uppercase tracking-eyebrow">Subscribe Now</span>
                <span className="text-[9px] font-medium opacity-90">Starting at $1</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Centered masthead — homepage only */}
      {showMasthead && (
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-5 md:py-8 flex justify-center">
            <Link href={currentPub ? `/p/${currentPub.slug}` : '/'} aria-label={`${currentPub?.name || 'WV News'} home`}>
              <Logo height={88} variant="full" publicationId={resolvedPubId} className="hidden md:block" />
              <Logo height={64} variant="full" publicationId={resolvedPubId} className="hidden sm:block md:hidden" />
              <Logo height={48} variant="full" publicationId={resolvedPubId} className="sm:hidden" />
            </Link>
          </div>
        </div>
      )}

      {/* Row 4: TRENDING strip — homepage only */}
      {showMasthead && trendingTopics.length > 0 && (
        <div className="border-y border-ink-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-baseline gap-3 overflow-x-auto whitespace-nowrap">
            <span className="text-[11px] font-bold uppercase tracking-eyebrow text-red-700 flex-shrink-0">
              Trending:
            </span>
            <div className="flex items-baseline gap-2.5 text-[11px] font-bold uppercase tracking-eyebrow text-ink-700">
              {trendingTopics.map((topic, i) => (
                <span key={topic.label + i} className="flex items-baseline gap-2.5">
                  {i > 0 && <span className="text-ink-300">|</span>}
                  <Link href={topic.href || '#'} className="hover:text-red-700 transition-colors">
                    {topic.label}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search bar overlay */}
      {searchOpen && (
        <div className="border-t border-ink-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search stories, topics, people..."
                className="w-full pl-10 pr-4 py-2.5 bg-ink-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
              <svg className="absolute left-3 top-3 w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-ink-100 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {sections.map(section => (
              <Link
                key={section.id}
                href={`/section/${section.slug}`}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-brand-50 rounded"
                onClick={() => setMenuOpen(false)}
              >
                <span>{section.icon}</span>
                {section.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
