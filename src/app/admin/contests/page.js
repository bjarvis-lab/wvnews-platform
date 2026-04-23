'use client';
import { useState } from 'react';
import Link from 'next/link';
import { contests, sites } from '@/data/mock';

const typeMeta = {
  bestof: { label: 'Best Of', tone: 'bg-brand-100 text-brand-800', icon: '🏆' },
  sweepstakes: { label: 'Sweepstakes', tone: 'bg-gold-100 text-gold-900', icon: '🎁' },
  photo: { label: 'Photo Contest', tone: 'bg-emerald-100 text-emerald-800', icon: '📷' },
};

const phaseMeta = {
  nomination: { label: 'Nominations', tone: 'bg-emerald-100 text-emerald-800' },
  voting: { label: 'Voting', tone: 'bg-brand-100 text-brand-800' },
  entry: { label: 'Entry Open', tone: 'bg-emerald-100 text-emerald-800' },
  submission: { label: 'Submissions', tone: 'bg-emerald-100 text-emerald-800' },
  winners: { label: 'Winners', tone: 'bg-gold-100 text-gold-900' },
  closed: { label: 'Closed', tone: 'bg-ink-100 text-ink-700' },
};

export default function AdminContests() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);

  const filtered = contests.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    active: contests.filter(c => c.status === 'active').length,
    totalVotes: contests.reduce((a, c) => a + (c.totalVotes || 0), 0),
    totalNoms: contests.reduce((a, c) => a + (c.totalNominations || 0), 0),
    totalEntries: contests.reduce((a, c) => a + (c.totalEntries || 0) + (c.totalSubmissions || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900">Contests & Sweepstakes</h2>
          <p className="text-sm text-ink-500 mt-0.5">Best Of ballots, sweepstakes, and photo contests across all publications.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">
          + New Contest
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Contests" value={stats.active} />
        <StatCard label="Votes Cast (YTD)" value={stats.totalVotes.toLocaleString()} />
        <StatCard label="Nominations (YTD)" value={stats.totalNoms.toLocaleString()} />
        <StatCard label="Entries + Photos" value={stats.totalEntries.toLocaleString()} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-ink-200">
        <span className="text-xs font-semibold text-ink-600 uppercase tracking-wider">Type</span>
        <div className="flex gap-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'bestof', label: 'Best Of' },
            { id: 'sweepstakes', label: 'Sweepstakes' },
            { id: 'photo', label: 'Photo' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded ${
                typeFilter === t.id ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-ink-300">·</span>
        <span className="text-xs font-semibold text-ink-600 uppercase tracking-wider">Status</span>
        <div className="flex gap-1">
          {['all', 'active', 'archived'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded capitalize ${
                statusFilter === s ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 border-b border-ink-200">
            <tr className="text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">
              <th className="px-5 py-3">Contest</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Phase</th>
              <th className="px-5 py-3">Site</th>
              <th className="px-5 py-3 text-right">Engagement</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered.map(c => {
              const t = typeMeta[c.type];
              const p = phaseMeta[c.phase] || phaseMeta.closed;
              const site = sites.find(s => s.id === c.site);
              const engagement = c.type === 'bestof'
                ? `${(c.totalVotes || c.totalNominations || 0).toLocaleString()} ${c.phase === 'nomination' ? 'noms' : 'votes'}`
                : c.type === 'sweepstakes'
                ? `${(c.totalEntries || 0).toLocaleString()} entries`
                : `${(c.totalSubmissions || 0).toLocaleString()} photos`;

              return (
                <tr key={c.id} className="hover:bg-ink-50/50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-ink-900">{c.title}</div>
                    <div className="text-xs text-ink-500">{c.subtitle}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded ${t.tone}`}>
                      <span>{t.icon}</span>{t.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${p.tone}`}>{p.label}</span>
                  </td>
                  <td className="px-5 py-4 text-ink-700">{site?.name}</td>
                  <td className="px-5 py-4 text-right font-semibold text-ink-900 whitespace-nowrap">{engagement}</td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <Link href={`/admin/contests/${c.id}`} className="text-brand-700 text-xs font-semibold hover:underline">
                      Manage →
                    </Link>
                    <span className="mx-2 text-ink-300">|</span>
                    <Link href={`/contests/${c.slug}`} target="_blank" className="text-ink-500 text-xs font-semibold hover:text-ink-900">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New contest modal */}
      {showNew && <NewContestModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-200">
      <div className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-ink-900">{value}</div>
    </div>
  );
}

function NewContestModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [form, setForm] = useState({ title: '', site: 'wvnews' });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-xs text-ink-500 uppercase tracking-wider">Step {step} of 2</div>
            <h3 className="font-display text-xl font-bold text-ink-900">Create a new contest</h3>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 text-xl">✕</button>
        </div>

        {step === 1 && (
          <>
            <p className="text-sm text-ink-600 mb-4">Choose a contest type to start.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'bestof', label: 'Best Of', icon: '🏆', desc: 'Multi-phase reader-voted awards with categories and nominees.' },
                { id: 'sweepstakes', label: 'Sweepstakes', icon: '🎁', desc: 'Single-entry prize drawing. Users enter once; you pick a winner.' },
                { id: 'photo', label: 'Photo Contest', icon: '📷', desc: 'Reader-submitted photos with optional public voting.' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setType(t.id); setStep(2); }}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    type === t.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-brand-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{t.icon}</div>
                  <div className="font-display text-lg font-bold text-ink-900">{t.label}</div>
                  <div className="text-xs text-ink-600 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <form onSubmit={e => { e.preventDefault(); console.log('New contest (mock):', { type, ...form }); onClose(); }}>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-ink-700">Contest title *</span>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Best of Harrison 2027"
                  className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-700">Publication *</span>
                <select required value={form.site} onChange={e => setForm({...form, site: e.target.value})}
                  className="mt-1 w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <p className="text-xs text-ink-500">
                After creation you&apos;ll configure phases, categories, sponsors, and rules on the contest management page.
              </p>
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-ink-100">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-ink-600 hover:text-ink-900">
                ← Back
              </button>
              <button type="submit" className="px-5 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">
                Create contest →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
