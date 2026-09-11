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
// TODO(og): ganti ke /og/zenko-og.jpg (1200×628, JPEG) begitu berkas
// sumbernya masuk ke public/og/ — sampai saat itu lockup lama tetap dipakai
// supaya tidak ada halaman yang menunjuk gambar yang belum ada.
export const DEFAULT_OG = {
  ogImage: 'https://zenkoedu.id/brand/zenko-lockup-horizontal-blue.png',
  ogImageWidth: 654,
  ogImageHeight: 204,
  ogImageAlt: 'Zenko — tryout online untuk semua ujian',
  ogImageType: 'image/png',
} as const
