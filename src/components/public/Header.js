'use client';
import { useState } from 'react';
import Link from 'next/link';
import { sections } from '@/data/mock';
import Logo from './Logo';

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="bg-white border-b border-ink-200 sticky top-0 z-50">
      {/* Top utility bar */}
      <div className="bg-brand-950 text-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-8 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-white/60">Monday, March 9, 2026</span>
            <span className="text-white/40">|</span>
            <span className="text-white/60">Clarksburg, WV · 47°F ☁️</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/p" className="text-white/80 hover:text-gold-400 transition-colors">Publications</Link>
            <Link href="/contests" className="text-white/80 hover:text-gold-400 transition-colors">Contests</Link>
            <Link href="/e-edition" className="text-white/80 hover:text-gold-400 transition-colors">E-Edition</Link>
            <Link href="/subscribe" className="text-gold-400 font-semibold hover:text-gold-300 transition-colors">Subscribe</Link>
            <Link href="/account" className="text-white/80 hover:text-gold-400 transition-colors">Sign In</Link>
            <Link href="/admin" className="text-white/60 hover:text-white transition-colors">Admin</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-ink-600 hover:text-ink-900"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" aria-label="WV News home" className="flex items-center">
            <Logo height={44} variant="full" className="hidden sm:block" />
            <Logo height={40} variant="icon" className="sm:hidden rounded-full" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {sections.slice(0, 8).map(section => (
              <Link
                key={section.id}
                href={`/section/${section.slug}`}
                className="px-3 py-2 text-sm font-medium text-ink-700 hover:text-brand-700 hover:bg-brand-50 rounded transition-colors"
              >
                {section.name}
              </Link>
            ))}
            <button className="px-3 py-2 text-sm font-medium text-ink-500 hover:text-ink-700">More ▾</button>
          </nav>

          {/* Search & Subscribe */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-ink-500 hover:text-ink-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link
              href="/subscribe"
              className="hidden sm:block px-4 py-2 bg-brand-950 text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </div>

      {/* Search bar */}
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
