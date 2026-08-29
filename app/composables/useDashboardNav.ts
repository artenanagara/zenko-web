import type { Component } from 'vue'
import IconBank from '~/components/icons/IconBank.vue'
import IconEye from '~/components/icons/IconEye.vue'
import IconGrid from '~/components/icons/IconGrid.vue'
import IconHome from '~/components/icons/IconHome.vue'
import IconReceipt from '~/components/icons/IconReceipt.vue'
import IconSettings from '~/components/icons/IconSettings.vue'
import IconUser from '~/components/icons/IconUser.vue'
import IconUsers from '~/components/icons/IconUsers.vue'
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
      {
        label: 'Tutor',
        to: '/dashboard/admin/tutors',
        icon: IconUser,
        // Two distinct tables (pengajuan vs daftar tutor aktif), so one page
        // each behind a sub-menu instead of top-level tabs — same shape as
        // Rekening bank below. The roster child shares its path with the
        // parent, hence `exact` — prefix matching would light it up on any
        // future nested tutor route too.
        children: [
          { label: 'Pengajuan Tutor', to: '/dashboard/admin/applications' },
          { label: 'Daftar Tutor', to: '/dashboard/admin/tutors', exact: true },
        ],
      },
      { label: 'Daftar Siswa', to: '/dashboard/admin/students', icon: IconUsers },
      { label: 'Moderasi produk', to: '/dashboard/admin/products', icon: IconEye },
      // Uang masuk sebelum uang keluar: verifikasi pembayaran adalah antrean
      // yang menahan akses pembeli yang sudah membayar, jadi ia duduk di atas
      // Pencairan.
      { label: 'Verifikasi pembayaran', to: '/dashboard/admin/payments', icon: IconReceipt },
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

/** Rendered while the session is still resolving — see the empty-fallback note below. */
const EMPTY_NAV: DashboardNav = { title: '', items: [] }

/**
 * Resolves the sidebar for the signed-in user.
 *
 * Empty while the session is still resolving, rather than guessing a role:
 * SSR can never read the (HttpOnly, API-origin) session cookie, so every
 * server render hits this branch — previously it guessed the tutor sidebar,
 * on the reasoning that the dashboard pages are guarded by `roles` and only
 * a tutor or admin ever gets this far. That guess was silently wrong for
 * every admin, and Vue's hydration does not fully repair the damage: once
 * the client resolves the real role and the guess turns out wrong, hydration
 * adopts the server-rendered <a> nodes and — for reasons that sit in Vue's
 * hydration internals rather than this app's code — patches their label and
 * active-state class reactively but never repatches their already-adopted
 * `href` attribute, since nothing about `item.to` changes again afterwards
 * to trigger a further update. The visible label always ends up correct;
 * the underlying link silently keeps pointing at the tutor route it was
 * guessed to be. A plain click still lands correctly (Vue Router navigates
 * off the live `to` prop, not the stale DOM attribute), but the rendered
 * href is what a screen reader announces, what "copy link" copies, and what
 * an assistive tool or crawler would follow.
 *
 * An empty nav sidesteps this rather than papering over it: SSR renders no
 * items, so the client has nothing stale to adopt — every real item is
 * freshly created once the role resolves, with the correct href from the
 * moment it exists. The tutor sidebar's previous instant, guess-right SSR
 * paint is the one trade-off (it now fills in a beat after mount, same as
 * admin's), in exchange for an admin's sidebar never lying about where its
 * links go.
 */
export function useDashboardNav() {
  const { user } = useAuth()

  return computed<DashboardNav>(() => {
    const role = user.value?.role
    return role === 'admin' || role === 'tutor' ? NAV_BY_ROLE[role] : EMPTY_NAV
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
