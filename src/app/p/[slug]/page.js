'use client';
import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import SiteBadge from '@/components/public/SiteBadge';
import { sites } from '@/data/mock';
import ingested from '@/data/ingested-stories.json';

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now - d) / (1000 * 60 * 60);
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffH < 48) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PublicationPage({ params }) {
  const { slug } = params;
  // Accept either the site id (e.g. "exponent") or the wvnews.com URL slug (e.g. "theet")
  const site = sites.find(s => s.id === slug) || sites.find(s => s.slug === slug);

  if (!site) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold text-ink-900">Publication not found</h1>
          <Link href="/p" className="inline-block mt-5 px-5 py-3 bg-brand-700 text-white font-semibold rounded-lg hover:bg-brand-600">
            ← All publications
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const stories = ingested?.stories?.[site.id] || [];
  const [lead, ...rest] = stories;
  const related = sites.filter(s => s.id !== site.id).slice(0, 6);

  return (
    <div className="min-h-screen bg-ink-50">
      <PublicHeader />

      {/* Publication masthead — uses brand color as background accent */}
      <section
        className="text-white relative"
        style={{ background: `linear-gradient(135deg, ${site.color} 0%, #0f1d3d 100%)` }}
      >
        <div className="max-w-7xl mx-auto px-4 py-10">
          <Link href="/p" className="text-white/70 text-sm hover:text-white">← All publications</Link>
          <div className="flex items-center gap-5 mt-4">
            {site.logoFile ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={site.logoFile}
                alt={site.name}
                className="h-20 w-auto bg-white rounded-lg p-3 shadow-lg"
              />
            ) : (
              <SiteBadge site={site} size={80} />
            )}
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">{site.name}</h1>
              <p className="text-white/80 mt-1">{site.market} · {site.domain}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section nav (stub — would be real sections per pub in production) */}
      <div className="bg-white border-b border-ink-200 sticky top-[88px] z-30">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {['Latest', 'News', 'Sports', 'Community', 'Obits', 'Opinion', 'E-Edition'].map(s => (
            <button key={s} className="px-4 py-3 text-sm font-semibold text-ink-700 hover:text-brand-700 border-b-2 border-transparent hover:border-brand-700 whitespace-nowrap">
              {s}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {stories.length === 0 ? (
          <div className="bg-white rounded-xl border border-ink-200 p-10 text-center">
            <div className="text-5xl mb-3">📰</div>
            <h2 className="font-display text-xl font-bold text-ink-900">No recent stories ingested yet</h2>
            <p className="text-sm text-ink-600 mt-2 max-w-md mx-auto">
              {site.name} didn&apos;t have stories in the last ingestion batch. Run
              <code className="mx-1 px-1.5 py-0.5 bg-ink-100 rounded font-mono text-xs">node scripts/ingest-wvnews.mjs</code>
              to refresh, or check back later.
            </p>
            <Link
              href={`https://www.wvnews.com/${site.slug}/`}
              target="_blank"
              className="inline-block mt-4 text-brand-700 text-sm font-semibold hover:underline"
            >
              View this publication on wvnews.com →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Lead story */}
              {lead && (
                <article className="mb-8">
                  <a href={lead.sourceUrl} target="_blank" rel="noreferrer" className="block group">
                    {lead.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lead.image}
                        alt=""
                        className="w-full aspect-[16/9] object-cover rounded-xl mb-4"
                      />
                    )}
                    <h2 className="font-display text-3xl font-bold text-ink-900 group-hover:text-brand-700 leading-tight">
                      {lead.title}
                    </h2>
                    {lead.description && (
                      <p className="text-ink-700 mt-2 text-lg leading-relaxed">{lead.description}</p>
                    )}
                    <div className="text-xs text-ink-500 mt-3">
                      {lead.author} · {fmtDate(lead.pubDate)}
                    </div>
                  </a>
                </article>
              )}

              {/* Grid of rest */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-ink-200">
                {rest.map(story => (
                  <a
                    key={story.id}
                    href={story.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block group"
                  >
                    {story.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={story.image} alt="" className="w-full aspect-[16/9] object-cover rounded-lg mb-3" />
                    )}
                    <h3 className="font-display text-lg font-bold text-ink-900 group-hover:text-brand-700 leading-snug">
                      {story.title}
                    </h3>
                    {story.description && (
                      <p className="text-sm text-ink-600 mt-1 line-clamp-2">{story.description}</p>
                    )}
                    <div className="text-xs text-ink-500 mt-2">
                      {story.author} · {fmtDate(story.pubDate)}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="bg-white rounded-xl border border-ink-200 p-5">
                <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">About {site.name}</div>
                <p className="text-sm text-ink-700">
                  {site.name} serves {site.market}. Part of the WV News Group, covering {sites.length} markets across West Virginia and the surrounding region.
                </p>
                <div className="mt-4 pt-4 border-t border-ink-100 space-y-2 text-sm">
                  <a href={`https://${site.domain}`} target="_blank" rel="noreferrer" className="block text-brand-700 hover:underline">
                    {site.domain} →
                  </a>
                  <Link href="/subscribe" className="block text-brand-700 hover:underline">
                    Subscribe to {site.name} →
                  </Link>
                  <Link href="/contests" className="block text-brand-700 hover:underline">
                    Best Of & Contests →
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-ink-200 p-5">
                <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">Other Publications</div>
                <div className="space-y-2">
                  {related.map(r => (
                    <Link key={r.id} href={`/p/${r.id}`} className="flex items-center gap-2 p-2 rounded hover:bg-ink-50">
                      {r.logoFile ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.logoFile} alt={r.name} className="h-7 w-auto max-w-[80px] object-contain" />
                      ) : (
                        <SiteBadge site={r} size={28} />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink-900 truncate">{r.name}</div>
                        <div className="text-[11px] text-ink-500 truncate">{r.market}</div>
                      </div>
                    </Link>
                  ))}
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
