import type { Component } from 'vue'
import IconGrid from '~/components/icons/IconGrid.vue'
import IconHome from '~/components/icons/IconHome.vue'
import IconReceipt from '~/components/icons/IconReceipt.vue'
import IconUser from '~/components/icons/IconUser.vue'

export interface AccountNavItem {
  label: string
  to: string
  icon: Component
}

/**
 * The account area's full local navigation, shown in the sidebar. It leads with
 * Ringkasan — the progress overview a signed-in learner lands on — so the rail
 * is a map of the area, not an echo of the profile dropdown: who you are, what
 * you own, what you paid, then your settings.
 */
export const ACCOUNT_NAV: AccountNavItem[] = [
  { label: 'Ringkasan', to: '/akun', icon: IconHome },
  { label: 'Paket saya', to: '/akun/paket', icon: IconGrid },
  { label: 'Riwayat pembelian', to: '/akun/pembelian', icon: IconReceipt },
  { label: 'Akun saya', to: '/akun/profil', icon: IconUser },
]

/**
 * The profile dropdown is a global door into the account area from anywhere on
 * the site, not a second copy of the sidebar. It carries only the two surfaces
 * people actually jump to; the rest is one step away in the sidebar once you
 * are inside.
 */
export const ACCOUNT_MENU: AccountNavItem[] = [
  { label: 'Ringkasan', to: '/akun', icon: IconHome },
  { label: 'Paket saya', to: '/akun/paket', icon: IconGrid },
]
