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

const HOUR = 3600_000;

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
    candidates.push({
      id: d.id,
      slug: d.slug,
      headline: d.headline,
      deck: d.deck || '',
      image: d.image?.url || null,
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

  // Promote a story with an image to the lead position if the current
  // lead has none — readers expect the top of the email to look complete.
  if (picked.length > 1 && !picked[0].image) {
    const firstWithImage = picked.findIndex(s => s.image);
    if (firstWithImage > 0) {
      const [withImage] = picked.splice(firstWithImage, 1);
      picked.unshift(withImage);
    }
  }

  return picked;
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
  stories,                    // [story]
  ads,                        // [ad]
  date = new Date(),
  siteBaseUrl = 'https://wvnews.com',
  unsubscribeUrl = '%%unsubscribe_url%%',  // CC merge tag
  preferencesUrl = '%%preferences_url%%',  // CC merge tag
} = {}) {
  const [lead, ...rest] = stories;
  const secondary = rest.slice(0, 5);
  const tail = rest.slice(5, 9);
  const adA = ads[0] || null;
  const adB = ads[1] || null;

  const niceDate = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const editionName = publication?.name || 'WV News';
  const accent = '#0f1d3d';
  const gold = '#c08f2e';

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

        <!-- Masthead -->
        <tr><td class="padcol" style="padding:24px 32px 18px;border-bottom:3px solid ${accent};">
          <table role="presentation" width="100%"><tr>
            <td style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:${accent};letter-spacing:-0.01em;">
              ${escapeHtml(editionName)}
            </td>
            <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6a6f76;">
              ${niceDate}
            </td>
          </tr></table>
        </td></tr>

        <!-- Lead story -->
        ${lead ? `
        <tr><td class="padcol" style="padding:28px 32px 8px;">
          <a href="${absUrl(siteBaseUrl, lead.url)}" style="text-decoration:none;color:inherit;">
            ${lead.image ? `
            <img class="full-width" src="${escapeAttr(lead.image)}" alt="" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;margin-bottom:14px;">
            ` : ''}
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:6px;">
              ${lead.breaking ? '<span style="color:#c0392b;">● Breaking</span> &nbsp;·&nbsp; ' : ''}${escapeHtml(lead.section || 'News')}
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

        <!-- Ad slot A -->
        ${adA ? renderAdRow(adA) : ''}

        <!-- Section divider -->
        <tr><td class="padcol" style="padding:28px 32px 4px;border-top:1px solid #e3e5ea;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6a6f76;">
            More from ${escapeHtml(editionName)}
          </div>
        </td></tr>

        <!-- Secondary stories -->
        ${secondary.map(s => renderSecondaryRow(s, siteBaseUrl, accent)).join('\n')}

        <!-- Ad slot B -->
        ${adB ? renderAdRow(adB) : ''}

        <!-- Tail stories — title-only -->
        ${tail.length ? `
        <tr><td class="padcol" style="padding:24px 32px 8px;border-top:1px solid #e3e5ea;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6a6f76;margin-bottom:14px;">
            Also today
          </div>
          ${tail.map(s => `
          <div style="margin-bottom:12px;">
            <a href="${absUrl(siteBaseUrl, s.url)}" style="font-family:Georgia,serif;font-size:16px;font-weight:600;line-height:1.3;color:${accent};text-decoration:none;">
              ${escapeHtml(s.headline)}
            </a>
            ${s.author ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6a6f76;margin-top:2px;">By ${escapeHtml(s.author)}</div>` : ''}
          </div>`).join('')}
        </td></tr>` : ''}

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
  return `
        <tr><td class="padcol" style="padding:16px 32px;border-top:1px solid #e3e5ea;">
          <a href="${absUrl(siteBaseUrl, story.url)}" style="text-decoration:none;color:inherit;display:block;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td valign="top" style="padding-right:14px;">
                ${story.section ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:4px;">${escapeHtml(story.section)}</div>` : ''}
                <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;line-height:1.25;color:${accent};margin-bottom:4px;">
                  ${escapeHtml(story.headline)}
                </div>
                ${story.deck ? `<p style="font-family:Georgia,serif;font-size:14px;line-height:1.5;color:#3a3f45;margin:0 0 4px;">${escapeHtml(story.deck)}</p>` : ''}
                ${story.author ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6a6f76;">By ${escapeHtml(story.author)}</div>` : ''}
              </td>
              ${story.image ? `
              <td valign="top" align="right" width="120" style="width:120px;">
                <img src="${escapeAttr(story.image)}" alt="" width="120" height="80" style="display:block;width:120px;height:80px;object-fit:cover;border:0;">
              </td>` : ''}
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
