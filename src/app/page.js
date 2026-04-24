// Homepage — server component. Renders published native stories from
// Firestore, mixed with mock.js seeds so the layout stays populated while
// your reporters ramp up authoring in the new CMS. Native stories always
// win over mock when both exist at the same slug.

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
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Merge native + mock, native wins. Mock entries fill the visual space
// while the real CMS is populated; they show up clearly with slug links
// that still resolve (articles/[slug] falls back to mock seeds).
async function blendStories() {
  let native = [];
  try {
    native = await listPublishedStories({ limit: 40 });
  } catch {
    native = [];
  }
  const nativeSlugs = new Set(native.map(s => s.slug));
  const mocks = mockStories.filter(s => !nativeSlugs.has(s.slug));
  return [...native, ...mocks];
}

function StoryCard({ story, size = 'medium' }) {
  const section = sections.find(s => s.id === story.section);

  const accessBadge = story.accessLevel === 'premium'
    ? <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-950 text-white rounded">Subscriber</span>
    : story.accessLevel === 'metered'
    ? <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gold-500 text-white rounded">Premium</span>
    : null;

  const heroImg = story.image?.url;

  if (size === 'hero') {
    return (
      <Link href={`/article/${story.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-lg bg-ink-900 aspect-[16/9]">
          {heroImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImg} alt={story.image?.alt || ''} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
          {!heroImg && <div className="absolute inset-0 bg-brand-950/40" />}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
            {story.breaking && (
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest bg-red-600 text-white rounded mb-3 animate-pulse">
                Breaking News
              </span>
            )}
            <div className="flex items-center gap-2 mb-2">
              {accessBadge}
              <span className="text-white/70 text-xs uppercase tracking-wider font-medium">
                {section?.name}
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-white leading-tight group-hover:text-gold-400 transition-colors">
              {story.headline}
            </h2>
            {story.deck && (
              <p className="mt-2 text-white/80 text-sm md:text-base max-w-2xl line-clamp-2">{story.deck}</p>
            )}
            <div className="mt-3 flex items-center gap-3 text-white/60 text-xs">
              <span className="font-medium text-white/80">{story.author?.name}</span>
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
          {heroImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
          ) : (
            <div className="absolute inset-0 bg-brand-950/20 group-hover:bg-brand-950/10 transition-colors" />
          )}
        </div>
        <div className="flex items-center gap-2 mb-1">
          {accessBadge}
          <span className="text-brand-700 text-[11px] uppercase tracking-wider font-semibold">
            {section?.name}
          </span>
        </div>
        <h3 className="font-display text-xl font-bold leading-snug text-ink-900 group-hover:text-brand-700 transition-colors">
          {story.headline}
        </h3>
        {story.deck && <p className="mt-1 text-ink-600 text-sm line-clamp-2">{story.deck}</p>}
        <div className="mt-2 flex items-center gap-2 text-ink-500 text-xs">
          <span className="font-medium">{story.author?.name}</span>
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
            {section?.name}
          </span>
          {story.breaking && <span className="text-[10px] font-bold text-red-600">● BREAKING</span>}
        </div>
        <h3 className="font-display text-base font-bold leading-snug text-ink-900 group-hover:text-brand-700 transition-colors line-clamp-2">
          {story.headline}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-ink-500 text-xs">
          <span>{story.author?.name}</span>
          <span>·</span>
          <span>{timeAgo(story.publishedAt)}</span>
        </div>
      </div>
      <div className="w-24 h-20 flex-shrink-0 rounded bg-ink-200 overflow-hidden">
        {heroImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-brand-950/10" />
        )}
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const all = await blendStories();

  const breaking = all.find(s => s.breaking) || null;
  const featured = all.filter(s => s.featured && !s.breaking).slice(0, 4);
  const latest = all.filter(s => !s.featured && !s.breaking).slice(0, 20);
  const mostRead = [...all].sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0)).slice(0, 5);

  const adTargeting = { page: 'home', breaking: breaking ? 'yes' : 'no' };

  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Top-of-page ad slot — desktop leaderboard / mobile banner */}
      <div className="max-w-7xl mx-auto px-4 pt-3">
        <AdSlot placement="home-top" site="wvnews" targeting={adTargeting} />
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            {breaking ? (
              <StoryCard story={breaking} size="hero" />
            ) : featured[0] ? (
              <StoryCard story={featured[0]} size="hero" />
            ) : all[0] ? (
              <StoryCard story={all[0]} size="hero" />
            ) : null}
          </div>
          <div className="space-y-4">
            {featured.slice(breaking ? 0 : 1, breaking ? 3 : 4).map(story => (
              <StoryCard key={story.id || story.slug} story={story} size="medium" />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {featured.length > 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {featured.slice(3).map(story => (
                  <StoryCard key={story.id || story.slug} story={story} size="large" />
                ))}
              </div>
            )}
            <div className="border-t border-ink-200">
              {latest.map(story => (
                <StoryCard key={story.id || story.slug} story={story} size="medium" />
              ))}
            </div>
            <div className="my-6">
              <AdSlot placement="home-in-feed" site="wvnews" targeting={adTargeting} />
            </div>
          </div>

          <div className="space-y-6">
            <WeatherWidget />
            <NewsletterSignup />

            <div className="bg-white rounded-lg p-4 shadow-sm border border-ink-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">Most Read Today</h3>
              <ol className="space-y-3">
                {mostRead.map((story, i) => (
                  <li key={story.id || story.slug} className="flex gap-3">
                    <span className="text-2xl font-display font-bold text-brand-200">{i + 1}</span>
                    <Link href={`/article/${story.slug}`} className="text-sm font-medium text-ink-800 hover:text-brand-700 leading-tight">
                      {story.headline}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

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

            <AdSlot placement="home-sidebar-1" site="wvnews" targeting={adTargeting} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
