import type { Component } from 'vue'
import IconBank from '~/components/icons/IconBank.vue'
import IconEye from '~/components/icons/IconEye.vue'
import IconGrid from '~/components/icons/IconGrid.vue'
import IconHome from '~/components/icons/IconHome.vue'
import IconReceipt from '~/components/icons/IconReceipt.vue'
import IconSettings from '~/components/icons/IconSettings.vue'
import IconUser from '~/components/icons/IconUser.vue'
import IconWallet from '~/components/icons/IconWallet.vue'

/** Roles that have a dashboard. A student's home is the account area instead. */
type DashboardRole = 'admin' | 'tutor'

/**
 * A sub-menu entry. Deliberately has NO `icon` field: only the parent menu
 * item carries an icon, and leaving the field out makes that unrepresentable
 * rather than merely discouraged.
 */
export interface DashboardNavChild {
  label: string
  to: string
  /**
   * Match this entry on its exact path only. Needed wherever an entry's path
   * is the prefix of a sibling's — each role's "Ringkasan" (prefix of every
   * sibling route), and a sub-menu's index child (prefix of its siblings).
   */
  exact?: boolean
}

export interface DashboardNavItem extends DashboardNavChild {
  icon: Component
  /**
   * Turns this entry into a group header: the children own the routes, the
   * parent only expands/collapses them. A menu whose page would hold two or
   * more distinct tables belongs here — one child per table — never behind
   * top-level tabs.
   */
  children?: DashboardNavChild[]
}

export interface DashboardNav {
  /** Shown next to the brand, so a signed-in user knows which surface they are on. */
  title: string
  items: DashboardNavItem[]
}

/**
 * Sidebar contents per role. Every entry points at a real page; order matches
 * the admin's decision flow (and the Ringkasan queue cards).
 */
const NAV_BY_ROLE: Record<DashboardRole, DashboardNav> = {
  admin: {
    title: 'Dashboard admin',
    items: [
      { label: 'Ringkasan', to: '/dashboard/admin', icon: IconHome, exact: true },
      { label: 'Pengajuan tutor', to: '/dashboard/admin/applications', icon: IconUser },
      { label: 'Tutor', to: '/dashboard/admin/tutors', icon: IconGrid },
      { label: 'Moderasi produk', to: '/dashboard/admin/products', icon: IconEye },
      { label: 'Pencairan', to: '/dashboard/admin/payouts', icon: IconWallet },
      {
        label: 'Rekening bank',
        to: '/dashboard/admin/bank-accounts',
        icon: IconBank,
        // Two distinct tables (verifikasi rekening vs pengajuan perubahan), so
        // one page each behind a sub-menu instead of top-level tabs. The index
        // child shares its path with the parent, hence `exact` — prefix
        // matching would light it up on /changes too.
        children: [
          { label: 'Pengajuan', to: '/dashboard/admin/bank-accounts', exact: true },
          { label: 'Perubahan', to: '/dashboard/admin/bank-accounts/changes' },
        ],
      },
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
 * /dashboard/tutor/products/new still highlights "Produk saya", and
 * /dashboard/admin/products/[id] lights "Moderasi produk". Anchor entries
 * (none today) compare the hash too; `exact` entries require an empty hash.
 *
 * Takes the child shape, so top-level items and sub-menu entries share one
 * rule — a child is active exactly the way a top-level item is.
 */
export function isDashboardItemActive(
  item: DashboardNavChild,
  route: { path: string, hash: string },
): boolean {
  const hashIndex = item.to.indexOf('#')
  const itemPath = hashIndex === -1 ? item.to : item.to.slice(0, hashIndex)
  const itemHash = hashIndex === -1 ? '' : item.to.slice(hashIndex)

  if (itemHash) return route.path === itemPath && route.hash === itemHash
  if (item.exact) return route.path === itemPath && !route.hash
  return route.path === itemPath || route.path.startsWith(`${itemPath}/`)
}
