import type { Component } from 'vue'
import IconBank from '~/components/icons/IconBank.vue'
import IconChart from '~/components/icons/IconChart.vue'
import IconCheckCircle from '~/components/icons/IconCheckCircle.vue'
import IconEye from '~/components/icons/IconEye.vue'
import IconGrid from '~/components/icons/IconGrid.vue'
import IconHandshake from '~/components/icons/IconHandshake.vue'
import IconHome from '~/components/icons/IconHome.vue'
import IconLifebuoy from '~/components/icons/IconLifebuoy.vue'
import IconReceipt from '~/components/icons/IconReceipt.vue'
import IconRepeat from '~/components/icons/IconRepeat.vue'
import IconRocket from '~/components/icons/IconRocket.vue'
import IconSettings from '~/components/icons/IconSettings.vue'
import IconUser from '~/components/icons/IconUser.vue'
import IconUsers from '~/components/icons/IconUsers.vue'
import IconWallet from '~/components/icons/IconWallet.vue'
import IconImage from '~/components/icons/IconImage.vue'
import IconLink from '~/components/icons/IconLink.vue'
import IconSearch from '~/components/icons/IconSearch.vue'
import IconTarget from '~/components/icons/IconTarget.vue'
import IconTableInsert from '~/components/icons/IconTableInsert.vue'
import IconTicket from '~/components/icons/IconTicket.vue'
import IconTrophy from '~/components/icons/IconTrophy.vue'

/** Roles that have a dashboard. A student's home is the account area instead. */
type DashboardRole = 'admin' | 'tutor' | 'marketing' | 'editor'

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
  /**
   * Judul kelompok yang dicetak di atas entri ini. Bukan pengelompokan seperti
   * `children` — rutenya tetap milik entri masing-masing; ini hanya memberi
   * tingkat pada daftar yang datar.
   *
   * Urutannya adalah kontraknya: entri berurutan dengan `section` yang sama
   * jadi satu kelompok, dan judulnya dicetak sekali di entri pertamanya. Entri
   * tanpa `section` berdiri sendiri di puncak, sebelum kelompok mana pun —
   * tempat "Ringkasan", satu-satunya halaman yang bukan bagian dari alur kerja
   * tertentu.
   *
   * Tingkatnya dibaca dari atas ke bawah: apa yang menahan orang lain lebih
   * dulu, lalu uang, lalu data yang hanya dibaca, lalu pengaturan.
   */
  section?: string
}

export interface DashboardNav {
  /** Shown next to the brand, so a signed-in user knows which surface they are on. */
  title: string
  items: DashboardNavItem[]
}

/**
 * Isi sidebar per role.
 *
 * Urutannya bertingkat, bukan menurut entitas: Ringkasan di puncak, lalu
 * antrean yang menahan orang lain, lalu uang, lalu direktori yang hanya
 * dibaca, dan pengaturan di dasar. Alasannya sederhana — yang paling atas
 * adalah yang paling mahal kalau terlambat dikerjakan.
 *
 * Karena itu "Pengajuan tutor" tidak lagi satu grup dengan "Daftar tutor":
 * keduanya memang tentang tutor, tetapi yang satu antrean keputusan dan yang
 * lain daftar bacaan. Menyatukannya berarti mengubur antrean di balik satu
 * klik ekstra hanya demi kerapian nama.
 */
const NAV_BY_ROLE: Record<DashboardRole, DashboardNav> = {
  admin: {
    title: 'Dashboard admin',
    items: [
      { label: 'Ringkasan', to: '/dashboard/admin', icon: IconHome, exact: true },

      // Antrean — semuanya menahan orang yang sudah menunggu, diurutkan
      // menurut siapa yang paling dirugikan oleh keterlambatan: pembeli yang
      // sudah membayar, lalu tutor yang produknya belum tayang, lalu akun yang
      // belum bisa mulai bekerja sama sekali.
      //
      // "Tagihan bimbel" dulu berdiri di sini bernama "Pembayaran bimbel", dan
      // itu keliru dua kali. Namanya nyaris tidak bisa dibedakan dari
      // "Verifikasi pembayaran" di atasnya, dan isinya bukan antrean sama
      // sekali: tagihan yang belum dibayar sedang menunggu bimbelnya, bukan
      // menunggu admin. Ia sekarang buku catatan di Keuangan — kata benda,
      // bukan kata kerja, dan itulah pembeda namanya.
      { label: 'Verifikasi pembayaran', to: '/dashboard/admin/payments', icon: IconReceipt, section: 'Antrean' },
      { label: 'Moderasi produk', to: '/dashboard/admin/products', icon: IconEye, section: 'Antrean' },
      { label: 'Pengajuan tutor', to: '/dashboard/admin/applications', icon: IconCheckCircle, section: 'Antrean' },

      // Keuangan — catatan uang, bukan antrean keputusan. Pencairan lebih dulu
      // karena ia yang ditunggu tutor, rekening bank adalah syarat yang
      // melayaninya, dan tagihan bimbel menutup daftar: tidak ada yang
      // menunggu di sana, ia dibuka untuk mencari tahu di mana posisi
      // langganan sebuah bimbel.
      { label: 'Pencairan', to: '/dashboard/admin/payouts', icon: IconWallet, section: 'Keuangan' },
      {
        label: 'Rekening bank',
        to: '/dashboard/admin/bank-accounts',
        icon: IconBank,
        section: 'Keuangan',
        // Two distinct tables (verifikasi rekening vs pengajuan perubahan), so
        // one page each behind a sub-menu instead of top-level tabs. The index
        // child shares its path with the parent, hence `exact` — prefix
        // matching would light it up on /changes too.
        children: [
          { label: 'Pengajuan', to: '/dashboard/admin/bank-accounts', exact: true },
          { label: 'Perubahan', to: '/dashboard/admin/bank-accounts/changes' },
        ],
      },
      { label: 'Tagihan bimbel', to: '/dashboard/admin/bimbels/orders', icon: IconRepeat, section: 'Keuangan' },
      { label: 'Voucher', to: '/dashboard/admin/vouchers', icon: IconTicket, section: 'Keuangan' },

      // Direktori — tidak ada yang menunggu di sini; ini tempat mencari orang,
      // bukan tempat memutuskan sesuatu. Ikon di seluruh sidebar ini sengaja
      // tidak ada yang kembar: dulu grup Bimbel memakai IconUsers yang sama
      // dengan "Daftar Siswa", dan pada rail yang diciutkan — ketika label
      // hilang dan hanya ikon yang tersisa — dua menu itu jadi tidak
      // terbedakan sama sekali.
      { label: 'Daftar tutor', to: '/dashboard/admin/tutors', icon: IconUser, section: 'Direktori' },
      { label: 'Daftar siswa', to: '/dashboard/admin/students', icon: IconUsers, section: 'Direktori' },
      // Dulu "Pengajuan bimbel" di Antrean. Mendaftarkan bimbel tidak lagi
      // menunggu persetujuan, jadi tidak ada satu baris pun di sana yang
      // menunggu admin — yang tersisa daftar bacaan, dan tempatnya di sini.
      { label: 'Daftar bimbel', to: '/dashboard/admin/bimbels', icon: IconHandshake, section: 'Direktori' },

      { label: 'Produk saya', to: '/dashboard/admin/my-products', icon: IconGrid, section: 'Pengelolaan' },
      { label: 'Pengguna marketing', to: '/dashboard/admin/marketing-users', icon: IconUsers, section: 'Pengelolaan' },
      // Admin memakai pengaturan tutor yang sama: profil publik, ulasan, dan
      // rekening bank tidak boleh punya dua implementasi yang berbeda.
      { label: 'Pengaturan', to: '/dashboard/tutor/settings', icon: IconSettings, section: 'Pengelolaan' },

      { label: 'Pusat Bantuan', to: '/pusat-bantuan', icon: IconLifebuoy, section: 'Bantuan' },
    ],
  },
  tutor: {
    title: 'Dashboard tutor',
    items: [
      { label: 'Ringkasan', to: '/dashboard/tutor', icon: IconHome, exact: true },
      { label: 'Produk saya', to: '/dashboard/tutor/products', icon: IconGrid },

      // Uang menyusul produk: tidak ada penjualan sebelum ada yang dijual.
      { label: 'Penjualan', to: '/dashboard/tutor/sales', icon: IconReceipt, section: 'Pendapatan' },
      { label: 'Pencairan', to: '/dashboard/tutor/payouts', icon: IconWallet, section: 'Pendapatan' },
      { label: 'Voucher', to: '/dashboard/tutor/vouchers', icon: IconTicket, section: 'Pendapatan' },

      // Pusat Bantuan sengaja tidak ada di sini (juga di sidebar bimbel dan
      // dropdown profil): pintunya satu, tab Bantuan di Akun saya
      // (/akun/profil?tab=bantuan), yang isinya sudah disaring per peran.
      { label: 'Pengaturan', to: '/dashboard/tutor/settings', icon: IconSettings, section: 'Akun' },
    ],
  },
  marketing: {
    title: 'Marketing Hub',
    items: [
      { label: 'Ringkasan', to: '/dashboard/marketing', icon: IconHome, exact: true },
      { label: 'Artikel & Panduan', to: '/dashboard/marketing/articles', icon: IconReceipt, section: 'Konten & CMS' },
      { label: 'Kategori Konten', to: '/dashboard/marketing/categories', icon: IconTableInsert, section: 'Konten & CMS' },
      { label: 'Banner & Promosi', to: '/dashboard/marketing/banners', icon: IconImage, section: 'Konten & CMS' },
      { label: 'Performa Pencarian', to: '/dashboard/marketing/seo/performance', icon: IconSearch, section: 'SEO & Visibilitas' },
      { label: 'Peluang Cepat', to: '/dashboard/marketing/seo/opportunities', icon: IconTarget, section: 'SEO & Visibilitas' },
      { label: 'Sitemap & Tautan', to: '/dashboard/marketing/seo/health', icon: IconLink, section: 'SEO & Visibilitas' },
      { label: 'Trafik Web', to: '/dashboard/marketing/insights/traffic', icon: IconChart, section: 'Insight & Atribusi' },
      { label: 'Performa Produk', to: '/dashboard/marketing/insights/products', icon: IconGrid, section: 'Insight & Atribusi' },
      { label: 'Kampanye UTM', to: '/dashboard/marketing/insights/campaigns', icon: IconRocket, section: 'Insight & Atribusi' },
      { label: 'Funnel Konversi', to: '/dashboard/marketing/insights/funnel', icon: IconTrophy, section: 'Insight & Atribusi' },
      { label: 'Pengaturan', to: '/dashboard/marketing/settings', icon: IconSettings, section: 'Pengelolaan' },
    ],
  },
  editor: {
    title: 'Marketing Hub',
    items: [
      { label: 'Ringkasan', to: '/dashboard/marketing', icon: IconHome, exact: true },
      { label: 'Artikel & Panduan', to: '/dashboard/marketing/articles', icon: IconReceipt, section: 'Konten & CMS' },
      { label: 'Kategori Konten', to: '/dashboard/marketing/categories', icon: IconTableInsert, section: 'Konten & CMS' },
      { label: 'Banner & Promosi', to: '/dashboard/marketing/banners', icon: IconImage, section: 'Konten & CMS' },
      { label: 'Performa Produk', to: '/dashboard/marketing/insights/products', icon: IconGrid, section: 'Insight & Atribusi' },
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
  const route = useRoute()
  const { data: memberships } = useBimbelMemberships()

  return computed<DashboardNav>(() => {
    const bimbelId = typeof route.params.bimbelId === 'string' ? route.params.bimbelId : ''
    if (route.path.startsWith('/dashboard/bimbel/') && bimbelId) {
      const membership = memberships.value.find(item => item.bimbelId === bimbelId && item.status === 'active')
      if (!membership || membership.role === 'student') return EMPTY_NAV

      const base = `/dashboard/bimbel/${bimbelId}`
      const canManage = membership.role === 'admin' || membership.role === 'owner'

      /*
       * Tingkatnya sama dengan sidebar Zenko: pekerjaan harian lebih dulu, uang
       * di tengah, pengaturan di dasar. Sebelumnya "Pengaturan" duduk di tengah
       * — ia ikut terdorong ke atas karena dipasang bersama "Siswa & tim" dalam
       * satu blok peran, sehingga entri milik owner (Penjualan, Langganan)
       * menyusul di bawahnya. Yang paling jarang dibuka jadi bukan yang paling
       * bawah, dan itu terbaca sebagai daftar yang tidak diurutkan sama sekali.
       */
      const items: DashboardNavItem[] = [
        { label: 'Ringkasan', to: base, icon: IconHome, exact: true },
        { label: 'Paket', to: `${base}/products`, icon: IconGrid, section: 'Pengajaran' },
        { label: 'Kelas', to: `${base}/classes`, icon: IconUsers, section: 'Pengajaran' },
      ]
      if (canManage) {
        items.push({ label: 'Siswa', to: `${base}/members`, icon: IconUser, section: 'Pengajaran' })
      }
      if (membership.role === 'owner') {
        items.push({ label: 'Penjualan', to: `${base}/sales`, icon: IconReceipt, section: 'Keuangan' })
        items.push({ label: 'Pencairan', to: `${base}/payouts`, icon: IconWallet, section: 'Keuangan' })
      }
      if (canManage) {
        items.push({ label: 'Pengaturan', to: `${base}/settings`, icon: IconSettings, section: 'Pengelolaan' })
      }
      return { title: membership.bimbelName, items }
    }

    const role = user.value?.role
    return role && role in NAV_BY_ROLE ? NAV_BY_ROLE[role as DashboardRole] : EMPTY_NAV
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
