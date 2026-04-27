// Role + permission model for the admin surface.
//
// Module keys are the unit of permission — one per admin nav item and route
// group. A user's effective permissions are:
//   1. Explicit overrides on their users/{uid} doc (`permissions` array), OR
//   2. The role's default permission set (if no explicit list is set)
//
// The UI shows the admin their role with suggested defaults, and lets them
// deviate per-user via checkboxes if needed. Server-side guards check the
// effective list regardless — hiding a nav item is just UX, not security.

export const MODULES = [
  { key: 'dashboard',    label: 'Dashboard',           icon: '📊', href: '/admin',                  description: 'Role-aware home' },
  { key: 'stories',      label: 'Stories',             icon: '📝', href: '/admin/stories',          description: 'Create + edit stories' },
  { key: 'mediadesk',    label: 'Media Desk',          icon: '📡', href: '/admin/mediadesk',        description: 'Live WV news feed + trending' },
  { key: 'layout',       label: 'Layout Builder',      icon: '🧱', href: '/admin/layout-builder',   description: 'Home/section layout' },
  { key: 'media',        label: 'Media Library',       icon: '📸', href: '/admin/media',            description: 'Photos, videos, assets' },
  { key: 'budget',       label: 'Editorial Budget',    icon: '📋', href: '/admin/budget',           description: 'Newsroom planning' },
  { key: 'analytics',    label: 'Analytics',           icon: '📈', href: '/admin/analytics',        description: 'Traffic + engagement' },
  { key: 'airewriter',   label: 'AI Rewriter',         icon: '✍️', href: '/admin/ai-rewriter',      description: 'Rewrite for SEO / voice' },
  { key: 'newsletters',  label: 'Newsletters',         icon: '✉️', href: '/admin/newsletters',      description: 'Email campaigns' },
  { key: 'social',       label: 'Social Media',        icon: '📱', href: '/admin/social',           description: 'Multi-platform posting' },
  { key: 'forms',        label: 'Forms & Submissions', icon: '📝', href: '/admin/forms',            description: 'Self-serve submissions queue' },
  { key: 'pricing',      label: 'Self-Serve Pricing',  icon: '💵', href: '/admin/pricing',          description: 'Obit/classified/legal rates' },
  { key: 'contests',     label: 'Contests',            icon: '🏆', href: '/admin/contests',         description: 'Best Of + sweepstakes + photos' },
  { key: 'ads',          label: 'Advertising & GAM',   icon: '💰', href: '/admin/ads',              description: 'Ad orders + GAM trafficking' },
  { key: 'subscribers',  label: 'Subscribers',         icon: '👥', href: '/admin/subscribers',      description: 'Subscription database' },
  { key: 'eedition',     label: 'E-Edition',           icon: '📰', href: '/admin/e-edition',        description: 'Digital paper uploads' },
  { key: 'sites',        label: 'Sites & Domains',     icon: '🌐', href: '/admin/sites',            description: 'Multi-publication config' },
  { key: 'seo',          label: 'SEO & AI',            icon: '🤖', href: '/admin/seo',              description: 'SEO audit + AI tools' },
  { key: 'import',       label: 'Import Content',      icon: '📥', href: '/admin/import',           description: 'Bulk content import' },
  { key: 'settings',     label: 'Settings',            icon: '⚙️', href: '/admin/settings',         description: 'Platform settings' },
  { key: 'users',        label: 'Users & Permissions', icon: '🔐', href: '/admin/users',            description: 'Manage who sees what' },
];

// All module keys — convenience for "admin" role.
export const ALL_MODULES = MODULES.map(m => m.key);

// Role → default permissions for the PLATFORM app's modules.
// Same role names are used in `crm/` and `printmanager/` (via SCHEMAS.md);
// each app maps the role to its OWN module set. So a sales_manager has
// rich access in CRM but minimal access in platform.
//
// SCHEMAS.md is the canonical contract for which roles exist and what
// they mean across all three apps. Keep this in sync.
export const ROLE_DEFAULTS = {
  // ─── Universal ─────────────────────────────────────────────────────
  admin: ALL_MODULES,

  // ─── Platform / editorial ─────────────────────────────────────────
  editor: [
    'dashboard', 'stories', 'mediadesk', 'layout', 'media', 'budget',
    'analytics', 'airewriter', 'newsletters', 'social', 'forms',
    'contests', 'eedition', 'sites', 'seo', 'import', 'settings',
  ],
  reporter: [
    'dashboard', 'stories', 'mediadesk', 'media', 'budget',
    'airewriter', 'analytics',
  ],

  // ─── CRM / sales ──────────────────────────────────────────────────
  // These roles primarily live in crm/. In platform/ they get a slim
  // dashboard + the ads module so they can see the production queue.
  sales_manager: ['dashboard', 'ads', 'pricing', 'analytics', 'contests'],
  sales_rep:     ['dashboard', 'ads', 'forms'],
  ad_taker:      ['dashboard', 'ads', 'forms'],

  // ─── Circulation / PrintManager ───────────────────────────────────
  // These roles primarily live in printmanager/. Platform exposes only
  // the subscribers nav so they can cross-check digital records.
  circulation_manager: ['dashboard', 'subscribers', 'analytics'],
  circulation_clerk:   ['dashboard', 'subscribers'],

  // ─── Production / creative ───────────────────────────────────────
  designer: ['dashboard', 'ads', 'media', 'eedition', 'layout'],

  // ─── Read-only ────────────────────────────────────────────────────
  viewer: ['dashboard', 'analytics'],

  // ─── Custom ───────────────────────────────────────────────────────
  // Rely entirely on the explicit `permissions` array on the user doc.
  custom: [],
};

// Legacy role names that may still exist on user docs from earlier
// development. Resolve them to the canonical role at read time so we
// don't have to migrate Firestore data immediately.
const LEGACY_ROLE_ALIASES = {
  salesrep: 'sales_rep',     // platform's pre-canonical naming
  manager: 'sales_manager',  // CRM's pre-canonical naming
  rep: 'sales_rep',          // CRM's pre-canonical naming
  adtaker: 'ad_taker',       // CRM's pre-canonical naming
};

export function canonicalRole(role) {
  if (!role) return 'reporter';
  return LEGACY_ROLE_ALIASES[role] || role;
}

// Resolve what a user actually sees. Explicit `permissions` on the user doc
// wins entirely when set; otherwise fall back to the role's defaults.
export function effectivePermissions(profile) {
  if (!profile) return [];
  if (Array.isArray(profile.permissions) && profile.permissions.length > 0) {
    return profile.permissions;
  }
  return ROLE_DEFAULTS[canonicalRole(profile.role)] || ROLE_DEFAULTS.reporter;
}

export function hasPermission(profile, moduleKey) {
  return effectivePermissions(profile).includes(moduleKey);
}

// Resolve the admin nav for a given profile — ordered list of visible items.
// Called from AdminShell after the server passes the user down.
export function visibleNavItems(profile) {
  const allowed = new Set(effectivePermissions(profile));
  return MODULES.filter(m => allowed.has(m.key));
}

// External apps in the WV News stack. Surfaced in the admin sidebar so
// staff who work across modules can hop between them. Visibility is driven
// by canonical role — see SCHEMAS.md for which roles primarily live where.
export const EXTERNAL_APPS = [
  {
    key: 'crm',
    label: 'CRM',
    icon: '💼',
    href: 'https://wvnews-crm.vercel.app',
    description: 'Sales, advertisers, ad orders',
    roles: ['admin', 'sales_manager', 'sales_rep', 'ad_taker', 'designer', 'editor', 'circulation_manager'],
  },
  {
    key: 'printmanager',
    label: 'PrintManager',
    icon: '🚚',
    href: 'https://printmanager.vercel.app',
    description: 'Subscribers, carriers, renewals',
    roles: ['admin', 'circulation_manager', 'circulation_clerk', 'sales_manager', 'editor'],
  },
];

export function visibleExternalApps(profile) {
  const role = canonicalRole(profile?.role);
  return EXTERNAL_APPS.filter(app => app.roles.includes(role));
}

// Map path → module key so server guards can check by request path.
// Returns null for paths that aren't module-gated (e.g. /admin itself).
export function moduleKeyForPath(pathname) {
  if (!pathname || !pathname.startsWith('/admin')) return null;
  if (pathname === '/admin' || pathname === '/admin/') return 'dashboard';
  // Find the longest-prefix match so /admin/stories/[id]/edit → stories.
  const segments = pathname.slice('/admin/'.length).split('/').filter(Boolean);
  if (!segments.length) return 'dashboard';
  const first = segments[0];
  const mapping = {
    'stories': 'stories',
    'mediadesk': 'mediadesk',
    'media': 'media',
    'budget': 'budget',
    'analytics': 'analytics',
    'ai-rewriter': 'airewriter',
    'newsletters': 'newsletters',
    'social': 'social',
    'forms': 'forms',
    'pricing': 'pricing',
    'contests': 'contests',
    'ads': 'ads',
    'subscribers': 'subscribers',
    'e-edition': 'eedition',
    'sites': 'sites',
    'seo': 'seo',
    'import': 'import',
    'settings': 'settings',
    'users': 'users',
    'layout-builder': 'layout',
    'signin': null, // always accessible
  };
  return mapping[first] || null;
}
