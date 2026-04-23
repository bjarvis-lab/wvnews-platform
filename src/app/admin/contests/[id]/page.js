'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  contests,
  contestCategories,
  contestCategoryGroups,
  contestPhotoSubmissions,
  contestSweepstakesEntries,
  sites,
} from '@/data/mock';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminContestDetail({ params }) {
  const { id } = params;
  const contest = contests.find(c => c.id === id);
  const [tab, setTab] = useState('overview');

  if (!contest) {
    return (
      <div className="p-10 text-center">
        <h2 className="font-display text-2xl text-ink-900">Contest not found</h2>
        <Link href="/admin/contests" className="inline-block mt-4 text-brand-700 hover:underline">← Back to contests</Link>
      </div>
    );
  }

  const site = sites.find(s => s.id === contest.site);
  const categories = contestCategories.filter(c => c.contestId === contest.id);
  const photoSubs = contestPhotoSubmissions.filter(p => p.contestId === contest.id);
  const entries = contestSweepstakesEntries.filter(e => e.contestId === contest.id);

  const tabs = contest.type === 'bestof'
    ? ['overview', 'categories', 'nominations', 'results', 'sponsors', 'rules', 'settings']
    : contest.type === 'sweepstakes'
    ? ['overview', 'entries', 'drawing', 'rules', 'settings']
    : ['overview', 'submissions', 'voting', 'winners', 'rules', 'settings'];

  return (
    <div className="space-y-5">
      {/* Breadcrumb + header */}
      <div>
        <Link href="/admin/contests" className="text-xs text-ink-500 hover:text-ink-900">← All contests</Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-ink-900">{contest.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-ink-600">
              <span className="capitalize">{contest.type}</span>
              <span>·</span>
              <span>{site?.name}</span>
              <span>·</span>
              <span className="capitalize font-semibold text-brand-700">{contest.phase} phase</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/contests/${contest.slug}`} target="_blank"
              className="px-3 py-2 bg-white text-ink-700 text-sm font-medium rounded-lg border border-ink-200 hover:bg-ink-50">
              Preview public page ↗
            </Link>
            <button className="px-3 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">
              Advance phase →
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-ink-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 whitespace-nowrap ${
                tab === t ? 'border-brand-700 text-brand-900' : 'border-transparent text-ink-500 hover:text-ink-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab contest={contest} categories={categories} photoSubs={photoSubs} entries={entries} />}
      {tab === 'categories' && <CategoriesTab contest={contest} categories={categories} />}
      {tab === 'nominations' && <NominationsTab contest={contest} categories={categories} />}
      {tab === 'results' && <ResultsTab contest={contest} categories={categories} />}
      {tab === 'entries' && <EntriesTab contest={contest} entries={entries} />}
      {tab === 'drawing' && <DrawingTab contest={contest} entries={entries} />}
      {tab === 'submissions' && <SubmissionsTab contest={contest} photoSubs={photoSubs} />}
      {tab === 'voting' && <VotingTab contest={contest} photoSubs={photoSubs} />}
      {tab === 'winners' && <WinnersTab contest={contest} photoSubs={photoSubs} />}
      {tab === 'sponsors' && <SponsorsTab contest={contest} categories={categories} />}
      {tab === 'rules' && <RulesTab contest={contest} />}
      {tab === 'settings' && <SettingsTab contest={contest} />}
    </div>
  );
}

// ---------- Shared tab helpers ----------
function Panel({ title, action, children }) {
  return (
    <div className="bg-white rounded-xl border border-ink-200">
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          {title && <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-ink-200">
      <div className="text-xs text-ink-500 uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-2xl font-bold text-ink-900 mt-1">{value}</div>
      {hint && <div className="text-xs text-ink-500 mt-1">{hint}</div>}
    </div>
  );
}

// ---------- Tabs ----------
function OverviewTab({ contest, categories, photoSubs, entries }) {
  const timelineRows = contest.type === 'bestof'
    ? [
        ['Nominations', contest.nominationStart, contest.nominationEnd],
        ['Voting', contest.votingStart, contest.votingEnd],
        ['Winners', contest.winnersPublish, null],
      ]
    : contest.type === 'sweepstakes'
    ? [
        ['Entry', contest.entryStart, contest.entryEnd],
        ['Drawing', contest.drawingDate, null],
        ['Winners', contest.winnersPublish, null],
      ]
    : [
        ['Submissions', contest.submissionStart, contest.submissionEnd],
        ['Voting', contest.votingStart, contest.votingEnd],
        ['Winners', contest.winnersPublish, null],
      ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {contest.type === 'bestof' && (
            <>
              <Stat label="Categories" value={categories.length} />
              <Stat label="Nominations" value={(contest.totalNominations || 0).toLocaleString()} />
              <Stat label="Votes" value={(contest.totalVotes || 0).toLocaleString()} />
              <Stat label="Unique Voters" value={(contest.uniqueVoters || 0).toLocaleString()} />
            </>
          )}
          {contest.type === 'sweepstakes' && (
            <>
              <Stat label="Total Entries" value={entries.length ? (contest.totalEntries || entries.length).toLocaleString() : (contest.totalEntries || 0).toLocaleString()} />
              <Stat label="Days Remaining" value={Math.max(0, Math.ceil((new Date(contest.entryEnd) - new Date()) / (1000 * 60 * 60 * 24)))} hint={`Entry ends ${fmtDate(contest.entryEnd)}`} />
              <Stat label="Drawing" value={fmtDate(contest.drawingDate)} />
              <Stat label="Newsletter Opt-In" value="73%" hint="Mock — wire to real data" />
            </>
          )}
          {contest.type === 'photo' && (
            <>
              <Stat label="Submissions" value={(contest.totalSubmissions || photoSubs.length).toLocaleString()} />
              <Stat label="Categories" value={contest.photoCategories?.length || 0} />
              <Stat label="Votes" value={photoSubs.reduce((a, p) => a + (p.votes || 0), 0).toLocaleString()} />
              <Stat label="Unique Photographers" value={new Set(photoSubs.map(p => p.photographer)).size} />
            </>
          )}
        </div>

        <Panel title="Timeline">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-ink-100">
              {timelineRows.map(([label, start, end]) => (
                <tr key={label}>
                  <td className="py-3 font-semibold text-ink-800 w-1/3">{label}</td>
                  <td className="py-3 text-ink-600">
                    {fmtDate(start)}{end && ` – ${fmtDate(end)}`}
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-xs text-brand-700 hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Description">
          <p className="text-sm text-ink-700">{contest.description}</p>
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel title="Presenting Sponsor">
          {contest.presentingSponsor ? (
            <>
              <div className="font-semibold text-ink-900">{contest.presentingSponsor.name}</div>
              <button className="mt-3 w-full px-3 py-2 text-xs bg-ink-100 hover:bg-ink-200 rounded-lg font-semibold">Replace</button>
            </>
          ) : contest.sponsor ? (
            <>
              <div className="font-semibold text-ink-900">{contest.sponsor.name}</div>
              <button className="mt-3 w-full px-3 py-2 text-xs bg-ink-100 hover:bg-ink-200 rounded-lg font-semibold">Replace</button>
            </>
          ) : (
            <button className="w-full px-3 py-3 text-sm bg-gold-50 hover:bg-gold-100 border border-dashed border-gold-300 rounded-lg font-semibold text-gold-900">
              + Add presenting sponsor
            </button>
          )}
        </Panel>

        <Panel title="Quick Actions">
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50 rounded">📧 Email contest promo</button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50 rounded">📱 Share on social</button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50 rounded">📊 Export data (CSV)</button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50 rounded">🖼️ Generate winner certificates</button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50 rounded text-red-600">⚠️ Close contest</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CategoriesTab({ contest, categories }) {
  const [groupFilter, setGroupFilter] = useState('all');
  const grouped = useMemo(() => {
    const g = {};
    categories.forEach(c => {
      g[c.group] = g[c.group] || [];
      g[c.group].push(c);
    });
    return g;
  }, [categories]);

  return (
    <Panel
      title={`${categories.length} Categories`}
      action={<button className="px-3 py-1.5 bg-brand-700 text-white text-xs font-semibold rounded">+ New Category</button>}
    >
      <div className="flex gap-1 mb-4 flex-wrap">
        <button onClick={() => setGroupFilter('all')} className={`px-3 py-1.5 text-xs font-semibold rounded ${
          groupFilter === 'all' ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
        }`}>
          All
        </button>
        {contestCategoryGroups.map(g => (
          <button
            key={g.id}
            onClick={() => setGroupFilter(g.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${
              groupFilter === g.id ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            {g.icon} {g.label}
          </button>
        ))}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider border-b border-ink-200">
            <th className="pb-2">Category</th>
            <th className="pb-2">Group</th>
            <th className="pb-2">Sponsor</th>
            <th className="pb-2 text-right">Nominees</th>
            <th className="pb-2 text-right">Votes</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {categories
            .filter(c => groupFilter === 'all' || c.group === groupFilter)
            .map(cat => {
              const group = contestCategoryGroups.find(g => g.id === cat.group);
              const totalVotes = cat.nominees.reduce((a, n) => a + n.votes, 0);
              return (
                <tr key={cat.id} className="hover:bg-ink-50/50">
                  <td className="py-3 font-semibold text-ink-900">{cat.name}</td>
                  <td className="py-3 text-ink-600">{group?.icon} {group?.label}</td>
                  <td className="py-3 text-ink-600">{cat.sponsor || <span className="text-ink-400">—</span>}</td>
                  <td className="py-3 text-right font-semibold">{cat.nominees.length}</td>
                  <td className="py-3 text-right font-semibold">{totalVotes.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <button className="text-xs text-brand-700 hover:underline">Edit</button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </Panel>
  );
}

function NominationsTab({ contest, categories }) {
  // Mock queue of pending / approved nominations
  const mockQueue = [
    { id: 1, business: 'Bistro 34', category: 'Best Burger', nominator: 'Sarah M.', count: 23, status: 'pending' },
    { id: 2, business: 'The Corner Cafe', category: 'Best Coffee Shop', nominator: 'Mike D.', count: 17, status: 'pending' },
    { id: 3, business: 'Dr. Rachel Kim, DDS', category: 'Best Dentist', nominator: 'Jennifer L.', count: 14, status: 'approved' },
    { id: 4, business: 'Main Street Motors', category: 'Best Auto Repair', nominator: 'Dave P.', count: 11, status: 'approved' },
    { id: 5, business: 'XYZ Spam Company', category: 'Best Pizza', nominator: 'anonymous', count: 3, status: 'flagged' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
      <div className="lg:col-span-3">
        <Panel title="Nominations Queue" action={
          <select className="text-xs px-3 py-1.5 border border-ink-200 rounded bg-white">
            <option>All statuses</option>
            <option>Pending review</option>
            <option>Approved</option>
            <option>Flagged</option>
          </select>
        }>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider border-b border-ink-200">
                <th className="pb-2">Business</th>
                <th className="pb-2">Category</th>
                <th className="pb-2 text-right">Nominations</th>
                <th className="pb-2">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {mockQueue.map(row => (
                <tr key={row.id} className="hover:bg-ink-50/50">
                  <td className="py-3 font-semibold text-ink-900">{row.business}</td>
                  <td className="py-3 text-ink-600">{row.category}</td>
                  <td className="py-3 text-right font-semibold">{row.count}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      row.status === 'pending' ? 'bg-gold-100 text-gold-900' :
                      row.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button className="text-xs text-emerald-700 hover:underline font-semibold">Approve</button>
                    <button className="text-xs text-red-600 hover:underline font-semibold">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
      <div className="space-y-5">
        <Panel title="Queue Stats">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-ink-600">Pending</span><span className="font-semibold">2</span></div>
            <div className="flex justify-between"><span className="text-ink-600">Approved</span><span className="font-semibold">2</span></div>
            <div className="flex justify-between"><span className="text-ink-600">Flagged</span><span className="font-semibold">1</span></div>
          </div>
        </Panel>
        <Panel title="Auto-Advance">
          <p className="text-xs text-ink-600 mb-3">Top 5 nominees per category advance to voting automatically.</p>
          <button className="w-full px-3 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">
            Build ballot →
          </button>
        </Panel>
      </div>
    </div>
  );
}

function ResultsTab({ contest, categories }) {
  return (
    <Panel title="Live Voting Results"
      action={<button className="px-3 py-1.5 text-xs bg-ink-100 hover:bg-ink-200 rounded font-semibold">Export CSV</button>}>
      <div className="space-y-5">
        {categories.map(cat => {
          const sorted = [...cat.nominees].sort((a, b) => b.votes - a.votes);
          const total = sorted.reduce((a, n) => a + n.votes, 0);
          return (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-display font-bold text-ink-900">{cat.name}</div>
                  {cat.sponsor && <div className="text-xs text-ink-500">Sponsor: {cat.sponsor}</div>}
                </div>
                <div className="text-xs text-ink-500">{total.toLocaleString()} total votes</div>
              </div>
              <div className="space-y-1.5">
                {sorted.map((n, i) => {
                  const pct = total ? (n.votes / total) * 100 : 0;
                  return (
                    <div key={n.id} className="flex items-center gap-3 text-sm">
                      <div className={`w-5 text-center font-bold ${i === 0 ? 'text-gold-600' : 'text-ink-400'}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0 bg-ink-100 rounded h-6 relative overflow-hidden">
                        <div
                          className={`h-full ${i === 0 ? 'bg-gold-400' : 'bg-brand-200'}`}
                          style={{ width: `${pct}%` }}
                        />
                        <div className="absolute inset-0 flex items-center px-2 text-xs font-semibold text-ink-900 truncate">
                          {n.name}
                        </div>
                      </div>
                      <div className="w-20 text-right text-xs font-semibold whitespace-nowrap">
                        {n.votes.toLocaleString()} ({pct.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function EntriesTab({ contest, entries }) {
  return (
    <Panel
      title={`${(contest.totalEntries || entries.length).toLocaleString()} Entries`}
      action={<button className="px-3 py-1.5 text-xs bg-ink-100 hover:bg-ink-200 rounded font-semibold">Export CSV</button>}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider border-b border-ink-200">
            <th className="pb-2">Name</th>
            <th className="pb-2">Email</th>
            <th className="pb-2">ZIP</th>
            <th className="pb-2">Source</th>
            <th className="pb-2">Entered</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {entries.map(e => (
            <tr key={e.id} className="hover:bg-ink-50/50">
              <td className="py-3 font-semibold text-ink-900">{e.name}</td>
              <td className="py-3 text-ink-600">{e.email}</td>
              <td className="py-3 text-ink-600">{e.zip}</td>
              <td className="py-3 text-ink-600 capitalize">{e.referral}</td>
              <td className="py-3 text-ink-600">{new Date(e.entered).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-xs text-ink-500">Showing {entries.length} of {(contest.totalEntries || 0).toLocaleString()} entries (sample).</p>
    </Panel>
  );
}

function DrawingTab({ contest, entries }) {
  const [winner, setWinner] = useState(null);

  function draw() {
    // Mock: pick a random entry
    const pick = entries[Math.floor(Math.random() * entries.length)];
    setWinner(pick);
  }

  return (
    <Panel title="Random Winner Drawing">
      {!winner ? (
        <div className="text-center py-10">
          <div className="text-6xl mb-3">🎲</div>
          <div className="font-display text-xl font-bold text-ink-900">Ready to draw?</div>
          <p className="text-sm text-ink-600 mt-2 max-w-md mx-auto">
            The drawing will select one entry at random from all {(contest.totalEntries || entries.length).toLocaleString()} valid entries.
            Invalid entries (duplicates, disqualified) are excluded.
          </p>
          <button onClick={draw} className="mt-5 px-6 py-3 bg-brand-700 text-white font-semibold rounded-lg hover:bg-brand-600">
            🎲 Draw Winner
          </button>
          <p className="text-xs text-ink-500 mt-3">Drawing is logged and auditable. You can re-draw if the winner is unreachable.</p>
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="text-6xl mb-3">🎉</div>
          <div className="text-xs text-gold-700 font-bold uppercase tracking-wider">Winner</div>
          <div className="font-display text-3xl font-bold text-ink-900 mt-1">{winner.name}</div>
          <div className="text-sm text-ink-600 mt-1">{winner.email} · ZIP {winner.zip}</div>
          <div className="flex gap-2 justify-center mt-5">
            <button className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600">
              Notify winner
            </button>
            <button onClick={() => setWinner(null)} className="px-4 py-2 bg-ink-100 hover:bg-ink-200 text-sm font-semibold rounded-lg">
              Re-draw
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function SubmissionsTab({ contest, photoSubs }) {
  return (
    <Panel title={`${photoSubs.length} Photo Submissions`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photoSubs.map(p => (
          <div key={p.id} className="border border-ink-200 rounded-lg overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-4xl opacity-50">📷</div>
            <div className="p-3">
              <div className="text-[10px] text-emerald-700 font-semibold uppercase">{p.category}</div>
              <div className="font-semibold text-sm text-ink-900 truncate">{p.title}</div>
              <div className="text-xs text-ink-500">{p.photographer}</div>
              <div className="flex gap-1 mt-2">
                <button className="flex-1 px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded font-semibold">Approve</button>
                <button className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded font-semibold">Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function VotingTab({ contest, photoSubs }) {
  const sorted = [...photoSubs].sort((a, b) => b.votes - a.votes);
  return (
    <Panel title="Live Voting Leaderboard">
      <div className="space-y-2">
        {sorted.map((p, i) => (
          <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-ink-50">
            <div className={`w-8 text-center font-bold ${i < 3 ? 'text-gold-600' : 'text-ink-400'}`}>{i + 1}</div>
            <div className="w-16 aspect-square bg-gradient-to-br from-emerald-100 to-emerald-200 rounded flex items-center justify-center text-xl opacity-50">📷</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-ink-900 truncate">{p.title}</div>
              <div className="text-xs text-ink-500">{p.photographer} · {p.category}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-ink-900">{p.votes.toLocaleString()}</div>
              <div className="text-xs text-ink-500">votes</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function WinnersTab({ contest, photoSubs }) {
  const winners = [...photoSubs].sort((a, b) => b.votes - a.votes).slice(0, 5);
  return (
    <Panel title="Winners" action={<button className="px-3 py-1.5 bg-brand-700 text-white text-xs font-semibold rounded">Publish winners</button>}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {winners.slice(0, 3).map((p, i) => (
          <div key={p.id} className="border-2 border-gold-300 bg-gold-50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">{['🥇', '🥈', '🥉'][i]}</div>
            <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-emerald-200 rounded flex items-center justify-center text-5xl opacity-50 mb-3">📷</div>
            <div className="font-display font-bold text-ink-900">{p.title}</div>
            <div className="text-xs text-ink-600">{p.photographer}</div>
            <div className="text-sm font-semibold text-gold-900 mt-1">{p.votes.toLocaleString()} votes</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SponsorsTab({ contest, categories }) {
  const sponsored = categories.filter(c => c.sponsor);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Panel title="Presenting Sponsor" action={<button className="px-3 py-1.5 text-xs bg-brand-700 text-white rounded font-semibold">Edit</button>}>
        {contest.presentingSponsor ? (
          <div>
            <div className="w-20 h-20 bg-ink-100 rounded mb-3 flex items-center justify-center text-ink-400">Logo</div>
            <div className="font-display text-xl font-bold text-ink-900">{contest.presentingSponsor.name}</div>
            <div className="text-xs text-ink-500 mt-1">URL: {contest.presentingSponsor.url}</div>
            <div className="mt-3 pt-3 border-t border-ink-100 text-sm">
              <div className="flex justify-between"><span className="text-ink-600">Tier</span><span className="font-semibold">Presenting</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Contract value</span><span className="font-semibold">$15,000</span></div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-500">No presenting sponsor configured.</p>
        )}
      </Panel>

      <Panel title={`Category Sponsors (${sponsored.length})`} action={<button className="px-3 py-1.5 text-xs bg-brand-700 text-white rounded font-semibold">+ Add</button>}>
        {sponsored.length === 0 ? (
          <p className="text-sm text-ink-500">No category sponsors yet.</p>
        ) : (
          <div className="space-y-2">
            {sponsored.map(cat => (
              <div key={cat.id} className="flex items-center justify-between py-2 border-b border-ink-100 last:border-0">
                <div>
                  <div className="text-sm font-semibold text-ink-900">{cat.sponsor}</div>
                  <div className="text-xs text-ink-500">sponsors {cat.name}</div>
                </div>
                <div className="text-sm font-semibold text-emerald-700">$2,500</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function RulesTab({ contest }) {
  return (
    <Panel title="Official Rules" action={<button className="px-3 py-1.5 text-xs bg-brand-700 text-white rounded font-semibold">Save</button>}>
      <textarea
        rows={20}
        defaultValue={`OFFICIAL RULES — ${contest.title}\n\n1. ELIGIBILITY\nOpen to legal residents of the United States, 18 years of age or older. Void where prohibited.\n\n2. HOW TO ENTER / VOTE\nNo purchase necessary. See contest page for entry / voting instructions.\n\n3. PRIZES\n${contest.prize || 'See contest page for prize details.'}\n\n4. WINNER SELECTION\n${contest.type === 'sweepstakes' ? 'Winner will be selected by random drawing.' : 'Winners determined by verified reader votes.'}\n\n5. SPONSOR\nWV News Group, 324 Hewes Ave, Clarksburg, WV 26301\n\n(Edit this template with your legal team before publishing.)`}
        className="w-full text-sm font-mono p-4 border border-ink-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
      />
    </Panel>
  );
}

function SettingsTab({ contest }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Panel title="Basic Settings">
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-ink-700">Title</span>
            <input defaultValue={contest.title} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-700">Slug</span>
            <input defaultValue={contest.slug} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm font-mono" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-700">Phase (override)</span>
            <select defaultValue={contest.phase} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm bg-white">
              {(contest.type === 'bestof' ? ['nomination', 'voting', 'winners', 'closed'] :
                contest.type === 'sweepstakes' ? ['entry', 'drawing', 'winners', 'closed'] :
                ['submission', 'voting', 'winners', 'closed']).map(p => (
                <option key={p} value={p} className="capitalize">{p}</option>
              ))}
            </select>
          </label>
        </div>
      </Panel>

      <Panel title="Voting / Entry Rules">
        <div className="space-y-3 text-sm">
          {contest.votingRules && (
            <>
              <div className="flex justify-between"><span className="text-ink-600">Auth required</span><span className="font-semibold capitalize">{contest.votingRules.authRequired}</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Vote frequency</span><span className="font-semibold capitalize">{contest.votingRules.frequency}</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Votes per category</span><span className="font-semibold">{contest.votingRules.perCategoryLimit}</span></div>
            </>
          )}
          {contest.entryLimit !== undefined && (
            <div className="flex justify-between"><span className="text-ink-600">Entries per person</span><span className="font-semibold">{contest.entryLimit}</span></div>
          )}
          {contest.maxSubmissionsPerUser && (
            <div className="flex justify-between"><span className="text-ink-600">Submissions per user</span><span className="font-semibold">{contest.maxSubmissionsPerUser}</span></div>
          )}
          {contest.votingMode && (
            <div className="flex justify-between"><span className="text-ink-600">Voting mode</span><span className="font-semibold capitalize">{contest.votingMode}</span></div>
          )}
          {contest.topN && (
            <div className="flex justify-between"><span className="text-ink-600">Nominees advancing</span><span className="font-semibold">Top {contest.topN}</span></div>
          )}
        </div>
      </Panel>

      <Panel title="Danger Zone">
        <div className="space-y-2">
          <button className="w-full px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded font-semibold border border-red-200">
            Archive contest
          </button>
          <button className="w-full px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded font-semibold border border-red-200">
            Delete contest and all data
          </button>
        </div>
      </Panel>
    </div>
  );
}
