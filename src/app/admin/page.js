// Admin dashboard — server component. Renders a different view per role:
//   - reporter: their stories, their pageviews (last 7d/30d), drafts in progress
//   - editor: newsroom-wide rollup, top reporters, top stories, section breakdown
//   - salesrep: ad order queue, self-serve submission queue
//   - admin: editor view + system health (GA4 / Firebase / Anthropic / GAM)
//
// GA4 Data API powers pageview numbers. When it isn't authorized yet
// (service account needs Viewer access on the GA4 property), the dashboard
// still renders with story-side data and surfaces a "Connect GA4" hint.

import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-server';
import { reporterDashboard, editorDashboard, salesDashboard, checkGA4 } from '@/lib/dashboard-stats';
import { GAM_IS_LIVE } from '@/lib/gam-config';
import { GA4_IS_LIVE } from '@/lib/ga-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const profile = user.profile;
  const role = profile?.role || 'reporter';

  if (role === 'reporter') return <ReporterView profile={profile} />;
  if (role === 'salesrep') return <SalesView profile={profile} />;
  // editor + admin + designer + custom all see the editor view by default
  return <EditorView profile={profile} role={role} />;
}

// ─── Reporter view ────────────────────────────────────────────────────
async function ReporterView({ profile }) {
  const data = await reporterDashboard({ email: profile.email, days: 7 });

  return (
    <div className="space-y-6">
      <Header
        title={`Welcome, ${(profile.name || 'reporter').split(' ')[0]}.`}
        subtitle="Your work over the last 7 days. Click any story to edit."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Published (all-time)" value={data.totals.published} />
        <StatCard label="Drafts" value={data.totals.drafts} />
        <StatCard
          label="Pageviews · 7d"
          value={data.totals.totalRecentViews ?? '—'}
          hint={data.totals.totalRecentViews == null ? 'GA4 not yet connected' : 'on your stories'}
          accent
        />
        <StatCard label="Avg per story" value={
          data.totals.totalRecentViews && data.totals.published
            ? Math.round(data.totals.totalRecentViews / data.totals.published).toLocaleString()
            : '—'
        } />
      </div>

      {!data.ga4Ok && <Ga4Notice error={data.ga4Error} />}

      <Panel title="Your top stories (last 7 days)">
        {data.topStories.length === 0 ? (
          <Empty text="You haven't published anything yet. Click + New Story up top." />
        ) : (
          <StoryList stories={data.topStories} showViews={data.ga4Ok} />
        )}
      </Panel>

      <Panel title={`Drafts (${data.drafts.length})`}>
        {data.drafts.length === 0 ? (
          <Empty text="No drafts in progress." />
        ) : (
          <StoryList stories={data.drafts} showViews={false} draft />
        )}
      </Panel>

      <Panel title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <ActionLink href="/admin/stories?new=1">+ New Story</ActionLink>
          <ActionLink href="/admin/mediadesk">📡 Media Desk</ActionLink>
          <ActionLink href="/admin/stories">📝 All Stories</ActionLink>
        </div>
      </Panel>
    </div>
  );
}

// ─── Editor view ──────────────────────────────────────────────────────
async function EditorView({ profile, role }) {
  const [data, sysGA4] = await Promise.all([
    editorDashboard({ days: 7 }),
    role === 'admin' ? checkGA4() : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <Header
        title={`Good day${profile.name ? `, ${profile.name.split(' ')[0]}` : ''}.`}
        subtitle="Newsroom snapshot — last 7 days."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total pageviews · 7d" value={data.totals.totalRecentViews?.toLocaleString() ?? '—'} accent />
        <StatCard label="Published stories" value={data.totals.published} />
        <StatCard label="Drafts in flight" value={data.totals.drafts} />
        <StatCard label="Active reporters" value={data.topReporters.filter(r => r.stories > 0).length} />
      </div>

      {!data.ga4Ok && <Ga4Notice error={data.ga4Error} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Top stories · 7d">
          {data.topStories.length === 0 ? (
            <Empty text="No published stories yet." />
          ) : (
            <StoryList stories={data.topStories} showViews={data.ga4Ok} />
          )}
        </Panel>

        <Panel title="Top reporters · 7d">
          {data.topReporters.length === 0 ? (
            <Empty text="No author data yet." />
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.topReporters.map((r, i) => (
                <li key={r.email || r.name} className="py-2.5 flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-bold text-ink-400">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink-900 truncate">{r.name}</div>
                    <div className="text-xs text-ink-500 truncate">{r.email || '—'}</div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="text-sm font-bold text-ink-900">
                      {data.ga4Ok ? r.views.toLocaleString() : '—'}
                    </div>
                    <div className="text-[10px] text-ink-500">{r.stories} {r.stories === 1 ? 'story' : 'stories'}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Sections by traffic">
        {data.sections.length === 0 ? (
          <Empty text="No section data yet." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.sections.map(s => (
              <li key={s.section} className="py-2 flex items-center gap-3">
                <span className="text-sm font-semibold text-ink-800 capitalize">{s.section}</span>
                <span className="flex-1 text-xs text-ink-500">{s.stories} {s.stories === 1 ? 'story' : 'stories'}</span>
                <span className="text-sm font-bold text-ink-900">{data.ga4Ok ? s.views.toLocaleString() : '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {role === 'admin' && (
        <Panel title="System status">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <SysRow label="Firebase / Firestore" ok={true} hint="Always connected when admin loads" />
            <SysRow label="GA4 Data API" ok={!!sysGA4?.ok} hint={sysGA4?.error || `Property ${sysGA4?.propertyId || 'not configured'}`} />
            <SysRow label="GAM (ad serving)" ok={GAM_IS_LIVE} hint={GAM_IS_LIVE ? 'Network configured' : 'NEXT_PUBLIC_GAM_NETWORK_ID not set'} />
            <SysRow label="GA4 client tracking" ok={GA4_IS_LIVE} hint={GA4_IS_LIVE ? 'gtag.js loading on public pages' : 'NEXT_PUBLIC_GA4_MEASUREMENT_ID not set'} />
          </div>
        </Panel>
      )}
    </div>
  );
}

// ─── Sales view ───────────────────────────────────────────────────────
async function SalesView({ profile }) {
  const data = await salesDashboard();

  return (
    <div className="space-y-6">
      <Header
        title={`Good day${profile.name ? `, ${profile.name.split(' ')[0]}` : ''}.`}
        subtitle="Ad sales pipeline + inbound submissions."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active CRM orders" value={data.orders.total} />
        <StatCard label="Awaiting artwork" value={data.orders.pendingArtwork} accent />
        <StatCard label="Submissions to review" value={data.submissions.pendingReview} />
        <StatCard label="Awaiting payment" value={data.submissions.awaitingPayment} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/ads" className="block bg-white p-5 rounded-xl border border-ink-200 hover:border-brand-400 transition-colors">
          <div className="text-2xl mb-2">💰</div>
          <div className="font-display font-bold text-ink-900">Ad Production Queue →</div>
          <div className="text-sm text-ink-600 mt-1">Live CRM orders that need artwork.</div>
        </Link>
        <Link href="/admin/forms" className="block bg-white p-5 rounded-xl border border-ink-200 hover:border-brand-400 transition-colors">
          <div className="text-2xl mb-2">📝</div>
          <div className="font-display font-bold text-ink-900">Submissions Queue →</div>
          <div className="text-sm text-ink-600 mt-1">Obits, classifieds, legals — review + bill.</div>
        </Link>
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────
function Header({ title, subtitle }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h2 className="text-2xl font-display font-bold text-ink-900">{title}</h2>
        {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        <Link href="/admin/stories?new=1" className="px-3 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">
          + New Story
        </Link>
        <Link href="/admin/mediadesk" className="px-3 py-2 bg-white text-ink-700 text-sm font-medium rounded-lg border border-ink-200 hover:bg-ink-50">
          📡 Media Desk
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, accent }) {
  return (
    <div className={`rounded-xl p-5 border ${accent ? 'bg-brand-50 border-brand-200' : 'bg-white border-ink-200'}`}>
      <div className="text-xs font-medium text-ink-500 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-ink-900 mt-1">{value}</div>
      {hint && <div className="text-xs text-ink-500 mt-1">{hint}</div>}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-ink-200">
      <div className="px-5 py-4 border-b border-ink-100">
        <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StoryList({ stories, showViews, draft }) {
  return (
    <ul className="divide-y divide-ink-100">
      {stories.map(s => (
        <li key={s.id} className="py-3">
          <Link href={`/admin/stories?edit=${s.id}`} className="flex items-start gap-3 group">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-ink-900 group-hover:text-brand-700 leading-snug truncate">{s.headline}</div>
              <div className="text-xs text-ink-500 mt-0.5">
                {draft ? 'Draft · ' : ''}
                {s.section || 'news'}
                {s.author?.name ? ` · ${s.author.name}` : ''}
              </div>
            </div>
            {showViews && (
              <div className="text-right whitespace-nowrap">
                <div className="text-sm font-bold text-ink-900">{(s.recentViews || 0).toLocaleString()}</div>
                <div className="text-[10px] text-ink-500">views · 7d</div>
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Empty({ text }) {
  return <div className="text-center py-8 text-sm text-ink-500">{text}</div>;
}

function ActionLink({ href, children }) {
  return (
    <Link href={href} className="px-4 py-2 bg-white text-ink-700 text-sm font-semibold rounded-lg border border-ink-200 hover:bg-ink-50">
      {children}
    </Link>
  );
}

function Ga4Notice({ error }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
      <div className="font-semibold text-amber-900 mb-1">📊 Pageview numbers will appear once GA4 is connected</div>
      <p className="text-amber-800 text-xs">
        In <a className="underline" href="https://analytics.google.com" target="_blank" rel="noreferrer">GA4 → Admin → Property → Property Access Management</a>, add{' '}
        <code className="px-1 py-0.5 bg-white rounded font-mono">firebase-adminsdk-fbsvc@wvnews-crm.iam.gserviceaccount.com</code>{' '}
        with the <strong>Viewer</strong> role. Stats will populate within minutes of pageviews flowing in.
        {error && <span className="block mt-1 text-amber-700">Last error: {error}</span>}
      </p>
    </div>
  );
}

function SysRow({ label, ok, hint }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-ink-50 rounded">
      <span>{ok ? '🟢' : '🟡'}</span>
      <div className="flex-1">
        <div className="text-sm font-semibold text-ink-900">{label}</div>
        <div className="text-xs text-ink-500">{hint}</div>
      </div>
    </div>
  );
}
