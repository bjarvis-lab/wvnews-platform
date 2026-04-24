'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import StoryEditor from './StoryEditor';

// Form wrapping the TipTap editor + metadata fields. Used by both /new and
// /[id]/edit. The form action is passed as a prop so the parent page wires
// up the correct server action.

export default function StoryForm({
  action,      // server action: (formData) => Promise<…>
  initial = {},
  sections = [],
  sites = [],
  mode = 'new', // 'new' | 'edit'
  onDelete,     // optional server action for delete (edit mode)
}) {
  const [body, setBody] = useState(initial.body || '');
  const [pending, startTransition] = useTransition();
  const [submittingAction, setSubmittingAction] = useState(null);
  const router = useRouter();

  function submitWith(actionName, ev) {
    ev.preventDefault();
    setSubmittingAction(actionName);
    const form = ev.target.closest('form');
    const fd = new FormData(form);
    fd.set('body', body);
    fd.set('_action', actionName);
    startTransition(async () => {
      try {
        const result = await action(fd);
        if (result?.ok) router.refresh();
      } finally {
        setSubmittingAction(null);
      }
    });
  }

  const publishing = submittingAction === 'publish' && pending;
  const saving = submittingAction === 'save' && pending;

  return (
    <form className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6" onSubmit={e => e.preventDefault()}>
      {/* Main column: headline, deck, body */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1">Headline *</label>
          <input
            name="headline"
            required
            defaultValue={initial.headline || ''}
            placeholder="Write a clear, specific headline…"
            className="w-full px-4 py-3 text-2xl font-display font-bold border border-ink-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1">SEO Headline</label>
          <input
            name="seoHeadline"
            defaultValue={initial.seoHeadline || ''}
            placeholder="Search-optimized version (optional)"
            className="w-full px-4 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1">Deck / Sub-headline</label>
          <textarea
            name="deck"
            rows={2}
            defaultValue={initial.deck || ''}
            placeholder="One-sentence summary under the headline."
            className="w-full px-4 py-2.5 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-2">Body *</label>
          <StoryEditor initialContent={initial.body || ''} onChange={setBody} autoFocus={mode === 'new'} />
        </div>
      </div>

      {/* Sidebar: metadata + actions */}
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="bg-white border border-ink-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-ink-500 uppercase tracking-wider">Status</div>
              <div className="font-semibold text-ink-900 capitalize">{initial.status || 'Draft'}</div>
            </div>
            {initial.publishedAt && (
              <div className="text-right">
                <div className="text-xs text-ink-500">Published</div>
                <div className="text-xs font-semibold text-ink-700">{new Date(initial.publishedAt).toLocaleString()}</div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-ink-100">
            <button
              type="button"
              onClick={(e) => submitWith('save', e)}
              disabled={pending}
              className="w-full px-4 py-2.5 bg-white text-ink-700 text-sm font-semibold border border-ink-200 rounded-lg hover:bg-ink-50 disabled:opacity-50"
            >
              {saving ? 'Saving…' : '💾 Save Draft'}
            </button>
            <button
              type="button"
              onClick={(e) => submitWith('publish', e)}
              disabled={pending}
              className="w-full px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50"
            >
              {publishing ? 'Publishing…' : (initial.status === 'published' ? '↻ Update Published' : '🚀 Publish')}
            </button>
            {initial.status === 'published' && (
              <button
                type="button"
                onClick={(e) => submitWith('unpublish', e)}
                disabled={pending}
                className="w-full px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900"
              >
                Unpublish (back to draft)
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-ink-200 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-ink-600 uppercase tracking-wider">Placement</div>
          <label className="block">
            <span className="text-xs font-semibold text-ink-700">Primary section</span>
            <select name="section" defaultValue={initial.section || 'news'} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm bg-white">
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-700">Secondary sections</span>
            <input
              name="secondarySections"
              defaultValue={(initial.secondarySections || []).join(', ')}
              placeholder="politics, business"
              className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm"
            />
            <span className="text-[11px] text-ink-500">Comma-separated section ids</span>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-700">Publications</span>
            <input
              name="sites"
              defaultValue={(initial.sites || ['wvnews']).join(', ')}
              placeholder="wvnews, exponent, dominion"
              className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm"
            />
            <span className="text-[11px] text-ink-500">Which papers run this — {sites.length} available</span>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-700">Access level</span>
            <select name="accessLevel" defaultValue={initial.accessLevel || 'free'} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm bg-white">
              <option value="free">Free</option>
              <option value="metered">Metered (paywall after N reads)</option>
              <option value="premium">Premium (subscribers only)</option>
            </select>
          </label>
        </div>

        <div className="bg-white border border-ink-200 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-ink-600 uppercase tracking-wider">Hero Image</div>
          <input name="imageUrl" defaultValue={initial.image?.url || ''} placeholder="Image URL" className="w-full px-3 py-2 border border-ink-200 rounded text-sm" />
          <input name="imageAlt" defaultValue={initial.image?.alt || ''} placeholder="Alt text" className="w-full px-3 py-2 border border-ink-200 rounded text-sm" />
          <input name="imageCredit" defaultValue={initial.image?.credit || ''} placeholder="Photo credit" className="w-full px-3 py-2 border border-ink-200 rounded text-sm" />
        </div>

        <div className="bg-white border border-ink-200 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-ink-600 uppercase tracking-wider">Byline</div>
          <input name="authorName" defaultValue={initial.author?.name || ''} placeholder="Author name" className="w-full px-3 py-2 border border-ink-200 rounded text-sm" />
          <input name="authorRole" defaultValue={initial.author?.role || ''} placeholder="Role / title" className="w-full px-3 py-2 border border-ink-200 rounded text-sm" />
        </div>

        <div className="bg-white border border-ink-200 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-ink-600 uppercase tracking-wider">Tags & Flags</div>
          <label className="block">
            <span className="text-xs font-semibold text-ink-700">Tags</span>
            <input name="tags" defaultValue={(initial.tags || []).join(', ')} placeholder="wvu, sports, basketball" className="mt-1 w-full px-3 py-2 border border-ink-200 rounded text-sm" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="featured" defaultChecked={!!initial.featured} />
            <span className="text-sm text-ink-700">Featured</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="breaking" defaultChecked={!!initial.breaking} />
            <span className="text-sm text-ink-700">Breaking news</span>
          </label>
        </div>

        {mode === 'edit' && onDelete && (
          <form action={onDelete}>
            <button type="submit" className="w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg">
              Delete story
            </button>
          </form>
        )}
      </aside>
    </form>
  );
}
