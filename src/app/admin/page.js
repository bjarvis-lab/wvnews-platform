'use client';
import { analyticsData, stories, budgetItems, subscribers } from '@/data/mock';
import Link from 'next/link';

function StatCard({ label, value, change, changePositive }) {
  return (
    <div className="stat-card bg-white rounded-xl p-5 shadow-sm border border-ink-100">
      <div className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-ink-900">{value}</div>
      {change && (
        <div className={`text-xs mt-1 font-medium ${changePositive ? 'text-green-600' : 'text-red-500'}`}>
          {changePositive ? '↑' : '↓'} {change} vs last week
        </div>
      )}
    </div>
  );
}

function MiniChart({ data }) {
  const max = Math.max(...data.map(d => d.views));
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-brand-500 rounded-t"
            style={{ height: `${(d.views / max) * 100}%`, minHeight: '4px' }}
          />
          <span className="text-[9px] text-ink-400">{d.date.split(' ')[1]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { overview, trafficSources, dailyViews, paywallFunnel } = analyticsData;
  const activeStories = budgetItems.filter(b => b.status !== 'Published');
  const recentPublished = stories.filter(s => s.status === 'published').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome + quick actions */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900">Good morning, Sarah</h2>
          <p className="text-sm text-ink-500 mt-0.5">Here&apos;s what&apos;s happening across your sites today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/stories" className="px-3 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-600">
            + New Story
          </Link>
          <Link href="/admin/budget" className="px-3 py-2 bg-white text-ink-700 text-sm font-medium rounded-lg border border-ink-200 hover:bg-ink-50">
            Today&apos;s Budget
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Pageviews" value={overview.totalPageviews.toLocaleString()} change="12%" changePositive={true} />
        <StatCard label="Unique Visitors" value={overview.uniqueVisitors.toLocaleString()} change="8%" changePositive={true} />
        <StatCard label="New Subscribers" value={overview.newSubscribers} change="23%" changePositive={true} />
        <StatCard label="Revenue (MTD)" value={overview.revenue} change="5%" changePositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink-800">Pageviews — Last 7 Days</h3>
            <div className="flex gap-2">
              <button className="px-2 py-1 text-xs bg-brand-50 text-brand-700 rounded font-medium">7D</button>
              <button className="px-2 py-1 text-xs text-ink-500 hover:bg-ink-50 rounded">30D</button>
              <button className="px-2 py-1 text-xs text-ink-500 hover:bg-ink-50 rounded">90D</button>
            </div>
          </div>
          <MiniChart data={dailyViews} />
          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-ink-100">
            <div>
              <div className="text-xs text-ink-500">Avg. Session</div>
              <div className="text-lg font-bold text-ink-900">{overview.avgSessionDuration}</div>
            </div>
            <div>
              <div className="text-xs text-ink-500">Bounce Rate</div>
              <div className="text-lg font-bold text-ink-900">{overview.bounceRate}</div>
            </div>
            <div>
              <div className="text-xs text-ink-500">Registrations</div>
              <div className="text-lg font-bold text-ink-900">{overview.registrations}</div>
            </div>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
          <h3 className="text-sm font-bold text-ink-800 mb-4">Traffic Sources</h3>
          <div className="space-y-3">
            {trafficSources.map(source => (
              <div key={source.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink-700">{source.name}</span>
                  <span className="font-medium text-ink-900">{source.value}%</span>
                </div>
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${source.value}%`, background: source.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active stories / budget */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink-800">Today&apos;s Editorial Budget</h3>
            <Link href="/admin/budget" className="text-xs text-brand-700 font-medium hover:underline">View Full Budget →</Link>
          </div>
          <div className="space-y-2">
            {activeStories.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                  item.status === 'Assigned' ? 'badge-draft' :
                  item.status === 'In Progress' ? 'badge-review' :
                  item.status === 'Filed' ? 'badge-scheduled' :
                  'bg-ink-100 text-ink-600'
                }`}>
                  {item.status}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-800 truncate">{item.slug}</div>
                  <div className="text-xs text-ink-500">{item.reporter} · {item.section}</div>
                </div>
                <div className="flex gap-1">
                  {item.printFlag && <span className="text-[10px] px-1.5 py-0.5 bg-ink-100 rounded text-ink-600">Print</span>}
                  {item.digitalFlag && <span className="text-[10px] px-1.5 py-0.5 bg-brand-50 rounded text-brand-700">Web</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paywall funnel */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
          <h3 className="text-sm font-bold text-ink-800 mb-4">Paywall Conversion Funnel</h3>
          <div className="space-y-3">
            {paywallFunnel.map((step, i) => {
              const prevCount = i > 0 ? paywallFunnel[i-1].count : step.count;
              const convRate = i > 0 ? ((step.count / prevCount) * 100).toFixed(1) : '100';
              return (
                <div key={step.stage}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-ink-700">{step.stage}</span>
                    <span className="font-medium text-ink-900">{step.count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-ink-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-500"
                        style={{ width: `${(step.count / paywallFunnel[0].count) * 100}%` }}
                      />
                    </div>
                    {i > 0 && <span className="text-[10px] text-ink-500 w-12 text-right">{convRate}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top performing stories */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-ink-800">Top Performing Stories Today</h3>
          <Link href="/admin/analytics" className="text-xs text-brand-700 font-medium hover:underline">Full Analytics →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-ink-500 uppercase tracking-wider border-b border-ink-100">
                <th className="pb-2 font-medium">Story</th>
                <th className="pb-2 font-medium text-right">Views</th>
                <th className="pb-2 font-medium text-right">Uniques</th>
                <th className="pb-2 font-medium text-right">Avg. Time</th>
                <th className="pb-2 font-medium text-right">Social</th>
                <th className="pb-2 font-medium text-right">SEO Score</th>
              </tr>
            </thead>
            <tbody>
              {recentPublished.sort((a,b) => b.stats.views - a.stats.views).map(story => (
                <tr key={story.id} className="border-b border-ink-50 last:border-0">
                  <td className="py-3">
                    <div className="text-sm font-medium text-ink-800 max-w-md truncate">{story.headline}</div>
                    <div className="text-xs text-ink-500">{story.author.name}</div>
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-ink-900">{story.stats.views.toLocaleString()}</td>
                  <td className="py-3 text-right text-sm text-ink-600">{story.stats.uniqueReaders.toLocaleString()}</td>
                  <td className="py-3 text-right text-sm text-ink-600">{story.stats.avgTimeOnPage}</td>
                  <td className="py-3 text-right text-sm text-ink-600">{story.stats.socialShares}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      story.seo.score >= 90 ? 'bg-green-100 text-green-700' :
                      story.seo.score >= 75 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {story.seo.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-brand-950 to-brand-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-bold">AI Insights & Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-white/60 mb-1">Trending Topic</div>
            <div className="text-sm font-medium">&quot;West Virginia infrastructure&quot; is trending on Google — 3 of your stories match. Consider a landing page.</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-white/60 mb-1">SEO Opportunity</div>
            <div className="text-sm font-medium">4 stories published today are missing meta descriptions. AI can generate them in one click.</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-white/60 mb-1">Engagement Alert</div>
            <div className="text-sm font-medium">The WVU basketball story has 2× average social engagement. Boost it on Facebook and Instagram.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
