import Lenis from 'lenis'

/**
 * Smooth scroll seluruh situs lewat Lenis, dipasang di window.
 *
 * Yang dijaga supaya tidak bentrok dengan perilaku yang sudah ada:
 * - Kunci gulir modal/sheet di app ini ditulis ke `document.body.style.overflow`
 *   (AppHeader, TryoutNavigatorSheet, layout dashboard). Body yang `hidden`
 *   memang mengunci viewport untuk pengguna, tetapi Lenis tetap bisa
 *   menggeser `scrollTop` secara programatik — jadi Lenis dihentikan selama
 *   kuncinya aktif, lewat MutationObserver pada atribut style body.
 * - Area gulir bersarang (isi modal, tabel lebar, navigator soal) dibiarkan
 *   native lewat `allowNestedScroll`, tanpa perlu menandai satu per satu.
 * - Pindah halaman selalu mendarat di atas seketika: Nuxt sudah men-scroll ke
 *   (0,0) setelah transisi keluar selesai, tetapi kalau Lenis sedang
 *   ber-inersia ia akan menarik balik ke targetnya sendiri — maka target Lenis
 *   ikut dipaksa ke 0 pada hook yang sama. Tautan ber-hash dikecualikan
 *   karena Nuxt yang mengantarnya ke elemen tujuan.
 * - `prefers-reduced-motion` dihormati Lenis sendiri (`respectReducedMotion`
 *   default true): gulir jadi native, tanpa pelembutan.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const lenis = new Lenis({
    autoRaf: true,
    allowNestedScroll: true,
    anchors: true,
    stopInertiaOnNavigate: true,
    lerp: 0.12,
  })

  const syncScrollLock = () => {
    if (getComputedStyle(document.body).overflow === 'hidden') lenis.stop()
    else lenis.start()
  }
  const observer = new MutationObserver(syncScrollLock)
  observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] })
  syncScrollLock()

  const router = useRouter()
  nuxtApp.hook('page:transition:finish', () => {
    if (router.currentRoute.value.hash) return
    lenis.scrollTo(0, { immediate: true, force: true })
  })

  return { provide: { lenis } }
})
