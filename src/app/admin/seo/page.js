'use client';
import { stories } from '@/data/mock';

export default function SeoPage() {
  return (
    <div className="space-y-6">
      {/* SEO Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall SEO Score', value: '84/100', color: 'text-green-600' },
          { label: 'Stories Missing Meta', value: '12', color: 'text-red-500' },
          { label: 'Broken Links', value: '3', color: 'text-yellow-600' },
          { label: 'Indexed Pages', value: '98.2%', color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="stat-card bg-white rounded-lg p-4 shadow-sm border border-ink-100">
            <div className="text-xs text-ink-500">{s.label}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* AI SEO Tools */}
      <div className="bg-gradient-to-r from-brand-950 to-brand-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🤖</span>
          <h3 className="text-lg font-display font-bold">AI SEO Engine</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-sm font-bold mb-2">Headline Optimizer</h4>
            <p className="text-xs text-white/70 mb-3">AI generates 3-5 SEO-optimized headlines for every story based on content and target keywords.</p>
            <button className="px-3 py-1.5 text-xs bg-white text-brand-950 rounded-lg font-medium hover:bg-white/90">Run on All Drafts</button>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-sm font-bold mb-2">Auto Meta Descriptions</h4>
            <p className="text-xs text-white/70 mb-3">AI writes compelling meta descriptions for stories missing them. One click to generate and apply.</p>
            <button className="px-3 py-1.5 text-xs bg-white text-brand-950 rounded-lg font-medium hover:bg-white/90">Generate 12 Missing</button>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-sm font-bold mb-2">Trend Matcher</h4>
            <p className="text-xs text-white/70 mb-3">AI compares your stories against Google Trends to flag rising search opportunities.</p>
            <button className="px-3 py-1.5 text-xs bg-white text-brand-950 rounded-lg font-medium hover:bg-white/90">Check Trends Now</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-sm font-bold mb-2">Auto-Tagging</h4>
            <p className="text-xs text-white/70 mb-3">AI reads articles and suggests relevant tags, topics, and people mentioned.</p>
            <button className="px-3 py-1.5 text-xs bg-white text-brand-950 rounded-lg font-medium hover:bg-white/90">Bulk Auto-Tag</button>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-sm font-bold mb-2">Internal Link Builder</h4>
            <p className="text-xs text-white/70 mb-3">AI scans articles and suggests existing stories to link to, improving site-wide link equity.</p>
            <button className="px-3 py-1.5 text-xs bg-white text-brand-950 rounded-lg font-medium hover:bg-white/90">Suggest Links</button>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-sm font-bold mb-2">Content Summaries</h4>
            <p className="text-xs text-white/70 mb-3">AI generates 2-3 sentence summaries for newsletters, social posts, and structured data.</p>
            <button className="px-3 py-1.5 text-xs bg-white text-brand-950 rounded-lg font-medium hover:bg-white/90">Generate Summaries</button>
          </div>
        </div>
      </div>

      {/* Story SEO audit */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
        <h3 className="text-sm font-bold text-ink-800 mb-4">Story SEO Audit</h3>
        <div className="space-y-3">
          {stories.map(story => (
            <div key={story.id} className="flex items-center gap-4 py-2 border-b border-ink-50 last:border-0">
              <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                story.seo.score >= 90 ? 'bg-green-100 text-green-700' :
                story.seo.score >= 75 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>{story.seo.score}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink-800 truncate">{story.headline}</div>
                <div className="text-xs text-ink-500">Keyword: &quot;{story.seo.keyword}&quot;</div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 text-xs text-brand-700 bg-brand-50 rounded hover:bg-brand-100">🤖 Optimize</button>
                <button className="px-2 py-1 text-xs text-ink-500 hover:bg-ink-50 rounded">View</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical SEO */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
        <h3 className="text-sm font-bold text-ink-800 mb-3">Technical SEO Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Server-Side Rendering', status: '✅ Active', desc: 'All pages SSR via Next.js' },
            { label: 'Structured Data', status: '✅ Active', desc: 'NewsArticle + BreadcrumbList' },
            { label: 'XML Sitemaps', status: '✅ Auto-generated', desc: 'Updated within 5 min of publish' },
            { label: 'Core Web Vitals', status: '✅ Passing', desc: 'LCP: 1.8s, FID: 45ms, CLS: 0.05' },
            { label: 'Canonical URLs', status: '✅ Active', desc: 'Auto-managed for cross-posts' },
            { label: 'Open Graph Tags', status: '✅ Active', desc: 'Auto-populated from metadata' },
            { label: '301 Redirects', status: '⚠️ 8 pending', desc: 'BLOX migration redirects' },
            { label: 'AMP Support', status: '☐ Optional', desc: 'Available per-site toggle' },
          ].map(item => (
            <div key={item.label} className="p-3 bg-ink-50 rounded-lg">
              <div className="text-xs font-medium text-ink-700">{item.label}</div>
              <div className="text-sm font-bold text-ink-900">{item.status}</div>
              <div className="text-[10px] text-ink-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
