'use client';
import { useState } from 'react';
import { stories } from '@/data/mock';

const REWRITE_MODES = [
  { id: 'rewrite', label: 'Full Rewrite', desc: 'Completely rewrite in a fresh voice while preserving all facts', icon: '✍️' },
  { id: 'simplify', label: 'Simplify', desc: 'Make it easier to read — lower grade level, shorter sentences', icon: '📖' },
  { id: 'expand', label: 'Expand & Deepen', desc: 'Add context, background, and richer detail', icon: '📐' },
  { id: 'localize', label: 'Localize for WV', desc: 'Add West Virginia context and local impact framing', icon: '🏔️' },
  { id: 'headline', label: 'Headline Variants', desc: 'Generate 5+ headline options optimized for SEO and clicks', icon: '📰' },
  { id: 'social', label: 'Social Posts', desc: 'Create platform-specific posts for FB, X, Instagram, TikTok', icon: '📱' },
  { id: 'newsletter', label: 'Newsletter Summary', desc: 'Write a 2-3 sentence digest version for email', icon: '✉️' },
  { id: 'seo', label: 'SEO Optimize', desc: 'Weave in target keywords naturally without stuffing', icon: '🔍' },
];

// Simulated AI responses (in production these come from OpenAI/Anthropic API)
const SIMULATED_OUTPUTS = {
  rewrite: `West Virginia is set to embark on its largest-ever infrastructure overhaul after the governor signed a sweeping $2.3 billion package into law Thursday at the Culture Center in Charleston.

The five-year spending plan directs $1.4 billion toward resurfacing and rebuilding state highways — targeting roughly 1,200 miles rated in poor or failing condition by transportation officials. Another $620 million is earmarked for replacing or rehabilitating 340 structurally deficient bridges across the state.

The legislation also sets aside $180 million for broadband buildout along highway corridors and $100 million in county road assistance grants, addressing long-standing complaints from rural communities about neglected local roads.

Bipartisan support carried the bill through both legislative chambers, though not without skepticism. Senate Minority Leader Mike Woelfel acknowledged voting in favor but warned that the state Division of Highways faces significant capacity questions in managing projects at this scale simultaneously.`,

  headline: `1. West Virginia Commits $2.3 Billion to Fix Crumbling Roads and Bridges
2. Governor Signs Largest Infrastructure Bill in WV History — Here's What It Funds
3. 1,200 Miles of Highway Repairs: Inside WV's $2.3B Infrastructure Plan
4. Bipartisan $2.3B Deal Targets 340 Deficient Bridges Across West Virginia
5. 'Generational Investment': WV Governor Signs Historic Roads and Bridges Package
6. $2.3 Billion for WV Infrastructure: What It Means for Your County
7. West Virginia Roads Bill: $1.4B for Highways, $620M for Bridges Over 5 Years`,

  social: `📘 FACEBOOK:
West Virginia just made its biggest-ever bet on infrastructure. Governor Justice signed a $2.3 billion package into law that will repair 1,200 miles of highways and replace 340 bridges over 5 years. The plan also includes $180M for broadband expansion. Here's what it means for your county ⬇️

🐦 X/TWITTER:
BREAKING: Governor signs $2.3B infrastructure bill — the largest in WV history.

→ 1,200 miles of highway repairs
→ 340 bridge replacements
→ $180M for broadband
→ $100M for county roads

Bipartisan support. 5-year timeline. Full story:

📸 INSTAGRAM:
🏗️ $2.3 BILLION for West Virginia roads and bridges.

Governor Justice just signed the biggest infrastructure bill in state history. That's 1,200 miles of highway repairs, 340 bridges fixed, and broadband expansion across all 55 counties.

What road in your area needs the most help? Drop it in the comments 👇

🎵 TIKTOK:
West Virginia just allocated $2.3 BILLION to fix roads and bridges. 1,200 miles of highways. 340 bridges. The biggest infrastructure deal in state history. Your pothole's days are numbered. #WestVirginia #Infrastructure #WVRoads #LocalNews`,

  newsletter: `West Virginia's governor signed the state's largest-ever infrastructure package Thursday — a $2.3 billion plan targeting 1,200 miles of deteriorating highways and 340 structurally deficient bridges over five years. The bipartisan bill also directs $180 million toward broadband expansion along highway corridors.`,

  simplify: `The governor signed a big spending bill Thursday to fix West Virginia's roads and bridges.

The plan costs $2.3 billion over five years. Most of the money — $1.4 billion — goes toward repaving and rebuilding highways. The state says about 1,200 miles of road are in bad shape.

Another $620 million will go to fixing or replacing 340 bridges that inspectors have flagged as deficient.

The bill also includes $180 million for expanding internet access and $100 million to help counties fix their own roads.

Both parties in the Legislature voted for it, but some lawmakers worry the state highway department might struggle to handle this many projects at once.`,
};

export default function AIRewriterPage() {
  const [sourceText, setSourceText] = useState('');
  const [selectedStory, setSelectedStory] = useState('');
  const [mode, setMode] = useState('rewrite');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetKeyword, setTargetKeyword] = useState('');
  const [plagiarismScore, setPlagiarismScore] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tone, setTone] = useState('neutral');
  const [readingLevel, setReadingLevel] = useState('general');

  const loadStory = (id) => {
    const story = stories.find(s => s.id === id);
    if (story) {
      setSelectedStory(id);
      // Strip HTML tags for display
      setSourceText(story.body.replace(/<[^>]*>/g, '').trim());
    }
  };

  const runRewrite = async () => {
    setIsProcessing(true);
    setOutput('');
    setPlagiarismScore(null);

    // Simulate AI processing with streaming effect
    const result = SIMULATED_OUTPUTS[mode] || SIMULATED_OUTPUTS.rewrite;
    let displayed = '';

    for (let i = 0; i < result.length; i += 3) {
      await new Promise(r => setTimeout(r, 8));
      displayed = result.substring(0, i + 3);
      setOutput(displayed);
    }
    setOutput(result);

    // Simulate plagiarism check
    await new Promise(r => setTimeout(r, 500));
    setPlagiarismScore({
      score: Math.floor(Math.random() * 5 + 1), // 1-5% match (very low)
      status: 'pass',
      details: 'AI-rewritten content has been checked against web sources. No significant matches found. Safe to publish.'
    });

    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-950 to-brand-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🤖</span>
          <div>
            <h2 className="text-lg font-display font-bold">AI Content Rewriter</h2>
            <p className="text-sm text-white/70">Rewrite, optimize, and repurpose content — with built-in plagiarism protection</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <div className="px-3 py-1 bg-white/10 rounded-lg text-xs">✅ Original voice generation</div>
          <div className="px-3 py-1 bg-white/10 rounded-lg text-xs">✅ Plagiarism check on every output</div>
          <div className="px-3 py-1 bg-white/10 rounded-lg text-xs">✅ Facts preserved, words changed</div>
          <div className="px-3 py-1 bg-white/10 rounded-lg text-xs">✅ SEO keyword weaving</div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {REWRITE_MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`p-2 rounded-lg border text-center transition-all ${
              mode === m.id
                ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                : 'border-ink-200 bg-white hover:border-ink-300'
            }`}>
            <div className="text-lg">{m.icon}</div>
            <div className="text-[10px] font-bold text-ink-800 mt-0.5">{m.label}</div>
          </button>
        ))}
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-800">Source Content</h3>
            <select value={selectedStory} onChange={e => loadStory(e.target.value)}
              className="px-2 py-1 text-xs bg-white border border-ink-200 rounded">
              <option value="">Load from CMS...</option>
              {stories.map(s => <option key={s.id} value={s.id}>{s.headline.substring(0, 50)}...</option>)}
            </select>
          </div>
          <textarea
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            placeholder="Paste or type the content you want to rewrite, or select a story from the CMS above..."
            className="w-full h-72 px-4 py-3 bg-white border border-ink-200 rounded-xl text-sm leading-relaxed resize-none outline-none focus:ring-2 focus:ring-brand-400"
          />
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <span>{sourceText.split(/\s+/).filter(Boolean).length} words</span>
            <span>·</span>
            <span>{sourceText.length} characters</span>
          </div>

          {/* Additional settings */}
          <button onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-brand-700 hover:underline">
            {showSettings ? 'Hide' : 'Show'} advanced settings
          </button>

          {showSettings && (
            <div className="bg-ink-50 rounded-lg p-3 space-y-2">
              {mode === 'seo' && (
                <div>
                  <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Target SEO Keyword</label>
                  <input value={targetKeyword} onChange={e => setTargetKeyword(e.target.value)}
                    placeholder="e.g., west virginia infrastructure bill"
                    className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs" />
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
                  <option value="neutral">Neutral / News</option>
                  <option value="conversational">Conversational</option>
                  <option value="formal">Formal</option>
                  <option value="urgent">Urgent / Breaking</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Reading Level</label>
                <select value={readingLevel} onChange={e => setReadingLevel(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
                  <option value="general">General Audience (8th grade)</option>
                  <option value="advanced">Advanced (college level)</option>
                  <option value="simple">Simple (6th grade)</option>
                </select>
              </div>
            </div>
          )}

          {/* Run button */}
          <button onClick={runRewrite} disabled={!sourceText || isProcessing}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
              sourceText && !isProcessing
                ? 'bg-brand-700 text-white hover:bg-brand-600'
                : 'bg-ink-200 text-ink-500 cursor-not-allowed'
            }`}>
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                AI is writing...
              </span>
            ) : (
              `🤖 ${REWRITE_MODES.find(m => m.id === mode)?.label || 'Rewrite'}`
            )}
          </button>
        </div>

        {/* Output */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-800">AI Output</h3>
            {output && (
              <div className="flex gap-1">
                <button onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-2 py-1 text-xs bg-ink-100 text-ink-600 rounded hover:bg-ink-200">Copy</button>
                <button className="px-2 py-1 text-xs bg-brand-50 text-brand-700 rounded hover:bg-brand-100">Insert into Story</button>
              </div>
            )}
          </div>
          <div className="w-full h-72 px-4 py-3 bg-white border border-ink-200 rounded-xl text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap">
            {output || <span className="text-ink-300">AI output will appear here...</span>}
            {isProcessing && <span className="animate-pulse">▊</span>}
          </div>

          {output && (
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <span>{output.split(/\s+/).filter(Boolean).length} words</span>
              <span>·</span>
              <span>{output.length} characters</span>
            </div>
          )}

          {/* Plagiarism Check */}
          {plagiarismScore && (
            <div className={`rounded-lg p-3 border ${
              plagiarismScore.status === 'pass' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{plagiarismScore.status === 'pass' ? '✅' : '⚠️'}</span>
                <div className="text-sm font-bold text-ink-800">
                  Plagiarism Check: {plagiarismScore.score}% match
                </div>
                <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded ${
                  plagiarismScore.status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {plagiarismScore.status === 'pass' ? 'SAFE TO PUBLISH' : 'REVIEW NEEDED'}
                </span>
              </div>
              <div className="text-xs text-ink-600">{plagiarismScore.details}</div>
            </div>
          )}

          {/* Action buttons */}
          {output && !isProcessing && (
            <div className="flex gap-2">
              <button onClick={runRewrite}
                className="flex-1 py-2 bg-ink-100 text-ink-700 text-xs font-medium rounded-lg hover:bg-ink-200">
                🔄 Regenerate
              </button>
              <button className="flex-1 py-2 bg-brand-700 text-white text-xs font-medium rounded-lg hover:bg-brand-600">
                ✅ Use This Version
              </button>
              <button className="flex-1 py-2 bg-ink-100 text-ink-700 text-xs font-medium rounded-lg hover:bg-ink-200">
                📝 Edit & Refine
              </button>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
        <h3 className="text-sm font-bold text-ink-800 mb-3">How AI Rewriting Works (No Plagiarism)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Extract Facts', desc: 'AI identifies all factual claims, quotes, numbers, names, and dates in the source text.' },
            { step: '2', title: 'Generate New Prose', desc: 'AI writes entirely new sentences and paragraph structures using those facts — never copying phrases.' },
            { step: '3', title: 'Plagiarism Scan', desc: 'Every output is checked against web sources. Matching phrases above 5 words are flagged automatically.' },
            { step: '4', title: 'Human Review', desc: 'Editor reviews the AI output, makes any edits, and approves before it goes into the CMS.' },
          ].map(item => (
            <div key={item.step} className="text-center">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center mx-auto mb-2">{item.step}</div>
              <div className="text-xs font-bold text-ink-800">{item.title}</div>
              <div className="text-[10px] text-ink-500 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
