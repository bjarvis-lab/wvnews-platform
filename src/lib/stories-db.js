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
export async function createNativeStory(input, { publish = false } = {}) {
  const slug = ensureSlug(input.headline, `draft-${Date.now()}`);
  const now = FieldValue.serverTimestamp();

  const doc = {
    source: 'native',
    slug,
    headline: input.headline?.trim() || 'Untitled',
    seoHeadline: input.seoHeadline?.trim() || '',
    deck: input.deck?.trim() || '',
    body: input.body || '',
    section: input.section || 'news',
    secondarySections: input.secondarySections || [],
    sites: input.sites?.length ? input.sites : ['wvnews'],
    accessLevel: input.accessLevel || 'free',
    author: input.author || { name: 'WV News Staff', role: 'Staff', avatar: 'WV' },
    image: input.image || null,
    tags: input.tags || [],
    featured: !!input.featured,
    breaking: !!input.breaking,
    status: publish ? 'published' : 'draft',
    publishedAt: publish ? Timestamp.now() : null,
    createdAt: now,
    updatedAt: now,
    stats: { views: 0, uniqueReaders: 0, socialShares: 0 },
  };

  const ref = await db.collection(COL).add(doc);
  return { id: ref.id, slug };
}

export async function updateStory(id, patch, { publish = null } = {}) {
  const update = { ...patch, updatedAt: FieldValue.serverTimestamp() };
  if (publish === true) {
    update.status = 'published';
    update.publishedAt = update.publishedAt || Timestamp.now();
  } else if (publish === false) {
    update.status = 'draft';
  }
  if (patch.headline && !patch.slug) {
    update.slug = ensureSlug(patch.headline, id);
  }
  await db.collection(COL).doc(id).update(update);
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
