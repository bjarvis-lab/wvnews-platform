// Firestore data layer for the `stories` collection. Shared between native
// and ingested content — distinguished by the `source` field:
//
//   source: 'native'   — authored in /admin/stories, full body, owned, paywall-able
//   source: 'ingested' — scraped from wvnews.com or syndication, external link-out
//
// Native stories render at /article/[slug]. Ingested stories show as link-out
// cards on listing pages (homepage, section pages, publication pages) and
// never get a full /article/[slug] render.

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase-admin';

const COL = 'stories';

// ---- Coercion helpers ----

// Firestore returns Timestamps; callers want ISO strings for serialization.
function serializeStory(docSnap) {
  const data = docSnap.data();
  if (!data) return null;
  const out = { id: docSnap.id, ...data };
  for (const [k, v] of Object.entries(out)) {
    if (v && typeof v === 'object' && typeof v.toDate === 'function') {
      out[k] = v.toDate().toISOString();
    }
  }
  return out;
}

function ensureSlug(headline, fallback) {
  const base = (headline || '').toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 90);
  return base || fallback || `story-${Date.now()}`;
}

// ---- Public API ----

export async function listStories({ source, status, limit = 50 } = {}) {
  // We intentionally avoid combining where() + orderBy() on different fields
  // to stay off Firestore's composite-index requirement. For prototype scale
  // (<1000 native stories) fetching more rows and filtering in memory is fine.
  // Once ingested stories land in this collection, swap this for a composite
  // index keyed on (source, updatedAt).
  const overFetch = source || status ? limit * 4 : limit;
  const snap = await db.collection(COL).orderBy('updatedAt', 'desc').limit(overFetch).get();
  let rows = snap.docs.map(serializeStory);
  if (source) rows = rows.filter(r => r.source === source);
  if (status) rows = rows.filter(r => r.status === status);
  return rows.slice(0, limit);
}

export async function getStoryById(id) {
  const snap = await db.collection(COL).doc(id).get();
  return snap.exists ? serializeStory(snap) : null;
}

export async function getStoryBySlug(slug, { source = 'native' } = {}) {
  const snap = await db.collection(COL)
    .where('slug', '==', slug)
    .where('source', '==', source)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return serializeStory(snap.docs[0]);
}

export async function getRecentBySection(sectionId, { limit = 10 } = {}) {
  const snap = await db.collection(COL)
    .where('section', '==', sectionId)
    .where('status', '==', 'published')
    .orderBy('publishedAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(serializeStory);
}

// Published native stories ordered newest-first. We over-fetch and filter
// in-memory to avoid Firestore's composite-index requirement on
// (source, updatedAt). Once native content passes a few hundred docs,
// switch to a real composite index at:
//   Firebase Console → Firestore → Indexes → + Add Index
//   Collection: stories   Fields: source (Asc) + updatedAt (Desc)
//
// Pulling up to 500 docs per request on the shared collection is fine at
// current scale (1 native + ~150 ingested).
export async function listPublishedStories({ limit = 40 } = {}) {
  const snap = await db.collection('stories')
    .orderBy('updatedAt', 'desc')
    .limit(500)
    .get();
  return snap.docs
    .map(serializeStory)
    .filter(s => s.source === 'native' && s.status === 'published')
    .slice(0, limit);
}

export async function listPublishedBySection(sectionId, { limit = 30 } = {}) {
  const rows = await listPublishedStories({ limit: 200 });
  return rows
    .filter(s => s.section === sectionId || (s.secondarySections || []).includes(sectionId))
    .slice(0, limit);
}

// Context snapshot for AI topic-suggestion prompts. Returns a compact
// list of recent story titles + decks + publication tags that Claude can
// scan to suggest follow-ups. Kept small so we don't burn tokens.
export async function getRecentStoriesForContext({ limit = 30 } = {}) {
  const snap = await db.collection('stories')
    .orderBy('updatedAt', 'desc')
    .limit(100)
    .get();
  return snap.docs
    .map(serializeStory)
    .filter(s => s.status === 'published')
    .slice(0, limit)
    .map(s => ({
      headline: s.headline,
      deck: s.deck || '',
      section: s.section || null,
      sites: s.sites || [],
      tags: s.tags || [],
    }));
}

export async function getBreakingStories({ limit = 5 } = {}) {
  // Fetch the most recently-updated published stories and filter to the
  // breaking ones in app code — same approach as listStories() for avoiding
  // composite indexes. Breaking stories are typically few, so this is cheap.
  const snap = await db.collection('stories')
    .orderBy('updatedAt', 'desc')
    .limit(50)
    .get();
  return snap.docs
    .map(serializeStory)
    .filter(s => s.breaking && s.status === 'published' && s.source === 'native')
    .slice(0, limit);
}

export async function getRecentBySite(siteId, { limit = 10 } = {}) {
  // 'sites' is an array — Firestore supports array-contains
  const snap = await db.collection(COL)
    .where('sites', 'array-contains', siteId)
    .where('status', '==', 'published')
    .orderBy('publishedAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(serializeStory);
}

// ---- Mutations ----

// Create a new native story. Accepts form fields + explicit publish flag.
// Returns { id, slug } of the created doc.
//
// The `body` field is kept for backward compat (some older data lives there).
// New writes put web content in `webBody` and print content in `printBody`.
// If the caller only provides one, we mirror it into `body` so the public
// article route can keep its existing fallback logic working.
export async function createNativeStory(input, { publish = false } = {}) {
  const slug = ensureSlug(input.headline, `draft-${Date.now()}`);
  const now = FieldValue.serverTimestamp();

  // Accept either new-style (webBody/printBody) or legacy (body) input.
  const webBody = input.webBody ?? (input.hasWeb !== false ? input.body || '' : '');
  const printBody = input.printBody ?? (input.hasPrint ? input.body || '' : '');
  const hasWeb = input.hasWeb !== false; // default true
  const hasPrint = !!input.hasPrint;

  const doc = {
    source: 'native',
    slug,
    headline: input.headline?.trim() || 'Untitled',
    seoHeadline: input.seoHeadline?.trim() || '',
    deck: input.deck?.trim() || '',

    // Versions
    hasWeb,
    hasPrint,
    webBody,
    printBody,
    body: webBody || printBody || '', // legacy fallback for any consumer still reading .body

    webStatus: publish && hasWeb ? 'published' : 'draft',
    printStatus: hasPrint ? 'draft' : null,

    section: input.section || 'news',
    secondarySections: input.secondarySections || [],
    sites: input.sites?.length ? input.sites : ['wvnews'],
    accessLevel: input.accessLevel || 'free',
    author: input.author || { name: 'WV News Staff', role: 'Staff', avatar: 'WV' },
    image: input.image || null,
    tags: input.tags || [],
    featured: !!input.featured,
    breaking: !!input.breaking,

    // Top-level status remains the web lifecycle (primary view on the site)
    status: publish ? 'published' : 'draft',
    publishedAt: publish ? Timestamp.now() : null,
    updateLog: [],
    createdAt: now,
    updatedAt: now,
    stats: { views: 0, uniqueReaders: 0, socialShares: 0 },
  };

  const ref = await db.collection(COL).add(doc);
  return { id: ref.id, slug };
}

export async function updateStory(id, patch, { publish = null } = {}) {
  const update = { ...patch, updatedAt: FieldValue.serverTimestamp() };

  // Keep `body` in sync with whichever version the app treats as primary
  // (web first, then print). Older code paths that read `.body` directly
  // continue to see a sensible value.
  if (patch.webBody !== undefined || patch.printBody !== undefined) {
    update.body = (patch.webBody || patch.printBody || '');
  }

  if (publish === true) {
    update.status = 'published';
    update.webStatus = 'published';
    update.publishedAt = update.publishedAt || Timestamp.now();
  } else if (publish === false) {
    update.status = 'draft';
    update.webStatus = 'draft';
  }
  if (patch.headline && !patch.slug) {
    update.slug = ensureSlug(patch.headline, id);
  }
  await db.collection(COL).doc(id).update(update);
  return { id };
}

// Append an entry to the running update log on a story. Used when a reporter
// makes notable changes to a live web story so readers can see when it was
// last revised.
export async function appendUpdateLog(id, { note, by }) {
  await db.collection(COL).doc(id).update({
    updateLog: FieldValue.arrayUnion({
      at: Timestamp.now(),
      by: by || 'staff',
      note: note || 'Updated',
    }),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { id };
}

export async function deleteStory(id) {
  await db.collection(COL).doc(id).delete();
  return { id };
}

// ---- Ingested content upsert (used by scripts/ingest-wvnews.mjs migration) ----
//
// Ingested stories use the article's CRM-agnostic external id as the doc id
// so re-running ingestion is idempotent. A small subset of fields is tracked.
export async function upsertIngestedStory(story) {
  const id = `ingested_${story.id}`;
  await db.collection(COL).doc(id).set({
    source: 'ingested',
    slug: story.slug,
    headline: story.title,
    deck: story.description || '',
    body: '', // intentionally empty — we don't store external bodies
    section: 'news',
    secondarySections: [],
    sites: [story.siteId || 'wvnews'],
    accessLevel: 'free',
    author: { name: story.author || 'From staff reports', role: '', avatar: '' },
    image: story.image ? { url: story.image, alt: '' } : null,
    tags: [],
    featured: false,
    breaking: false,
    status: 'published',
    sourceUrl: story.sourceUrl,
    sourcePrefix: story.prefix || null,
    publishedAt: story.pubDate ? Timestamp.fromDate(new Date(story.pubDate)) : Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { id };
}
