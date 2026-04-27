'use client';
// Atlantic-clean article layout. Server component fetches the story and
// hands it to this client component for SSR + interactive paywall.
//
// Layout: restrained prose column (max-w-prose ≈ 640px), drop cap on
// first paragraph, inline ads after paragraph 3 and paragraph 8, sticky
// right rail on desktop with article-sidebar ad + "More from {section}".
// Mobile drops the rail entirely; sticky-bottom mobile ad covers the
// fold.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import RegistrationWall from '@/components/public/RegistrationWall';
import AdSlot from '@/components/public/AdSlot';

// Splits the body HTML at </p> boundaries so we can interleave ad units
// without touching the editorial markup. Returns an array of chunk strings.
// If the body has fewer than `count` paragraphs, the trailing chunks are empty.
function splitParagraphs(html, breakpoints) {
  if (!html) return [''];
  const parts = html.split(/(<\/p>)/i); // keeps the </p> in the array
  // Recombine into paragraph-sized strings.
  const paras = [];
  let buf = '';
  for (const p of parts) {
    buf += p;
    if (/<\/p>/i.test(p)) {
      paras.push(buf);
      buf = '';
    }
  }
  if (buf) paras.push(buf);

  const sortedBreaks = [...breakpoints].sort((a, b) => a - b);
  const chunks = [];
  let cursor = 0;
  for (const bp of sortedBreaks) {
    if (bp > cursor && bp <= paras.length) {
      chunks.push(paras.slice(cursor, bp).join(''));
      cursor = bp;
    } else {
      chunks.push('');
    }
  }
  chunks.push(paras.slice(cursor).join(''));
  return chunks;
}

export default function ArticleBody({ story, section, sections, related, sectionMore }) {
  const [showRegWall, setShowRegWall] = useState(false);

  const adSite = (story.sites && story.sites[0]) || 'wvnews';
  const adTargeting = {
    page: 'article',
    section: story.section || 'news',
    tags: story.tags || [],
    breaking: story.breaking ? 'yes' : 'no',
    access: story.accessLevel || 'free',
    storyId: story.id || '',
  };

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'article_view', {
      author: story.author?.name || 'staff',
      author_email: story.author?.email || '',
      section: story.section || 'news',
      story_id: story.id || '',
      story_slug: story.slug || '',
      publication: adSite,
      breaking: story.breaking ? 'yes' : 'no',
      access_level: story.accessLevel || 'free',
      published_at: story.publishedAt || '',
    });
  }, [story.id, story.slug, adSite, story.author?.name, story.author?.email, story.section, story.breaking, story.accessLevel, story.publishedAt]);

  const publishDate = story.publishedAt
    ? new Date(story.publishedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Draft';

  const bodyHtml = story.webBody || story.body || '';
  // Inline ads after paragraph 3 and paragraph 8. If the article is short
  // (fewer than 4 paragraphs), only the first ad fires.
  const [chunkA, chunkB, chunkC] = useMemo(() => splitParagraphs(bodyHtml, [3, 8]), [bodyHtml]);

  // Header swaps to the publication's logo when the story is tagged for
  // a specific paper. The umbrella WV News mark renders for stories
  // tagged with the wvnews umbrella id (or untagged).
  const headerPubId = adSite && adSite !== 'wvnews' ? adSite : null;

  return (
    <div className="min-h-screen">
      <PublicHeader publicationId={headerPubId} />

      {/* Top leaderboard */}
      <div className="border-b border-ink-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <AdSlot placement="article-top" site={adSite} targeting={adTargeting} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-10">
        <nav className="flex items-center gap-2 text-xs text-ink-500 mb-6">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <span className="text-ink-300">/</span>
          {section && (
            <Link href={`/section/${section.slug}`} className="hover:text-brand-700 font-medium uppercase tracking-eyebrow text-[11px]">{section.name}</Link>
          )}
        </nav>

        {/* Headline block — wide above the two-column body */}
        <header className="max-w-4xl mb-8">
          <div className="flex items-center gap-2 mb-3">
            {story.accessLevel === 'premium' && (
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-eyebrow bg-brand-950 text-white rounded-sm">
                Subscriber
              </span>
            )}
            {story.accessLevel === 'metered' && (
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-eyebrow bg-gold-500 text-white rounded-sm">
                Premium
              </span>
            )}
            {story.breaking && (
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-eyebrow bg-red-600 text-white rounded-sm">
                ● Breaking
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-ink-900 leading-[1.1]">
            {story.headline}
          </h1>
          {story.deck && (
            <p className="mt-4 text-lg md:text-xl text-ink-600 leading-snug font-display max-w-3xl">
              {story.deck}
            </p>
          )}
          <div className="mt-6 flex items-center gap-3 pb-5 border-b border-ink-300">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-brand-800 font-bold text-sm">
                {story.author?.avatar || (story.author?.name || 'WV').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-ink-900">By {story.author?.name || 'WV News Staff'}</div>
              <div className="text-ink-500 text-xs">
                {story.author?.role ? `${story.author.role} · ` : ''}{publishDate}
              </div>
            </div>
          </div>
        </header>

        {story.image?.url && (
          <figure className="mb-8 max-w-4xl">
            <div className="aspect-[16/9] bg-ink-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.image.url} alt={story.image.alt || ''} className="w-full h-full object-cover" />
            </div>
            {(story.image.alt || story.image.credit) && (
              <figcaption className="mt-2 text-xs text-ink-500 leading-snug">
                {story.image.alt}
                {story.image.credit && <span className="text-ink-400"> · {story.image.credit}</span>}
              </figcaption>
            )}
          </figure>
        )}

        {/* Two-column: prose left (restrained width), sidebar right */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,_40rem)_1fr] gap-x-12 gap-y-8">
          <article>
            <div className="article-body">
              {chunkA && <div dangerouslySetInnerHTML={{ __html: chunkA }} />}
            </div>

            {/* Inline ad after paragraph 3 */}
            {chunkB && (
              <div className="my-10">
                <AdSlot placement="article-inline" site={adSite} targeting={adTargeting} />
              </div>
            )}

            <div className="article-body">
              {chunkB && <div dangerouslySetInnerHTML={{ __html: chunkB }} />}
            </div>

            {/* Inline ad after paragraph 8 */}
            {chunkC && (
              <div className="my-10">
                <AdSlot placement="article-inline" site={adSite} targeting={adTargeting} />
              </div>
            )}

            <div className="article-body">
              {chunkC && <div dangerouslySetInnerHTML={{ __html: chunkC }} />}
            </div>

            {story.tags?.length > 0 && (
              <div className="mt-10 pt-5 border-t border-ink-200">
                <div className="text-[10px] font-bold uppercase tracking-eyebrow text-ink-500 mb-2">Tagged</div>
                <div className="flex flex-wrap gap-2">
                  {story.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-ink-100 text-ink-700 text-xs rounded-sm font-body">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <section className="mt-12 pt-8 border-t border-ink-300">
                <h3 className="font-display text-xl font-bold text-ink-900 mb-5">Related coverage</h3>
                <div className="space-y-4">
                  {related.map(rs => (
                    <Link key={rs.id || rs.slug} href={`/article/${rs.slug}`} className="block group">
                      <div className="font-display text-base font-semibold text-ink-800 group-hover:text-brand-700 leading-snug">
                        {rs.headline}
                      </div>
                      {rs.author?.name && (
                        <div className="text-xs text-ink-500 mt-1">By {rs.author.name}</div>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* End-of-article ad */}
            <div className="mt-12">
              <AdSlot placement="article-end" site={adSite} targeting={adTargeting} />
            </div>
          </article>

          {/* Right rail — desktop only, sticky */}
          <aside className="hidden lg:block">
            <div className="sticky top-4 space-y-6">
              <AdSlot placement="article-sidebar" site={adSite} targeting={adTargeting} />

              {section && sectionMore.length > 0 && (
                <div className="bg-white border border-ink-200 p-5">
                  <h3 className="text-[11px] font-bold uppercase tracking-eyebrow text-ink-500 mb-3 pb-2 border-b border-ink-200">
                    More from {section.name}
                  </h3>
                  <ul className="space-y-3">
                    {sectionMore.map(s => (
                      <li key={s.id || s.slug}>
                        <Link href={`/article/${s.slug}`} className="block font-display text-sm font-semibold text-ink-800 hover:text-brand-700 leading-snug">
                          {s.headline}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile sticky footer ad */}
      <AdSlot placement="article-sticky-mobile" site={adSite} targeting={adTargeting} />

      <Footer />
      {showRegWall && <RegistrationWall onClose={() => setShowRegWall(false)} />}
    </div>
  );
}
