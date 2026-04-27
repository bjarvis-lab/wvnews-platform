// Section page — Atlantic-clean two-column layout. Lead story up top
// (full-width photo + big headline), then a story river with images.
// In-feed ad after every ~5 stories. Sticky right rail on desktop with
// section-sidebar ad + sibling sections.

import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import AdSlot from '@/components/public/AdSlot';
import { listPublishedBySection } from '@/lib/stories-db';
import { stories as mockStories, sections } from '@/data/mock';

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
  try {
    native = await listPublishedBySection(sectionId, { limit: 30 });
  } catch {
    native = [];
  }
  const nativeSlugs = new Set(native.map(s => s.slug));
  const mocks = mockStories.filter(
    s => !nativeSlugs.has(s.slug) && (s.section === sectionId || (s.secondarySections || []).includes(sectionId))
  );
  return [...native, ...mocks];
}

function Eyebrow({ section, breaking, featured }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {breaking && (
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-eyebrow bg-red-600 text-white rounded-sm">● Breaking</span>
      )}
      {featured && !breaking && (
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-eyebrow bg-gold-100 text-gold-900 rounded-sm">Featured</span>
      )}
      <span className="text-[10px] font-bold uppercase tracking-eyebrow text-brand-700">
        {section}
      </span>
    </div>
  );
}

function StoryRow({ story, sectionName }) {
  const heroImg = story.image?.url;
  return (
    <Link href={`/article/${story.slug}`} className="group flex gap-5 py-6 border-b border-ink-200 last:border-0">
      <div className="flex-1 min-w-0">
        <Eyebrow section={sectionName} breaking={story.breaking} featured={story.featured} />
        <h2 className="font-display text-xl md:text-2xl font-bold text-ink-900 group-hover:text-brand-700 transition-colors leading-snug">
          {story.headline}
        </h2>
        {story.deck && <p className="mt-2 text-sm text-ink-600 line-clamp-2 leading-snug">{story.deck}</p>}
        <div className="mt-2 text-xs text-ink-500">
          {story.author?.name && <span className="font-medium text-ink-700">{story.author.name}</span>}
          {story.author?.name && story.publishedAt && <span className="mx-1.5">·</span>}
          {story.publishedAt && <span>{timeAgo(story.publishedAt)}</span>}
        </div>
      </div>
      {heroImg && (
        <div className="w-36 h-28 sm:w-44 sm:h-32 flex-shrink-0 bg-ink-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </Link>
  );
}

function LeadStory({ story, sectionName }) {
  if (!story) return null;
  const heroImg = story.image?.url;
  return (
    <Link href={`/article/${story.slug}`} className="group block mb-10 pb-8 border-b border-ink-300">
      {heroImg && (
        <div className="aspect-[16/9] bg-ink-200 overflow-hidden mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImg} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        </div>
      )}
      <Eyebrow section={sectionName} breaking={story.breaking} featured={story.featured} />
      <h2 className="font-display text-3xl md:text-4xl font-bold text-ink-900 group-hover:text-brand-700 transition-colors leading-[1.1]">
        {story.headline}
      </h2>
      {story.deck && <p className="mt-3 text-base md:text-lg text-ink-600 leading-snug max-w-3xl">{story.deck}</p>}
      <div className="mt-3 text-xs text-ink-500">
        {story.author?.name && <span className="font-medium text-ink-700">{story.author.name}</span>}
        {story.author?.name && story.publishedAt && <span className="mx-1.5">·</span>}
        {story.publishedAt && <span>{timeAgo(story.publishedAt)}</span>}
      </div>
    </Link>
  );
}

export default async function SectionPage({ params }) {
  const { slug } = params;
  const section = sections.find(s => s.slug === slug) || sections[0];
  const sectionStories = await blendSectionStories(section.id);
  const adTargeting = { page: 'section', section: section.id };

  const lead = sectionStories[0] || null;
  const rest = sectionStories.slice(1);
  // Insert in-feed ad after every 5 stories.
  const groups = [];
  for (let i = 0; i < rest.length; i += 5) groups.push(rest.slice(i, i + 5));

  return (
    <div className="min-h-screen">
      <PublicHeader />

      <div className="border-b border-ink-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <AdSlot placement="section-top" site="wvnews" targeting={adTargeting} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-10">
        {/* Section header */}
        <header className="mb-8 pb-5 border-b-2 border-ink-900">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl">{section.icon}</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-900 tracking-tight">{section.name}</h1>
            <span className="ml-auto text-xs uppercase tracking-eyebrow text-ink-500">
              {sectionStories.length} {sectionStories.length === 1 ? 'story' : 'stories'}
            </span>
          </div>
          {section.description && (
            <p className="mt-2 text-base text-ink-600 max-w-3xl font-display italic">{section.description}</p>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {lead && <LeadStory story={lead} sectionName={section.name} />}

            {sectionStories.length === 0 && (
              <div className="text-center py-16 text-ink-500">
                <p className="font-display text-xl mb-2 text-ink-700">No stories in this section yet.</p>
                <p className="text-sm">Check back soon — content updates every fifteen minutes.</p>
              </div>
            )}

            {groups.map((g, idx) => (
              <div key={idx}>
                {g.map(story => (
                  <StoryRow key={story.id || story.slug} story={story} sectionName={section.name} />
                ))}
                {idx < groups.length - 1 && (
                  <div className="my-8">
                    <AdSlot placement="section-in-feed" site="wvnews" targeting={adTargeting} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-4 space-y-6">
              <AdSlot placement="section-sidebar" site="wvnews" targeting={adTargeting} />

              <div className="bg-white border border-ink-200 p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-eyebrow text-ink-500 mb-3 pb-2 border-b border-ink-200">
                  All Sections
                </h3>
                <ul className="space-y-1">
                  {sections.map(s => (
                    <li key={s.id}>
                      <Link
                        href={`/section/${s.slug}`}
                        className={`block py-1.5 text-sm transition-colors ${
                          s.id === section.id ? 'text-brand-800 font-semibold' : 'text-ink-700 hover:text-brand-700'
                        }`}
                      >
                        <span className="mr-2">{s.icon}</span>{s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
