// Homepage — Boston Globe-style: dense, news-paper feel, multi-column
// grids, red accent, prominent section dividers. Server component.
//
// Reads site settings from Firestore (settings/site-{site}) so the
// editor can swap the masthead, reorder featured section blocks, and
// toggle sidebar widgets via /admin/site without a code change.

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

function Eyebrow({ section, breaking, color = 'red-700' }) {
  const sec = sections.find(s => s.id === section);
  return (
    <div className="flex items-center gap-2 mb-2">
      {breaking && (
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-eyebrow bg-red-600 text-white rounded-sm">
          ● Breaking
        </span>
      )}
      {sec && (
        <span className={`text-[11px] font-bold uppercase tracking-eyebrow text-${color}`}>
          {sec.name}
        </span>
      )}
    </div>
  );
}

function Byline({ author, publishedAt }) {
  return (
    <div className="text-xs text-ink-500 font-body">
      {author?.name && <span className="font-medium text-ink-700">{author.name}</span>}
      {author?.name && publishedAt && <span className="mx-1.5 text-ink-400">·</span>}
      {publishedAt && <span>{timeAgo(publishedAt)}</span>}
    </div>
  );
}

// Hero — full-bleed photo with headline overlay, dramatic. The Globe
// uses this for the day's biggest story.
function HeroLead({ story }) {
  if (!story) return null;
  const heroImg = story.image?.url;
  return (
    <Link href={`/article/${story.slug}`} className="group block mb-6">
      <article>
        {heroImg ? (
          <div className="relative overflow-hidden bg-ink-900 mb-4 aspect-[16/8] md:aspect-[16/7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt={story.image?.alt || ''} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          </div>
        ) : (
          <div className="aspect-[16/7] mb-4 bg-gradient-to-br from-brand-900 to-brand-950" />
        )}
        <Eyebrow section={story.section} breaking={story.breaking} />
        <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.02] text-ink-900 group-hover:text-brand-800 transition-colors tracking-tight">
          {story.headline}
        </h1>
        {story.deck && (
          <p className="mt-3 text-base md:text-lg text-ink-700 leading-snug max-w-3xl font-display">
            {story.deck}
          </p>
        )}
        <div className="mt-3"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
      </article>
    </Link>
  );
}

// Compact card — used in the 3-up secondary row + section grids.
function StoryCard({ story, withImage = true, headlineSize = 'md' }) {
  const heroImg = story.image?.url;
  const sizeClass = headlineSize === 'lg'
    ? 'text-xl md:text-2xl'
    : headlineSize === 'sm'
    ? 'text-base'
    : 'text-lg md:text-xl';
  return (
    <Link href={`/article/${story.slug}`} className="group block">
      {withImage && (
        <div className="relative overflow-hidden bg-ink-200 aspect-[16/10] mb-3">
          {heroImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-brand-100" />
          )}
        </div>
      )}
      <Eyebrow section={story.section} breaking={story.breaking} />
      <h3 className={`font-display ${sizeClass} font-bold leading-snug text-ink-900 group-hover:text-brand-800 transition-colors`}>
        {story.headline}
      </h3>
      {story.deck && headlineSize !== 'sm' && (
        <p className="mt-1.5 text-sm text-ink-600 leading-snug line-clamp-2">{story.deck}</p>
      )}
      <div className="mt-1.5"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
    </Link>
  );
}

// Tight headline-only row — Globe's section "more" lists.
function HeadlineRow({ story }) {
  return (
    <Link href={`/article/${story.slug}`} className="group block py-3 border-b border-ink-200 last:border-0">
      <h4 className="font-display text-base font-semibold leading-snug text-ink-800 group-hover:text-brand-800 transition-colors">
        {story.headline}
      </h4>
      <div className="mt-1"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
    </Link>
  );
}

// Globe-style red section divider. Big bold serif label, thin red rule,
// "More" link to the section page.
function SectionRule({ section, sectionData }) {
  return (
    <header className="mb-5 pb-2 border-b-[3px] border-red-700">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-ink-900 tracking-tight">
          <span className="text-red-700 mr-1">{sectionData?.icon}</span>
          {sectionData?.name || section}
        </h2>
        <Link href={`/section/${sectionData?.slug || section}`}
              className="text-[11px] font-bold uppercase tracking-eyebrow text-red-700 hover:text-red-900">
          More {sectionData?.name?.toLowerCase()} →
        </Link>
      </div>
    </header>
  );
}

// Section block: 1 lead with image + 3 headline rows beside it.
async function SectionBlock({ sectionId, allStories }) {
  const sec = sections.find(s => s.id === sectionId);
  if (!sec) return null;

  // Try Firestore for live stories in this section, fall back to allStories.
  let stories = [];
  try {
    stories = await listPublishedBySection(sectionId, { limit: 8 });
  } catch { /* ignore */ }
  if (!stories.length) {
    stories = allStories.filter(s => s.section === sectionId || (s.secondarySections || []).includes(sectionId));
  }
  if (!stories.length) return null;

  const [lead, ...rest] = stories;
  const sideStories = rest.slice(0, 3);
  return (
    <section className="py-6 first:pt-0">
      <SectionRule section={sectionId} sectionData={sec} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
        <div className="md:col-span-2">
          <StoryCard story={lead} headlineSize="lg" />
        </div>
        <div>
          {sideStories.map(s => <HeadlineRow key={s.id || s.slug} story={s} />)}
        </div>
      </div>
    </section>
  );
}

// Right-rail widgets, server-rendered shells around client islands.
function MostRead({ stories }) {
  return (
    <section className="bg-white border-t-[3px] border-red-700">
      <h3 className="text-[11px] font-bold uppercase tracking-eyebrow text-red-700 mt-3 mb-3">Most read</h3>
      <ol className="space-y-3">
        {stories.map((story, i) => (
          <li key={story.id || story.slug} className="flex gap-3 items-start pb-3 border-b border-ink-200 last:border-0">
            <span className="font-display text-2xl font-bold text-red-700 leading-none w-6 flex-shrink-0">{i + 1}</span>
            <Link href={`/article/${story.slug}`} className="font-display text-sm font-semibold leading-snug text-ink-800 hover:text-brand-800 transition-colors">
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
    <section className="bg-white border-t-[3px] border-red-700">
      <h3 className="text-[11px] font-bold uppercase tracking-eyebrow text-red-700 mt-3 mb-3">Reader services</h3>
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.label}>
            <Link href={item.href} className="block py-1.5 text-sm text-ink-700 hover:text-brand-800">
              {item.label} <span className="text-ink-400">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [all, settings] = await Promise.all([blendStories(), loadSiteSettings('wvnews')]);

  const breaking = all.find(s => s.breaking) || null;
  const featured = all.filter(s => s.featured && !s.breaking);
  const lead = breaking || featured[0] || all[0];
  const usedIds = new Set([lead].filter(Boolean).map(s => s.id || s.slug));

  // Three-up under the hero — next 3 most important.
  const threeUp = (breaking ? featured : featured.slice(1))
    .filter(s => !usedIds.has(s.id || s.slug))
    .slice(0, 3);
  threeUp.forEach(s => usedIds.add(s.id || s.slug));

  // Story river of recent items not used elsewhere.
  const river = all.filter(s => !usedIds.has(s.id || s.slug)).slice(0, 14);

  const mostRead = [...all].sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0)).slice(0, 5);
  const adTargeting = { page: 'home', breaking: breaking ? 'yes' : 'no' };

  // Optional masthead from /admin/site
  const masthead = settings.masthead?.imageUrl ? settings.masthead : null;
  const sidebar = settings.sidebar;

  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Optional editor-uploaded masthead banner */}
      {masthead && (
        <a href={masthead.linkUrl || '/'} className="block border-b border-ink-200" style={{ background: masthead.bgColor || '#f8f9fa' }}>
          <div className="max-w-7xl mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={masthead.imageUrl} alt={masthead.altText || ''} className="block max-w-full h-auto mx-auto" />
          </div>
        </a>
      )}

      {/* Top leaderboard */}
      <div className="border-b border-ink-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <AdSlot placement="home-top" site="wvnews" targeting={adTargeting} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-7 lg:py-9">
        {/* Hero + 3-up. Globe puts the day's biggest above smaller secondary cards. */}
        <section className="pb-8 mb-8 border-b-2 border-ink-900">
          <HeroLead story={lead} />
          {threeUp.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-6 pt-2">
              {threeUp.map(story => (
                <StoryCard key={story.id || story.slug} story={story} headlineSize="md" />
              ))}
            </div>
          )}
        </section>

        {/* Two-column river + right rail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-8">
          <div className="lg:col-span-2 space-y-1">
            <header className="pb-2 border-b-[3px] border-red-700 mb-4">
              <h2 className="font-display text-2xl font-bold text-ink-900 tracking-tight">Latest from West Virginia</h2>
            </header>
            {river.slice(0, 6).map(story => (
              <article key={story.id || story.slug} className="grid grid-cols-3 gap-4 py-4 border-b border-ink-200 last:border-0">
                <Link href={`/article/${story.slug}`} className="group col-span-2">
                  <Eyebrow section={story.section} breaking={story.breaking} />
                  <h3 className="font-display text-lg md:text-xl font-bold leading-snug text-ink-900 group-hover:text-brand-800 transition-colors">
                    {story.headline}
                  </h3>
                  {story.deck && <p className="mt-1.5 text-sm text-ink-600 line-clamp-2">{story.deck}</p>}
                  <div className="mt-1.5"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
                </Link>
                {story.image?.url && (
                  <Link href={`/article/${story.slug}`} className="block">
                    <div className="bg-ink-200 aspect-[4/3] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={story.image.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </Link>
                )}
              </article>
            ))}

            <div className="my-7">
              <AdSlot placement="home-in-feed" site="wvnews" targeting={adTargeting} />
            </div>

            {river.slice(6).map(story => (
              <article key={story.id || story.slug} className="grid grid-cols-3 gap-4 py-4 border-b border-ink-200 last:border-0">
                <Link href={`/article/${story.slug}`} className="group col-span-2">
                  <Eyebrow section={story.section} breaking={story.breaking} />
                  <h3 className="font-display text-lg font-bold leading-snug text-ink-900 group-hover:text-brand-800 transition-colors">
                    {story.headline}
                  </h3>
                  <div className="mt-1.5"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
                </Link>
                {story.image?.url && (
                  <Link href={`/article/${story.slug}`} className="block">
                    <div className="bg-ink-200 aspect-[4/3] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={story.image.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </Link>
                )}
              </article>
            ))}
          </div>

          {/* Right rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-4 space-y-6">
              <AdSlot placement="home-sidebar-1" site="wvnews" targeting={adTargeting} />
              {sidebar.showMostRead && <MostRead stories={mostRead} />}
              {sidebar.showNewsletter && <NewsletterSignup />}
              {sidebar.showWeather && <WeatherWidget />}
              <AdSlot placement="home-sidebar-2" site="wvnews" targeting={adTargeting} />
              {sidebar.showReaderServices && <ReaderServices />}
            </div>
          </aside>

          {/* Mobile collapse — sidebar widgets below river */}
          <div className="lg:hidden space-y-6 mt-2">
            {sidebar.showNewsletter && <NewsletterSignup />}
            {sidebar.showMostRead && <MostRead stories={mostRead} />}
            {sidebar.showReaderServices && <ReaderServices />}
          </div>
        </div>

        {/* Featured section blocks — News, Sports, Opinion, etc. — Globe-style */}
        <div className="mt-12 space-y-3 divide-y divide-ink-200">
          {settings.featuredSections.map(sectionId => (
            <SectionBlock key={sectionId} sectionId={sectionId} allStories={all} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
