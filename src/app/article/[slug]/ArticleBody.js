'use client';
import { useState } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import RegistrationWall from '@/components/public/RegistrationWall';

// Client-side layout for the article page. Server component fetches the
// story and hands it in as a prop so we get SSR for SEO/cache while
// keeping paywall/regwall interactivity here.

export default function ArticleBody({ story, section, sections, related, sectionMore }) {
  const [showRegWall, setShowRegWall] = useState(false);

  const publishDate = story.publishedAt
    ? new Date(story.publishedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Draft';

  return (
    <div className="min-h-screen">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-xs text-ink-500 mb-4">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <span>/</span>
          {section && (
            <Link href={`/section/${section.slug}`} className="hover:text-brand-700">{section.name}</Link>
          )}
          {story.secondarySections?.length > 0 && story.secondarySections.map(ss => {
            const sec = sections.find(s => s.id === ss);
            return sec ? (
              <span key={ss}>
                <span className="mx-1">·</span>
                <Link href={`/section/${sec.slug}`} className="hover:text-brand-700">{sec.name}</Link>
              </span>
            ) : null;
          })}
        </nav>

        {story.accessLevel === 'premium' && (
          <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-brand-950 text-white rounded mb-3">
            Subscriber Content
          </span>
        )}
        {story.accessLevel === 'metered' && (
          <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-gold-500 text-white rounded mb-3">
            Premium
          </span>
        )}

        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-ink-900 leading-tight mb-3">
          {story.headline}
        </h1>
        {story.deck && (
          <p className="text-lg text-ink-600 leading-relaxed mb-4">{story.deck}</p>
        )}

        <div className="flex items-center gap-4 pb-4 border-b border-ink-200 mb-6">
          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-brand-700 font-bold text-sm">{story.author?.avatar || 'WV'}</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink-900">{story.author?.name || 'WV News Staff'}</div>
            <div className="text-xs text-ink-500">{story.author?.role ? `${story.author.role} · ` : ''}{publishDate}</div>
          </div>
        </div>

        {story.image?.url && (
          <figure className="mb-6">
            <div className="aspect-[16/9] bg-ink-200 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.image.url} alt={story.image.alt || ''} className="w-full h-full object-cover" />
            </div>
            {(story.image.alt || story.image.credit) && (
              <figcaption className="mt-2 text-xs text-ink-500">
                {story.image.alt} {story.image.credit && <span className="text-ink-400">({story.image.credit})</span>}
              </figcaption>
            )}
          </figure>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <article className="lg:col-span-3 article-body">
            {/* Prefer the web-specific body; fall back to legacy `body`. */}
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: story.webBody || story.body || '' }} />

            {story.tags?.length > 0 && (
              <div className="mt-8 pt-4 border-t border-ink-200">
                <div className="flex flex-wrap gap-2">
                  {story.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-ink-100 text-ink-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div className="mt-8 p-4 bg-brand-50 rounded-lg border border-brand-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-brand-700 text-white px-2 py-0.5 rounded font-medium">Related</span>
                </div>
                <div className="space-y-3">
                  {related.map(rs => (
                    <Link key={rs.id || rs.slug} href={`/article/${rs.slug}`} className="block text-sm font-medium text-ink-800 hover:text-brand-700">
                      → {rs.headline}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside className="space-y-4">
            <div className="bg-ink-100 rounded-lg p-4 text-center">
              <span className="text-[10px] uppercase tracking-widest text-ink-400">Ad</span>
              <div className="h-48 flex items-center justify-center text-ink-400 text-xs">300×250</div>
            </div>

            {section && sectionMore.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-ink-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">More from {section.name}</h3>
                <div className="space-y-3">
                  {sectionMore.map(s => (
                    <Link key={s.id || s.slug} href={`/article/${s.slug}`} className="block text-sm font-medium text-ink-700 hover:text-brand-700 leading-tight">
                      {s.headline}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <Footer />
      {showRegWall && <RegistrationWall onClose={() => setShowRegWall(false)} />}
    </div>
  );
}
