// /topic/[slug] — groups stories that share a tag. Powers the "Trending"
// bar in the header (each pipe-separated topic links here). Also linked
// from section subcategory navigation, story tag pills, and topic
// landings.
//
// Matching is liberal: a story matches the topic if its tags array
// contains the slug-matched tag, OR its headline mentions the topic
// keywords. This way trending topics generated from tag-less ingested
// content still surface relevant stories.

import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import AdSlot from '@/components/public/AdSlot';
import { listPublishedStories } from '@/lib/stories-db';
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

function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function denormalize(slug) {
  // Crude human-readable label from a slug (e.g. "wvu-football" → "WVU Football").
  return String(slug || '').split('-').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
}

async function blendStoriesForTopic(topicSlug) {
  const label = denormalize(topicSlug).toLowerCase();
  const tagSlugs = new Set([topicSlug.toLowerCase()]);
  let native = [];
  try { native = await listPublishedStories({ limit: 200 }); } catch { native = []; }
  const all = [...native, ...mockStories];

  const matches = all.filter(s => {
    if (Array.isArray(s.tags) && s.tags.some(t => tagSlugs.has(slugify(t)))) return true;
    const hay = `${s.headline || ''} ${s.deck || ''} ${(s.tags || []).join(' ')}`.toLowerCase();
    return hay.includes(label);
  });

  // Dedupe by slug, keep order.
  const seen = new Set();
  const out = [];
  for (const s of matches) {
    const key = s.slug || s.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
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

function StoryRow({ story }) {
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

export default async function TopicPage({ params }) {
  const { slug } = params;
  const stories = await blendStoriesForTopic(slug);
  const label = denormalize(slug);
  const adTargeting = { page: 'topic', topic: slug };

  const [lead, ...rest] = stories;

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <div className="border-b border-ink-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <AdSlot placement="section-top" site="wvnews" targeting={adTargeting} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <header className="pb-4 mb-6 border-b border-ink-300">
          <div className="text-[11px] font-bold uppercase tracking-eyebrow text-red-700 mb-1">Trending topic</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-900 tracking-tight leading-tight">{label}</h1>
          <p className="mt-2 text-sm text-ink-500">
            {stories.length} {stories.length === 1 ? 'story' : 'stories'} grouped by topic across all WV News publications.
          </p>
        </header>

        {stories.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-ink-700 mb-2">No stories yet for {label}</p>
            <p className="text-sm text-ink-500 mb-6">Try one of the sections instead.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {sections.slice(0, 6).map(s => (
                <Link key={s.id} href={`/section/${s.slug}`} className="px-3 py-1.5 text-xs font-medium text-ink-700 bg-ink-100 rounded hover:bg-brand-50 hover:text-brand-700">
                  {s.icon} {s.name}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-8">
            <div className="lg:col-span-8">
              {lead && (
                <Link href={`/article/${lead.slug}`} className="group block mb-8 pb-8 border-b border-ink-300">
                  {lead.image?.url && (
                    <div className="aspect-[16/9] bg-ink-200 overflow-hidden mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={lead.image.url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                    </div>
                  )}
                  <Eyebrow section={lead.section} breaking={lead.breaking} />
                  <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight text-ink-900 group-hover:text-brand-800 tracking-tight">{lead.headline}</h2>
                  {lead.deck && <p className="mt-3 text-base text-ink-600 leading-snug max-w-3xl">{lead.deck}</p>}
                  <div className="mt-3"><Byline author={lead.author} publishedAt={lead.publishedAt} /></div>
                </Link>
              )}
              {rest.map(s => <StoryRow key={s.id || s.slug} story={s} />)}
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-32 space-y-6">
                <AdSlot placement="section-sidebar" site="wvnews" targeting={adTargeting} />
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-eyebrow text-ink-900 pb-2 mb-3 border-b-[3px] border-ink-900">Browse by section</h3>
                  <ul className="space-y-1">
                    {sections.map(s => (
                      <li key={s.id}>
                        <Link href={`/section/${s.slug}`} className="block py-1.5 text-sm text-ink-700 hover:text-red-700">
                          <span className="mr-2">{s.icon}</span>{s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
