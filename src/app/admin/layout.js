// Admin layout — server component. Gates every page under /admin/* (except
// /admin/signin) behind a valid Firebase session cookie. The interactive
// sidebar + top bar live in AdminShell (client component).

import { headers } from 'next/headers';
import { requireAdmin } from '@/lib/auth-server';
import AdminShell from './AdminShell';

export default async function AdminLayout({ children }) {
  // Let the signin page render without the shell / without auth.
  const pathname = headers().get('x-pathname') || '';
  if (pathname.startsWith('/admin/signin')) return children;

  const user = await requireAdmin();
  return <AdminShell user={user.profile}>{children}</AdminShell>;
}
