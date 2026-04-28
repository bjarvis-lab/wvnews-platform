// Newsletter composer — server-side. Selects stories + ads, renders an
// email-safe HTML template. Template is table-based with inline styles
// because Outlook + corporate webmail still mangle modern CSS.
//
// Three pieces:
//   selectStoriesForNewsletter(opts)  — picks the most important stories
//   selectAdsForNewsletter(opts)      — pulls active digital ad creatives
//   renderNewsletterHtml(opts)        — composes the final HTML
//
// Story prioritization (most important first):
//   1. Breaking — flagged as breaking
//   2. Featured — manually starred for the section
//   3. Most-read — by view count over the window
//   4. Newest — fallback

import { db } from './firebase-admin';
import { sites as PUBLICATIONS } from '@/data/mock';

const HOUR = 3600_000;

// Look up the publication logo for a given site id. Used as a fallback
// image when an ingested article doesn't have its own photo, so every
// story row in the email gets a visual.
function publicationLogoFor(siteId) {
  const pub = PUBLICATIONS.find(p => p.id === siteId);
  return pub?.logoFile || null;
}

// Editorial priority order — sections render in this order in the email
// (the lead story floats above all of these). Sections with no recent
// stories are skipped so we don't ship empty headers.
export const SECTION_ORDER = [
  'news',
  'politics',
  'crime',
  'business',
  'education',
  'sports',
  'opinion',
  'lifestyle',
  'community',
  'obituaries',
];

// Display names — keep IDs short (matches mock.js sections), expand here.
export const SECTION_LABELS = {
  news:        'News',
  politics:    'Politics',
  crime:       'Crime & Courts',
  business:    'Business',
  education:   'Education',
  sports:      'Sports',
  opinion:     'Opinion',
  lifestyle:   'Lifestyle',
  community:   'Community',
  obituaries:  'Obituaries',
};

// ─── Story selection ──────────────────────────────────────────────────────

// Publications that aggregate from all the others. When the newsletter
// is for one of these, we do NOT filter by site — we pull the best of
// every paper. (The ingest script assigns each story to its specific
// publication; nothing is tagged as "wvnews", so without this carve-out
// the wvnews umbrella newsletter would be permanently empty.)
const AGGREGATOR_PUBLICATIONS = new Set(['wvnews', 'all']);

export async function selectStoriesForNewsletter({
  publication = 'wvnews',
  hoursBack = 24,
  count = 8,
} = {}) {
  // Pull a generous over-fetch and rank in memory — Firestore composite
  // indexes aren't worth setting up for a once-a-day batch.
  const cutoff = Date.now() - hoursBack * HOUR;
  const isAggregator = AGGREGATOR_PUBLICATIONS.has(publication);
  // Aggregator pulls from a wider over-fetch so the score sort has
  // enough candidates across 20 papers to pick from.
  const overfetch = Math.max(count * (isAggregator ? 25 : 5), 80);
  const snap = await db.collection('stories')
    .orderBy('publishedAt', 'desc')
    .limit(overfetch)
    .get();

  const candidates = [];
  for (const doc of snap.docs) {
    const d = { id: doc.id, ...doc.data() };
    const pubMs = d.publishedAt?.toDate?.()?.getTime?.() || 0;
    if (pubMs < cutoff) continue;
    if (d.status && d.status !== 'published') continue;
    // Per-publication newsletter: require exact site match. Aggregator
    // newsletter: accept any story.
    if (!isAggregator && publication && Array.isArray(d.sites) && d.sites.length > 0 && !d.sites.includes(publication)) continue;
    // Native and ingested both eligible.
    const articleImage = d.image?.url || null;
    const primarySite = (d.sites && d.sites[0]) || null;
    const fallbackLogo = publicationLogoFor(primarySite);
    candidates.push({
      id: d.id,
      slug: d.slug,
      headline: d.headline,
      deck: d.deck || '',
      // Real article image, with publication-logo fallback so every row
      // in the newsletter has a visual. `imageIsLogo` lets the renderer
      // pick `object-fit:contain` for logos vs `cover` for photos.
      image: articleImage,
      fallbackImage: fallbackLogo,
      imageIsLogo: !articleImage && !!fallbackLogo,
      author: d.author?.name || '',
      section: d.section || '',
      breaking: !!d.breaking,
      featured: !!d.featured,
      views: d.stats?.views || 0,
      publishedAt: pubMs,
      source: d.source || 'native',
      sites: d.sites || [],
      // We need a clickable URL the email client can use. Native stories
      // live at /article/{slug}; ingested keep a link-out URL in `body`
      // or `webBody`. Fall back to the article path either way.
      url: d.source === 'ingested' && d.body
        ? extractFirstHref(d.body) || `/article/${d.slug}`
        : `/article/${d.slug}`,
    });
  }

  // Score: breaking +100, featured +50, +1 per 10 views, +10 recent (<6h),
  // +5 if has image (slight nudge — prettier email).
  const scored = candidates.map(c => {
    let score = 0;
    if (c.breaking) score += 100;
    if (c.featured) score += 50;
    score += Math.min(c.views / 10, 80);
    if (Date.now() - c.publishedAt < 6 * HOUR) score += 10;
    if (c.image) score += 5;
    return { ...c, score };
  }).sort((a, b) => b.score - a.score);

  // Aggregator: enforce per-site diversity so one paper doesn't monopolize
  // the daily roundup. Pick greedily, capping each site at PER_SITE_CAP
  // until we hit the requested count.
  const PER_SITE_CAP = 2;
  let picked;
  if (isAggregator) {
    const seen = new Map();
    picked = [];
    for (const story of scored) {
      const site = (story.sites && story.sites[0]) || '_';
      const used = seen.get(site) || 0;
      if (used >= PER_SITE_CAP) continue;
      picked.push(story);
      seen.set(site, used + 1);
      if (picked.length >= count) break;
    }
    // If we underfilled (e.g. only 3 papers had recent stories), backfill
    // from the remaining scored list ignoring the cap.
    if (picked.length < count) {
      const have = new Set(picked.map(s => s.id));
      for (const story of scored) {
        if (have.has(story.id)) continue;
        picked.push(story);
        if (picked.length >= count) break;
      }
    }
  } else {
    picked = scored.slice(0, count);
  }

  // Lead picker: most viewed at the time of sending, per editor's rule.
  // Fall back to score-based pick when view counts are all zero (common
  // for ingested stories during the first 24h, since views accumulate
  // on wvnews.com but we don't ingest those counts). Then prefer an
  // imaged story for the lead so the email's top block looks complete.
  if (picked.length > 1) {
    const maxViews = picked.reduce((m, s) => Math.max(m, s.views || 0), 0);
    let leadIdx = 0;
    if (maxViews > 0) {
      // True "most viewed" pick.
      leadIdx = picked.findIndex(s => (s.views || 0) === maxViews);
    } else if (!picked[0].image) {
      // No view data — keep the top-scored story unless it lacks an
      // image, in which case promote the first imaged candidate.
      const idx = picked.findIndex(s => s.image);
      if (idx > 0) leadIdx = idx;
    }
    if (leadIdx > 0) {
      const [lead] = picked.splice(leadIdx, 1);
      picked.unshift(lead);
    }
  }

  return picked;
}

// ─── Section grouping ────────────────────────────────────────────────────

// Splits a flat scored story list into per-section buckets ordered by
// SECTION_ORDER. Returns:
//   { lead, groups: [{ id, name, stories: [...] }] }
// Stories in unrecognized sections are bucketed under 'news'.
//
// Within each section, stories are sorted by:
//   1. views DESC — most viewed in that local market floats to the top
//   2. publishedAt DESC — recency is the tiebreaker
// This matches editorial expectations: the section's most-read article
// leads, with the rest in reverse-chronological order.
export function groupBySection(stories, { perSectionMax = 4 } = {}) {
  if (!stories || !stories.length) return { lead: null, groups: [] };

  const [lead, ...rest] = stories;

  // Bucket
  const buckets = new Map();
  for (const id of SECTION_ORDER) buckets.set(id, []);
  for (const s of rest) {
    let id = s.section || 'news';
    if (!buckets.has(id)) id = 'news';
    buckets.get(id).push(s);
  }

  // Sort each bucket: views DESC, publishedAt DESC.
  for (const list of buckets.values()) {
    list.sort((a, b) => {
      const dv = (b.views || 0) - (a.views || 0);
      if (dv !== 0) return dv;
      return (b.publishedAt || 0) - (a.publishedAt || 0);
    });
  }

  // Build ordered groups (skip empties, cap per-section count)
  const groups = [];
  for (const id of SECTION_ORDER) {
    const list = buckets.get(id) || [];
    if (!list.length) continue;
    groups.push({
      id,
      name: SECTION_LABELS[id] || id,
      stories: list.slice(0, perSectionMax),
    });
  }
  return { lead, groups };
}

function extractFirstHref(html) {
  if (!html) return null;
  const m = /href=["']([^"']+)["']/i.exec(html);
  return m ? m[1] : null;
}

// ─── Ad selection ─────────────────────────────────────────────────────────

// Active ads with uploaded artwork. We pull from the CRM's `orders`
// collection (owned by crm/) and filter to digital orders that have
// artworkUrl set. Each ad is shown once per email; we don't repeat in a
// single newsletter.
export async function selectAdsForNewsletter({ count = 2, publication = 'wvnews' } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const snap = await db.collection('orders')
    .orderBy('updatedAt', 'desc')
    .limit(150)
    .get();

  const ads = [];
  for (const doc of snap.docs) {
    const o = doc.data();
    if (!o.artworkUrl) continue;
    if (o.type && !['Digital', 'Print', 'Legal', 'Classified'].includes(o.type)) continue;
    if (o.status && /cancel|expired|complete/i.test(o.status)) continue;
    // Date guard: skip if endDate is in the past
    if (o.endDate && o.endDate < today) continue;
    if (o.startDate && o.startDate > today) continue;

    ads.push({
      id: doc.id,
      adNum: o.adNum || doc.id,
      advertiser: o.aname || o.advertiser || 'Sponsor',
      imageUrl: o.artworkUrl,
      // Click URL — fall back to a safe default that opens advertiser
      // search on the public site if we don't have an explicit one.
      linkUrl: o.clickUrl || o.advertiserUrl || `https://wvnews.com/advertisers/${encodeURIComponent(o.aname || '')}`,
      // For email layout — assume we don't know exact dimensions; CSS
      // max-width keeps things sane.
    });
    if (ads.length >= count) break;
  }
  return ads;
}

// ─── HTML template ────────────────────────────────────────────────────────

// Email-safe HTML. Table layout, inline styles, max-width 600px (gmail
// renders 640px before clipping), system serif/sans pairing for fallback
// (most clients ignore web fonts).
//
// Structure:
//   masthead (logo + date + edition)
//   lead story (image + headline + deck + button)
//   ad #1 (banner)
//   secondary stories (4-5 title + deck rows)
//   ad #2 (banner)
//   tail stories (3-4 title-only)
//   footer (unsubscribe + about)

export function renderNewsletterHtml({
  publication,                // { id, name, domain, ... }
  stories,                    // [story] — flat scored list; lead is index 0
  ads,                        // [ad]   — rotates if there are more story-gaps than ads
  adCadence = 3,              // insert an ad after every N stories
  date = new Date(),
  siteBaseUrl = 'https://wvnews.com',
  unsubscribeUrl = '%%unsubscribe_url%%',  // CC merge tag
  preferencesUrl = '%%preferences_url%%',  // CC merge tag
  sectioned = true,           // render section headers between groups
} = {}) {
  // Group stories by section so the email reads "News … Sports …
  // Opinion …" instead of one undifferentiated river. Lead floats above.
  const grouped = sectioned ? groupBySection(stories) : { lead: stories[0], groups: [{ id: 'all', name: '', stories: stories.slice(1) }] };
  const lead = grouped.lead;

  const niceDate = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const editionName = publication?.name || 'WV News';
  const accent = '#0f1d3d';
  const gold = '#c08f2e';

  // Walk every section's stories in order, render rows, and insert an
  // ad row every `adCadence` stories. We rotate through `ads` so we
  // never leave a gap empty even if CRM has fewer ad orders than slots.
  let storyCounter = 0;
  let adIdx = 0;
  const adsAvailable = (ads && ads.length) ? ads : [];
  const sectionsHtml = grouped.groups.map(group => {
    const rows = [];
    if (sectioned && group.name) rows.push(renderSectionHeader(group.name, accent));
    for (const story of group.stories) {
      rows.push(renderSecondaryRow(story, siteBaseUrl, accent));
      storyCounter++;
      if (adCadence > 0 && adsAvailable.length && storyCounter % adCadence === 0) {
        const ad = adsAvailable[adIdx % adsAvailable.length];
        adIdx++;
        rows.push(renderAdRow(ad));
      }
    }
    return rows.join('\n');
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(editionName)} — ${niceDate}</title>
  <style>
    @media only screen and (max-width: 620px) {
      table.email-shell { width: 100% !important; }
      td.padcol         { padding-left: 16px !important; padding-right: 16px !important; }
      img.full-width    { width: 100% !important; height: auto !important; }
      h1.lead-headline  { font-size: 26px !important; line-height: 1.15 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f4f6;font-family:Georgia,'Times New Roman',serif;color:#1f2429;">
  <!-- preheader: shown in inbox preview, hidden in body -->
  <div style="display:none;visibility:hidden;opacity:0;height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f4f6;">
    ${escapeHtml(lead?.deck || lead?.headline || 'The latest news from ' + editionName)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f6;">
    <tr><td align="center" style="padding:24px 12px;">

      <table role="presentation" class="email-shell" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e3e5ea;">

        <!-- Masthead — logo if available, wordmark fallback. Big enough
             to read like a real newspaper flag at the top of the email,
             not a tiny brand bug. -->
        <tr><td class="padcol" style="padding:28px 32px 22px;border-bottom:3px solid ${accent};">
          <table role="presentation" width="100%"><tr>
            <td valign="middle" style="font-family:Georgia,serif;font-size:30px;font-weight:700;color:${accent};letter-spacing:-0.01em;">
              ${publication?.logoFile
                ? `<img src="${escapeAttr(absoluteAsset(siteBaseUrl, publication.logoFile))}" alt="${escapeAttr(editionName)}" height="72" style="display:block;height:72px;max-height:72px;width:auto;border:0;">`
                : escapeHtml(editionName)}
            </td>
            <td valign="middle" align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6a6f76;">
              ${niceDate}
            </td>
          </tr></table>
        </td></tr>

        <!-- Lead story (most viewed at time of send; falls back to top-scored).
             Lead always shows an image: real article photo if present,
             else publication logo, else a colored placeholder. -->
        ${lead ? `
        <tr><td class="padcol" style="padding:28px 32px 8px;">
          <a href="${absUrl(siteBaseUrl, lead.url)}" style="text-decoration:none;color:inherit;">
            ${renderLeadImage(lead, siteBaseUrl, accent)}
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:6px;">
              ${lead.breaking ? '<span style="color:#c0392b;">● Breaking</span> &nbsp;·&nbsp; ' : ''}Top story
              ${lead.section ? ` &nbsp;·&nbsp; ${escapeHtml(SECTION_LABELS[lead.section] || lead.section)}` : ''}
            </div>
            <h1 class="lead-headline" style="font-family:Georgia,serif;font-size:30px;font-weight:700;line-height:1.12;margin:0 0 10px;color:${accent};letter-spacing:-0.01em;">
              ${escapeHtml(lead.headline)}
            </h1>
            ${lead.deck ? `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#3a3f45;margin:0 0 14px;">${escapeHtml(lead.deck)}</p>` : ''}
            ${lead.author ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6a6f76;margin-bottom:12px;">By <span style="color:#3a3f45;font-weight:600;">${escapeHtml(lead.author)}</span></div>` : ''}
          </a>
          <a href="${absUrl(siteBaseUrl, lead.url)}" style="display:inline-block;padding:10px 20px;background:${accent};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
            Read the full story →
          </a>
        </td></tr>` : ''}

        <!-- Section blocks (News / Sports / Opinion / etc), ads interleaved every N -->
        ${sectionsHtml}

        <!-- Closing CTA -->
        <tr><td class="padcol" align="center" style="padding:28px 32px 32px;border-top:1px solid #e3e5ea;background:#fbfbfd;">
          <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:${accent};margin-bottom:6px;">
            Read more on ${escapeHtml(publication?.domain || 'wvnews.com')}
          </div>
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#3a3f45;margin:0 0 14px;">
            Local journalism that holds power to account.
          </p>
          <a href="${siteBaseUrl}/subscribe" style="display:inline-block;padding:10px 22px;background:${gold};color:${accent};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
            Become a subscriber
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td class="padcol" style="padding:20px 32px;background:${accent};color:#cdd2dc;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;">
          <div style="margin-bottom:8px;">
            <strong style="color:#ffffff;">${escapeHtml(editionName)}</strong> — ${niceDate}
          </div>
          <div style="margin-bottom:8px;">
            You're receiving this because you signed up for the ${escapeHtml(editionName)} daily briefing.
          </div>
          <div>
            <a href="${preferencesUrl}" style="color:#cdd2dc;text-decoration:underline;">Manage preferences</a>
            &nbsp;·&nbsp;
            <a href="${unsubscribeUrl}" style="color:#cdd2dc;text-decoration:underline;">Unsubscribe</a>
            &nbsp;·&nbsp;
            <a href="${siteBaseUrl}" style="color:#cdd2dc;text-decoration:underline;">Visit site</a>
          </div>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

// Lead image — full-bleed photo if the article has one. Falls back to
// the publication logo on a brand-tinted background, then to a plain
// brand-color placeholder. Always renders something so the lead block
// never looks half-empty.
function renderLeadImage(story, siteBaseUrl, accent) {
  if (story.image) {
    return `<img class="full-width" src="${escapeAttr(story.image)}" alt="" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;margin-bottom:14px;">`;
  }
  if (story.fallbackImage) {
    const logoUrl = absoluteAsset(siteBaseUrl, story.fallbackImage);
    return `<table role="presentation" width="100%" style="margin-bottom:14px;border-collapse:collapse;"><tr><td align="center" style="padding:64px 24px;background:${accent};">
      <img src="${escapeAttr(logoUrl)}" alt="" height="80" style="display:block;height:80px;width:auto;border:0;margin:0 auto;">
    </td></tr></table>`;
  }
  return `<div style="height:160px;background:${accent};margin-bottom:14px;"></div>`;
}

// Section header — small uppercase eyebrow + thin gold underline so the
// reader's eye catches the section break without it shouting.
function renderSectionHeader(name, accent) {
  return `
        <tr><td class="padcol" style="padding:30px 32px 6px;">
          <div style="border-top:2px solid ${accent};padding-top:12px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${accent};">
              ${escapeHtml(name)}
            </div>
          </div>
        </td></tr>`;
}

function renderAdRow(ad) {
  return `
        <tr><td class="padcol" align="center" style="padding:18px 32px;background:#fbfbfd;border-top:1px solid #e3e5ea;border-bottom:1px solid #e3e5ea;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#97a0aa;margin-bottom:8px;">
            Advertisement
          </div>
          <a href="${escapeAttr(ad.linkUrl)}" style="text-decoration:none;">
            <img class="full-width" src="${escapeAttr(ad.imageUrl)}" alt="${escapeAttr(ad.advertiser || 'Sponsor')}" style="display:block;max-width:536px;height:auto;border:0;margin:0 auto;">
          </a>
        </td></tr>`;
}

function renderSecondaryRow(story, siteBaseUrl, accent) {
  // Always show an image column. Real photo > publication logo (with
  // tinted background + contain so the brand mark isn't cropped) > a
  // plain brand-color block. Keeps every row visually balanced.
  let thumbCell;
  if (story.image) {
    thumbCell = `
              <td valign="top" align="right" width="160" style="width:160px;">
                <img src="${escapeAttr(story.image)}" alt="" width="160" height="110" style="display:block;width:160px;height:110px;object-fit:cover;border:0;">
              </td>`;
  } else if (story.fallbackImage) {
    const logoUrl = absoluteAsset(siteBaseUrl, story.fallbackImage);
    thumbCell = `
              <td valign="top" align="right" width="160" style="width:160px;">
                <table role="presentation" width="160" height="110" style="width:160px;height:110px;border-collapse:collapse;"><tr><td align="center" valign="middle" style="background:${accent};width:160px;height:110px;">
                  <img src="${escapeAttr(logoUrl)}" alt="" height="56" style="display:block;height:56px;width:auto;max-width:140px;border:0;margin:0 auto;">
                </td></tr></table>
              </td>`;
  } else {
    thumbCell = `
              <td valign="top" align="right" width="160" style="width:160px;">
                <div style="width:160px;height:110px;background:${accent};"></div>
              </td>`;
  }
  return `
        <tr><td class="padcol" style="padding:16px 32px;border-top:1px solid #e3e5ea;">
          <a href="${absUrl(siteBaseUrl, story.url)}" style="text-decoration:none;color:inherit;display:block;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td valign="top" style="padding-right:14px;">
                ${story.section ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:4px;">${escapeHtml(SECTION_LABELS[story.section] || story.section)}</div>` : ''}
                <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;line-height:1.25;color:${accent};margin-bottom:4px;">
                  ${escapeHtml(story.headline)}
                </div>
                ${story.deck ? `<p style="font-family:Georgia,serif;font-size:14px;line-height:1.5;color:#3a3f45;margin:0 0 4px;">${escapeHtml(story.deck)}</p>` : ''}
                ${story.author ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6a6f76;">By ${escapeHtml(story.author)}</div>` : ''}
              </td>
              ${thumbCell}
            </tr></table>
          </a>
        </td></tr>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
function escapeAttr(s) {
  return String(s ?? '').replace(/[&"<>]/g, c => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[c]);
}
function absUrl(base, path) {
  if (!path) return base;
  if (/^https?:/i.test(path)) return path;
  if (path.startsWith('/')) return `${base}${path}`;
  return path;
}

// Logo files like "/logo-wvnews.png" live in the platform's public/ dir.
// Each publication's email is sent with siteBaseUrl set to its own
// domain (e.g. https://theet.com), but the asset is hosted on the
// platform — so we resolve assets against the platform host explicitly
// rather than the per-publication base.
function absoluteAsset(siteBaseUrl, assetPath) {
  if (!assetPath) return '';
  if (/^https?:/i.test(assetPath)) return assetPath;
  // Hard-coded fallback for now — logos always live with the platform.
  // When publications get their own asset CDNs we can switch to a per-
  // publication map.
  const platformBase = process.env.NEXT_PUBLIC_SITE_URL
    || (typeof siteBaseUrl === 'string' ? siteBaseUrl : 'https://wvnews-platform-lgg2.vercel.app');
  return `${platformBase}${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
}
