import type { Component } from 'vue'
import IconEye from '~/components/icons/IconEye.vue'
import IconGrid from '~/components/icons/IconGrid.vue'
import IconHome from '~/components/icons/IconHome.vue'
import IconReceipt from '~/components/icons/IconReceipt.vue'
import IconSettings from '~/components/icons/IconSettings.vue'
import IconUser from '~/components/icons/IconUser.vue'
import IconWallet from '~/components/icons/IconWallet.vue'

/** Roles that have a dashboard. A student's home is the account area instead. */
type DashboardRole = 'admin' | 'tutor'

export interface DashboardNavItem {
  label: string
  to: string
  icon: Component
  /**
   * Match this entry on its exact path only. For each role's "Ringkasan":
   * its path is the prefix of every sibling route, so prefix matching would
   * light it up everywhere at once.
   */
  exact?: boolean
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
      { label: 'Ringkasan', to: '/dashboard/admin', icon: IconHome, exact: true },
      { label: 'Pengajuan tutor', to: '/dashboard/admin#pengajuan', icon: IconUser },
      { label: 'Moderasi produk', to: '/dashboard/admin#paket', icon: IconEye },
      { label: 'Pencairan', to: '/dashboard/admin#pencairan', icon: IconWallet },
    ],
  },
  tutor: {
    title: 'Dashboard tutor',
    items: [
      { label: 'Ringkasan', to: '/dashboard/tutor', icon: IconHome, exact: true },
      { label: 'Produk saya', to: '/dashboard/tutor/products', icon: IconGrid },
      { label: 'Penjualan', to: '/dashboard/tutor/sales', icon: IconReceipt },
      { label: 'Pencairan', to: '/dashboard/tutor/payouts', icon: IconWallet },
      { label: 'Pengaturan', to: '/dashboard/tutor/settings', icon: IconSettings },
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

/**
 * Active state for a sidebar entry.
 *
 * Prefix matching, so nested pages keep their section lit — e.g.
 * /dashboard/tutor/products/new still highlights "Produk saya". Anchor
 * entries (admin's) compare the hash too, since they all share one path;
 * `exact` entries yield to them by requiring an empty hash.
 */
export function isDashboardItemActive(
  item: DashboardNavItem,
  route: { path: string, hash: string },
): boolean {
  const hashIndex = item.to.indexOf('#')
  const itemPath = hashIndex === -1 ? item.to : item.to.slice(0, hashIndex)
  const itemHash = hashIndex === -1 ? '' : item.to.slice(hashIndex)

  if (itemHash) return route.path === itemPath && route.hash === itemHash
  if (item.exact) return route.path === itemPath && !route.hash
  return route.path === itemPath || route.path.startsWith(`${itemPath}/`)
}
