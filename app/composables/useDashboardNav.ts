/** Roles that have a dashboard. A student's home is the account area instead. */
type DashboardRole = 'admin' | 'tutor'

export interface DashboardNavItem {
  label: string
  to: string
}

export interface DashboardNav {
  /** Shown next to the brand, so a signed-in user knows which surface they are on. */
  title: string
  items: DashboardNavItem[]
}

/**
 * Sidebar contents per role.
 *
 * Every tutor entry points at a real page. Admin's later entries are anchors
 * into the one admin page it has today.
 */
const NAV_BY_ROLE: Record<DashboardRole, DashboardNav> = {
  admin: {
    title: 'Dashboard admin',
    items: [
      { label: 'Ringkasan', to: '/dashboard/admin' },
      { label: 'Pengajuan tutor', to: '/dashboard/admin#pengajuan' },
      { label: 'Moderasi produk', to: '/dashboard/admin#paket' },
      { label: 'Pencairan', to: '/dashboard/admin#pencairan' },
    ],
  },
  tutor: {
    title: 'Dashboard tutor',
    items: [
      { label: 'Ringkasan', to: '/dashboard/tutor' },
      { label: 'Produk saya', to: '/dashboard/tutor/products' },
      { label: 'Penjualan', to: '/dashboard/tutor/sales' },
      { label: 'Pencairan', to: '/dashboard/tutor/payouts' },
    ],
  },
}

/**
 * Resolves the sidebar for the signed-in user.
 *
 * Falls back to the tutor sidebar while the session is still resolving: the
 * dashboard pages are guarded by `roles`, so only a tutor or admin ever gets
 * far enough to see one.
 */
export function useDashboardNav() {
  const { user } = useAuth()

  return computed<DashboardNav>(() => {
    const role = user.value?.role
    return role === 'admin' || role === 'tutor' ? NAV_BY_ROLE[role] : NAV_BY_ROLE.tutor
  })
}
