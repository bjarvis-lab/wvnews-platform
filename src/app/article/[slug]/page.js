'use client';
import { useState } from 'react';
import { stories, sections } from '@/data/mock';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import RegistrationWall from '@/components/public/RegistrationWall';
import Link from 'next/link';
import { use } from 'react';

export default function ArticlePage({ params }) {
  const { slug } = use(params);
  const story = stories.find(s => s.slug === slug) || stories[0];
  const [showPaywall, setShowPaywall] = useState(false);
  const [showRegWall, setShowRegWall] = useState(false);
  const section = sections.find(s => s.id === story.section);

  const relatedStories = stories.filter(s => s.id !== story.id).slice(0, 3);
  const publishDate = new Date(story.publishedAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-ink-500 mb-4">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <span>/</span>
          <Link href={`/section/${section?.slug}`} className="hover:text-brand-700">{section?.name}</Link>
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

        {/* Access badge */}
        {story.accessLevel === 'subscriber' && (
          <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-brand-950 text-white rounded mb-3">
            Subscriber Content
          </span>
        )}
        {story.accessLevel === 'metered' && (
          <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-gold-500 text-white rounded mb-3">
            Premium
          </span>
        )}

        {/* Headline */}
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-ink-900 leading-tight mb-3">
          {story.headline}
        </h1>

        {/* Deck */}
        <p className="text-lg text-ink-600 leading-relaxed mb-4">{story.deck}</p>

        {/* Author / Date */}
        <div className="flex items-center gap-4 pb-4 border-b border-ink-200 mb-6">
          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-brand-700 font-bold text-sm">{story.author.avatar}</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink-900">{story.author.name}</div>
            <div className="text-xs text-ink-500">{story.author.role} · {publishDate}</div>
          </div>
          <div className="flex-1" />
          {/* Share buttons */}
          <div className="flex items-center gap-2">
            <button className="p-2 bg-ink-100 rounded-full hover:bg-ink-200 transition-colors text-ink-600" title="Share on Facebook">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </button>
            <button className="p-2 bg-ink-100 rounded-full hover:bg-ink-200 transition-colors text-ink-600" title="Share on X">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            <button className="p-2 bg-ink-100 rounded-full hover:bg-ink-200 transition-colors text-ink-600" title="Copy link">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </button>
          </div>
        </div>

        {/* Hero Image */}
        <figure className="mb-6">
          <div className="aspect-[16/9] bg-ink-200 rounded-lg overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-brand-950/20 to-brand-950/5 flex items-center justify-center text-ink-400">
              <span className="text-sm">Story Photo</span>
            </div>
          </div>
          <figcaption className="mt-2 text-xs text-ink-500">
            {story.image.alt} <span className="text-ink-400">({story.image.credit})</span>
          </figcaption>
        </figure>

        {/* Article Body */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <article className={`lg:col-span-3 article-body ${showPaywall ? 'relative' : ''}`}>
            <div dangerouslySetInnerHTML={{ __html: story.body }} />

            {/* Paywall demo overlay */}
            {story.accessLevel === 'subscriber' && (
              <div className="mt-6 relative">
                <div className="paywall-blur">
                  <p>This content continues but is reserved for subscribers. The full story includes detailed analysis of the project timeline, affected neighborhoods, and expert commentary on water infrastructure challenges facing Appalachian communities.</p>
                  <p>Additional reporting covers the funding sources, contractor selection process, and expected completion date for the multi-phase project.</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm text-center border border-ink-200">
                    <div className="w-10 h-10 bg-brand-950 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-display font-bold text-xs">WV</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-ink-900 mb-1">Subscribe to Continue</h3>
                    <p className="text-sm text-ink-500 mb-4">Get unlimited access to all WVNews stories and E-Edition.</p>
                    <Link href="/subscribe" className="block w-full py-2.5 bg-brand-950 text-white text-sm font-bold rounded-lg hover:bg-brand-800 transition-colors mb-2">
                      Subscribe from $6.99/mo
                    </Link>
                    <button onClick={() => setShowRegWall(true)} className="text-sm text-brand-700 font-medium hover:underline">
                      Register for 5 free articles →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="mt-8 pt-4 border-t border-ink-200">
              <div className="flex flex-wrap gap-2">
                {story.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-ink-100 text-ink-600 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* AI-powered related content */}
            <div className="mt-8 p-4 bg-brand-50 rounded-lg border border-brand-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-brand-700 text-white px-2 py-0.5 rounded font-medium">AI Suggested</span>
                <span className="text-xs text-ink-500">Related stories you might enjoy</span>
              </div>
              <div className="space-y-3">
                {relatedStories.map(rs => (
                  <Link key={rs.id} href={`/article/${rs.slug}`} className="block text-sm font-medium text-ink-800 hover:text-brand-700">
                    → {rs.headline}
                  </Link>
                ))}
              </div>
            </div>
          </article>

          {/* Article Sidebar */}
          <aside className="space-y-4">
            {/* Ad */}
            <div className="bg-ink-100 rounded-lg p-4 text-center">
              <span className="text-[10px] uppercase tracking-widest text-ink-400">Ad</span>
              <div className="h-48 flex items-center justify-center text-ink-400 text-xs">300×250</div>
            </div>

            {/* More from section */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-ink-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">More from {section?.name}</h3>
              <div className="space-y-3">
                {stories.filter(s => s.section === story.section && s.id !== story.id).slice(0, 3).map(s => (
                  <Link key={s.id} href={`/article/${s.slug}`} className="block text-sm font-medium text-ink-700 hover:text-brand-700 leading-tight">
                    {s.headline}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
      {showRegWall && <RegistrationWall onClose={() => setShowRegWall(false)} />}
    </div>
  );
}
