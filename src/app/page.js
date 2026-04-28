// Homepage — Boston Globe layout. Three-column above-the-fold:
//   col 1 (lead photo + headline)  |  col 2 (stacked stories)  |  col 3 (opinion)
// Centered blackletter-style masthead in the header. TRENDING strip
// with red label + pipe-separated topics. Below the fold: featured
// section blocks (News, Sports, etc.) and the right rail with widgets.

import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { WeatherWidget, NewsletterSignup } from '@/components/public/HomeSidebarClient';
import AdSlot from '@/components/public/AdSlot';
import { listPublishedStories, listPublishedBySection } from '@/lib/stories-db';
import { stories as mockStories, sections } from '@/data/mock';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  masthead: { imageUrl: '', altText: '', linkUrl: '/', bgColor: '' },
  featuredSections: ['news', 'sports', 'opinion', 'business', 'community'],
  sidebar: {
    showWeather: true,
    showNewsletter: true,
    showMostRead: true,
    showReaderServices: true,
  },
};

async function loadSiteSettings(siteId = 'wvnews') {
  try {
    const snap = await db.collection('settings').doc(`site-${siteId}`).get();
    if (!snap.exists) return DEFAULT_SETTINGS;
    const d = snap.data();
    return {
      ...DEFAULT_SETTINGS,
      ...d,
      masthead: { ...DEFAULT_SETTINGS.masthead, ...(d.masthead || {}) },
      sidebar: { ...DEFAULT_SETTINGS.sidebar, ...(d.sidebar || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function blendStories() {
  let native = [];
  try { native = await listPublishedStories({ limit: 100 }); } catch { native = []; }
  const nativeSlugs = new Set(native.map(s => s.slug));
  const mocks = mockStories.filter(s => !nativeSlugs.has(s.slug));
  return [...native, ...mocks];
}

// ─── Building blocks ────────────────────────────────────────────────────

function Eyebrow({ section, breaking }) {
  const sec = sections.find(s => s.id === section);
  return (
    <div className="flex items-center gap-2 mb-2">
      {breaking && (
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-eyebrow bg-red-700 text-white rounded-sm">
          ● Breaking
        </span>
      )}
      {sec && !breaking && (
        <span className="text-[11px] font-bold uppercase tracking-eyebrow text-red-700">
          {sec.name}
        </span>
      )}
    </div>
  );
}

function Byline({ author, publishedAt, color = 'text-ink-500' }) {
  return (
    <div className={`text-xs font-body ${color}`}>
      {author?.name && <span className="font-medium text-ink-700">By {author.name}</span>}
      {author?.name && publishedAt && <span className="mx-1.5 text-ink-400">·</span>}
      {publishedAt && <span>{timeAgo(publishedAt)}</span>}
    </div>
  );
}

// COL 1 — Lead photo + headline below. Globe's left column.
function LeadPhotoStory({ story }) {
  if (!story) return null;
  const heroImg = story.image?.url;
  return (
    <Link href={`/article/${story.slug}`} className="group block">
      <article>
        {heroImg ? (
          <div className="relative overflow-hidden bg-ink-900 mb-4 aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt={story.image?.alt || ''} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          </div>
        ) : (
          <div className="aspect-[4/3] mb-4 bg-gradient-to-br from-brand-900 to-brand-950" />
        )}
        <Eyebrow section={story.section} breaking={story.breaking} />
        <h2 className="font-display text-2xl md:text-[28px] font-bold leading-[1.1] text-ink-900 group-hover:text-brand-800 transition-colors tracking-tight">
          {story.headline}
        </h2>
        {story.deck && (
          <p className="mt-2 text-base text-ink-700 leading-snug font-display">
            {story.deck}
          </p>
        )}
        <div className="mt-2"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
      </article>
    </Link>
  );
}

// COL 2 — Stacked stories. Top one BIG with optional inline deck+thumb.
function StackedStories({ stories }) {
  if (!stories.length) return null;
  const [lead, ...rest] = stories;
  return (
    <div className="space-y-5">
      {/* Big lead — biggest type on the page */}
      <Link href={`/article/${lead.slug}`} className="group block pb-5 border-b border-ink-200">
        <Eyebrow section={lead.section} breaking={lead.breaking} />
        <h1 className="font-display text-3xl md:text-[34px] font-bold leading-[1.05] text-ink-900 group-hover:text-brand-800 transition-colors tracking-tight">
          {lead.headline}
        </h1>
        {lead.deck && (
          <div className="mt-4 flex gap-4">
            <p className="flex-1 text-[15px] text-ink-700 leading-snug font-display italic">{lead.deck}</p>
            {lead.image?.url && (
              <div className="w-24 h-20 sm:w-28 sm:h-24 flex-shrink-0 overflow-hidden bg-ink-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lead.image.url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}
        <div className="mt-3"><Byline author={lead.author} publishedAt={lead.publishedAt} /></div>
      </Link>

      {/* Stack — text-only headlines under the lead */}
      {rest.map(story => (
        <Link key={story.id || story.slug} href={`/article/${story.slug}`} className="group block pb-4 border-b border-ink-200 last:border-0">
          <Eyebrow section={story.section} breaking={story.breaking} />
          <h3 className="font-display text-xl font-bold leading-snug text-ink-900 group-hover:text-brand-800 transition-colors">
            {story.headline}
          </h3>
          <div className="mt-1.5"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
        </Link>
      ))}
    </div>
  );
}

// COL 3 — Opinion sidebar. Red OPINION eyebrow, opinion lead with image,
// red byline labels, then 2 sub-takes side-by-side.
function OpinionColumn({ stories }) {
  if (!stories.length) return null;
  const [lead, ...rest] = stories;
  const subTakes = rest.slice(0, 2);

  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-eyebrow text-ink-900 pb-2 mb-4 border-b-[3px] border-ink-900">
        Opinion
      </h3>
      {lead && (
        <Link href={`/article/${lead.slug}`} className="group block mb-5 pb-5 border-b border-ink-200">
          {lead.image?.url && (
            <div className="aspect-[4/3] bg-ink-200 overflow-hidden mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lead.image.url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          {lead.author?.name && (
            <div className="text-[11px] font-bold uppercase tracking-eyebrow text-red-700 mb-1.5">
              {lead.author.name}
            </div>
          )}
          <h4 className="font-display text-lg font-bold leading-snug text-ink-900 group-hover:text-brand-800 transition-colors">
            {lead.headline}
          </h4>
          {lead.deck && (
            <p className="mt-2 text-sm text-ink-600 leading-snug">{lead.deck}</p>
          )}
        </Link>
      )}
      {subTakes.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {subTakes.map(s => (
            <Link key={s.id || s.slug} href={`/article/${s.slug}`} className="group block">
              {s.author?.name && (
                <div className="text-[10px] font-bold uppercase tracking-eyebrow text-red-700 mb-1">
                  {s.author.name}
                </div>
              )}
              <h5 className="font-display text-sm font-bold leading-snug text-ink-900 group-hover:text-brand-800 transition-colors">
                {s.headline}
              </h5>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Section block (below the above-fold) — red rule + section label, lead
// with photo + 3 headline rows beside it.
async function SectionBlock({ sectionId, fallbackStories }) {
  const sec = sections.find(s => s.id === sectionId);
  if (!sec) return null;

  let stories = [];
  try { stories = await listPublishedBySection(sectionId, { limit: 8 }); } catch { /* ignore */ }
  if (!stories.length) {
    stories = fallbackStories.filter(s => s.section === sectionId || (s.secondarySections || []).includes(sectionId));
  }
  if (!stories.length) return null;

  const [lead, ...rest] = stories;
  const sideStories = rest.slice(0, 3);
  return (
    <section className="py-7 first:pt-0">
      <header className="mb-5 pb-2 border-b-[3px] border-red-700">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl md:text-[28px] font-bold text-ink-900 tracking-tight">
            {sec.name}
          </h2>
          <Link href={`/section/${sec.slug}`}
                className="text-[11px] font-bold uppercase tracking-eyebrow text-red-700 hover:text-red-900">
            More {sec.name.toLowerCase()} →
          </Link>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
        <div className="md:col-span-2">
          <Link href={`/article/${lead.slug}`} className="group block">
            {lead.image?.url && (
              <div className="aspect-[16/10] bg-ink-200 overflow-hidden mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lead.image.url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <h3 className="font-display text-xl md:text-2xl font-bold leading-snug text-ink-900 group-hover:text-brand-800">
              {lead.headline}
            </h3>
            {lead.deck && <p className="mt-2 text-sm text-ink-600 line-clamp-2">{lead.deck}</p>}
            <div className="mt-2"><Byline author={lead.author} publishedAt={lead.publishedAt} /></div>
          </Link>
        </div>
        <div>
          {sideStories.map(s => (
            <Link key={s.id || s.slug} href={`/article/${s.slug}`} className="group block py-3 border-b border-ink-200 last:border-0">
              <h4 className="font-display text-base font-semibold leading-snug text-ink-800 group-hover:text-brand-800">
                {s.headline}
              </h4>
              <div className="mt-1"><Byline author={s.author} publishedAt={s.publishedAt} /></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Right-rail widgets
function MostRead({ stories }) {
  return (
    <section>
      <h3 className="text-[11px] font-bold uppercase tracking-eyebrow text-ink-900 pb-2 mb-4 border-b-[3px] border-ink-900">Most read</h3>
      <ol className="space-y-3">
        {stories.map((story, i) => (
          <li key={story.id || story.slug} className="flex gap-3 items-start pb-3 border-b border-ink-200 last:border-0">
            <span className="font-display text-2xl font-bold text-red-700 leading-none w-6 flex-shrink-0">{i + 1}</span>
            <Link href={`/article/${story.slug}`} className="font-display text-sm font-semibold leading-snug text-ink-800 hover:text-brand-800">
              {story.headline}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReaderServices() {
  const items = [
    { label: 'Submit an Obituary', href: '/submit?form=obituary' },
    { label: 'Submit a Letter', href: '/submit?form=letter' },
    { label: 'Send a News Tip', href: '/submit?form=tip' },
    { label: 'Place a Classified Ad', href: '/submit?form=classified' },
    { label: 'Subscribe', href: '/subscribe' },
    { label: 'E-Edition', href: '/e-edition' },
    { label: 'Manage My Account', href: '/account' },
  ];
  return (
    <section>
      <h3 className="text-[11px] font-bold uppercase tracking-eyebrow text-ink-900 pb-2 mb-3 border-b-[3px] border-ink-900">Reader services</h3>
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.label}>
            <Link href={item.href} className="block py-1.5 text-sm text-ink-700 hover:text-red-700">
              {item.label} <span className="text-ink-400">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Trending derivation — surface tags from breaking + featured stories
// as Globe-style trending topics. Each links to /topic/{slug} which
// groups all stories sharing that tag.
function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function deriveTrending(all) {
  const tagCounts = new Map();
  // Score tags: breaking +3, featured +2, recent +1
  for (const s of all) {
    if (!Array.isArray(s.tags)) continue;
    const weight = s.breaking ? 3 : s.featured ? 2 : 1;
    for (const tag of s.tags.slice(0, 3)) {
      const norm = String(tag || '').trim();
      if (!norm || norm.length < 3 || norm.length > 30) continue;
      tagCounts.set(norm, (tagCounts.get(norm) || 0) + weight);
    }
  }
  // Top 8 by score, ties broken alphabetically.
  const ranked = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8);

  const fromTags = ranked.map(([tag]) => ({
    label: tag.toUpperCase(),
    href: `/topic/${slugify(tag)}`,
  }));

  // If there aren't enough tags, fall back to truncated breaking/featured
  // headlines so the bar always has content.
  if (fromTags.length >= 4) return fromTags;
  const seen = new Set(fromTags.map(t => t.label));
  const fallbacks = all.filter(s => s.breaking || s.featured)
    .map(s => {
      const label = (s.headline || '').slice(0, 28).trim().toUpperCase();
      return { label, href: `/article/${s.slug}` };
    })
    .filter(t => t.label && !seen.has(t.label));
  return [...fromTags, ...fallbacks].slice(0, 8);
}

// ─── Page ────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [all, settings] = await Promise.all([blendStories(), loadSiteSettings('wvnews')]);

  const breaking = all.find(s => s.breaking) || null;
  const featured = all.filter(s => s.featured && !s.breaking);

  // COL 1 — left photo lead. Use the second-best featured story (so the
  // biggest is in the center stack as the day's "lead").
  const photoLead = featured[1] || all.find(s => s.image?.url && !s.breaking) || all[0];

  // COL 2 — center stack. Top is the day's lead, then 3-4 stacked stories.
  const stackLead = breaking || featured[0] || all[0];
  const usedIds = new Set([photoLead, stackLead].filter(Boolean).map(s => s.id || s.slug));
  const stackRest = all
    .filter(s => !usedIds.has(s.id || s.slug) && s.section !== 'opinion')
    .slice(0, 4);
  const stack = [stackLead, ...stackRest];
  stackRest.forEach(s => usedIds.add(s.id || s.slug));

  // COL 3 — opinion column. Top opinion + 2 sub-takes.
  const opinions = all.filter(s => s.section === 'opinion').slice(0, 5);

  // Below-the-fold: section blocks
  const featuredSections = settings.featuredSections.filter(id => id !== 'opinion');

  // Most-read for right rail
  const mostRead = [...all].sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0)).slice(0, 5);

  const adTargeting = { page: 'home', breaking: breaking ? 'yes' : 'no' };
  const trendingTopics = deriveTrending(all);
  const masthead = settings.masthead?.imageUrl ? settings.masthead : null;
  const sidebar = settings.sidebar;

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader showMasthead trendingTopics={trendingTopics} />

      {/* Optional editor-uploaded promotional masthead banner */}
      {masthead && (
        <a href={masthead.linkUrl || '/'} className="block border-b border-ink-200" style={{ background: masthead.bgColor || '#f8f9fa' }}>
          <div className="max-w-7xl mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={masthead.imageUrl} alt={masthead.altText || ''} className="block max-w-full h-auto mx-auto" />
          </div>
        </a>
      )}

      {/* Top leaderboard ad — Globe puts this above the masthead, but we
          already have the masthead in the sticky header, so we keep the
          leaderboard below where it can fill 970x250. */}
      <div className="border-b border-ink-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <AdSlot placement="home-top" site="wvnews" targeting={adTargeting} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        {/* Three-column above-the-fold grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8 pb-8 mb-8 border-b-2 border-ink-900">
          <div className="lg:col-span-4">
            <LeadPhotoStory story={photoLead} />
          </div>
          <div className="lg:col-span-5 lg:border-x lg:border-ink-200 lg:px-8">
            <StackedStories stories={stack} />
          </div>
          <div className="lg:col-span-3">
            <OpinionColumn stories={opinions} />
          </div>
        </section>

        {/* Two-column: section blocks + right rail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-8">
          <div className="lg:col-span-9 divide-y divide-ink-200">
            {featuredSections.map(sectionId => (
              <SectionBlock key={sectionId} sectionId={sectionId} fallbackStories={all} />
            ))}

            <div className="py-6">
              <AdSlot placement="home-in-feed" site="wvnews" targeting={adTargeting} />
            </div>
          </div>

          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-32 space-y-6">
              <AdSlot placement="home-sidebar-1" site="wvnews" targeting={adTargeting} />
              {sidebar.showMostRead && <MostRead stories={mostRead} />}
              {sidebar.showNewsletter && <NewsletterSignup />}
              {sidebar.showWeather && <WeatherWidget />}
              <AdSlot placement="home-sidebar-2" site="wvnews" targeting={adTargeting} />
              {sidebar.showReaderServices && <ReaderServices />}
            </div>
          </aside>

          <div className="lg:hidden space-y-6">
            {sidebar.showNewsletter && <NewsletterSignup />}
            {sidebar.showMostRead && <MostRead stories={mostRead} />}
            {sidebar.showReaderServices && <ReaderServices />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
