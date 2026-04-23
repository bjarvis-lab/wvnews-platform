'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import {
  contests,
  contestCategories,
  contestCategoryGroups,
  contestPhotoSubmissions,
  sites,
} from '@/data/mock';

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysBetween(a, b) {
  if (!a || !b) return 0;
  return Math.max(0, Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24)));
}

// ============================================================================
// Shared: Contest header / hero
// ============================================================================
function ContestHero({ contest, site }) {
  const typeMeta = {
    bestof: { label: 'Readers\' Choice', color: 'bg-brand-700' },
    sweepstakes: { label: 'Sweepstakes', color: 'bg-gold-600' },
    photo: { label: 'Photo Contest', color: 'bg-emerald-700' },
  }[contest.type];

  return (
    <section className={`${typeMeta.color} text-white`}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link href="/contests" className="inline-flex items-center gap-1 text-white/70 text-sm hover:text-white mb-4">
          ← All Contests
        </Link>
        <div className="flex items-center gap-2 text-white/80 text-xs uppercase tracking-wider mb-2">
          <span className="px-2 py-0.5 bg-white/20 rounded font-semibold">{typeMeta.label}</span>
          <span>·</span>
          <span>{site?.name}</span>
          {contest.year && <><span>·</span><span>{contest.year}</span></>}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">{contest.title}</h1>
        {contest.subtitle && (
          <p className="text-xl text-white/90 mt-2">{contest.subtitle}</p>
        )}
        <p className="text-white/80 mt-4 max-w-3xl">{contest.description}</p>

        {contest.presentingSponsor && (
          <div className="mt-6 inline-flex items-center gap-3 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
            <span className="text-xs text-white/70 uppercase tracking-wider">Presented by</span>
            <span className="font-semibold">{contest.presentingSponsor.name}</span>
          </div>
        )}
        {contest.sponsor && !contest.presentingSponsor && (
          <div className="mt-6 inline-flex items-center gap-3 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
            <span className="text-xs text-white/70 uppercase tracking-wider">Sponsored by</span>
            <span className="font-semibold">{contest.sponsor.name}</span>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Shared: Phase timeline
// ============================================================================
function PhaseTimeline({ contest }) {
  const steps =
    contest.type === 'bestof'
      ? [
          { phase: 'nomination', label: 'Nominations', range: `${fmtDate(contest.nominationStart)} – ${fmtDate(contest.nominationEnd)}` },
          { phase: 'voting', label: 'Voting', range: `${fmtDate(contest.votingStart)} – ${fmtDate(contest.votingEnd)}` },
          { phase: 'winners', label: 'Winners', range: fmtDate(contest.winnersPublish) },
        ]
      : contest.type === 'sweepstakes'
      ? [
          { phase: 'entry', label: 'Enter to Win', range: `${fmtDate(contest.entryStart)} – ${fmtDate(contest.entryEnd)}` },
          { phase: 'drawing', label: 'Drawing', range: fmtDate(contest.drawingDate) },
          { phase: 'winners', label: 'Winner Announced', range: fmtDate(contest.winnersPublish) },
        ]
      : [
          { phase: 'submission', label: 'Submissions', range: `${fmtDate(contest.submissionStart)} – ${fmtDate(contest.submissionEnd)}` },
          { phase: 'voting', label: 'Voting', range: `${fmtDate(contest.votingStart)} – ${fmtDate(contest.votingEnd)}` },
          { phase: 'winners', label: 'Winners', range: fmtDate(contest.winnersPublish) },
        ];

  const currentIdx = steps.findIndex(s => s.phase === contest.phase);
  return (
    <div className="bg-white border-b border-ink-200">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between gap-2">
          {steps.map((s, i) => {
            const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'future';
            return (
              <div key={s.phase} className="flex-1 flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    state === 'done' ? 'bg-emerald-500 text-white' :
                    state === 'current' ? 'bg-brand-700 text-white ring-4 ring-brand-100' :
                    'bg-ink-100 text-ink-400'
                  }`}
                >
                  {state === 'done' ? '✓' : i + 1}
                </div>
                <div className="min-w-0">
                  <div className={`text-sm font-semibold truncate ${
                    state === 'current' ? 'text-brand-900' : state === 'done' ? 'text-ink-700' : 'text-ink-400'
                  }`}>
                    {s.label}
                  </div>
                  <div className="text-xs text-ink-500 truncate">{s.range}</div>
                </div>
                {i < steps.length - 1 && (
                  <div className={`hidden md:block flex-1 h-0.5 ${
                    state === 'done' ? 'bg-emerald-500' : 'bg-ink-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BEST OF — Nomination phase
// ============================================================================
function BestOfNominate({ contest, categories, groups }) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.id);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState({ businessName: '', address: '', nominator: '', email: '' });
  const [submitted, setSubmitted] = useState(false);

  const visibleCats = categories.filter(c => c.group === activeGroup);

  function submit(e) {
    e.preventDefault();
    // In production: POST to /api/contests/nominations
    console.log('Nomination submitted (mock):', { contestId: contest.id, categoryId: selectedCategory?.id, ...form });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedCategory(null);
      setForm({ businessName: '', address: '', nominator: '', email: '' });
    }, 2500);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-lg">
        <div className="font-semibold text-brand-900">Nominations are open through {fmtDate(contest.nominationEnd)}.</div>
        <p className="text-sm text-brand-800 mt-1">
          Nominate your favorite local businesses in any category. The top 5 nominees per category advance to the voting ballot.
        </p>
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-ink-200">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeGroup === g.id
                ? 'border-brand-700 text-brand-900'
                : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            <span className="mr-2">{g.icon}</span>{g.label}
          </button>
        ))}
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCats.length === 0 && (
          <p className="text-ink-500 col-span-full">No categories in this group yet.</p>
        )}
        {visibleCats.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat)}
            className="text-left bg-white rounded-lg border border-ink-200 p-5 hover:border-brand-400 hover:shadow-sm transition-all"
          >
            <div className="font-display text-lg font-bold text-ink-900">{cat.name}</div>
            {cat.sponsor && <div className="text-xs text-ink-500 mt-1">Sponsored by {cat.sponsor}</div>}
            <div className="mt-3 text-sm text-brand-700 font-semibold">+ Nominate a business →</div>
          </button>
        ))}
      </div>

      {/* Nomination modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCategory(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <div className="font-display text-xl font-bold text-ink-900">Nomination received</div>
                <p className="text-sm text-ink-600 mt-2">Thanks — we&apos;ll tally nominations and announce ballots on {fmtDate(contest.votingStart)}.</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs text-ink-500 uppercase tracking-wider">Nominate for</div>
                    <div className="font-display text-xl font-bold text-ink-900">{selectedCategory.name}</div>
                  </div>
                  <button onClick={() => setSelectedCategory(null)} className="text-ink-400 hover:text-ink-700">✕</button>
                </div>
                <form onSubmit={submit} className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-700">Business / Person *</span>
                    <input required type="text" value={form.businessName} onChange={e => setForm({...form, businessName: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-700">City / Address</span>
                    <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-700">Your name *</span>
                    <input required type="text" value={form.nominator} onChange={e => setForm({...form, nominator: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-700">Your email *</span>
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                  </label>
                  <p className="text-[11px] text-ink-500">By submitting, you agree to the contest rules. One email per nomination; duplicate submissions ignored.</p>
                  <button type="submit" className="w-full py-3 bg-brand-700 text-white font-semibold rounded-lg hover:bg-brand-600">
                    Submit Nomination
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BEST OF — Voting phase
// ============================================================================
function BestOfVote({ contest, categories, groups }) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.id);
  const [votes, setVotes] = useState({}); // { categoryId: nomineeId } — client-side ballot state
  const [email, setEmail] = useState('');
  const [authed, setAuthed] = useState(false);
  const [submittedCats, setSubmittedCats] = useState(new Set());

  const visibleCats = categories.filter(c => c.group === activeGroup);

  function castVote(catId, nomineeId) {
    if (!authed) return;
    if (submittedCats.has(catId)) return;
    setVotes(v => ({ ...v, [catId]: nomineeId }));
    setSubmittedCats(s => new Set(s).add(catId));
    // In production: POST /api/contests/votes
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {!authed ? (
        <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-200 rounded-xl p-6 mb-8">
          <div className="font-display text-xl font-bold text-ink-900 mb-1">Ready to vote?</div>
          <p className="text-sm text-ink-600 mb-4">
            Enter your email to start voting. You can vote once per category per day through {fmtDate(contest.votingEnd)}.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 px-4 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => email.includes('@') && setAuthed(true)}
              className="px-5 py-2.5 bg-brand-700 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50"
              disabled={!email.includes('@')}
            >
              Start Voting
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="text-sm text-emerald-900">
            ✓ Voting as <strong>{email}</strong> · {submittedCats.size} of {categories.length} categories voted
          </div>
          <button onClick={() => { setAuthed(false); setVotes({}); setSubmittedCats(new Set()); }} className="text-xs text-emerald-800 hover:underline">
            Sign out
          </button>
        </div>
      )}

      {/* Group tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-ink-200">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeGroup === g.id
                ? 'border-brand-700 text-brand-900'
                : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            <span className="mr-2">{g.icon}</span>{g.label}
          </button>
        ))}
      </div>

      {/* Ballot cards */}
      <div className="space-y-6">
        {visibleCats.map(cat => {
          const votedNomineeId = votes[cat.id];
          const isSubmitted = submittedCats.has(cat.id);
          return (
            <div key={cat.id} className="bg-white rounded-xl border border-ink-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between bg-ink-50/50">
                <div>
                  <h3 className="font-display text-xl font-bold text-ink-900">{cat.name}</h3>
                  {cat.sponsor && <div className="text-xs text-ink-500 mt-0.5">Sponsored by {cat.sponsor}</div>}
                </div>
                {isSubmitted && <span className="text-xs font-semibold text-emerald-700">✓ Vote cast</span>}
              </div>
              <div className="divide-y divide-ink-100">
                {cat.nominees.map(n => {
                  const isVoted = votedNomineeId === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => castVote(cat.id, n.id)}
                      disabled={!authed || isSubmitted}
                      className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors ${
                        isVoted ? 'bg-emerald-50' :
                        !authed || isSubmitted ? 'opacity-60' : 'hover:bg-brand-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className={`font-semibold ${isVoted ? 'text-emerald-900' : 'text-ink-900'}`}>
                          {isVoted && '✓ '}{n.name}
                        </div>
                        <div className="text-xs text-ink-500">{n.address}</div>
                      </div>
                      <div className={`text-sm font-semibold whitespace-nowrap ${isVoted ? 'text-emerald-700' : 'text-brand-700'}`}>
                        {isVoted ? 'Voted' : 'Vote →'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// BEST OF — Winners phase
// ============================================================================
function BestOfWinners({ contest, categories, groups }) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.id);
  const visibleCats = categories.filter(c => c.group === activeGroup);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8 p-5 bg-gradient-to-r from-gold-50 to-gold-100 border border-gold-300 rounded-xl text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h2 className="font-display text-2xl font-bold text-ink-900">Winners Announced</h2>
        <p className="text-sm text-ink-700 mt-1">
          Congratulations to all {contest.totalVotes?.toLocaleString()} vote winners — thank you to the {contest.uniqueVoters?.toLocaleString()} readers who cast a ballot.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-ink-200">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${
              activeGroup === g.id ? 'border-brand-700 text-brand-900' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            <span className="mr-2">{g.icon}</span>{g.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleCats.map(cat => {
          const sorted = [...cat.nominees].sort((a, b) => b.votes - a.votes);
          const [winner, second, third] = sorted;
          return (
            <div key={cat.id} className="bg-white rounded-xl border border-ink-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-ink-100 bg-ink-50/50">
                <h3 className="font-display text-lg font-bold text-ink-900">{cat.name}</h3>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4 pb-4 border-b border-ink-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold">🥇</div>
                  <div className="flex-1">
                    <div className="text-xs text-gold-700 uppercase tracking-wider font-semibold">Winner</div>
                    <div className="font-display text-xl font-bold text-ink-900">{winner?.name}</div>
                    <div className="text-xs text-ink-500">{winner?.address} · {winner?.votes.toLocaleString()} votes</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {second && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥈</span>
                      <span className="font-semibold text-ink-800">{second.name}</span>
                      <span className="text-xs text-ink-500">({second.votes.toLocaleString()} votes)</span>
                    </div>
                  )}
                  {third && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥉</span>
                      <span className="font-semibold text-ink-800">{third.name}</span>
                      <span className="text-xs text-ink-500">({third.votes.toLocaleString()} votes)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// SWEEPSTAKES — Entry phase
// ============================================================================
function SweepstakesEntry({ contest }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', zip: '', optIn: true });
  const [submitted, setSubmitted] = useState(false);

  function submit(e) {
    e.preventDefault();
    console.log('Sweepstakes entry (mock):', { contestId: contest.id, ...form });
    setSubmitted(true);
  }

  const daysLeft = daysBetween(new Date(), contest.entryEnd);

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🎟️</div>
        <h2 className="font-display text-3xl font-bold text-ink-900">You&apos;re entered!</h2>
        <p className="text-ink-600 mt-3 max-w-md mx-auto">
          Thanks for entering. The winner will be drawn on <strong>{fmtDate(contest.drawingDate)}</strong> and notified via email. Good luck!
        </p>
        <Link href="/contests" className="inline-block mt-6 px-5 py-3 bg-brand-700 text-white font-semibold rounded-lg hover:bg-brand-600">
          Browse more contests →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <div className="bg-gradient-to-br from-gold-50 to-gold-100 border border-gold-200 rounded-xl p-6">
            <div className="text-xs font-semibold text-gold-800 uppercase tracking-wider">Grand Prize</div>
            <div className="font-display text-2xl font-bold text-ink-900 mt-1">{contest.prize}</div>
            <div className="mt-4 pt-4 border-t border-gold-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-600">Entries so far</span>
                <span className="font-semibold text-ink-900">{contest.totalEntries?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">Entry closes</span>
                <span className="font-semibold text-ink-900">{fmtDate(contest.entryEnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">Drawing</span>
                <span className="font-semibold text-ink-900">{fmtDate(contest.drawingDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">Days left</span>
                <span className="font-semibold text-emerald-700">{daysLeft} days</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-ink-500 px-2">
            <p><strong>No purchase necessary.</strong> One entry per email address. Open to U.S. residents 18+. Full rules on contest page.</p>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-xl border border-ink-200 p-6">
            <h2 className="font-display text-2xl font-bold text-ink-900 mb-1">Enter to Win</h2>
            <p className="text-sm text-ink-600 mb-5">Fill out the form below. One entry per person.</p>

            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-ink-700">First name *</span>
                  <input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
                    className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-ink-700">Last name *</span>
                  <input required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
                    className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-ink-700">Email *</span>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-ink-700">Phone</span>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-ink-700">ZIP *</span>
                  <input required value={form.zip} onChange={e => setForm({...form, zip: e.target.value})}
                    className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                </label>
              </div>
              <label className="flex items-start gap-2 py-2">
                <input type="checkbox" checked={form.optIn} onChange={e => setForm({...form, optIn: e.target.checked})}
                  className="mt-0.5" />
                <span className="text-xs text-ink-600">
                  Sign me up for WV News email newsletters. I can unsubscribe anytime.
                </span>
              </label>
              <button type="submit" className="w-full py-3 bg-gold-600 text-white font-semibold rounded-lg hover:bg-gold-500">
                Enter Sweepstakes
              </button>
              <p className="text-[11px] text-ink-500 text-center">
                By entering you agree to the <Link href="#" className="underline">Official Rules</Link>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PHOTO — Submission phase
// ============================================================================
function PhotoSubmission({ contest }) {
  const [form, setForm] = useState({ photographer: '', email: '', title: '', location: '', category: contest.photoCategories?.[0] || '', agree: false });
  const [submitted, setSubmitted] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!form.agree) return;
    console.log('Photo submission (mock):', { contestId: contest.id, ...form });
    setSubmitted(true);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {submitted ? (
        <div className="bg-white rounded-xl border border-ink-200 p-10 text-center">
          <div className="text-6xl mb-4">📷</div>
          <h2 className="font-display text-3xl font-bold text-ink-900">Photo submitted</h2>
          <p className="text-ink-600 mt-3 max-w-md mx-auto">
            Thanks for your entry. Submissions are reviewed before appearing in the public gallery. Voting begins {fmtDate(contest.votingStart)}.
          </p>
          <button onClick={() => { setSubmitted(false); setForm({ photographer: '', email: '', title: '', location: '', category: contest.photoCategories?.[0] || '', agree: false }); }}
            className="mt-6 px-5 py-3 bg-brand-700 text-white font-semibold rounded-lg hover:bg-brand-600">
            Submit another photo
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-ink-200 p-6">
          <h2 className="font-display text-2xl font-bold text-ink-900 mb-1">Submit Your Photo</h2>
          <p className="text-sm text-ink-600 mb-6">
            Up to {contest.maxSubmissionsPerUser} submissions per photographer. JPG/PNG, max 10MB.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div className="border-2 border-dashed border-ink-300 rounded-xl p-10 text-center hover:border-brand-400 transition-colors cursor-pointer">
              <div className="text-4xl mb-2">📷</div>
              <div className="font-semibold text-ink-900">Drop your photo here, or click to upload</div>
              <div className="text-xs text-ink-500 mt-1">JPG, PNG · Max 10MB · Original work only</div>
              <input type="file" accept="image/*" className="hidden" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-ink-700">Photo title *</span>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-700">Category *</span>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  {(contest.photoCategories || []).map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-ink-700">Location (where was this taken?)</span>
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-ink-700">Your name *</span>
                <input required value={form.photographer} onChange={e => setForm({...form, photographer: e.target.value})}
                  className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-700">Email *</span>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </label>
            </div>
            <label className="flex items-start gap-2 py-2">
              <input required type="checkbox" checked={form.agree} onChange={e => setForm({...form, agree: e.target.checked})} className="mt-0.5" />
              <span className="text-xs text-ink-600">
                I certify this is my original work and I grant WV News a non-exclusive license to publish and promote it in connection with this contest.
              </span>
            </label>
            <button type="submit" disabled={!form.agree} className="w-full py-3 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50">
              Submit Photo
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PHOTO — Voting phase / gallery
// ============================================================================
function PhotoGallery({ contest, submissions }) {
  const [filter, setFilter] = useState('All');
  const [votedIds, setVotedIds] = useState(new Set());
  const categories = ['All', ...(contest.photoCategories || [])];

  const filtered = filter === 'All' ? submissions : submissions.filter(s => s.category === filter);

  function vote(id) {
    setVotedIds(s => new Set(s).add(id));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 text-sm font-semibold rounded-full ${
              filter === cat ? 'bg-emerald-700 text-white' : 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => {
          const voted = votedIds.has(p.id);
          return (
            <div key={p.id} className="bg-white rounded-xl overflow-hidden border border-ink-200">
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-6xl opacity-50">
                📷
              </div>
              <div className="p-4">
                <div className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">{p.category}</div>
                <div className="font-display text-lg font-bold text-ink-900 mt-0.5">{p.title}</div>
                <div className="text-xs text-ink-500 mt-0.5">by {p.photographer} · {p.location}</div>
                <button
                  onClick={() => vote(p.id)}
                  disabled={voted}
                  className={`mt-3 w-full py-2 rounded-lg text-sm font-semibold ${
                    voted ? 'bg-emerald-100 text-emerald-800 cursor-default' : 'bg-emerald-700 text-white hover:bg-emerald-600'
                  }`}
                >
                  {voted ? `✓ Voted (${(p.votes + 1).toLocaleString()})` : `❤️ Vote (${p.votes.toLocaleString()})`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Page entry point
// ============================================================================
export default function ContestPage({ params }) {
  const { slug } = params;
  const contest = contests.find(c => c.slug === slug);

  const categories = useMemo(
    () => (contest ? contestCategories.filter(c => c.contestId === contest.id) : []),
    [contest]
  );
  const groupsInContest = useMemo(() => {
    const ids = new Set(categories.map(c => c.group));
    return contestCategoryGroups.filter(g => ids.has(g.id));
  }, [categories]);

  const photoSubs = useMemo(
    () => (contest ? contestPhotoSubmissions.filter(p => p.contestId === contest.id) : []),
    [contest]
  );

  if (!contest) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">🤷</div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Contest not found</h1>
          <p className="text-ink-600 mt-2">We couldn&apos;t find a contest at this URL.</p>
          <Link href="/contests" className="inline-block mt-5 px-5 py-3 bg-brand-700 text-white font-semibold rounded-lg hover:bg-brand-600">
            ← All Contests
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const site = sites.find(s => s.id === contest.site);

  return (
    <div className="min-h-screen bg-ink-50">
      <PublicHeader />
      <ContestHero contest={contest} site={site} />
      <PhaseTimeline contest={contest} />

      {/* Body switches on contest type + phase */}
      {contest.type === 'bestof' && contest.phase === 'nomination' && (
        <BestOfNominate contest={contest} categories={categories} groups={groupsInContest} />
      )}
      {contest.type === 'bestof' && contest.phase === 'voting' && (
        <BestOfVote contest={contest} categories={categories} groups={groupsInContest} />
      )}
      {contest.type === 'bestof' && contest.phase === 'winners' && (
        <BestOfWinners contest={contest} categories={categories} groups={groupsInContest} />
      )}

      {contest.type === 'sweepstakes' && contest.phase === 'entry' && (
        <SweepstakesEntry contest={contest} />
      )}
      {contest.type === 'sweepstakes' && contest.phase === 'winners' && (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-3">🎉</div>
          <h2 className="font-display text-3xl font-bold text-ink-900">Winner Announced</h2>
          <p className="text-ink-600 mt-3">Check your inbox — the winner has been notified.</p>
        </div>
      )}

      {contest.type === 'photo' && contest.phase === 'submission' && (
        <PhotoSubmission contest={contest} />
      )}
      {contest.type === 'photo' && contest.phase === 'voting' && (
        <PhotoGallery contest={contest} submissions={photoSubs} />
      )}
      {contest.type === 'photo' && contest.phase === 'winners' && (
        <PhotoGallery contest={contest} submissions={photoSubs.slice().sort((a,b) => b.votes - a.votes).slice(0, 6)} />
      )}

      <Footer />
    </div>
  );
}
