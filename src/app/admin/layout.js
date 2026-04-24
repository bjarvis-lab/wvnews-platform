// Admin layout — server component. Gates every page under /admin/* (except
// /admin/signin) behind a valid Firebase session cookie, then performs a
// per-module permission check. The interactive sidebar + top bar live in
// AdminShell (client component), which receives the user profile so it can
// hide nav items the user isn't authorized to see.

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-server';
import { moduleKeyForPath, hasPermission, visibleNavItems } from '@/lib/permissions';
import AdminShell from './AdminShell';

export default async function AdminLayout({ children }) {
  // Let the signin page render without the shell / without auth.
  const pathname = headers().get('x-pathname') || '';
  if (pathname.startsWith('/admin/signin')) return children;

  const user = await requireAdmin();
  const profile = user.profile;

  // Server-side module gate: even if an unauthorized user guesses a URL,
  // they get bounced to the first page they DO have permission for.
  const moduleKey = moduleKeyForPath(pathname);
  if (moduleKey && !hasPermission(profile, moduleKey)) {
    const allowed = visibleNavItems(profile);
    const fallback = allowed[0]?.href || '/admin/signin';
    if (fallback !== pathname) redirect(fallback);
  }

  return <AdminShell user={profile}>{children}</AdminShell>;
}
