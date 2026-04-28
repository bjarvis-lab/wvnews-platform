// /admin/site — focused site customization. Replaces the speculative
// layout builder with the narrow set of knobs editors actually need:
//
//   - Masthead/banner image upload (renders at top of public homepage)
//   - Featured sections (which sections + order to spotlight)
//   - Sidebar toggles (weather / newsletter / most-read / services)
//
// The opinionated Atlantic-clean / Globe-clean homepage layout stays
// hardcoded; this page customizes what plugs into it.

import SiteSettingsClient from './SiteSettingsClient';
import { sites, sections } from '@/data/mock';
import { requireAdmin } from '@/lib/auth-server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  masthead: { imageUrl: '', altText: '', linkUrl: '/', bgColor: '' },
  featuredSections: ['news', 'sports', 'opinion', 'business', 'community'],
  sidebar: {
    showWeather: true,
    showNewsletter: true,
    showMostRead: true,
    showReaderServices: true,
  },
};

async function loadSettings(siteId) {
  const id = `site-${siteId}`;
  try {
    const snap = await db.collection('settings').doc(id).get();
    if (!snap.exists) return DEFAULT_SETTINGS;
    const data = snap.data();
    return { ...DEFAULT_SETTINGS, ...data, sidebar: { ...DEFAULT_SETTINGS.sidebar, ...(data.sidebar || {}) } };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default async function SiteCustomizationPage({ searchParams }) {
  const user = await requireAdmin();
  const siteId = searchParams?.site || 'wvnews';
  const initial = await loadSettings(siteId);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-ink-900">Site Customization</h2>
        <p className="text-sm text-ink-500 mt-0.5">
          Configure the masthead, featured sections, and sidebar widgets for the public homepage.
          The page layout itself is opinionated — these are the knobs that plug into it.
        </p>
      </div>
      <SiteSettingsClient
        sites={sites}
        sections={sections}
        initialSiteId={siteId}
        initialSettings={initial}
      />
    </div>
  );
}
