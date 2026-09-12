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
