/**
 * Gambar Open Graph bawaan situs — yang muncul saat tautan Zenko dibagikan
 * di WhatsApp, Instagram, LinkedIn, X, dan sejenisnya.
 *
 * Satu tempat, bukan URL yang disalin ke tiap halaman: halaman yang punya
 * gambar sendiri (detail paket, profil tutor) tetap memakai miliknya, sisanya
 * memakai ini. JPEG, bukan WebP — pratinjau WhatsApp dan LinkedIn masih
 * tidak konsisten membaca WebP, dan gambar yang tidak muncul lebih buruk
 * dari beberapa puluh KB tambahan.
 *
 * URL absolut karena crawler tidak menyelesaikan path relatif, dan menunjuk
 * domain produksi karena kartu pratinjau yang sama harus muncul dari
 * staging maupun produksi.
 */
export const DEFAULT_OG = {
  ogImage: 'https://zenkoedu.id/og/zenko-og.jpg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Zenko — tryout online untuk semua ujian',
  ogImageType: 'image/jpeg',
} as const

/**
 * Sampul cadangan paket sebagai gambar Open Graph — untuk halaman detail
 * paket yang tutornya tidak mengunggah sampul. Berkas yang sama dengan yang
 * dipakai AppThumbnail di katalog, jadi pratinjau tautan dan kartu katalog
 * menampilkan gambar yang sama.
 */
export const PACKAGE_COVER_FALLBACK_OG = 'https://zenkoedu.id/brand/package-thumbnail-fallback.jpg'

/**
 * Produce a compact, plain-text description suitable for search snippets.
 * API descriptions may contain HTML, lists, or line breaks, and cutting them
 * at an arbitrary character can leave a broken word in the SERP preview.
 */
export function metaDescription(value: string, max = 155): string {
  const plain = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (plain.length <= max) return plain

  const suffix = '…'
  const limit = max - suffix.length
  const cut = plain.slice(0, limit).trimEnd()
  const wordBoundary = cut.lastIndexOf(' ')
  return `${(wordBoundary > 0 ? cut.slice(0, wordBoundary) : cut).trimEnd()}${suffix}`
}

/**
 * Slug URL untuk label kategori/subkategori katalog ("Rekrutmen BUMN" →
 * "rekrutmen-bumn"). Hanya alias: aturan slugnya satu, di slugifyCategory
 * (app/utils/categorySlug.ts), yang identik dengan service.SlugifyFacet di
 * zenko-api.
 */
export function categorySlug(label: string): string {
  return slugifyCategory(label)
}
