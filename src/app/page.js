'use client';
import { useState } from 'react';
import { stories, sections } from '@/data/mock';
import PublicHeader from '@/components/public/Header';
import BreakingTicker from '@/components/public/BreakingTicker';
import RegistrationWall from '@/components/public/RegistrationWall';
import Footer from '@/components/public/Footer';
import Link from 'next/link';

function StoryCard({ story, size = 'medium' }) {
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const accessBadge = story.accessLevel === 'subscriber'
    ? <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-950 text-white rounded">Subscriber</span>
    : story.accessLevel === 'metered'
    ? <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gold-500 text-white rounded">Premium</span>
    : null;

  if (size === 'hero') {
    return (
      <Link href={`/article/${story.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-lg bg-ink-900 aspect-[16/9]">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
          <div className="absolute inset-0 bg-brand-950/40" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
            {story.breaking && (
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest bg-red-600 text-white rounded mb-3 animate-pulse">
                Breaking News
              </span>
            )}
            <div className="flex items-center gap-2 mb-2">
              {accessBadge}
              <span className="text-white/70 text-xs uppercase tracking-wider font-medium">
                {sections.find(s => s.id === story.section)?.name}
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-white leading-tight group-hover:text-gold-400 transition-colors">
              {story.headline}
            </h2>
            <p className="mt-2 text-white/80 text-sm md:text-base max-w-2xl line-clamp-2">{story.deck}</p>
            <div className="mt-3 flex items-center gap-3 text-white/60 text-xs">
              <span className="font-medium text-white/80">{story.author.name}</span>
              <span>·</span>
              <span>{timeAgo(story.publishedAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (size === 'large') {
    return (
      <Link href={`/article/${story.slug}`} className="group block">
        <div className="relative overflow-hidden rounded bg-ink-200 aspect-[16/10] mb-3">
          <div className="absolute inset-0 bg-brand-950/20 group-hover:bg-brand-950/10 transition-colors" />
        </div>
        <div className="flex items-center gap-2 mb-1">
          {accessBadge}
          <span className="text-brand-700 text-[11px] uppercase tracking-wider font-semibold">
            {sections.find(s => s.id === story.section)?.name}
          </span>
        </div>
        <h3 className="font-display text-xl font-bold leading-snug text-ink-900 group-hover:text-brand-700 transition-colors">
          {story.headline}
        </h3>
        <p className="mt-1 text-ink-600 text-sm line-clamp-2">{story.deck}</p>
        <div className="mt-2 flex items-center gap-2 text-ink-500 text-xs">
          <span className="font-medium">{story.author.name}</span>
          <span>·</span>
          <span>{timeAgo(story.publishedAt)}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/article/${story.slug}`} className="group flex gap-4 py-4 border-b border-ink-200 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {accessBadge}
          <span className="text-brand-700 text-[10px] uppercase tracking-wider font-semibold">
            {sections.find(s => s.id === story.section)?.name}
          </span>
        </div>
        <h3 className="font-display text-base font-bold leading-snug text-ink-900 group-hover:text-brand-700 transition-colors line-clamp-2">
          {story.headline}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-ink-500 text-xs">
          <span>{story.author.name}</span>
          <span>·</span>
          <span>{timeAgo(story.publishedAt)}</span>
        </div>
      </div>
      <div className="w-24 h-20 flex-shrink-0 rounded bg-ink-200 overflow-hidden">
        <div className="w-full h-full bg-brand-950/10" />
      </div>
    </Link>
  );
}

function WeatherWidget() {
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

function NewsletterSignup() {
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
            onChange={(e) => setEmail(e.target.value)}
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

export default function HomePage() {
  const [showRegWall, setShowRegWall] = useState(false);
  const breaking = stories.find(s => s.breaking);
  const featured = stories.filter(s => s.featured && !s.breaking);
  const latest = stories.filter(s => !s.featured && !s.breaking);

  return (
    <div className="min-h-screen">
      <PublicHeader />
      {breaking && <BreakingTicker story={breaking} />}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            {breaking && <StoryCard story={breaking} size="hero" />}
          </div>
          <div className="space-y-4">
            {featured.map(story => (
              <StoryCard key={story.id} story={story} size="medium" />
            ))}
          </div>
        </div>

        {/* Section Divider */}
        <div className="flex items-center gap-4 mb-6">
          <h2 className="font-display text-xl font-bold text-ink-900 whitespace-nowrap">Latest Stories</h2>
          <div className="flex-1 h-px bg-ink-200" />
          <div className="flex gap-2">
            {sections.slice(0, 5).map(section => (
              <Link
                key={section.id}
                href={`/section/${section.slug}`}
                className="px-3 py-1 text-xs font-medium text-ink-600 hover:text-brand-700 hover:bg-brand-50 rounded-full transition-colors"
              >
                {section.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stories Column */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {featured.map(story => (
                <StoryCard key={story.id} story={story} size="large" />
              ))}
            </div>
            <div className="border-t border-ink-200">
              {latest.map(story => (
                <StoryCard key={story.id} story={story} size="medium" />
              ))}
            </div>
            {/* Ad placeholder */}
            <div className="my-6 bg-ink-100 rounded-lg p-4 text-center">
              <span className="text-[10px] uppercase tracking-widest text-ink-400 font-medium">Advertisement</span>
              <div className="h-24 flex items-center justify-center text-ink-400 text-sm">
                728×90 Leaderboard Ad Zone
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WeatherWidget />
            <NewsletterSignup />

            {/* Most Read */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-ink-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">Most Read Today</h3>
              <ol className="space-y-3">
                {stories.sort((a,b) => b.stats.views - a.stats.views).slice(0,5).map((story, i) => (
                  <li key={story.id} className="flex gap-3">
                    <span className="text-2xl font-display font-bold text-brand-200">{i+1}</span>
                    <Link href={`/article/${story.slug}`} className="text-sm font-medium text-ink-800 hover:text-brand-700 leading-tight">
                      {story.headline}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            {/* Self-service links */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-ink-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">Reader Services</h3>
              <div className="space-y-2">
                {[
                  { label: 'Submit an Obituary', href: '/submit?form=obituary' },
                  { label: 'Submit a Letter', href: '/submit?form=letter' },
                  { label: 'Send a News Tip', href: '/submit?form=tip' },
                  { label: 'Post an Event', href: '/submit?form=event' },
                  { label: 'Place a Classified Ad', href: '/submit?form=classified' },
                  { label: 'Advertise With Us', href: '/submit?form=advertise' },
                  { label: 'Subscribe', href: '/subscribe' },
                  { label: 'E-Edition', href: '/e-edition' },
                  { label: 'Manage My Account', href: '/account' },
                ].map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block px-3 py-2 text-sm text-ink-700 hover:text-brand-700 hover:bg-brand-50 rounded transition-colors"
                  >
                    {item.label} →
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar Ad */}
            <div className="bg-ink-100 rounded-lg p-4 text-center">
              <span className="text-[10px] uppercase tracking-widest text-ink-400 font-medium">Advertisement</span>
              <div className="h-64 flex items-center justify-center text-ink-400 text-sm">
                300×250 Sidebar Ad
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      {showRegWall && <RegistrationWall onClose={() => setShowRegWall(false)} />}
    </div>
  );
}
