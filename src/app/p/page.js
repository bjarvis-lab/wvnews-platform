'use client';
import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import SiteBadge from '@/components/public/SiteBadge';
import { sites } from '@/data/mock';
import ingested from '@/data/ingested-stories.json';

function storyCount(siteId) {
  return (ingested?.stories?.[siteId] || []).length;
}

export default function PublicationsIndex() {
  return (
    <div className="min-h-screen bg-ink-50">
      <PublicHeader />

      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="text-gold-400 text-sm font-semibold uppercase tracking-wider mb-2">WV News Group</div>
          <h1 className="font-display text-5xl font-bold leading-tight">Our Publications</h1>
          <p className="text-lg text-white/80 mt-3 max-w-2xl">
            {sites.length} papers and digital brands serving West Virginia and beyond. Find your hometown coverage.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map(site => {
            const count = storyCount(site.id);
            return (
              <Link
                key={site.id}
                href={`/p/${site.id}`}
                className="group flex items-center gap-4 bg-white p-5 rounded-xl border border-ink-200 hover:border-brand-400 hover:shadow-md transition-all"
              >
                {site.logoFile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={site.logoFile} alt={site.name} className="h-12 w-auto max-w-[140px] object-contain flex-shrink-0" />
                ) : (
                  <SiteBadge site={site} size={48} />
                )}
                <div className="min-w-0">
                  <div className="font-display font-bold text-ink-900 group-hover:text-brand-700 truncate">{site.name}</div>
                  <div className="text-xs text-ink-500 truncate">{site.market}</div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {count > 0 ? `${count} recent ${count === 1 ? 'story' : 'stories'}` : 'Archive only'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 p-5 bg-white rounded-xl border border-ink-200 text-xs text-ink-500">
          Content ingested from wvnews.com on {new Date(ingested?.fetchedAt).toLocaleString()}.
          Run <code className="px-1 py-0.5 bg-ink-100 rounded font-mono">node scripts/ingest-wvnews.mjs</code> to refresh.
        </div>
      </main>

      <Footer />
    </div>
  );
}
