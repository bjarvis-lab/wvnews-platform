'use client';
// Admin chrome — sidebar, top bar, site selector. Receives the authed user
// object from the server-side layout.

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { sites } from '@/data/mock';
import Logo from '@/components/public/Logo';
import { visibleNavItems, visibleExternalApps } from '@/lib/permissions';

export default function AdminShell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [currentSite, setCurrentSite] = useState('wvnews');
  const [signingOut, setSigningOut] = useState(false);

  // Nav items filtered by the signed-in user's effective permissions. The
  // stories badge keeps its legacy "3" count for now until the dashboard
  // wires up real draft counts.
  const navItems = visibleNavItems(user).map(item => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
    ...(item.key === 'stories' ? { badge: '3' } : {}),
  }));
  const externalApps = visibleExternalApps(user);

  const initials = (user?.name || user?.email || 'U')
    .split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join('');

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } finally {
      router.push('/admin/signin');
      router.refresh();
    }
  }

  return (
    <div className="flex h-screen bg-ink-50 overflow-hidden">
      <aside className={`admin-sidebar ${collapsed ? 'w-16' : 'w-60'} bg-brand-950 text-white flex flex-col transition-all duration-200 flex-shrink-0`}>
        <div className="h-14 flex items-center px-4 border-b border-white/10">
          {collapsed ? (
            <Logo height={28} variant="icon" className="rounded-full" />
          ) : (
            <div className="flex items-center gap-2">
              <Logo height={32} variant="icon" className="rounded-full" />
              <div>
                <div className="text-sm font-bold leading-none text-white">WPP Admin</div>
                <div className="text-[10px] text-white/50">Publishing Platform</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`${collapsed ? 'mx-auto' : 'ml-auto'} p-1 text-white/50 hover:text-white`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        {!collapsed && (
          <div className="px-3 py-2 border-b border-white/10">
            <select
              value={currentSite}
              onChange={(e) => setCurrentSite(e.target.value)}
              className="w-full bg-white/10 text-white text-xs rounded px-2 py-1.5 outline-none border border-white/10"
            >
              <option value="all" className="text-ink-900">All Sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id} className="text-ink-900">{site.name}</option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-white/15 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}

          {externalApps.length > 0 && (
            <div className="pt-3 mt-3 border-t border-white/10">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-white/40">
                  Other apps
                </div>
              )}
              {externalApps.map(app => (
                <a
                  key={app.key}
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  title={collapsed ? app.label : app.description}
                >
                  <span className="text-base flex-shrink-0">{app.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{app.label}</span>
                      <span className="text-white/30 text-xs">↗</span>
                    </>
                  )}
                </a>
              ))}
            </div>
          )}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              {user?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photo} alt={user.name} className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-xs font-bold">{initials}</div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{user?.name || 'Signed in'}</div>
                <div className="text-[10px] text-white/50 truncate">{(user?.role || 'editor').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="flex-1 text-center py-1 text-[10px] text-white/50 hover:text-white bg-white/5 rounded">
                View Site
              </Link>
              <button
                onClick={signOut}
                disabled={signingOut}
                className="flex-1 text-center py-1 text-[10px] text-white/50 hover:text-white bg-white/5 rounded disabled:opacity-50"
              >
                {signingOut ? '…' : 'Sign Out'}
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-ink-200 flex items-center px-6 flex-shrink-0">
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold text-ink-900">
              {navItems.find(n => n.href === pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/stories?new=1" className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors">
              + New Story
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
