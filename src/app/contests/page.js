'use client';
import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { contests, sites } from '@/data/mock';

function siteFor(id) {
  return sites.find(s => s.id === id);
}

const typeMeta = {
  bestof: { label: 'Readers\' Choice', color: 'bg-brand-700', icon: '🏆' },
  sweepstakes: { label: 'Sweepstakes', color: 'bg-gold-600', icon: '🎁' },
  photo: { label: 'Photo Contest', color: 'bg-emerald-700', icon: '📷' },
};

const phaseMeta = {
  nomination: { label: 'Nominations Open', tone: 'bg-emerald-100 text-emerald-800' },
  voting: { label: 'Voting Open', tone: 'bg-brand-100 text-brand-800' },
  entry: { label: 'Entry Open', tone: 'bg-emerald-100 text-emerald-800' },
  submission: { label: 'Accepting Submissions', tone: 'bg-emerald-100 text-emerald-800' },
  winners: { label: 'Winners Announced', tone: 'bg-gold-100 text-gold-900' },
  closed: { label: 'Closed', tone: 'bg-ink-100 text-ink-600' },
};

function ContestCard({ contest }) {
  const t = typeMeta[contest.type];
  const p = phaseMeta[contest.phase] || phaseMeta.closed;
  const site = siteFor(contest.site);
  return (
    <Link
      href={`/contests/${contest.slug}`}
      className="group block bg-white rounded-xl overflow-hidden border border-ink-200 hover:shadow-lg hover:border-brand-300 transition-all"
    >
      <div className={`relative aspect-[16/9] ${t.color} flex items-center justify-center`}>
        <span className="text-7xl opacity-30">{t.icon}</span>
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2 py-1 bg-white/90 text-ink-900 text-xs font-semibold rounded uppercase tracking-wide">
            {t.label}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 ${p.tone} text-xs font-semibold rounded uppercase tracking-wide`}>
            {p.label}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="text-xs text-ink-500 mb-1">
          {site?.name}{contest.year ? ` · ${contest.year}` : ''}
        </div>
        <h3 className="font-display text-xl font-bold text-ink-900 group-hover:text-brand-700 transition-colors">
          {contest.title}
        </h3>
        {contest.subtitle && (
          <p className="text-sm text-ink-600 mt-1">{contest.subtitle}</p>
        )}
        <p className="text-sm text-ink-500 mt-3 line-clamp-2">{contest.description}</p>

        <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
          {contest.type === 'bestof' && contest.phase === 'voting' && (
            <span>🗳️ {contest.totalVotes?.toLocaleString() || 0} votes cast</span>
          )}
          {contest.type === 'bestof' && contest.phase === 'nomination' && (
            <span>✏️ {contest.totalNominations?.toLocaleString() || 0} nominations</span>
          )}
          {contest.type === 'sweepstakes' && (
            <span>🎟️ {contest.totalEntries?.toLocaleString() || 0} entries</span>
          )}
          {contest.type === 'photo' && (
            <span>📷 {contest.totalSubmissions?.toLocaleString() || 0} photos</span>
          )}
          <span className="text-brand-700 font-semibold group-hover:underline">View →</span>
        </div>
      </div>
    </Link>
  );
}

export default function ContestsIndex() {
  const active = contests.filter(c => c.status === 'active');
  const archived = contests.filter(c => c.status === 'archived');

  return (
    <div className="min-h-screen bg-ink-50">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center gap-2 text-gold-400 text-sm font-semibold uppercase tracking-wider mb-3">
            <span>🏆</span>
            <span>Contests & Sweepstakes</span>
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight">
            Vote. Enter. Win.
          </h1>
          <p className="text-lg text-white/80 mt-3 max-w-2xl">
            Readers&apos; Choice awards, sweepstakes, and photo contests across all WV News Group publications.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Active contests */}
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900 mb-5">Active Now</h2>
          {active.length === 0 ? (
            <p className="text-ink-500">No active contests at the moment. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {active.map(c => <ContestCard key={c.id} contest={c} />)}
            </div>
          )}
        </section>

        {/* Past winners */}
        {archived.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold text-ink-900 mb-5">Past Contests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archived.map(c => <ContestCard key={c.id} contest={c} />)}
            </div>
          </section>
        )}

        {/* Call-to-action for advertisers */}
        <section className="mt-16 bg-white rounded-xl p-8 border border-ink-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-ink-900">
                Sponsor a contest
              </h3>
              <p className="text-sm text-ink-600 mt-1">
                Presenting and category sponsorships available. Reach 200,000+ daily readers across 20 publications.
              </p>
            </div>
            <Link
              href="/submit"
              className="px-5 py-3 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 whitespace-nowrap"
            >
              Contact Sales →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
