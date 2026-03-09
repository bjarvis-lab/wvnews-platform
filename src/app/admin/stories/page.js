'use client';
import { useState } from 'react';
import { stories, sections, sites } from '@/data/mock';

export default function StoriesPage() {
  const [view, setView] = useState('list');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  const filtered = stories.filter(s => {
    if (filter === 'published') return s.status === 'published';
    if (filter === 'draft') return s.status === 'draft';
    if (filter === 'subscriber') return s.accessLevel === 'subscriber';
    if (filter === 'free') return s.accessLevel === 'free';
    return true;
  }).filter(s => !search || s.headline.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-ink-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm outline-none"
        >
          <option value="all">All Stories</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="subscriber">Subscriber Only</option>
          <option value="free">Free</option>
        </select>
        <div className="flex bg-white rounded-lg border border-ink-200 overflow-hidden">
          <button onClick={() => setView('list')} className={`px-3 py-2 text-xs font-medium ${view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`}>List</button>
          <button onClick={() => setView('grid')} className={`px-3 py-2 text-xs font-medium ${view === 'grid' ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`}>Grid</button>
        </div>
        <button
          onClick={() => { setSelectedStory(null); setShowEditor(true); }}
          className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-600"
        >
          + New Story
        </button>
        <button className="px-3 py-2 bg-white text-ink-600 text-sm font-medium rounded-lg border border-ink-200 hover:bg-ink-50">
          Import from Google Docs
        </button>
      </div>

      {/* Stories List */}
      <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[11px] text-ink-500 uppercase tracking-wider border-b border-ink-100 bg-ink-50/50">
              <th className="px-4 py-3 font-medium">Story</th>
              <th className="px-4 py-3 font-medium">Section</th>
              <th className="px-4 py-3 font-medium">Sites</th>
              <th className="px-4 py-3 font-medium">Access</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Views</th>
              <th className="px-4 py-3 font-medium text-right">SEO</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(story => (
              <tr key={story.id} className="border-b border-ink-50 hover:bg-ink-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-12 bg-ink-100 rounded flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink-800 truncate max-w-xs">{story.headline}</div>
                      <div className="text-xs text-ink-500">{story.author.name} · {new Date(story.publishedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <span className="text-xs font-medium text-ink-700">{sections.find(s => s.id === story.section)?.name}</span>
                    {story.secondarySections.length > 0 && (
                      <div className="text-[10px] text-ink-400">+{story.secondarySections.length} more</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-1">
                    {story.sites.map(siteId => {
                      const site = sites.find(s => s.id === siteId);
                      return (
                        <div key={siteId} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold" style={{ background: site?.color }}>
                          {site?.logo}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                    story.accessLevel === 'free' ? 'bg-green-100 text-green-700' :
                    story.accessLevel === 'metered' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-brand-100 text-brand-700'
                  }`}>
                    {story.accessLevel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="badge-published px-2 py-0.5 text-[10px] font-bold rounded uppercase">
                    {story.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-ink-700">
                  {story.stats.views.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                    story.seo.score >= 90 ? 'bg-green-100 text-green-700' :
                    story.seo.score >= 75 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {story.seo.score}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedStory(story); setShowEditor(true); }}
                      className="px-2 py-1 text-xs text-brand-700 hover:bg-brand-50 rounded"
                    >
                      Edit
                    </button>
                    <button className="px-2 py-1 text-xs text-ink-500 hover:bg-ink-50 rounded">⋯</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Story Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8">
            {/* Editor Header */}
            <div className="flex items-center justify-between p-4 border-b border-ink-200">
              <h2 className="text-lg font-display font-bold text-ink-900">
                {selectedStory ? 'Edit Story' : 'New Story'}
              </h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-xs bg-ink-100 text-ink-600 rounded-lg hover:bg-ink-200">Save Draft</button>
                <button className="px-3 py-1.5 text-xs bg-brand-700 text-white rounded-lg hover:bg-brand-600">Publish</button>
                <button onClick={() => setShowEditor(false)} className="p-2 text-ink-400 hover:text-ink-600">✕</button>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-ink-100">
              {/* Main Editor */}
              <div className="col-span-2 p-6 space-y-4">
                <input
                  type="text"
                  placeholder="Write your headline..."
                  defaultValue={selectedStory?.headline || ''}
                  className="w-full text-2xl font-display font-bold text-ink-900 outline-none placeholder-ink-300"
                />
                <input
                  type="text"
                  placeholder="Deck / subheadline..."
                  defaultValue={selectedStory?.deck || ''}
                  className="w-full text-base text-ink-600 outline-none placeholder-ink-300"
                />
                {/* Rich text editor placeholder */}
                <div className="min-h-[300px] bg-ink-50 rounded-lg p-4 border border-ink-200">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-ink-200">
                    <button className="px-2 py-1 text-xs font-bold text-ink-600 hover:bg-ink-200 rounded">B</button>
                    <button className="px-2 py-1 text-xs italic text-ink-600 hover:bg-ink-200 rounded">I</button>
                    <button className="px-2 py-1 text-xs text-ink-600 hover:bg-ink-200 rounded">H2</button>
                    <button className="px-2 py-1 text-xs text-ink-600 hover:bg-ink-200 rounded">Link</button>
                    <button className="px-2 py-1 text-xs text-ink-600 hover:bg-ink-200 rounded">📷 Image</button>
                    <button className="px-2 py-1 text-xs text-ink-600 hover:bg-ink-200 rounded">🎥 Video</button>
                    <button className="px-2 py-1 text-xs text-ink-600 hover:bg-ink-200 rounded">Pullquote</button>
                    <div className="flex-1" />
                    <button className="px-2 py-1 text-xs text-brand-700 hover:bg-brand-50 rounded font-medium">
                      🤖 AI Assist
                    </button>
                  </div>
                  <div className="text-sm text-ink-600 leading-relaxed" contentEditable suppressContentEditableWarning>
                    {selectedStory ? (
                      <span dangerouslySetInnerHTML={{ __html: selectedStory.body.replace(/<\/?p>/g, '\n\n') }} />
                    ) : (
                      <span className="text-ink-300">Start writing your story... or paste a Google Docs link to import.</span>
                    )}
                  </div>
                </div>

                {/* AI Tools */}
                <div className="bg-brand-50 rounded-lg p-4 border border-brand-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">🤖</span>
                    <h4 className="text-xs font-bold text-brand-800">AI Writing Assistant</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200 hover:bg-brand-50">Generate Summary</button>
                    <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200 hover:bg-brand-50">Suggest Headlines</button>
                    <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200 hover:bg-brand-50">Write Meta Description</button>
                    <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200 hover:bg-brand-50">Auto-Tag Topics</button>
                    <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200 hover:bg-brand-50">Suggest Internal Links</button>
                    <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200 hover:bg-brand-50">Social Post Copy</button>
                  </div>
                </div>
              </div>

              {/* Settings Sidebar */}
              <div className="p-4 space-y-4 bg-ink-50/50 overflow-y-auto max-h-[80vh]">
                <div>
                  <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">Status</label>
                  <select className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
                    <option>Draft</option>
                    <option>In Review</option>
                    <option>Approved</option>
                    <option>Scheduled</option>
                    <option>Published</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">Content Access</label>
                  <select className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
                    <option>Free</option>
                    <option>Metered (counts toward limit)</option>
                    <option>Subscriber Only</option>
                    <option>Premium</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">Primary Section</label>
                  <select className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
                    {sections.map(s => <option key={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">Additional Sections</label>
                  <div className="space-y-1">
                    {sections.map(s => (
                      <label key={s.id} className="flex items-center gap-2 text-xs text-ink-700">
                        <input type="checkbox" className="rounded" />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">Publish To Sites</label>
                  <div className="space-y-1">
                    {sites.map(s => (
                      <label key={s.id} className="flex items-center gap-2 text-xs text-ink-700">
                        <input type="checkbox" defaultChecked={s.primary} className="rounded" />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">SEO Headline</label>
                  <input type="text" className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm" placeholder="SEO-optimized headline..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">Meta Description</label>
                  <textarea className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm h-20" placeholder="Meta description..." />
                  <button className="mt-1 text-xs text-brand-700 hover:underline">🤖 AI Generate</button>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">Tags</label>
                  <input type="text" className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm" placeholder="Add tags..." />
                  <button className="mt-1 text-xs text-brand-700 hover:underline">🤖 AI Suggest Tags</button>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">Featured Image</label>
                  <div className="w-full h-24 bg-white border-2 border-dashed border-ink-200 rounded-lg flex items-center justify-center text-xs text-ink-400 hover:border-brand-400 cursor-pointer">
                    Drop image or click to browse
                  </div>
                  <button className="mt-1 text-xs text-brand-700 hover:underline">🤖 AI Generate Alt Text</button>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="breaking" className="rounded" />
                  <label htmlFor="breaking" className="text-xs font-medium text-red-600">Mark as Breaking News</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="printBudget" className="rounded" />
                  <label htmlFor="printBudget" className="text-xs font-medium text-ink-700">Include in Print Budget</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
