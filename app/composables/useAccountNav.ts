import type { Component } from 'vue'
import IconLifebuoy from '~/components/icons/IconLifebuoy.vue'
import IconGrid from '~/components/icons/IconGrid.vue'
import IconHome from '~/components/icons/IconHome.vue'
import IconReceipt from '~/components/icons/IconReceipt.vue'
import IconUser from '~/components/icons/IconUser.vue'
import IconUsers from '~/components/icons/IconUsers.vue'

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
 *
 * Bimbel punya satu pintu saja, "Bimbel saya". Dulu ada dua — "Paket bimbel"
 * berdiri sendiri di sebelahnya — dan itu memaksa siswa menebak yang mana yang
 * dimaksud: keduanya tentang bimbel yang sama, dan satu-satunya cara tahu
 * bedanya adalah membuka keduanya. Sekarang seluruh paket bimbel ada di dalam
 * "Bimbel saya", bersama keanggotaan yang membukanya.
 */
export const ACCOUNT_NAV: AccountNavItem[] = [
  { label: 'Ringkasan', to: '/akun', icon: IconHome },
  { label: 'Paket saya', to: '/akun/paket', icon: IconGrid },
  { label: 'Bimbel saya', to: '/akun/bimbel', icon: IconUsers },
  { label: 'Riwayat pembelian', to: '/akun/pembelian', icon: IconReceipt },
  { label: 'Akun saya', to: '/akun/profil', icon: IconUser },
  { label: 'Pusat Bantuan', to: '/pusat-bantuan', icon: IconLifebuoy },
]

/**
 * The profile dropdown is a global door into the account area from anywhere on
 * the site — the surfaces people jump to most, plus the account settings
 * themselves, so the menu never needs a second click through the sidebar to
 * reach them.
 */
export const ACCOUNT_MENU: AccountNavItem[] = [
  { label: 'Ringkasan', to: '/akun', icon: IconHome },
  { label: 'Paket saya', to: '/akun/paket', icon: IconGrid },
  { label: 'Bimbel saya', to: '/akun/bimbel', icon: IconUsers },
  { label: 'Akun saya', to: '/akun/profil', icon: IconUser },
]
