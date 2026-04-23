'use client';
import { stories, sections } from '@/data/mock';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import Link from 'next/link';

export default function SectionPage({ params }) {
  const { slug } = params;
  const section = sections.find(s => s.slug === slug) || sections[0];
  const sectionStories = stories.filter(s =>
    s.section === section.id || s.secondarySections?.includes(section.id)
  );

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{section.icon}</span>
          <h1 className="font-display text-3xl font-bold text-ink-900">{section.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {sectionStories.length > 0 ? sectionStories.map(story => (
              <Link key={story.id} href={`/article/${story.slug}`} className="group block border-b border-ink-200 pb-6 last:border-0">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {story.accessLevel === 'subscriber' && <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-950 text-white rounded">Subscriber</span>}
                      {story.accessLevel === 'metered' && <span className="px-2 py-0.5 text-[10px] font-bold bg-gold-500 text-white rounded">Premium</span>}
                    </div>
                    <h2 className="font-display text-xl font-bold text-ink-900 group-hover:text-brand-700 transition-colors leading-snug">
                      {story.headline}
                    </h2>
                    <p className="mt-1 text-sm text-ink-600 line-clamp-2">{story.deck}</p>
                    <div className="mt-2 text-xs text-ink-500">{story.author.name} · {new Date(story.publishedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="w-32 h-24 bg-ink-200 rounded flex-shrink-0" />
                </div>
              </Link>
            )) : (
              <div className="text-center py-12 text-ink-400">
                <p className="text-lg mb-2">No stories in this section yet.</p>
                <p className="text-sm">Check back soon for updates.</p>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="bg-ink-100 rounded-lg p-4 text-center">
              <span className="text-[10px] uppercase tracking-widest text-ink-400">Ad</span>
              <div className="h-64 flex items-center justify-center text-ink-400 text-sm">300×250</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-ink-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">All Sections</h3>
              {sections.map(s => (
                <Link key={s.id} href={`/section/${s.slug}`}
                  className={`block px-3 py-2 text-sm rounded transition-colors ${s.id === section.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-ink-600 hover:bg-ink-50'}`}>
                  {s.icon} {s.name}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
