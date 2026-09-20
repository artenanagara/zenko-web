/**
 * Daftar provinsi Indonesia, dilewatkan melalui origin Zenko sendiri.
 *
 * Halaman tidak bisa memanggil wilayah.id langsung: respons GET-nya tidak
 * mengirim `Access-Control-Allow-Origin` sama sekali (preflight OPTIONS-nya
 * mengirim, permintaan sebenarnya tidak), jadi browser memblokir setiap
 * pemanggilan dari origin mana pun dan daftar provinsinya selalu kosong.
 *
 * Diambil dari sisi server, hasilnya disajikan dari origin yang sama dengan
 * halamannya, sehingga CORS tidak lagi terlibat. Efek sampingnya bagus:
 * formulir pendaftaran tidak lagi bergantung pada penyedia pihak ketiga yang
 * bisa dijangkau langsung oleh browser pengunjung.
 */
export default defineCachedEventHandler(
  async () => fetchRegions('provinces.json'),
  {
    // Daftar provinsi berubah dalam hitungan tahun, bukan menit. Cache sehari
    // membuat satu kunjungan ramai jadi satu panggilan keluar, dan tetap ikut
    // memperbarui diri tanpa perlu deploy saat daftarnya benar-benar berubah.
    maxAge: 60 * 60 * 24,
    name: 'regions',
    getKey: () => 'provinces',
  },
)
