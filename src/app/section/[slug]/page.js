// Section page — Boston Globe section layout.
//   1. Same header as the homepage (without the giant centered masthead)
//   2. Big section title + subsection pipe-nav
//   3. Two-column body: lead photo left, stacked stories right, sidebar far right

import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import AdSlot from '@/components/public/AdSlot';
import { listPublishedBySection } from '@/lib/stories-db';
import { stories as mockStories, sections, sectionSubcategories } from '@/data/mock';

export const dynamic = 'force-dynamic';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function blendSectionStories(sectionId) {
  let native = [];
  try { native = await listPublishedBySection(sectionId, { limit: 30 }); } catch { native = []; }
  const nativeSlugs = new Set(native.map(s => s.slug));
  const mocks = mockStories.filter(
    s => !nativeSlugs.has(s.slug) && (s.section === sectionId || (s.secondarySections || []).includes(sectionId))
  );
  return [...native, ...mocks];
}

function Eyebrow({ section, breaking }) {
  const sec = sections.find(s => s.id === section);
  return (
    <div className="flex items-center gap-2 mb-2">
      {breaking && (
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-eyebrow bg-red-700 text-white rounded-sm">● Breaking</span>
      )}
      {sec && !breaking && (
        <span className="text-[11px] font-bold uppercase tracking-eyebrow text-red-700">{sec.name}</span>
      )}
    </div>
  );
}

function Byline({ author, publishedAt }) {
  return (
    <div className="text-xs text-ink-500 font-body">
      {author?.name && <span className="font-medium text-ink-700">By {author.name}</span>}
      {author?.name && publishedAt && <span className="mx-1.5 text-ink-400">·</span>}
      {publishedAt && <span>{timeAgo(publishedAt)}</span>}
    </div>
  );
}

// Big lead photo with optional headline overlay below — Globe's left col.
function LeadPhotoStory({ story }) {
  if (!story) return null;
  const heroImg = story.image?.url;
  return (
    <Link href={`/article/${story.slug}`} className="group block">
      <article>
        {heroImg ? (
          <div className="relative overflow-hidden bg-ink-900 mb-4 aspect-[4/5]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          </div>
        ) : (
          <div className="aspect-[4/5] mb-4 bg-gradient-to-br from-brand-900 to-brand-950" />
        )}
        <h2 className="font-display text-2xl md:text-3xl font-bold leading-[1.1] text-ink-900 group-hover:text-brand-800 tracking-tight">
          {story.headline}
        </h2>
        {story.deck && <p className="mt-2 text-base text-ink-700 leading-snug">{story.deck}</p>}
        <div className="mt-2"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
      </article>
    </Link>
  );
}

// Stacked story rows with thumbnail on the right — Globe's center col.
function StackedRow({ story }) {
  const heroImg = story.image?.url;
  return (
    <Link href={`/article/${story.slug}`} className="group block py-5 border-b border-ink-200 last:border-0">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <Eyebrow section={story.section} breaking={story.breaking} />
          <h3 className="font-display text-lg md:text-xl font-bold leading-snug text-ink-900 group-hover:text-brand-800">
            {story.headline}
          </h3>
          {story.deck && <p className="mt-1.5 text-sm text-ink-600 leading-snug line-clamp-2">{story.deck}</p>}
          <div className="mt-1.5"><Byline author={story.author} publishedAt={story.publishedAt} /></div>
        </div>
        {heroImg && (
          <div className="w-32 h-24 sm:w-40 sm:h-28 flex-shrink-0 bg-ink-200 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </Link>
  );
}

export default async function SectionPage({ params }) {
  const { slug } = params;
  const section = sections.find(s => s.slug === slug) || sections[0];
  const sectionStories = await blendSectionStories(section.id);
  const subcategories = sectionSubcategories[section.id] || [];
  const adTargeting = { page: 'section', section: section.id };

  const lead = sectionStories[0] || null;
  const stack = sectionStories.slice(1, 9);
  const tail = sectionStories.slice(9, 17);

  return (
    <div className="min-h-screen bg-white">
      {/* Header has the umbrella nav but skips the huge centered masthead — section pages reserve that space for the section title. */}
      <PublicHeader />

      {/* Top leaderboard */}
      <div className="border-b border-ink-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <AdSlot placement="section-top" site="wvnews" targeting={adTargeting} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        {/* Section title + sub-nav row */}
        <header className="pb-4 mb-6 border-b border-ink-300">
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-ink-900 tracking-tight leading-none">
              {section.name}
            </h1>
            {subcategories.length > 0 && (
              <nav className="flex flex-wrap items-baseline">
                {subcategories.map((sub, i) => (
                  <span key={sub} className="flex items-baseline">
                    {i > 0 && <span className="px-2 text-ink-300 text-xs">|</span>}
                    <Link
                      href={`/topic/${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      className="text-[11px] font-bold uppercase tracking-eyebrow text-ink-900 hover:text-red-700 whitespace-nowrap"
                    >
                      {sub}
                    </Link>
                  </span>
                ))}
              </nav>
            )}
          </div>
          {section.description && (
            <p className="mt-3 text-base text-ink-600 max-w-3xl font-display italic">{section.description}</p>
          )}
        </header>

        {sectionStories.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-ink-700 mb-2">No stories in {section.name} yet.</p>
            <p className="text-sm text-ink-500">Content updates every fifteen minutes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8">
            {/* Left: hero photo column */}
            <div className="lg:col-span-5">
              <LeadPhotoStory story={lead} />
            </div>

            {/* Center: stacked stories with thumbnails */}
            <div className="lg:col-span-4 lg:border-x lg:border-ink-200 lg:px-8">
              {stack.map(s => <StackedRow key={s.id || s.slug} story={s} />)}
            </div>

            {/* Right rail: ad + tail headlines */}
            <aside className="lg:col-span-3">
              <div className="sticky top-32 space-y-6">
                <AdSlot placement="section-sidebar" site="wvnews" targeting={adTargeting} />
                {tail.length > 0 && (
                  <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-eyebrow text-ink-900 pb-2 mb-3 border-b-[3px] border-ink-900">
                      More in {section.name}
                    </h3>
                    <ul className="space-y-3">
                      {tail.map(s => (
                        <li key={s.id || s.slug} className="pb-3 border-b border-ink-200 last:border-0">
                          <Link href={`/article/${s.slug}`} className="block group">
                            <h4 className="font-display text-sm font-semibold leading-snug text-ink-800 group-hover:text-red-700">{s.headline}</h4>
                            <div className="mt-1"><Byline author={s.author} publishedAt={s.publishedAt} /></div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
