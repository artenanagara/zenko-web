/**
 * Kanal dukungan yang dicetak di Pusat Bantuan, halaman artikel, dan FAQ.
 *
 * Satu tempat supaya jam layanan dan nomor tidak lagi melenceng antarhalaman
 * (sebelumnya tiga halaman menulis jam "Senin–Jumat 09.00–17.00" sendiri-sendiri).
 * Halaman legal sengaja tidak memakai modul ini: teksnya dokumen yang direview
 * terpisah, bukan salinan UI.
 *
 * Nomor yang sama menerima WhatsApp (dikonfirmasi pemilik produk, 11 September
 * 2026), jadi tautan utamanya wa.me — `tel:` tidak berguna di desktop.
 */
export const SUPPORT_CONTACT = {
  email: 'halo@zenkoedu.id',
  phoneDisplay: '0882-2766-3468',
  whatsappUrl: 'https://wa.me/6288227663468',
  hours: '08.00–23.00 WIB',
} as const

/** mailto dengan subjek terisi, supaya pesan pertama langsung bisa dipilah. */
export function supportMailto(subject?: string): string {
  const base = `mailto:${SUPPORT_CONTACT.email}`
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base
}
