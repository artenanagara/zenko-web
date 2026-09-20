export type Workspace = 'marketing' | 'admin' | 'public'

const MARKETING_HOSTS = new Set([
  'marketing.zenkoedu.id',
  'marketing-staging.zenkoedu.id',
])

const ADMIN_HOSTS = new Set([
  'admin.zenkoedu.id',
  'admin-staging.zenkoedu.id',
])

export function workspaceForHost(hostname: string): Workspace {
  if (MARKETING_HOSTS.has(hostname)) return 'marketing'
  if (ADMIN_HOSTS.has(hostname)) return 'admin'
  return 'public'
}

export function workspaceHome(workspace: Workspace): string {
  if (workspace === 'marketing') return '/dashboard/marketing'
  if (workspace === 'admin') return '/dashboard/admin'
  return '/'
}

export function workspaceTitle(workspace: Workspace): string {
  if (workspace === 'marketing') return 'Marketing Hub'
  if (workspace === 'admin') return 'Dashboard Admin'
  return 'Zenko'
}
