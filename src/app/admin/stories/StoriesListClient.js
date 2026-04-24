'use client';
// Stories list + inline modal editor. Mirrors the original prototype UX:
//   - rich table (Story | Section | Sites | Access | Status | Views | SEO | Actions)
//   - list/grid view toggle
//   - "+ New Story" pops a modal (not a page navigation)
//   - AI Writing Assistant panel with quick-action buttons
//   - checkbox pickers for secondary sections + publications
// The save/publish buttons invoke Firestore server actions, so everything
// persists to the `stories` collection.

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createStoryAction, updateStoryAction, deleteStoryAction } from './actions';
import StoryEditor from '@/components/admin/StoryEditor';
import StoryIdeaPanel from '@/components/admin/StoryIdeaPanel';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diffH = (Date.now() - d) / (1000 * 60 * 60);
  if (diffH < 1) return 'just now';
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffH < 48) return 'yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function StoriesListClient({ stories, sections, sites }) {
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('all'); // all | breaking | featured
  const [advOpen, setAdvOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setSelectedStory(null);
      setEditorOpen(true);
    }
  }, [searchParams]);

  // Distinct authors for dropdown — sourced from the rows we have
  const authors = Array.from(new Set(stories.map(s => s.author?.name).filter(Boolean))).sort();

  function clearFilters() {
    setSearch(''); setStatusFilter('all'); setAccessFilter('all');
    setSectionFilter('all'); setSiteFilter('all'); setAuthorFilter('all');
    setDateFrom(''); setDateTo(''); setTagFilter(''); setFlagFilter('all');
  }

  const activeFilterCount = [
    statusFilter !== 'all', accessFilter !== 'all', sectionFilter !== 'all',
    siteFilter !== 'all', authorFilter !== 'all', flagFilter !== 'all',
    !!dateFrom, !!dateTo, !!tagFilter, !!search,
  ].filter(Boolean).length;

  const filtered = stories.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (accessFilter !== 'all' && s.accessLevel !== accessFilter) return false;
    if (sectionFilter !== 'all' && s.section !== sectionFilter) return false;
    if (siteFilter !== 'all' && !(s.sites || []).includes(siteFilter)) return false;
    if (authorFilter !== 'all' && s.author?.name !== authorFilter) return false;
    if (flagFilter === 'breaking' && !s.breaking) return false;
    if (flagFilter === 'featured' && !s.featured) return false;
    if (dateFrom) {
      const d = s.publishedAt || s.updatedAt;
      if (!d || new Date(d) < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const d = s.publishedAt || s.updatedAt;
      const endOfDay = new Date(dateTo); endOfDay.setHours(23, 59, 59);
      if (!d || new Date(d) > endOfDay) return false;
    }
    if (tagFilter) {
      const needle = tagFilter.toLowerCase();
      if (!(s.tags || []).some(t => t.toLowerCase().includes(needle))) return false;
    }
    if (search) {
      const needle = search.toLowerCase();
      const haystack = [s.headline, s.deck, s.seoHeadline, (s.tags || []).join(' '), s.author?.name]
        .filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls — primary row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <input
            type="text"
            placeholder="Search headlines, decks, tags, authors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-ink-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => setAdvOpen(v => !v)}
          className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-1 ${
            advOpen || activeFilterCount > 0 ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'
          }`}
        >
          ⚙ Filters
          {activeFilterCount > 0 && <span className="px-1.5 bg-brand-700 text-white text-[10px] rounded-full">{activeFilterCount}</span>}
        </button>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-ink-500 hover:text-ink-900 underline">
            Clear
          </button>
        )}
        <div className="flex bg-white rounded-lg border border-ink-200 overflow-hidden ml-auto">
          <button onClick={() => setView('list')} className={`px-3 py-2 text-xs font-medium ${view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`}>List</button>
          <button onClick={() => setView('grid')} className={`px-3 py-2 text-xs font-medium ${view === 'grid' ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`}>Grid</button>
        </div>
        <button
          onClick={() => { setSelectedStory(null); setEditorOpen(true); }}
          className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-600"
        >
          + New Story
        </button>
        <button className="px-3 py-2 bg-white text-ink-600 text-sm font-medium rounded-lg border border-ink-200 hover:bg-ink-50">
          Import from Google Docs
        </button>
      </div>

      {/* Advanced filter drawer */}
      {advOpen && (
        <div className="bg-white rounded-xl border border-ink-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <FilterField label="Status">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </FilterField>
          <FilterField label="Access">
            <select value={accessFilter} onChange={e => setAccessFilter(e.target.value)} className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="metered">Metered</option>
              <option value="premium">Subscriber Only</option>
            </select>
          </FilterField>
          <FilterField label="Section">
            <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
              <option value="all">All sections</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FilterField>
          <FilterField label="Publication">
            <select value={siteFilter} onChange={e => setSiteFilter(e.target.value)} className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
              <option value="all">All publications</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FilterField>
          <FilterField label="Author">
            <select value={authorFilter} onChange={e => setAuthorFilter(e.target.value)} className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
              <option value="all">All authors</option>
              {authors.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </FilterField>
          <FilterField label="Flags">
            <select value={flagFilter} onChange={e => setFlagFilter(e.target.value)} className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
              <option value="all">Any</option>
              <option value="breaking">● Breaking only</option>
              <option value="featured">★ Featured only</option>
            </select>
          </FilterField>
          <FilterField label="Tag contains">
            <input type="text" value={tagFilter} onChange={e => setTagFilter(e.target.value)} placeholder="e.g. wvu" className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm" />
          </FilterField>
          <FilterField label="Published date range">
            <div className="flex gap-1">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-2 py-2 bg-white rounded border border-ink-200 text-xs" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-2 py-2 bg-white rounded border border-ink-200 text-xs" />
            </div>
          </FilterField>
        </div>
      )}

      {/* Result count */}
      <div className="flex items-center justify-between text-xs text-ink-500 px-1">
        <span>
          Showing <strong className="text-ink-900">{filtered.length}</strong> of {stories.length} stories
          {activeFilterCount > 0 && <span className="ml-2">· {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>}
        </span>
      </div>

      {/* Empty state */}
      {stories.length === 0 ? (
        <div className="bg-white rounded-xl border border-ink-200 p-10 text-center">
          <div className="text-5xl mb-3">📝</div>
          <h3 className="font-display text-xl font-bold text-ink-900">No stories yet</h3>
          <p className="text-sm text-ink-600 mt-2">Click &quot;+ New Story&quot; to open the editor. Stories save to Firestore and render live the moment you hit Publish.</p>
        </div>
      ) : view === 'list' ? (
        <ListView stories={filtered} sections={sections} sites={sites} onEdit={s => { setSelectedStory(s); setEditorOpen(true); }} />
      ) : (
        <GridView stories={filtered} sections={sections} sites={sites} onEdit={s => { setSelectedStory(s); setEditorOpen(true); }} />
      )}

      {editorOpen && (
        <StoryEditorModal
          story={selectedStory}
          sections={sections}
          sites={sites}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// List + Grid views
// ─────────────────────────────────────────────────────────────────────────────

function ListView({ stories, sections, sites, onEdit }) {
  return (
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
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stories.map(story => {
            const section = sections.find(s => s.id === story.section);
            return (
              <tr key={story.id} className="border-b border-ink-50 hover:bg-ink-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-12 bg-ink-100 rounded flex-shrink-0 overflow-hidden">
                      {story.image?.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={story.image.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <button onClick={() => onEdit(story)} className="text-sm font-medium text-ink-800 hover:text-brand-700 text-left">
                        {story.headline}
                      </button>
                      <div className="text-xs text-ink-500 truncate">
                        {story.author?.name || '—'}
                        {story.breaking && <span className="ml-2 text-red-600 font-bold">● BREAKING</span>}
                        {story.featured && <span className="ml-2 text-gold-700">★ Featured</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-ink-700">{section ? `${section.icon} ${section.name}` : story.section}</span>
                  {story.secondarySections?.length > 0 && (
                    <div className="text-[10px] text-ink-400">+{story.secondarySections.length} more</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-1">
                    {(story.sites || []).slice(0, 4).map(siteId => {
                      const site = sites.find(x => x.id === siteId);
                      return site ? (
                        <div
                          key={siteId}
                          title={site.name}
                          className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold"
                          style={{ background: site.color || '#1a2c5b' }}
                        >
                          {site.code}
                        </div>
                      ) : null;
                    })}
                    {(story.sites || []).length > 4 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-ink-300 flex items-center justify-center text-white text-[8px] font-bold">
                        +{story.sites.length - 4}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                    story.accessLevel === 'free' ? 'bg-green-100 text-green-700' :
                    story.accessLevel === 'metered' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-brand-100 text-brand-700'
                  }`}>
                    {story.accessLevel || 'free'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                    story.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-700'
                  }`}>
                    {story.status || 'draft'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-ink-700">
                  {(story.stats?.views || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-ink-500">{fmtDate(story.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(story)} className="px-2 py-1 text-xs text-brand-700 hover:bg-brand-50 rounded">Edit</button>
                    {story.status === 'published' && story.slug && (
                      <Link href={`/article/${story.slug}`} target="_blank" className="px-2 py-1 text-xs text-ink-500 hover:bg-ink-50 rounded">View ↗</Link>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GridView({ stories, sections, sites, onEdit }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stories.map(story => {
        const section = sections.find(s => s.id === story.section);
        return (
          <button
            key={story.id}
            onClick={() => onEdit(story)}
            className="text-left bg-white rounded-xl border border-ink-200 overflow-hidden hover:border-brand-400 hover:shadow-md transition-all"
          >
            <div className="aspect-[16/9] bg-ink-100 overflow-hidden">
              {story.image?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.image.url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-ink-500">
                {section && <span>{section.icon} {section.name}</span>}
                <span className={`px-1.5 py-0.5 rounded ${
                  story.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-700'
                }`}>{story.status || 'draft'}</span>
              </div>
              <h3 className="font-display text-base font-bold text-ink-900 mt-1 line-clamp-2">{story.headline}</h3>
              {story.deck && <p className="text-xs text-ink-500 mt-1 line-clamp-2">{story.deck}</p>}
              <div className="mt-3 text-xs text-ink-500">{fmtDate(story.updatedAt)} · {(story.stats?.views || 0).toLocaleString()} views</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal editor (create OR edit)
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY = {
  id: null,
  headline: '',
  seoHeadline: '',
  deck: '',
  body: '',
  section: 'news',
  secondarySections: [],
  sites: ['wvnews'],
  accessLevel: 'free',
  tags: [],
  featured: false,
  breaking: false,
  metaDescription: '',
  image: null,
  author: null,
  status: 'draft',
  includeInPrintBudget: false,
};

function StoryEditorModal({ story, sections, sites, onClose }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState(null);
  const [error, setError] = useState(null);

  const initial = story ? { ...EMPTY, ...story } : EMPTY;
  const [form, setForm] = useState(initial);

  const isEditing = !!story?.id;

  function update(patch) { setForm(prev => ({ ...prev, ...patch })); }

  function toggleArray(field, value) {
    setForm(prev => {
      const set = new Set(prev[field] || []);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...prev, [field]: [...set] };
    });
  }

  async function submit(what) {
    setError(null);
    setAction(what);
    const fd = new FormData();
    fd.set('headline', form.headline);
    fd.set('seoHeadline', form.seoHeadline || '');
    fd.set('deck', form.deck || '');
    fd.set('body', form.body || '');
    fd.set('section', form.section || 'news');
    fd.set('secondarySections', (form.secondarySections || []).join(','));
    fd.set('sites', (form.sites || []).join(','));
    fd.set('accessLevel', form.accessLevel || 'free');
    fd.set('tags', (form.tags || []).join(','));
    if (form.featured) fd.set('featured', 'on');
    if (form.breaking) fd.set('breaking', 'on');
    if (form.image?.url) {
      fd.set('imageUrl', form.image.url);
      fd.set('imageAlt', form.image.alt || '');
      fd.set('imageCredit', form.image.credit || '');
    }
    if (form.author?.name) {
      fd.set('authorName', form.author.name);
      fd.set('authorRole', form.author.role || '');
    }
    fd.set('_action', what);

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateStoryAction(story.id, fd);
        } else {
          await createStoryAction(fd);
        }
        router.refresh();
        onClose();
      } catch (e) {
        setError(e.message || 'Save failed');
      } finally {
        setAction(null);
      }
    });
  }

  async function onDelete() {
    if (!story?.id) return;
    if (!window.confirm('Delete this story? This cannot be undone.')) return;
    await deleteStoryAction(story.id);
    router.refresh();
    onClose();
  }

  // AI Writing Assistant — each button invokes /api/ai with a specific action.
  // Simple-apply actions (summary, meta, tags, alt) patch the form directly.
  // Multi-option actions (headlines, social, links) set aiPopup to show picker.
  const [aiLoading, setAiLoading] = useState(null);
  const [aiPopup, setAiPopup] = useState(null);
  const [aiError, setAiError] = useState(null);

  async function ai(action) {
    setAiError(null);
    setAiLoading(action);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          story: {
            headline: form.headline,
            deck: form.deck,
            body: form.body,
            tags: form.tags,
            image: form.image,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      switch (action) {
        case 'summary':
          if (data.deck) update({ deck: data.deck });
          break;
        case 'meta':
          if (data.metaDescription) update({ metaDescription: data.metaDescription });
          break;
        case 'tags':
          if (data.tags?.length) {
            const merged = Array.from(new Set([...(form.tags || []), ...data.tags]));
            update({ tags: merged });
          }
          break;
        case 'alt':
          if (data.alt) update({ image: { ...(form.image || {}), alt: data.alt } });
          else if (data.note) setAiError(data.note);
          break;
        case 'headlines':
        case 'social':
        case 'links':
          setAiPopup({ action, data });
          break;
      }
    } catch (e) {
      setAiError(e.message || 'AI request failed');
    } finally {
      setAiLoading(null);
    }
  }

  const AI_BUTTONS = [
    { action: 'summary', label: 'Generate Deck', hint: 'Writes the subheadline under your headline.' },
    { action: 'headlines', label: 'Suggest Headlines', hint: 'Five alternates to pick from.' },
    { action: 'meta', label: 'Write Meta Description', hint: 'Fills the SEO meta description field.' },
    { action: 'tags', label: 'Auto-Tag Topics', hint: 'Appends 8 suggested tags.' },
    { action: 'links', label: 'Suggest Internal Links', hint: 'Finds link-worthy phrases in your body.' },
    { action: 'social', label: 'Social Post Copy', hint: 'Writes X / Facebook / Instagram posts.' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink-200">
          <div>
            <h2 className="text-lg font-display font-bold text-ink-900">
              {isEditing ? 'Edit Story' : 'New Story'}
            </h2>
            {isEditing && (
              <div className="text-xs text-ink-500 mt-0.5">
                {form.status} · last updated {fmtDate(story.updatedAt)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => submit('save')}
              disabled={pending || !form.headline}
              className="px-3 py-1.5 text-xs bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 disabled:opacity-50"
            >
              {action === 'save' && pending ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              onClick={() => submit('publish')}
              disabled={pending || !form.headline}
              className="px-3 py-1.5 text-xs bg-brand-700 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
            >
              {action === 'publish' && pending ? 'Publishing…' : (form.status === 'published' ? 'Update' : 'Publish')}
            </button>
            <button onClick={onClose} className="p-2 text-ink-400 hover:text-ink-600">✕</button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 text-red-800 text-xs rounded">{error}</div>
        )}

        <div className="grid grid-cols-3 divide-x divide-ink-100">
          {/* Main */}
          <div className="col-span-2 p-6 space-y-4">
            {!isEditing && (
              <StoryIdeaPanel
                section={form.section}
                onGenerated={(draft) => {
                  update({
                    headline: draft.headline || form.headline,
                    seoHeadline: draft.seoHeadline || form.seoHeadline,
                    deck: draft.deck || form.deck,
                    body: draft.body || form.body,
                    tags: (draft.tags && draft.tags.length) ? draft.tags : form.tags,
                    section: draft.section || form.section,
                  });
                }}
              />
            )}
            <input
              type="text"
              placeholder="Write your headline..."
              value={form.headline}
              onChange={e => update({ headline: e.target.value })}
              className="w-full text-2xl font-display font-bold text-ink-900 outline-none placeholder-ink-300"
            />
            <input
              type="text"
              placeholder="Deck / subheadline..."
              value={form.deck}
              onChange={e => update({ deck: e.target.value })}
              className="w-full text-base text-ink-600 outline-none placeholder-ink-300"
            />
            <StoryEditor initialContent={form.body} onChange={html => update({ body: html })} autoFocus={false} />

            {/* AI Writing Assistant */}
            <div className="bg-brand-50 rounded-lg p-4 border border-brand-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">🤖</span>
                <h4 className="text-xs font-bold text-brand-800">AI Writing Assistant</h4>
                <span className="ml-auto text-[10px] text-brand-600">powered by Claude</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AI_BUTTONS.map(btn => (
                  <button
                    key={btn.action}
                    type="button"
                    onClick={() => ai(btn.action)}
                    disabled={aiLoading !== null}
                    title={btn.hint}
                    className={`px-3 py-1.5 text-xs rounded-lg border ${
                      aiLoading === btn.action
                        ? 'bg-brand-700 text-white border-brand-700'
                        : 'bg-white text-brand-700 border-brand-200 hover:bg-brand-50'
                    } disabled:opacity-50`}
                  >
                    {aiLoading === btn.action ? '⏳ thinking…' : btn.label}
                  </button>
                ))}
              </div>
              {aiError && (
                <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 text-red-800 text-xs rounded">
                  {aiError} <button onClick={() => setAiError(null)} className="ml-2 underline">dismiss</button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="p-4 space-y-4 bg-ink-50/50 overflow-y-auto max-h-[80vh]">
            {/* Breaking toggle — surfaced at the top so editors can flip it fast */}
            <button
              type="button"
              onClick={() => update({ breaking: !form.breaking })}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border-2 transition-all ${
                form.breaking
                  ? 'bg-red-600 border-red-700 text-white shadow-sm'
                  : 'bg-white border-ink-200 text-ink-700 hover:border-red-300'
              }`}
            >
              <span className="flex items-center gap-2 font-semibold text-sm">
                <span className={form.breaking ? 'animate-pulse' : ''}>●</span>
                Breaking News
              </span>
              <span className={`inline-flex items-center h-5 w-9 rounded-full transition-colors ${
                form.breaking ? 'bg-white/25' : 'bg-ink-200'
              }`}>
                <span className={`inline-block h-4 w-4 bg-white rounded-full shadow transform transition-transform ${
                  form.breaking ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`} />
              </span>
            </button>
            {form.breaking && (
              <p className="text-[11px] text-red-700 -mt-2">
                This story will show in the site-wide red ribbon once published.
              </p>
            )}

            <Field label="Status">
              <select value={form.status} onChange={e => update({ status: e.target.value })} className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </Field>

            <Field label="Content Access">
              <select value={form.accessLevel} onChange={e => update({ accessLevel: e.target.value })} className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
                <option value="free">Free</option>
                <option value="metered">Metered (counts toward limit)</option>
                <option value="premium">Subscriber Only</option>
              </select>
            </Field>

            <Field label="Primary Section">
              <select value={form.section} onChange={e => update({ section: e.target.value })} className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm">
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>

            <Field label="Additional Sections">
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {sections.filter(s => s.id !== form.section).map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-xs text-ink-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={(form.secondarySections || []).includes(s.id)}
                      onChange={() => toggleArray('secondarySections', s.id)}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </Field>

            <Field label={`Publish To Sites (${(form.sites || []).length})`}>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {sites.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-xs text-ink-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={(form.sites || []).includes(s.id)}
                      onChange={() => toggleArray('sites', s.id)}
                    />
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[8px] font-bold" style={{ background: s.color || '#1a2c5b' }}>
                      {s.code}
                    </span>
                    {s.name}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="SEO Headline">
              <input type="text" value={form.seoHeadline || ''} onChange={e => update({ seoHeadline: e.target.value })} className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm" placeholder="SEO-optimized headline..." />
            </Field>

            <Field label="Meta Description">
              <textarea value={form.metaDescription || ''} onChange={e => update({ metaDescription: e.target.value })} className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm h-20" placeholder="Meta description..." />
              <button type="button" onClick={() => ai('meta')} disabled={aiLoading !== null} className="mt-1 text-xs text-brand-700 hover:underline disabled:opacity-50">
                {aiLoading === 'meta' ? '⏳ generating…' : '🤖 AI Generate'}
              </button>
            </Field>

            <Field label="Tags">
              <input
                type="text"
                value={(form.tags || []).join(', ')}
                onChange={e => update({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm"
                placeholder="Add tags, comma-separated..."
              />
              <button type="button" onClick={() => ai('tags')} disabled={aiLoading !== null} className="mt-1 text-xs text-brand-700 hover:underline disabled:opacity-50">
                {aiLoading === 'tags' ? '⏳ suggesting…' : '🤖 AI Suggest Tags'}
              </button>
            </Field>

            <Field label="Featured Image">
              <input
                type="text"
                value={form.image?.url || ''}
                onChange={e => update({ image: { ...(form.image || {}), url: e.target.value } })}
                placeholder="Image URL"
                className="w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm"
              />
              <input
                type="text"
                value={form.image?.alt || ''}
                onChange={e => update({ image: { ...(form.image || {}), alt: e.target.value } })}
                placeholder="Alt text"
                className="mt-1 w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm"
              />
              <input
                type="text"
                value={form.image?.credit || ''}
                onChange={e => update({ image: { ...(form.image || {}), credit: e.target.value } })}
                placeholder="Photo credit"
                className="mt-1 w-full px-3 py-2 bg-white rounded border border-ink-200 text-sm"
              />
              <button type="button" onClick={() => ai('alt')} disabled={aiLoading !== null} className="mt-1 text-xs text-brand-700 hover:underline disabled:opacity-50">
                {aiLoading === 'alt' ? '⏳ writing…' : '🤖 AI Generate Alt Text'}
              </button>
            </Field>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.featured} onChange={e => update({ featured: e.target.checked })} className="rounded" />
              <span className="text-xs font-medium text-gold-700">Featured (home/section spotlight)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.includeInPrintBudget} onChange={e => update({ includeInPrintBudget: e.target.checked })} className="rounded" />
              <span className="text-xs font-medium text-ink-700">Include in Print Budget</span>
            </label>

            {isEditing && (
              <div className="pt-4 border-t border-ink-200">
                <button type="button" onClick={onDelete} className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded">
                  Delete story
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI suggestion popup — layered over the editor modal */}
      {aiPopup && (
        <AiSuggestionPopup
          action={aiPopup.action}
          data={aiPopup.data}
          onApplyHeadline={h => { update({ headline: h }); setAiPopup(null); }}
          onApplyLinkSuggestion={null /* advisory only — editor inserts manually */}
          onClose={() => setAiPopup(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI suggestion popup — overlays the editor for multi-option results
// ─────────────────────────────────────────────────────────────────────────────

function AiSuggestionPopup({ action, data, onApplyHeadline, onClose }) {
  const title =
    action === 'headlines' ? 'Headline Suggestions' :
    action === 'social'    ? 'Social Posts' :
                             'Internal Link Suggestions';

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <div className="flex items-center gap-2">
            <span>🤖</span>
            <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-ink-700">✕</button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {action === 'headlines' && (
            <>
              <p className="text-xs text-ink-500 mb-2">Click one to apply as your headline.</p>
              {(data.options || []).map((h, i) => (
                <button
                  key={i}
                  onClick={() => onApplyHeadline(h)}
                  className="w-full text-left px-4 py-3 border border-ink-200 rounded-lg hover:border-brand-400 hover:bg-brand-50 transition-colors"
                >
                  <div className="text-[10px] font-bold text-ink-500 uppercase tracking-wider mb-1">Option {i + 1}</div>
                  <div className="font-display text-base text-ink-900">{h}</div>
                </button>
              ))}
              {!data.options?.length && <div className="text-sm text-ink-500">No suggestions returned.</div>}
            </>
          )}

          {action === 'social' && (
            <div className="space-y-4">
              {[
                { key: 'x', label: 'X / Twitter', limit: 280 },
                { key: 'facebook', label: 'Facebook', limit: null },
                { key: 'instagram', label: 'Instagram', limit: null },
              ].map(({ key, label, limit }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-ink-700 uppercase tracking-wider">{label}</span>
                    {limit && (
                      <span className={`text-[10px] ${(data[key] || '').length > limit ? 'text-red-600 font-bold' : 'text-ink-500'}`}>
                        {(data[key] || '').length} / {limit}
                      </span>
                    )}
                  </div>
                  <textarea
                    readOnly
                    value={data[key] || '(empty)'}
                    rows={key === 'x' ? 3 : 4}
                    className="w-full px-3 py-2 bg-ink-50 border border-ink-200 rounded text-sm"
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(data[key] || ''); }}
                    className="mt-1 text-xs text-brand-700 hover:underline"
                  >
                    📋 Copy {label}
                  </button>
                </div>
              ))}
            </div>
          )}

          {action === 'links' && (
            <>
              <p className="text-xs text-ink-500 mb-2">Candidate phrases for internal links. Use the editor&apos;s 🔗 Link button to add URLs manually.</p>
              {(data.suggestions || []).map((s, i) => (
                <div key={i} className="px-4 py-3 border border-ink-200 rounded-lg">
                  <div className="font-semibold text-ink-900">“{s.phrase}”</div>
                  <div className="text-xs text-ink-600 mt-1">{s.reason}</div>
                </div>
              ))}
              {!data.suggestions?.length && <div className="text-sm text-ink-500">No candidates found.</div>}
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-ink-100 text-[10px] text-ink-400">
          Generated by Claude · results are suggestions, review before publishing.
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-ink-600 uppercase tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  );
}
