// Homepage — Atlantic-clean editorial layout. Server component, blends
// native + ingested + mock stories. Ad inventory: top leaderboard,
// in-feed banner, two right-rail units (sticky on desktop). Mobile drops
// the rail and shifts ads inline.

import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { WeatherWidget, NewsletterSignup } from '@/components/public/HomeSidebarClient';
import AdSlot from '@/components/public/AdSlot';
import { listPublishedStories } from '@/lib/stories-db';
import { stories as mockStories, sections } from '@/data/mock';

export const dynamic = 'force-dynamic';

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
  try {
    native = await listPublishedStories({ limit: 60 });
  } catch {
    native = [];
  }
  const nativeSlugs = new Set(native.map(s => s.slug));
  const mocks = mockStories.filter(s => !nativeSlugs.has(s.slug));
  return [...native, ...mocks];
}

function Eyebrow({ section, breaking }) {
  const sec = sections.find(s => s.id === section);
  return (
    <div className="flex items-center gap-2 mb-2">
      {breaking && (
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-eyebrow bg-red-600 text-white rounded-sm">
          ● Breaking
        </span>
      )}
      {sec && (
        <span className="text-[10px] font-bold uppercase tracking-eyebrow text-brand-700">
          {sec.name}
        </span>
      )}
    </div>
  );
}

function Byline({ author, publishedAt }) {
  return (
    <div className="text-xs text-ink-500 font-body">
      <span className="font-medium text-ink-700">{author?.name || ''}</span>
      {author?.name && publishedAt && <span className="mx-1.5">·</span>}
      {publishedAt && <span>{timeAgo(publishedAt)}</span>}
    </div>
  );
}

function HeroStory({ story }) {
  if (!story) return null;
  const heroImg = story.image?.url;
  return (
    <Link href={`/article/${story.slug}`} className="group block">
      <div className="relative overflow-hidden bg-ink-900 aspect-[16/9] mb-5">
        {heroImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImg} alt={story.image?.alt || ''} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        )}
        {!heroImg && <div className="absolute inset-0 bg-gradient-to-br from-brand-900 to-brand-950" />}
      </div>
      <Eyebrow section={story.section} breaking={story.breaking} />
      <h1 className="font-display text-3xl md:text-5xl font-bold leading-[1.05] text-ink-900 group-hover:text-brand-700 transition-colors">
        {story.headline}
      </h1>
      {story.deck && (
        <p className="mt-3 text-base md:text-lg text-ink-600 leading-snug max-w-3xl">{story.deck}</p>
      )}
      <div className="mt-3"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
    </Link>
  );
}

function SecondaryStory({ story }) {
  const heroImg = story.image?.url;
  return (
    <Link href={`/article/${story.slug}`} className="group block">
      {heroImg && (
        <div className="relative overflow-hidden bg-ink-200 aspect-[16/10] mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      )}
      <Eyebrow section={story.section} breaking={story.breaking} />
      <h2 className="font-display text-xl md:text-2xl font-bold leading-snug text-ink-900 group-hover:text-brand-700 transition-colors">
        {story.headline}
      </h2>
      {story.deck && <p className="mt-2 text-sm text-ink-600 line-clamp-2">{story.deck}</p>}
      <div className="mt-2"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
    </Link>
  );
}

function RiverItem({ story }) {
  const heroImg = story.image?.url;
  return (
    <Link href={`/article/${story.slug}`} className="group flex gap-4 py-5 border-b border-ink-200 last:border-0">
      <div className="flex-1 min-w-0">
        <Eyebrow section={story.section} breaking={story.breaking} />
        <h3 className="font-display text-base md:text-lg font-bold leading-snug text-ink-900 group-hover:text-brand-700 transition-colors line-clamp-3">
          {story.headline}
        </h3>
        <div className="mt-1.5"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
      </div>
      {heroImg && (
        <div className="w-28 h-24 sm:w-32 sm:h-28 flex-shrink-0 bg-ink-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </Link>
  );
}

function MostRead({ stories }) {
  return (
    <section className="bg-white border border-ink-200 p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-eyebrow text-ink-500 mb-4 pb-2 border-b border-ink-200">
        Most Read
      </h3>
      <ol className="space-y-4">
        {stories.map((story, i) => (
          <li key={story.id || story.slug} className="flex gap-3 items-start">
            <span className="font-display text-2xl font-bold text-brand-300 leading-none w-6 flex-shrink-0">{i + 1}</span>
            <Link href={`/article/${story.slug}`} className="font-display text-sm font-semibold leading-snug text-ink-800 hover:text-brand-700 transition-colors">
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
    <section className="bg-white border border-ink-200 p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-eyebrow text-ink-500 mb-3 pb-2 border-b border-ink-200">
        Reader Services
      </h3>
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.label}>
            <Link href={item.href} className="block py-1.5 text-sm text-ink-700 hover:text-brand-700 transition-colors">
              {item.label} <span className="text-ink-400">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function HomePage() {
  const all = await blendStories();

  const breaking = all.find(s => s.breaking) || null;
  const featured = all.filter(s => s.featured && !s.breaking);
  const lead = breaking || featured[0] || all[0];
  const secondaries = (breaking ? featured : featured.slice(1)).slice(0, 4);
  const usedIds = new Set([lead, ...secondaries].filter(Boolean).map(s => s.id || s.slug));
  const river = all.filter(s => !usedIds.has(s.id || s.slug)).slice(0, 18);
  const mostRead = [...all].sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0)).slice(0, 5);

  const adTargeting = { page: 'home', breaking: breaking ? 'yes' : 'no' };

  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Top leaderboard. Sits below the header, above editorial. */}
      <div className="border-b border-ink-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <AdSlot placement="home-top" site="wvnews" targeting={adTargeting} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-10">
        {/* Lead block: hero left, two secondary right (desktop). Stacks on mobile. */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 pb-10 border-b border-ink-300">
          <div className="lg:col-span-2">
            <HeroStory story={lead} />
          </div>
          <div className="space-y-6 lg:border-l lg:border-ink-200 lg:pl-8">
            {secondaries.slice(0, 2).map(story => (
              <SecondaryStory key={story.id || story.slug} story={story} />
            ))}
          </div>
        </section>

        {/* Story river + right rail. Rail is sticky on desktop. */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
          <div className="lg:col-span-2">
            <header className="flex items-baseline justify-between mb-2 pb-3 border-b-2 border-ink-900">
              <h2 className="font-display text-2xl font-bold text-ink-900">Latest from West Virginia</h2>
              <Link href="/section/news" className="text-xs font-semibold uppercase tracking-eyebrow text-brand-700 hover:text-brand-900">
                See All →
              </Link>
            </header>

            {/* First chunk of river */}
            <div>
              {river.slice(0, 6).map(story => (
                <RiverItem key={story.id || story.slug} story={story} />
              ))}
            </div>

            {/* In-feed ad break */}
            <div className="my-8">
              <AdSlot placement="home-in-feed" site="wvnews" targeting={adTargeting} />
            </div>

            {/* Second chunk + featured callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 my-8">
              {secondaries.slice(2).map(story => (
                <SecondaryStory key={story.id || story.slug} story={story} />
              ))}
            </div>

            <div>
              {river.slice(6).map(story => (
                <RiverItem key={story.id || story.slug} story={story} />
              ))}
            </div>
          </div>

          {/* Right rail — desktop only */}
          <aside className="hidden lg:block space-y-6">
            <div className="sticky top-4 space-y-6">
              <AdSlot placement="home-sidebar-1" site="wvnews" targeting={adTargeting} />
              <MostRead stories={mostRead} />
              <NewsletterSignup />
              <WeatherWidget />
              <AdSlot placement="home-sidebar-2" site="wvnews" targeting={adTargeting} />
              <ReaderServices />
            </div>
          </aside>

          {/* Mobile-only: collapse sidebar widgets below river */}
          <div className="lg:hidden space-y-6 mt-10">
            <NewsletterSignup />
            <MostRead stories={mostRead} />
            <ReaderServices />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
