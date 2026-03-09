'use client';
import { socialAccounts, stories } from '@/data/mock';

export default function SocialPage() {
  return (
    <div className="space-y-6">
      {/* Account overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {socialAccounts.map((acc, i) => (
          <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-ink-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{acc.platform === 'Facebook' ? '📘' : acc.platform === 'Instagram' ? '📸' : acc.platform === 'TikTok' ? '🎵' : '🐦'}</span>
              <div className="text-xs font-medium text-ink-800">{acc.platform}</div>
            </div>
            <div className="text-xs text-ink-500">{acc.handle}</div>
            <div className="text-lg font-bold text-ink-900">{acc.followers}</div>
            <div className="text-[10px] text-ink-400">Engagement: {acc.engagement}</div>
          </div>
        ))}
      </div>

      {/* Compose post */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
        <h3 className="text-sm font-bold text-ink-800 mb-3">Compose Social Post</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <select className="w-full px-3 py-2 bg-ink-50 rounded-lg border border-ink-200 text-sm">
              <option>Select a story to share...</option>
              {stories.map(s => <option key={s.id}>{s.headline}</option>)}
            </select>
            <textarea placeholder="Post text (AI will pre-fill from story)..." className="w-full h-24 px-3 py-2 bg-ink-50 rounded-lg border border-ink-200 text-sm resize-none" />
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs bg-brand-50 text-brand-700 rounded-lg border border-brand-200">🤖 AI Generate Post Copy</button>
              <button className="px-3 py-1.5 text-xs bg-brand-50 text-brand-700 rounded-lg border border-brand-200">🤖 Optimize for Platform</button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-bold text-ink-500 uppercase tracking-wider">Post To:</div>
            {socialAccounts.filter(a => a.site === 'wvnews').map((acc, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" defaultChecked className="rounded" />
                {acc.platform} — {acc.handle}
              </label>
            ))}
            <div className="flex gap-2 pt-2">
              <button className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-600">Post Now</button>
              <button className="px-4 py-2 bg-white text-ink-600 text-sm rounded-lg border border-ink-200 hover:bg-ink-50">Schedule</button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent posts */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
        <h3 className="text-sm font-bold text-ink-800 mb-3">Recent Social Posts</h3>
        <div className="space-y-3">
          {stories.slice(0, 4).map(story => (
            <div key={story.id} className="flex items-center gap-4 py-3 border-b border-ink-50 last:border-0">
              <div className="flex-1">
                <div className="text-sm font-medium text-ink-800">{story.headline}</div>
                <div className="text-xs text-ink-500 mt-0.5">Posted to Facebook, X, Instagram · {new Date(story.publishedAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-ink-900">{story.stats.socialShares}</div>
                <div className="text-[10px] text-ink-500">Total engagements</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
