// Clusters near-duplicate Media Desk signals and flags trending / breaking
// stories. Runs after the collector on each cron. Uses Claude Haiku to
// group signals by story (not just topic) — same event, same facts, across
// different outlets.
//
// Rules:
//   Trending = ≥3 unique domains, newest signal <2h old
//   Breaking = ≥5 unique domains OR an official state/agency source,
//              newest signal <30min old
//
// Run: node scripts/cluster-media-signals.mjs

const UA = 'Mozilla/5.0 (wvnews-platform media-desk-clusterer)';

async function loadFirestore() {
  const { initializeApp, applicationDefault, cert, getApps } = await import('firebase-admin/app');
  const { getFirestore, Timestamp, FieldValue } = await import('firebase-admin/firestore');
  if (!getApps().length) {
    const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const credential = inline
      ? cert(typeof inline === 'string' ? JSON.parse(inline) : inline)
      : applicationDefault();
    initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID || 'wvnews-crm' });
  }
  return { db: getFirestore(), Timestamp, FieldValue };
}

// Kinds whose sources we treat as "official" for breaking-news escalation.
// An official source triggers breaking even if domain diversity is lower.
const OFFICIAL_KINDS = new Set(['gov', 'county', 'city']);

const CLAUDE_MODEL = 'claude-haiku-4-5';
const WINDOW_HOURS = 4;  // only cluster signals from last N hours
const MAX_ITEMS = 250;   // hard cap for Claude input

// ─── Claude API (inline, no SDK to keep script zero-dep) ──────────────────
async function callClaude({ system, user, maxTokens = 3000 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude ${res.status}: ${errText.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  return { text, usage: data.usage };
}

function parseClusterJson(text) {
  // Claude occasionally wraps JSON in ```json fences. Rather than trying to
  // match them with brittle anchored regex, find the first `{` and last `}`
  // and slice between them — the valid JSON is always in that span.
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first < 0 || last < first) return null;
  const candidate = text.slice(first, last + 1);
  try { return JSON.parse(candidate); }
  catch (err) {
    console.error('[cluster] JSON parse failed:', err.message);
    return null;
  }
}

// ─── Scoring + classification ──────────────────────────────────────────
function classifyCluster(cluster, now = Date.now()) {
  const uniqueDomains = new Set(cluster.members.map(m => m.domain).filter(Boolean));
  const hasOfficial = cluster.members.some(m => OFFICIAL_KINDS.has(m.kind));
  const newest = cluster.members.reduce((acc, m) => {
    const t = new Date(m.lastSeenAt || m.publishedAt || m.firstSeenAt).getTime();
    return t > acc ? t : acc;
  }, 0);
  const ageMs = now - newest;
  const ageMin = ageMs / 60000;

  const isTrending = uniqueDomains.size >= 3 && ageMin <= 120;
  const isBreaking =
    ageMin <= 30 && (uniqueDomains.size >= 5 || (uniqueDomains.size >= 2 && hasOfficial));

  return {
    uniqueDomains: [...uniqueDomains],
    hasOfficial,
    newestAt: new Date(newest).toISOString(),
    ageMin: Math.round(ageMin),
    isTrending,
    isBreaking,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  const { db, Timestamp, FieldValue } = await loadFirestore();

  // Pull signals from the last WINDOW_HOURS, newest first. Cap input size.
  const cutoffMs = Date.now() - WINDOW_HOURS * 3600 * 1000;
  console.log(`[cluster] pulling signals since ${new Date(cutoffMs).toISOString()}`);

  const snap = await db.collection('mediaSignals')
    .orderBy('lastSeenAt', 'desc')
    .limit(400)
    .get();

  const signals = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const lastSeen = data.lastSeenAt?.toDate?.()?.getTime?.() || 0;
    if (lastSeen >= cutoffMs) {
      signals.push({
        id: doc.id,
        title: data.title,
        summary: data.summary || '',
        sourceName: data.sourceName || '',
        domain: data.domain || extractDomain(data.url),
        kind: data.kind,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString?.() || null,
        lastSeenAt: data.lastSeenAt?.toDate?.()?.toISOString?.() || null,
        url: data.url,
      });
      if (signals.length >= MAX_ITEMS) break;
    }
  }

  console.log(`[cluster] ${signals.length} signals in the ${WINDOW_HOURS}-hour window`);
  if (signals.length < 3) {
    console.log('[cluster] not enough signals to cluster; exiting');
    return;
  }

  // Compact payload — use array index as the short ID so Claude's output
  // stays small (the real Firestore doc IDs are URL-encoded and ~500 chars
  // each; a cluster of 20 stories would blow max_tokens just repeating them).
  const compact = signals.map((s, i) => ({
    id: i,
    title: s.title?.slice(0, 200),
    source: s.sourceName?.slice(0, 60),
  }));

  const { text, usage } = await callClaude({
    system: `You cluster news items from West Virginia media. Group items that are about the SAME news event (same incident, same vote, same arrest, same game), not just items about the same general topic. Ignore national/wire stories that merely mention WV.

Return strict JSON with this shape. signalIds reference the 'id' field of each item.
{
  "clusters": [
    {
      "primaryTitle": "neutral canonical title, max 100 chars",
      "summary": "one-sentence neutral summary, max 200 chars",
      "beat": "news|politics|sports|business|crime|education|health|weather|obits|community|other",
      "keyPlace": "a WV county or city if clearly geographic, else null",
      "signalIds": ["<id1>", "<id2>", ...]
    }
  ]
}

Rules:
- A cluster must have at least 2 signals.
- Do not combine unrelated events even if they share a topic (two different fires are NOT one cluster).
- Single-signal items don't go in any cluster — omit them entirely.
- Prefer fewer, higher-confidence clusters over many weak ones.
- Output ONLY the JSON. No preamble. No explanation.`,
    user: `Here are ${compact.length} recent WV news signals. Group them into clusters of same-event coverage.\n\n${JSON.stringify(compact)}`,
    maxTokens: 12000,
  });

  const parsed = parseClusterJson(text);
  if (!parsed?.clusters) {
    console.error('[cluster] Claude returned unparseable JSON. First 500 chars:', text.slice(0, 500));
    return;
  }

  // Claude returned INDEX ids (0, 1, 2, ...) — map back to signal objects.
  const now = Date.now();
  const batch = db.batch();
  const statsCounts = { trending: 0, breaking: 0, total: 0, signalsClustered: 0 };

  for (const c of parsed.clusters) {
    const members = (c.signalIds || [])
      .map(id => {
        const idx = typeof id === 'number' ? id : Number(id);
        return Number.isFinite(idx) && idx >= 0 && idx < signals.length ? signals[idx] : null;
      })
      .filter(Boolean);
    if (members.length < 2) continue;

    const scoring = classifyCluster({ members }, now);
    const clusterDoc = {
      primaryTitle: c.primaryTitle || members[0].title,
      summary: c.summary || '',
      beat: c.beat || 'other',
      keyPlace: c.keyPlace || null,
      memberSignalIds: members.map(m => m.id),
      uniqueDomains: scoring.uniqueDomains,
      uniqueDomainCount: scoring.uniqueDomains.length,
      hasOfficial: scoring.hasOfficial,
      memberCount: members.length,
      firstSeenAt: Timestamp.fromDate(new Date(Math.min(...members.map(m => new Date(m.firstSeenAt || m.lastSeenAt || m.publishedAt || now).getTime())))),
      lastSeenAt: Timestamp.fromDate(new Date(scoring.newestAt)),
      ageMin: scoring.ageMin,
      isTrending: scoring.isTrending,
      isBreaking: scoring.isBreaking,
      clusteredAt: FieldValue.serverTimestamp(),
    };

    // Use a stable cluster ID derived from oldest signal id so re-runs update
    // the same doc when the same event persists in-window.
    const stableId = `cluster_${members[0].id}`;
    const clusterRef = db.collection('mediaClusters').doc(stableId);
    batch.set(clusterRef, clusterDoc, { merge: true });

    // Stamp each member signal with the cluster id
    for (const m of members) {
      batch.update(db.collection('mediaSignals').doc(m.id), {
        clusterId: stableId,
        clusterUpdatedAt: FieldValue.serverTimestamp(),
      });
    }

    statsCounts.total++;
    if (scoring.isTrending) statsCounts.trending++;
    if (scoring.isBreaking) statsCounts.breaking++;
    statsCounts.signalsClustered += members.length;
  }

  await batch.commit();

  // Persist a run summary for the admin UI
  await db.collection('mediaDeskStats').doc('latestCluster').set({
    runAt: FieldValue.serverTimestamp(),
    windowHours: WINDOW_HOURS,
    signalsInWindow: signals.length,
    ...statsCounts,
    claudeUsage: usage,
  }, { merge: true });

  console.log(`[cluster] ${statsCounts.total} clusters created/updated (${statsCounts.trending} trending, ${statsCounts.breaking} breaking)`);
  console.log(`[cluster] ${statsCounts.signalsClustered} signals assigned to clusters`);
  if (usage) console.log(`[cluster] Claude usage:`, usage);
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

main().catch(e => { console.error(e); process.exit(1); });
