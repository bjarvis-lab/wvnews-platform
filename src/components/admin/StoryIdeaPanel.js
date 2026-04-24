'use client';
// Story-idea widget — shown at the top of the story editor modal when
// creating a new story. Two modes:
//
//  (1) "Suggest topics" — scans recent coverage, proposes 8 local angles
//      Claude has determined aren't yet covered. Click one to prefill the
//      brief textarea.
//
//  (2) "Describe your story" — reporter types a brief (notes, bullet points,
//      a sentence) and hits Generate. We call /api/ai generateFullStory and
//      the parent's onGenerated() callback populates headline/deck/body/tags.
//
// Collapsible so it doesn't crowd the editor once the reporter starts
// writing. Disclaimer under the generate button reminds them to verify
// before publishing.

import { useState, useEffect, useRef } from 'react';

export default function StoryIdeaPanel({
  section,
  onGenerated,
  onDismiss,
  seedBrief = '',
  seedTone = 'hard news',
  seedBadge = null,
  autoGenerate = false,  // fire generate() once on mount if a seed is present
}) {
  const [brief, setBrief] = useState(seedBrief);
  const [loading, setLoading] = useState(null); // 'generate' | 'suggest' | null
  const [ideas, setIdeas] = useState(null);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  // Advanced inputs — collapsed by default. A thin brief + a few structured
  // facts produces much better output than a thin brief alone.
  const [advOpen, setAdvOpen] = useState(false);
  const [wordLimit, setWordLimit] = useState(600);
  const [tone, setTone] = useState(seedTone);
  const [quotesText, setQuotesText] = useState('');
  const [sourcesText, setSourcesText] = useState('');
  const [mustIncludeText, setMustIncludeText] = useState('');

  async function suggest() {
    setError(null); setLoading('suggest');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggestTopics' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch ideas');
      setIdeas(data.ideas || []);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(null); }
  }

  // Each textarea is parsed as a newline-separated list of items.
  function parseList(text) {
    return text.split('\n').map(s => s.trim()).filter(Boolean);
  }

  async function generate(overrideBrief) {
    // Allow an override so auto-generate can fire with the freshly-seeded
    // brief before React re-runs the effect.
    const effectiveBrief = (overrideBrief ?? brief).trim();
    if (effectiveBrief.length < 10) {
      setError('Describe your story in at least a sentence before generating.');
      return;
    }
    setError(null); setLoading('generate');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateFullStory',
          brief: effectiveBrief,
          section,
          wordLimit: Number(wordLimit) || undefined,
          tone,
          quotes: parseList(quotesText),
          sources: parseList(sourcesText),
          mustInclude: parseList(mustIncludeText),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      onGenerated(data);
      setCollapsed(true); // collapse so the editor is unobstructed after
    } catch (e) {
      setError(e.message);
    } finally { setLoading(null); }
  }

  // Auto-generate once on mount when we were opened from a Media Desk
  // cluster (autoGenerate=true + a non-trivial seed brief). The ref guard
  // prevents double-firing in React StrictMode dev.
  const autoFiredRef = useRef(false);
  useEffect(() => {
    if (autoGenerate && !autoFiredRef.current && seedBrief && seedBrief.trim().length >= 10) {
      autoFiredRef.current = true;
      generate(seedBrief);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (collapsed) {
    return (
      <div className="border border-ink-200 bg-ink-50 rounded-lg px-4 py-2 flex items-center justify-between text-xs">
        <span className="text-ink-600">✓ Draft generated · edit below, then verify and publish.</span>
        <button onClick={() => setCollapsed(false)} className="text-brand-700 font-semibold hover:underline">
          Regenerate
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-brand-50 via-gold-50 to-white border border-brand-200 rounded-xl p-5">
      {seedBadge && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-brand-700 text-white text-xs font-semibold flex items-center gap-2">
          <span>{seedBadge}</span>
          <span className="ml-auto text-white/70 font-normal">Brief pre-filled below — edit, then Generate.</span>
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className="font-display text-lg font-bold text-ink-900">Story Ideas & AI Draft</h3>
            <span className="text-[10px] text-brand-600 font-semibold uppercase tracking-wider">powered by Claude</span>
          </div>
          <p className="text-xs text-ink-600 mt-1">
            Suggest fresh local angles from recent coverage, or give Claude a brief and get a full article draft.
          </p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-ink-400 hover:text-ink-700 text-xl leading-none" title="Close idea panel">✕</button>
        )}
      </div>

      {/* Brief + generate */}
      <div>
        <label className="block">
          <span className="text-xs font-semibold text-ink-700">Describe your story</span>
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            rows={4}
            placeholder="e.g. Harrison County Commission voted 3-2 Tuesday to approve a $1.2M water line replacement in Shinnston. Project covers 3,400 homes. Source: commissioner John Smith said …"
            className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="text-[11px] text-ink-500 mt-1 block">
            The more specific your notes (names, numbers, quotes), the better the draft. Claude won&apos;t invent sources.
          </span>
        </label>

        {/* Advanced options — quick-access fields that materially improve the draft */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setAdvOpen(!advOpen)}
            className="text-xs font-semibold text-brand-700 hover:underline"
          >
            {advOpen ? '▾' : '▸'} Advanced options (length, quotes, sources, tone)
          </button>
          {advOpen && (
            <div className="mt-2 p-3 bg-white border border-brand-100 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-semibold text-ink-700 uppercase tracking-wider">Target word count</span>
                <input
                  type="number"
                  min="200"
                  max="1500"
                  step="50"
                  value={wordLimit}
                  onChange={e => setWordLimit(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm"
                />
                <span className="text-[10px] text-ink-500">Range 200–1500. Default 600 (standard news story).</span>
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-ink-700 uppercase tracking-wider">Tone</span>
                <select value={tone} onChange={e => setTone(e.target.value)} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm bg-white">
                  <option>hard news</option>
                  <option>breaking</option>
                  <option>feature</option>
                  <option>analysis</option>
                  <option>obituary-style</option>
                  <option>sports game story</option>
                  <option>business</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-[11px] font-semibold text-ink-700 uppercase tracking-wider">Direct quotes to include (one per line)</span>
                <textarea
                  rows={3}
                  value={quotesText}
                  onChange={e => setQuotesText(e.target.value)}
                  placeholder='"This is the biggest investment in our county in 20 years." — Commissioner John Smith'
                  className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm font-mono"
                />
                <span className="text-[10px] text-ink-500">Each quote will appear verbatim with the speaker you list.</span>
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-ink-700 uppercase tracking-wider">Named sources (one per line)</span>
                <textarea
                  rows={3}
                  value={sourcesText}
                  onChange={e => setSourcesText(e.target.value)}
                  placeholder={'John Smith, Harrison County Commissioner\nWV Dept. of Transportation\nShinnston Public Works'}
                  className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-ink-700 uppercase tracking-wider">Facts that must appear (one per line)</span>
                <textarea
                  rows={3}
                  value={mustIncludeText}
                  onChange={e => setMustIncludeText(e.target.value)}
                  placeholder={'3,400 homes affected\nProject starts June 1\n$1.2M budget'}
                  className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm"
                />
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={generate}
            disabled={loading !== null || brief.trim().length < 10}
            className="px-4 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50"
          >
            {loading === 'generate' ? '⏳ Writing draft (15–40s)…' : `✨ Generate ~${wordLimit}-word Draft`}
          </button>
          <button
            onClick={suggest}
            disabled={loading !== null}
            className="px-4 py-2 bg-white text-brand-700 text-sm font-semibold rounded-lg border border-brand-200 hover:bg-brand-50 disabled:opacity-50"
          >
            {loading === 'suggest' ? '⏳ Thinking…' : '💡 Suggest Topics from Recent Coverage'}
          </button>
        </div>
      </div>

      {/* Ideas list */}
      {ideas && (
        <div className="mt-4 pt-4 border-t border-brand-200">
          <div className="text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">
            {ideas.length} suggested angles
          </div>
          {ideas.length === 0 ? (
            <p className="text-sm text-ink-500">No suggestions returned. Try again in a moment.</p>
          ) : (
            <ul className="space-y-2">
              {ideas.map((idea, i) => (
                <li key={i}>
                  <button
                    onClick={() => { setBrief(`${idea.angle}\n\n(rationale: ${idea.why})`); setIdeas(null); }}
                    className="w-full text-left p-3 bg-white rounded-lg border border-ink-200 hover:border-brand-400 hover:bg-brand-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-ink-900 text-sm">{idea.angle}</span>
                      {idea.beat && (
                        <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                          {idea.beat}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-600 mt-1">{idea.why}</div>
                    <div className="text-[11px] text-brand-700 mt-1">Click to load as brief →</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 text-red-800 text-xs rounded">
          {error} <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      <div className="mt-3 text-[11px] text-ink-500 border-t border-brand-100 pt-3">
        🛑 <strong>Verify before publishing.</strong> AI drafts are starting points — check every fact, name, number, and quote. Never publish unedited.
      </div>
    </div>
  );
}
