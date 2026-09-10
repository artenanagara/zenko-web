/**
 * Konten Pusat Bantuan.
 *
 * Setiap langkah, label tombol, dan angka di sini harus cocok dengan perilaku
 * aplikasi yang sebenarnya — artikel yang salah lebih merugikan daripada
 * artikel yang tidak ada. Karena itu:
 * - label tombol dikutip persis seperti di UI ("Mulai try out", "Tarik Saldo");
 * - fitur yang belum dibangun tidak diterbitkan sebagai artikel;
 * - tidak ada placeholder tangkapan layar — gambar hanya ditambahkan kalau
 *   gambarnya benar-benar ada.
 *
 * Kalau alur, label, atau angka di produk berubah (masa tahan saldo, minimal
 * pencairan, masa berlaku kode, batas waktu ujian), perbarui artikel di sini
 * pada perubahan yang sama. Kanal kontak ada di `data/support-contact.ts`.
 *
 * Slug yang dipensiunkan dialihkan lewat `routeRules` di nuxt.config.ts.
 */
import { SUPPORT_CONTACT } from './support-contact'

export type HelpRole = 'siswa' | 'tutor' | 'bimbel'

export interface HelpNote {
  appearance: 'warning' | 'information'
  title?: string
  body: string
}

export interface HelpStep {
  title: string
  body: string
  note?: HelpNote
}

export interface HelpTroubleshootingItem {
  question: string
  answer: string
}

export interface HelpArticle {
  slug: string
  categorySlug: string
  title: string
  roles: HelpRole[]
  updated: string
  readMinutes: number
  summary: string
  prerequisites: string[]
  steps: HelpStep[]
  troubleshooting: HelpTroubleshootingItem[]
  keywords?: string[]
}

export type HelpCategoryIcon = 'user' | 'wallet' | 'target' | 'handshake' | 'users' | 'settings'

export interface HelpCategory {
  slug: string
  title: string
  description: string
  icon: HelpCategoryIcon
}

export const helpCategories: HelpCategory[] = [
  {
    slug: 'akun-keamanan',
    title: 'Akun dan Keamanan',
    description: 'Daftar, masuk, verifikasi email, dan kelola profil serta kata sandi.',
    icon: 'user',
  },
  {
    slug: 'pembayaran-kode-akses',
    title: 'Pembelian dan Pembayaran',
    description: 'Coba gratis, mengambil paket, status pesanan, dan invoice.',
    icon: 'wallet',
  },
  {
    slug: 'ujian-cbt-pembahasan',
    title: 'Ujian CBT dan Analisis Pembahasan',
    description: 'Mengerjakan try out, navigasi soal, aturan waktu, skor, dan pembahasan.',
    icon: 'target',
  },
  {
    slug: 'portal-tutor',
    title: 'Portal Tutor: Pembuatan Soal dan Penjualan',
    description: 'Ajukan akun tutor, buat paket, input soal, impor CSV, rekening, dan pencairan.',
    icon: 'handshake',
  },
  {
    slug: 'bimbel-institusi',
    title: 'Portal Bimbel, Langganan, dan Kelas',
    description: 'Gabung ke bimbel, mulai uji coba, pilih langganan, tambah kursi, kelola siswa dan kelas, serta jual paket.',
    icon: 'users',
  },
  {
    slug: 'kendala-teknis-kebijakan',
    title: 'Kendala Teknis, Troubleshooting, dan Refund',
    description: 'Pembayaran tertunda, sesi ujian terputus, tampilan bermasalah, dan refund.',
    icon: 'settings',
  },
]

export const helpArticles: HelpArticle[] = [
  // ======================================================================
  // Kategori 1: Akun dan Keamanan
  // ======================================================================
  {
    slug: 'daftar-akun-baru',
    categorySlug: 'akun-keamanan',
    title: 'Mendaftar Akun Baru',
    roles: ['siswa', 'tutor', 'bimbel'],
    updated: '11 September 2026',
    readMinutes: 3,
    summary: 'Buat akun Zenko lewat Google atau email, lalu aktifkan dengan kode verifikasi 6 digit.',
    prerequisites: ['Punya alamat email aktif, atau akun Google yang bisa diakses.'],
    steps: [
      {
        title: 'Buka halaman pendaftaran',
        body: 'Klik tombol "Daftar" di bilah navigasi Zenko untuk membuka halaman /daftar.',
      },
      {
        title: 'Pilih cara mendaftar',
        body:
          'Klik "Daftar dengan Google" untuk memakai akun Google, atau isi nama lengkap, email, dan kata sandi untuk mendaftar dengan email.',
      },
      {
        title: 'Masukkan kode verifikasi',
        body:
          'Apa pun cara yang kamu pilih, Zenko mengirim 6 digit kode ke emailmu dan membawamu ke halaman /verifikasi-email. Masukkan kode itu untuk mengaktifkan akun.',
        note: {
          appearance: 'warning',
          body: 'Kode berlaku 10 menit dan tidak bisa dipakai lagi setelah 5 kali salah ketik. Kalau sudah tidak berlaku, minta kode baru lewat tombol "Kirim ulang" di halaman yang sama.',
        },
      },
      {
        title: 'Lanjut masuk',
        body:
          'Setelah muncul "Email kamu terverifikasi", klik "Lanjut masuk" (atau "Lanjut masuk dengan Google" kalau kamu mendaftar dengan Google). Akunmu siap dipakai.',
      },
    ],
    troubleshooting: [
      {
        question: 'Kode verifikasi tidak masuk ke email, apa yang harus dilakukan?',
        answer:
          'Periksa folder Spam atau Promosi dan tunggu 1–2 menit. Kalau belum ada juga, gunakan tombol "Kirim ulang" di halaman /verifikasi-email, lalu pastikan alamat email yang kamu daftarkan sudah benar.',
      },
      {
        question: 'Saya mendaftar dengan Google, kenapa tetap diminta kode?',
        answer:
          'Semua akun baru diverifikasi sekali lewat kode di email, termasuk yang mendaftar dengan Google. Langkah ini hanya dilakukan sekali, saat pertama masuk.',
      },
      {
        question: 'Email yang saya pakai sudah pernah terdaftar, apa solusinya?',
        answer:
          'Masuk lewat halaman /masuk dengan email tersebut. Kalau lupa kata sandinya, reset lewat /lupa-password.',
      },
    ],
    keywords: ['daftar', 'registrasi', 'buat akun', 'google', 'otp', 'kode verifikasi', 'verifikasi email'],
  },
  {
    slug: 'reset-kata-sandi',
    categorySlug: 'akun-keamanan',
    title: 'Reset Kata Sandi',
    roles: ['siswa', 'tutor', 'bimbel'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Pulihkan akses akun, atau buat kata sandi untuk akun Google, lewat tautan yang dikirim ke email.',
    prerequisites: ['Bisa membuka email yang terdaftar di Zenko.'],
    steps: [
      {
        title: 'Buka halaman lupa kata sandi',
        body: 'Di halaman /masuk, klik "Lupa kata sandi" untuk menuju halaman /lupa-password.',
      },
      {
        title: 'Kirim permintaan reset',
        body: 'Masukkan alamat email yang terdaftar di Zenko, lalu kirim permintaannya.',
      },
      {
        title: 'Buka tautan di email',
        body: 'Buka email dari Zenko dan klik tautan reset. Tautan ini membawamu ke halaman /password-baru.',
        note: {
          appearance: 'warning',
          body: 'Tautan berlaku 24 jam. Permintaan ulang untuk email yang sama dalam 60 detik tidak mengirim email baru, jadi tunggu sebentar sebelum mencoba lagi.',
        },
      },
      {
        title: 'Buat kata sandi baru',
        body: 'Masukkan kata sandi baru (minimal 8 karakter) beserta konfirmasinya, lalu simpan. Setelah itu kamu bisa masuk dengan kata sandi tersebut.',
      },
    ],
    troubleshooting: [
      {
        question: 'Akun saya dibuat lewat Google. Bisakah saya punya kata sandi?',
        answer:
          'Bisa. Ikuti langkah di atas dengan email akun Googlemu untuk membuat kata sandi. Setelah itu kamu bisa masuk dengan Google maupun dengan email dan kata sandi.',
      },
      {
        question: 'Email reset tidak kunjung datang?',
        answer:
          'Periksa folder Spam dan pastikan email yang dimasukkan sama persis dengan email pendaftaran. Tunggu sekitar satu menit sebelum mengirim ulang permintaan.',
      },
    ],
    keywords: ['lupa password', 'lupa kata sandi', 'reset password', 'ganti sandi', 'kata sandi google'],
  },
  {
    slug: 'perbarui-profil-dan-kata-sandi',
    categorySlug: 'akun-keamanan',
    title: 'Ubah Profil dan Kata Sandi',
    roles: ['siswa', 'tutor', 'bimbel'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Ganti nama, foto profil, dan kata sandi, atau keluar dari semua perangkat.',
    prerequisites: ['Sudah masuk ke akun Zenko.'],
    steps: [
      {
        title: 'Buka Akun saya',
        body: 'Klik foto atau namamu di kanan atas, lalu pilih "Akun saya" untuk membuka halaman /akun/profil.',
      },
      {
        title: 'Ubah data profil',
        body: 'Di tab "Profil", perbarui nama lengkap atau foto profil, lalu simpan perubahan.',
      },
      {
        title: 'Ganti kata sandi',
        body:
          'Buka tab "Kata sandi", isi kata sandi saat ini dan kata sandi baru (minimal 8 karakter dan harus berbeda dari yang lama), lalu klik "Simpan kata sandi".',
      },
    ],
    troubleshooting: [
      {
        question: 'Saya selalu masuk dengan Google dan tidak tahu kata sandi saat ini. Bagaimana?',
        answer:
          'Buat kata sandi dulu lewat /lupa-password (lihat panduan Reset Kata Sandi). Setelah itu kamu bisa menggantinya kapan saja dari tab "Kata sandi".',
      },
      {
        question: 'HP saya hilang atau akun saya pernah dibuka di perangkat orang lain.',
        answer:
          'Di halaman /akun/profil ada pilihan "Keluar dari semua perangkat". Semua sesi yang sedang aktif akan berakhir, dan kamu perlu masuk lagi di perangkatmu sendiri.',
      },
    ],
    keywords: ['ubah profil', 'ganti nama', 'foto profil', 'ganti kata sandi akun', 'keluar semua perangkat'],
  },

  // ======================================================================
  // Kategori 2: Pembelian dan Pembayaran
  // ======================================================================
  {
    slug: 'coba-gratis-5-soal',
    categorySlug: 'pembayaran-kode-akses',
    title: 'Coba Gratis 5 Soal',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Cicipi lima soal asli dari sebuah paket tunggal, gratis dan tanpa perlu akun.',
    prerequisites: ['Tidak perlu punya akun. Cukup buka katalog paket.'],
    steps: [
      {
        title: 'Buka katalog paket',
        body: 'Kunjungi halaman /paket dan pilih paket try out yang ingin dicoba.',
      },
      {
        title: 'Klik "Coba Gratis 5 Soal"',
        body: 'Di halaman detail paket, klik "Coba Gratis 5 Soal" untuk membuka /paket/[slug]/coba.',
      },
      {
        title: 'Kerjakan lima soalnya',
        body: 'Kerjakan lima soal asli dari paket tersebut untuk merasakan format dan tingkat kesulitannya. Jawabanmu dinilai oleh server Zenko.',
      },
    ],
    troubleshooting: [
      {
        question: 'Apakah hasil coba gratis disimpan atau memengaruhi skor?',
        answer: 'Tidak. Coba gratis hanya untuk pratinjau. Hasilnya tidak masuk ke riwayat percobaan paket.',
      },
      {
        question: 'Kenapa paket bundel tidak punya tombol coba gratis?',
        answer: 'Coba gratis hanya tersedia untuk paket tunggal.',
      },
    ],
    keywords: ['coba gratis', 'trial', '5 soal', 'preview soal', 'sampel'],
  },
  {
    slug: 'beli-dan-bayar-via-qris',
    categorySlug: 'pembayaran-kode-akses',
    title: 'Mengambil dan Membeli Paket',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 3,
    summary: 'Cara mengambil paket lewat checkout, termasuk selama pembayaran QRIS belum aktif.',
    prerequisites: ['Sudah masuk ke akun Zenko.'],
    steps: [
      {
        title: 'Klik "Beli Sekarang"',
        body: 'Di halaman detail paket (/paket/[slug]), klik "Beli Sekarang".',
      },
      {
        title: 'Tinjau ringkasan checkout',
        body: 'Periksa nama paket dan totalnya di halaman /checkout/[slug] sebelum melanjutkan.',
      },
      {
        title: 'Paket gratis langsung aktif',
        body:
          'Untuk paket seharga Rp0, pesanan langsung berstatus Lunas dan paketnya muncul di "Paket saya" (/akun/paket) tanpa langkah pembayaran.',
      },
      {
        title: 'Paket berbayar',
        body:
          'Pembayaran QRIS saat ini masih dalam proses aktivasi. Selama belum aktif, checkout paket berbayar menampilkan "Pembayaran belum aktif": pesanan tidak dibuat dan kamu tidak ditagih apa pun.',
        note: {
          appearance: 'information',
          title: 'Setelah pembayaran aktif',
          body: 'Paket berbayar dibayar dengan QRIS dari aplikasi m-banking atau e-wallet apa pun. Panduan ini akan diperbarui begitu pembayarannya aktif.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Kenapa checkout paket berbayar tidak membuat pesanan?',
        answer:
          'Karena pembayaran belum aktif. Zenko sengaja tidak membuat pesanan yang belum bisa dibayar, jadi tidak ada tagihan yang menggantung di akunmu.',
      },
      {
        question: 'Paket gratis sudah saya ambil, tapi tidak muncul di Paket saya.',
        answer:
          'Muat ulang /akun/paket, lalu cek pesanannya di Riwayat pembelian (/akun/pembelian). Kalau statusnya Lunas tapi paketnya tetap tidak muncul, hubungi kami dengan menyertakan nomor invoice.',
      },
    ],
    keywords: ['beli paket', 'checkout', 'paket gratis', 'rp0', 'pembayaran belum aktif', 'bayar qris', 'qris', 'doku'],
  },
  {
    slug: 'riwayat-transaksi-dan-invoice',
    categorySlug: 'pembayaran-kode-akses',
    title: 'Riwayat Pembelian dan Invoice',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Lihat status setiap pesanan dan simpan invoicenya sebagai bukti.',
    prerequisites: ['Sudah masuk ke akun Zenko dan pernah mengambil atau membeli paket.'],
    steps: [
      {
        title: 'Buka Riwayat pembelian',
        body: 'Dari halaman akun, pilih "Riwayat pembelian" untuk membuka /akun/pembelian.',
      },
      {
        title: 'Baca status pesanan',
        body: 'Setiap pesanan menampilkan salah satu status: Menunggu pembayaran, Menunggu verifikasi, Lunas, atau Kedaluwarsa.',
      },
      {
        title: 'Buka dan simpan invoice',
        body: 'Buka pesanan untuk melihat invoicenya, lalu klik "Cetak / simpan PDF" untuk menyimpan bukti.',
      },
    ],
    troubleshooting: [
      {
        question: 'Apa arti "Menunggu verifikasi"?',
        answer:
          'Kamu sudah mengonfirmasi pembayaran dan tim Zenko sedang mengeceknya, paling lama 1×24 jam. Paket terbuka begitu pembayarannya disetujui, dan kamu mendapat email saat keputusan dibuat.',
      },
      {
        question: 'Pesanan saya berstatus Kedaluwarsa.',
        answer:
          'Batas waktu pembayarannya sudah lewat. Jangan membayar pesanan yang sudah kedaluwarsa. Buat pesanan baru dari halaman paket.',
      },
    ],
    keywords: ['invoice', 'riwayat transaksi', 'riwayat pembelian', 'bukti pembayaran', 'nota', 'status pesanan', 'kedaluwarsa'],
  },

  // ======================================================================
  // Kategori 3: Ujian CBT dan Analisis Pembahasan
  // ======================================================================
  {
    slug: 'mulai-tryout',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Memulai Try Out CBT',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 3,
    summary: 'Buka paket dan mulai mengerjakan try out langkah demi langkah.',
    prerequisites: ['Sudah masuk ke akun Zenko.', 'Paketnya sudah ada di "Paket saya".'],
    steps: [
      {
        title: 'Buka Paket saya',
        body: 'Buka /akun/paket dan pilih try out yang ingin dikerjakan.',
      },
      {
        title: 'Klik "Mulai try out"',
        body: 'Di halaman detail paket, klik "Mulai try out". Kalau kamu pernah mengerjakan paket ini, tombolnya bertuliskan "Kerjakan lagi".',
      },
      {
        title: 'Baca aturan, lalu klik "Mulai Ujian"',
        body: 'Layar pembuka menampilkan "Aturan pengerjaan" untuk paket ini, termasuk cara kerja waktunya. Waktu mulai berjalan begitu kamu klik "Mulai Ujian".',
        note: {
          appearance: 'warning',
          body: 'Kerjakan di satu tab dan jangan tutup tab itu sampai selesai. Jawabanmu tersimpan di tab tersebut, dan waktu tetap berjalan meskipun kamu berpindah tab.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Paket saya tidak muncul di Paket saya, kenapa?',
        answer:
          'Pastikan kamu masuk dengan akun yang sama seperti saat mengambil paket, lalu cek status pesanannya di Riwayat pembelian. Paket baru muncul setelah pesanannya Lunas.',
      },
      {
        question: 'Apakah paket punya masa akses?',
        answer: 'Tidak. Paket yang sudah kamu miliki bisa dikerjakan selama akunmu aktif.',
      },
    ],
    keywords: ['mulai try out', 'kerjakan ujian', 'cbt', 'mulai ujian', 'kerjakan lagi'],
  },
  {
    slug: 'navigasi-ujian-dan-tanda-ragu-ragu',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Navigasi Ujian dan Ragu-Ragu',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Berpindah nomor soal dan menandai jawaban yang masih ragu-ragu.',
    prerequisites: ['Sedang berada di dalam ruang ujian CBT.'],
    steps: [
      {
        title: 'Pilih jawaban',
        body: 'Klik opsi jawaban pada soal yang sedang ditampilkan. Kamu bisa menggantinya kapan saja sebelum subtesnya berakhir.',
      },
      {
        title: 'Berpindah nomor soal',
        body: 'Gunakan tombol "Sebelumnya" dan "Selanjutnya" (di HP berupa tombol panah), atau klik nomor soal di panel navigasi untuk melompat langsung.',
      },
      {
        title: 'Tandai ragu-ragu',
        body: 'Klik "Ragu-ragu" pada soal yang ingin kamu periksa lagi. Klik "Batalkan ragu-ragu" untuk menghapus tandanya.',
      },
      {
        title: 'Baca warna panel navigasi',
        body: 'Warna nomor soal menunjukkan mana yang sudah dijawab, mana yang ditandai ragu-ragu, dan mana yang belum dijawab.',
      },
    ],
    troubleshooting: [
      {
        question: 'Saya salah pilih jawaban, bisakah diubah?',
        answer: 'Bisa, selama waktunya belum habis dan subtesnya belum kamu akhiri.',
      },
    ],
    keywords: ['navigasi soal', 'ragu-ragu', 'panel nomor soal', 'pindah soal'],
  },
  {
    slug: 'mode-waktu-flat-vs-sequential',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Aturan Waktu: Satu Timer atau per Subtes',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 3,
    summary: 'Pahami dua cara kerja waktu try out supaya tidak kehabisan waktu.',
    prerequisites: [],
    steps: [
      {
        title: 'Satu timer untuk seluruh ujian',
        body:
          'Semua soal dari seluruh subtes terbuka sejak awal dan kamu bebas memilih urutan pengerjaan. Hanya ada satu batas waktu. Saat waktu habis, ujian berakhir otomatis dan nilainya dihitung.',
      },
      {
        title: 'Timer per subtes',
        body:
          'Setiap subtes punya waktunya sendiri. Kalau kamu klik "Akhiri Subtes" lalu "Ya, lanjutkan", atau waktunya habis, kamu pindah ke subtes berikutnya dan subtes sebelumnya terkunci.',
        note: {
          appearance: 'warning',
          body: 'Subtes yang sudah ditinggalkan tidak bisa dibuka lagi. Periksa jawabanmu sebelum mengakhiri subtes.',
        },
      },
      {
        title: 'Cek aturan sebelum mulai',
        body: 'Layar pembuka setiap try out mencantumkan "Aturan pengerjaan" yang berlaku untuk paket itu. Sisa waktu terlihat di bagian atas ruang ujian.',
      },
    ],
    troubleshooting: [
      {
        question: 'Bagaimana cara tahu paket saya memakai satu timer atau timer per subtes?',
        answer: 'Baca bagian "Aturan pengerjaan" di layar pembuka sebelum kamu klik "Mulai Ujian".',
      },
    ],
    keywords: ['mode waktu', 'flat', 'sequential', 'timer ujian', 'subtes terkunci', 'akhiri subtes'],
  },
  {
    slug: 'tampilan-soal-disembunyikan',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Kenapa Soal Tiba-tiba Tertutup?',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Soal ditutup saat kamu meninggalkan tab ujian, sementara waktunya tetap berjalan.',
    prerequisites: [],
    steps: [
      {
        title: 'Soal ditutup saat tab tidak aktif',
        body:
          'Kalau kamu pindah tab, membuka aplikasi lain, atau jendela browser tidak aktif, soal ditutup dan muncul pesan "Tampilan soal disembunyikan".',
      },
      {
        title: 'Kembali ke tab ujian',
        body: 'Kembali ke tab ujian untuk membuka soalnya lagi. Jawabanmu tidak hilang.',
        note: {
          appearance: 'warning',
          body: 'Waktu ujian tetap berjalan selama soal tertutup.',
        },
      },
      {
        title: 'Salin dan cetak tidak berfungsi',
        body:
          'Selama ujian, menyalin, memotong, klik kanan, menyeret teks, dan pintasan Ctrl/Cmd + A, C, X, P, S, atau U tidak berfungsi. Ini untuk melindungi isi soal milik tutor.',
      },
    ],
    troubleshooting: [
      {
        question: 'Apakah ujian saya dibatalkan kalau pindah tab?',
        answer:
          'Tidak. Zenko tidak memberi teguran dan tidak mengakhiri ujian karena kamu pindah tab. Satu-satunya akibatnya adalah waktu yang terus berjalan.',
      },
    ],
    keywords: ['soal tertutup', 'soal disembunyikan', 'pindah tab', 'anti kecurangan', 'tidak bisa copy', 'salin'],
  },
  {
    slug: 'selesaikan-ujian-dan-baca-skor',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Selesaikan Ujian dan Baca Skor',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 3,
    summary: 'Akhiri try out, lalu baca skor yang dihitung server Zenko.',
    prerequisites: ['Sedang mengerjakan try out.'],
    steps: [
      {
        title: 'Klik "Selesaikan Ujian"',
        body: 'Di subtes terakhir, klik "Selesaikan Ujian". Kalau waktu habis, ujian berakhir otomatis.',
      },
      {
        title: 'Periksa jendela konfirmasi',
        body:
          'Jendela konfirmasi menunjukkan berapa soal yang belum dijawab dan berapa yang masih ditandai ragu-ragu. Klik "Ya, selesaikan" kalau sudah yakin. Setelah itu jawaban tidak bisa diubah.',
      },
      {
        title: 'Baca hasilnya',
        body:
          'Skor dihitung oleh server Zenko. Untuk SKD, kamu melihat skor per subtes, ambang batasnya, dan keterangan LULUS atau TIDAK LULUS. Untuk TKA, skor ditampilkan dalam skala 0–100 tanpa ambang kelulusan.',
      },
    ],
    troubleshooting: [
      {
        question: 'Bisakah try out yang sudah selesai dikerjakan ulang?',
        answer: 'Bisa, tanpa batas. Buka paketnya lagi dan klik "Kerjakan lagi". Setiap percobaan tercatat di riwayat paket.',
      },
      {
        question: 'Muncul "Nilai belum bisa dihitung". Apa yang harus saya lakukan?',
        answer:
          'Jawabanmu belum berhasil dinilai, biasanya karena koneksi. Klik "Nilai ulang". Hasil yang dikirim lebih dari sekitar 2 menit setelah waktu habis ditolak server. Kalau itu yang terjadi, kerjakan ulang paketnya.',
      },
    ],
    keywords: ['selesaikan ujian', 'kumpulkan ujian', 'skor', 'nilai', 'passing grade', 'lulus', 'nilai ulang', 'kerjakan ulang'],
  },
  {
    slug: 'membuka-lembar-pembahasan',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Membuka Lembar Pembahasan',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Buka kunci jawaban dan pembahasan dari tutor untuk setiap percobaan.',
    prerequisites: ['Sudah menyelesaikan try out.'],
    steps: [
      {
        title: 'Buka pembahasan percobaan',
        body: 'Dari halaman hasil, atau dari riwayat percobaan di halaman detail paket, buka pembahasan percobaan yang ingin kamu pelajari.',
      },
      {
        title: 'Pelajari kunci jawaban dan pembahasan',
        body: 'Bandingkan jawabanmu dengan kunci jawaban, lalu baca uraian penyelesaian yang ditulis tutor.',
      },
    ],
    troubleshooting: [
      {
        question: 'Apakah pembahasan berubah kalau tutor memperbarui paketnya?',
        answer: 'Tidak. Pembahasan disimpan per percobaan, jadi yang kamu baca tetap sesuai soal saat kamu mengerjakannya.',
      },
      {
        question: 'Rumus matematika di pembahasan tidak tampil rapi, kenapa?',
        answer: 'Lihat panduan "Rumus atau Gambar Tidak Muncul" di kategori Kendala Teknis.',
      },
    ],
    keywords: ['pembahasan', 'kunci jawaban', 'lihat pembahasan', 'riwayat percobaan'],
  },

  // ======================================================================
  // Kategori 4: Portal Tutor
  // ======================================================================
  {
    slug: 'daftar-akun-tutor',
    categorySlug: 'portal-tutor',
    title: 'Mendaftar Akun Tutor',
    roles: ['tutor'],
    updated: '11 September 2026',
    readMinutes: 3,
    summary: 'Ajukan diri jadi tutor Zenko dan pantau status pengajuanmu.',
    prerequisites: ['Sudah punya akun Zenko dan sudah masuk.'],
    steps: [
      {
        title: 'Buka halaman Jadi Tutor',
        body: 'Kunjungi /jadi-tutor untuk membaca ketentuan dan mulai mengajukan diri.',
      },
      {
        title: 'Lengkapi formulir pengajuan',
        body:
          'Isi nomor WhatsApp, bidang keahlian, dan pengalamanmu mengajar atau menyusun soal. Tautan portofolio boleh dikosongkan. Nama dan email diambil otomatis dari akunmu.',
      },
      {
        title: 'Kirim dan pantau status',
        body:
          'Tim Zenko meninjau pengajuanmu, biasanya dalam 1–3 hari kerja. Kalau disetujui, kamu mendapat email dan akunmu langsung bisa membuka Dashboard Tutor.',
      },
    ],
    troubleshooting: [
      {
        question: 'Pengajuan saya ditolak, bisakah mengajukan ulang?',
        answer:
          'Bisa. Lengkapi pengalaman atau portofoliomu, lalu ajukan lagi lewat /jadi-tutor. Pengajuan baru hanya tidak bisa dikirim selama pengajuan sebelumnya masih ditinjau.',
      },
    ],
    keywords: ['jadi tutor', 'daftar tutor', 'pengajuan tutor'],
  },
  {
    slug: 'wizard-buat-paket-tryout',
    categorySlug: 'portal-tutor',
    title: 'Membuat Paket Try Out: 5 Langkah',
    roles: ['tutor'],
    updated: '11 September 2026',
    readMinutes: 4,
    summary: 'Lima langkah membuat paket, dari identitas paket sampai diajukan untuk ditinjau.',
    prerequisites: ['Akun tutor sudah disetujui.'],
    steps: [
      {
        title: 'Mulai paket baru',
        body: 'Dari "Produk saya" di Dashboard Tutor, mulai paket baru di /dashboard/tutor/products/new. Perubahanmu tersimpan otomatis.',
      },
      {
        title: 'Langkah 1: Identitas Paket',
        body:
          'Pilih tipe paket (tunggal atau bundel) dan identitas ujiannya: kategori, jenis ujian, serta mode simulasi (semua subtes) atau mini try out (satu subtes).',
      },
      {
        title: 'Langkah 2: Konfigurasi Ujian',
        body:
          'Atur jumlah soal dan durasi kalau paketnya boleh diatur (maksimal 200 soal dan 300 menit). Untuk jenis ujian dengan susunan baku, langkah ini menampilkan susunan subtes, durasi, dan penilaian yang berlaku.',
      },
      {
        title: 'Langkah 3: Detail Produk',
        body: 'Isi judul, deskripsi, "Yang kamu dapatkan", harga, harga coret, dan sampul produk.',
        note: {
          appearance: 'information',
          body: 'Selama pembayaran belum aktif, isian harga dikunci dan paketmu tayang gratis (Rp0).',
        },
      },
      {
        title: 'Langkah 4: Soal',
        body:
          'Tulis soal satu per satu atau impor lewat CSV. Setiap soal wajib punya kunci jawaban dan pembahasan. Untuk paket bundel, langkah ini dipakai untuk memilih paket anggotanya.',
      },
      {
        title: 'Langkah 5: Review & ajukan',
        body:
          'Periksa daftar "Kelengkapan sebelum diajukan", lalu ajukan paketmu. Server memeriksa ulang seluruh paket dan menampilkan semua hal yang masih kurang sekaligus.',
      },
    ],
    troubleshooting: [
      {
        question: 'Paket saya tidak bisa diajukan, kenapa?',
        answer:
          'Buka langkah Review & ajukan dan periksa "Kelengkapan sebelum diajukan". Biasanya masih ada soal, kunci jawaban, atau pembahasan yang belum lengkap.',
      },
      {
        question: 'Paket saya ditolak. Di mana alasannya?',
        answer:
          'Buka "Produk saya". Alasan penolakan tampil sebagai "Catatan revisi" di paket tersebut. Perbaiki paketnya, lalu ajukan ulang. Keputusan moderasi belum dikirim lewat email, jadi pantau statusnya di halaman ini.',
      },
    ],
    keywords: ['buat paket', 'wizard tryout', 'produk baru tutor', 'ajukan paket', 'paket ditolak', 'catatan revisi', 'harga paket'],
  },
  {
    slug: 'input-soal-manual-katex-gambar',
    categorySlug: 'portal-tutor',
    title: 'Input Soal, KaTeX, dan Gambar',
    roles: ['tutor'],
    updated: '11 September 2026',
    readMinutes: 4,
    summary: 'Tulis soal lengkap dengan rumus matematika dan gambar.',
    prerequisites: ['Sedang berada di langkah Soal pada pembuatan paket.'],
    steps: [
      {
        title: 'Tulis pertanyaan',
        body: 'Ketik teks pertanyaan di editor yang tersedia pada setiap butir soal.',
      },
      {
        title: 'Sisipkan rumus matematika',
        body: 'Gunakan tombol rumus di toolbar editor untuk membuka pemilih formula KaTeX (pecahan, akar, eksponen, matriks, dan lainnya).',
      },
      {
        title: 'Unggah gambar',
        body: 'Unggah gambar untuk wacana atau opsi jawaban, misalnya untuk soal figural atau grafik.',
      },
      {
        title: 'Tentukan kunci jawaban',
        body: 'Untuk soal pilihan ganda biasa, tentukan opsi yang benar. Untuk soal berbobot (gaya TKP), atur bobot nilai pada setiap opsi.',
      },
      {
        title: 'Tulis pembahasan',
        body: 'Lengkapi pembahasan. Bagian ini wajib diisi sebelum paket bisa diajukan.',
      },
    ],
    troubleshooting: [
      {
        question: 'Rumus KaTeX yang saya tulis tidak tampil sesuai harapan, kenapa?',
        answer: 'Periksa kembali notasi yang dipilih dari pemilih formula. Kalau masalahnya berlanjut, lihat panduan "Rumus atau Gambar Tidak Muncul" di kategori Kendala Teknis.',
      },
    ],
    keywords: ['editor soal', 'katex', 'rumus matematika', 'gambar soal', 'tkp berbobot'],
  },
  {
    slug: 'impor-soal-csv',
    categorySlug: 'portal-tutor',
    title: 'Impor Soal Massal via CSV',
    roles: ['tutor'],
    updated: '11 September 2026',
    readMinutes: 3,
    summary: 'Unggah banyak soal sekaligus lewat file CSV.',
    prerequisites: ['Sedang berada di langkah Soal pada pembuatan paket.', 'Punya aplikasi spreadsheet seperti Excel atau Google Sheets.'],
    steps: [
      {
        title: 'Buka impor soal',
        body: 'Di editor subtes, klik "Impor soal", lalu pilih impor untuk subtes ini saja atau impor gabungan untuk beberapa subtes sekaligus.',
      },
      {
        title: 'Unduh template',
        body: 'Klik "Unduh Template CSV" untuk mendapatkan berkas contoh dengan kolom yang sesuai. Template gabungan punya kolom tambahan untuk nama subtes.',
      },
      {
        title: 'Lengkapi dan simpan',
        body: 'Buka template di Excel atau Google Sheets, lengkapi kolomnya, lalu simpan sebagai .csv (UTF-8).',
      },
      {
        title: 'Unggah dan periksa laporan',
        body: 'Unggah berkas CSV-nya. Zenko menampilkan jumlah soal yang berhasil diimpor.',
        note: {
          appearance: 'warning',
          body: 'Baris dengan kolom tidak lengkap atau format yang salah dilewati. Daftar baris yang dilewati tampil di panel impor. Perbaiki baris tersebut lalu unggah ulang.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Sebagian baris gagal diimpor, apa penyebab paling umum?',
        answer: 'Biasanya kolom wajib kosong, format kunci jawaban tidak sesuai template, atau file tidak disimpan sebagai CSV UTF-8.',
      },
    ],
    keywords: ['impor csv', 'upload soal', 'template csv', 'soal massal', 'excel'],
  },
  {
    slug: 'rekening-bank-tutor',
    categorySlug: 'portal-tutor',
    title: 'Rekening Bank Tutor',
    roles: ['tutor'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Simpan rekening pencairan dan ajukan perubahan bila perlu.',
    prerequisites: ['Akun tutor sudah aktif.', 'Rekening bank atas nama sendiri.'],
    steps: [
      {
        title: 'Buka tab Rekening bank',
        body: 'Buka "Pengaturan" di Dashboard Tutor (/dashboard/tutor/settings), lalu pilih tab "Rekening bank".',
      },
      {
        title: 'Isi data rekening pertama kali',
        body: 'Pilih bank, ketik nomor rekening dan nama pemilik rekening, lalu simpan.',
        note: {
          appearance: 'warning',
          body: 'Setelah disimpan pertama kali, rekening tidak bisa diubah sendiri. Pastikan datanya benar sebelum menyimpan.',
        },
      },
      {
        title: 'Ajukan perubahan rekening',
        body:
          'Kalau perlu mengganti rekening, klik "Ajukan perubahan rekening". Rekening baru berlaku setelah disetujui admin, dan hanya satu pengajuan yang bisa menunggu pada satu waktu.',
      },
    ],
    troubleshooting: [
      {
        question: 'Berapa lama proses verifikasi perubahan rekening?',
        answer: 'Perubahan diverifikasi manual oleh admin Zenko. Kalau belum ada kabar, hubungi kami lewat email atau WhatsApp.',
      },
    ],
    keywords: ['rekening bank', 'ganti rekening', 'ubah rekening tutor', 'no rek'],
  },
  {
    slug: 'payout-dan-bagi-hasil',
    categorySlug: 'portal-tutor',
    title: 'Pencairan Dana dan Bagi Hasil',
    roles: ['tutor'],
    updated: '11 September 2026',
    readMinutes: 3,
    summary: 'Pahami saldo penghasilanmu dan ajukan pencairan dana.',
    prerequisites: ['Akun tutor aktif dan rekening bank sudah tersimpan.'],
    steps: [
      {
        title: 'Buka Pencairan',
        body: 'Buka menu "Pencairan" di Dashboard Tutor (/dashboard/tutor/payouts).',
      },
      {
        title: 'Saldo siap dicairkan dan saldo tertahan',
        body: 'Setiap penjualan ditahan 7 hari sejak pesanannya lunas sebelum masuk ke "Saldo siap dicairkan". Selama masa itu, jumlahnya tampil sebagai "Saldo tertahan".',
      },
      {
        title: 'Klik "Tarik Saldo"',
        body: 'Masukkan jumlah penarikan (minimal Rp100.000 dan paling banyak sebesar saldo siap dicairkan), lalu klik "Ajukan pencairan".',
      },
      {
        title: 'Pantau status pencairan',
        body:
          'Status pencairan berjalan dari Diajukan, Diproses, lalu Ditransfer. Kalau Ditolak, alasannya ditampilkan dan jumlahnya kembali ke saldomu.',
      },
    ],
    troubleshooting: [
      {
        question: 'Berapa pembagian hasil penjualan untuk tutor?',
        answer: 'Tutor menerima 70% dari harga yang dibayar pembeli, sesuai Syarat dan Ketentuan Tutor di /syarat-tutor.',
      },
      {
        question: 'Kenapa sebagian saldo saya masih tertahan?',
        answer: 'Setiap penjualan ditahan 7 hari sejak lunas sebagai perlindungan terhadap pembatalan atau refund.',
      },
    ],
    keywords: ['payout', 'pencairan dana', 'tarik saldo', 'withdraw', 'saldo tertahan', 'bagi hasil', '70%'],
  },

  // ======================================================================
  // Kategori 5: Portal Bimbel, Langganan, dan Kelas
  // ======================================================================
  {
    slug: 'gabung-bimbel-dengan-kode',
    categorySlug: 'bimbel-institusi',
    title: 'Bergabung ke Bimbel dengan Kode atau Undangan',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Masuk ke bimbelmu lewat kode dari pengelola atau lewat undangan, lalu buka paket privatnya.',
    prerequisites: ['Sudah masuk ke akun Zenko.', 'Mendapat kode bimbel dari pengelola, atau diundang lewat email akunmu.'],
    steps: [
      {
        title: 'Buka Bimbel saya',
        body: 'Klik foto atau namamu di kanan atas, lalu pilih "Bimbel saya" (/akun/bimbel).',
      },
      {
        title: 'Masukkan kode bimbel',
        body: 'Klik "Gabung bimbel", isi "Kode bimbel" yang diberikan pengelola, lalu kirim permintaanmu.',
      },
      {
        title: 'Tunggu persetujuan',
        body: 'Permintaanmu masuk ke pengelola bimbel. Selama menunggu, statusnya tampil di halaman Bimbel saya.',
      },
      {
        title: 'Atau jawab undangan',
        body: 'Kalau pengelola mengundangmu lewat email akun, undangannya muncul di Bimbel saya. Terima atau tolak undangan tersebut.',
      },
      {
        title: 'Buka paket bimbel',
        body: 'Setelah keanggotaanmu aktif, bank soal bimbel muncul di halaman Bimbel saya.',
      },
    ],
    troubleshooting: [
      {
        question: 'Kode saya ditolak, kenapa?',
        answer: 'Periksa kembali kodenya. Kode bimbel diberikan oleh pengelola bimbelmu, bukan oleh Zenko.',
      },
      {
        question: 'Paket bimbel tidak bisa dibuka, kenapa?',
        answer:
          'Keanggotaanmu mungkin masih menunggu persetujuan atau sedang ditangguhkan. Hubungi pengelola bimbelmu, karena hanya mereka yang bisa mengaktifkannya.',
      },
    ],
    keywords: ['gabung bimbel', 'kode bimbel', 'kode akses', 'kode bergabung', 'undangan bimbel', 'join bimbel', 'les'],
  },
  {
    slug: 'daftar-bimbel-dan-mulai-uji-coba',
    categorySlug: 'bimbel-institusi',
    title: 'Daftarkan Bimbel dan Mulai Uji Coba',
    roles: ['bimbel'],
    updated: '10 September 2026',
    readMinutes: 3,
    summary: 'Buat ruang kerja Bimbel dan mulai uji coba Pro selama 7 hari dengan 25 kursi siswa.',
    prerequisites: ['Sudah memiliki akun Zenko yang aktif.', 'Memiliki kewenangan untuk mendaftarkan Bimbel atau institusi.'],
    steps: [
      {
        title: 'Pelajari tingkat dan harga',
        body: 'Buka /untuk-bimbel untuk membandingkan tingkat Dasar, Pro, dan Institusi sebelum mendaftar. Kamu belum perlu memilih atau membayar tingkat pada tahap ini.',
      },
      {
        title: 'Lengkapi formulir Bimbel',
        body: 'Buka /untuk-bimbel/daftar, lalu isi nama Bimbel, rentang jumlah siswa, dan kota bila diperlukan. Baca serta setujui Ketentuan Layanan dan Kebijakan Privasi sebelum melanjutkan.',
      },
      {
        title: 'Mulai uji coba',
        body: 'Klik "Mulai uji coba 7 hari". Ruang kerja langsung dibuat dengan kapabilitas Pro, kuota 25 siswa aktif, dan tanpa tagihan di muka.',
      },
      {
        title: 'Masuk ke dashboard Bimbel',
        body: 'Gunakan dashboard untuk membuat paket privat, menambahkan siswa, membentuk kelas, dan memantau masa uji coba. Banner sejak hari pertama menunjukkan tanggal berakhir dan harga langganan setelah uji coba.',
      },
    ],
    troubleshooting: [
      {
        question: 'Kenapa saya tidak diminta memilih tingkat saat mendaftar?',
        answer: 'Uji coba selalu memakai kapabilitas Pro dengan 25 kursi. Pilih tingkat setelah mencoba dan mengetahui kebutuhan siswa, pengajar, serta bank soal Bimbel.',
      },
    ],
    keywords: ['daftar bimbel', 'uji coba bimbel', 'trial pro', '25 kursi'],
  },
  {
    slug: 'pilih-dan-perpanjang-langganan-bimbel',
    categorySlug: 'bimbel-institusi',
    title: 'Pilih dan Perpanjang Langganan Bimbel',
    roles: ['bimbel'],
    updated: '11 September 2026',
    readMinutes: 4,
    summary: 'Bandingkan tingkat, buat tagihan bulanan atau tahunan, lalu aktifkan langganan setelah pembayaran diverifikasi.',
    prerequisites: ['Sudah mengelola ruang kerja Bimbel.', 'Memiliki akses sebagai pemilik atau admin Bimbel.'],
    steps: [
      {
        title: 'Buka menu Langganan',
        body: 'Dari dashboard Bimbel, buka menu Langganan. Bagian teratas menunjukkan tingkat, status, tanggal berakhir, serta pemakaian kursi saat ini.',
      },
      {
        title: 'Pilih periode dan tingkat',
        body: 'Pilih tagihan bulanan atau tahunan, lalu bandingkan Dasar, Pro, dan Institusi. Paket tahunan memberi masa aktif 12 bulan dengan harga dasar setara 10 bulan. Porsi penjualan marketplace adalah 70% untuk Dasar, 75% untuk Pro, dan 80% untuk Institusi.',
      },
      {
        title: 'Periksa ringkasan dan tanggal akhir',
        body: 'Ringkasan menampilkan tingkat, kuota yang termasuk, periode, tanggal aktif sampai, dan total. Perpanjangan lebih awal menyambung dari tanggal berakhir saat ini sehingga hari yang sudah dibayar tidak hilang.',
      },
      {
        title: 'Buat dan bayar tagihan',
        body: 'Klik "Buat tagihan" dan ikuti instruksi pembayarannya. Setelah membayar, isi nama pengirim (wajib) dan lampirkan bukti transfer bila ada. Status langganan berubah setelah tim Zenko memverifikasi pembayaran.',
        note: {
          appearance: 'warning',
          title: 'Jangan membuat tagihan berulang',
          body: 'Jika pembayaran sudah dikonfirmasi, tunggu verifikasi pada tagihan yang sama. Tagihan yang sedang diperiksa juga mencegah ruang kerja terkunci hanya karena antrean verifikasi.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Apa yang terjadi ketika masa aktif habis?',
        answer: 'Bimbel mendapat masa tenggang 3 hari. Pembuatan aktivitas baru dibatasi, tetapi data lama tetap dapat dibaca. Setelah masa tenggang, ruang kerja ditangguhkan sampai langganan diperpanjang.',
      },
      {
        question: 'Apakah saya kehilangan sisa hari jika memperpanjang lebih awal?',
        answer: 'Tidak. Periode baru dimulai setelah masa aktif saat ini berakhir.',
      },
    ],
    keywords: ['langganan bimbel', 'paket dasar', 'paket pro', 'institusi', 'perpanjang', 'masa tenggang'],
  },
  {
    slug: 'tambah-kursi-siswa-bimbel',
    categorySlug: 'bimbel-institusi',
    title: 'Tambah Kursi Siswa Bimbel',
    roles: ['bimbel'],
    updated: '11 September 2026',
    readMinutes: 3,
    summary: 'Tambah kapasitas siswa dalam kelipatan 5 dan pahami kapan kuota baru dapat digunakan.',
    prerequisites: ['Langganan Bimbel sedang aktif.', 'Masa aktif tersisa sekurang-kurangnya satu bulan.'],
    steps: [
      {
        title: 'Buka tindakan Tambah kursi',
        body: 'Buka menu Langganan lalu klik "Tambah kursi". Peringatan yang sama muncul di halaman Siswa ketika pemakaian sudah mencapai 80% kuota.',
      },
      {
        title: 'Pilih jumlah kursi',
        body: 'Tambah kursi dalam kelipatan 5. Penawaran menghitung Rp3.000 per kursi dikalikan sisa bulan masa aktif yang dibulatkan ke atas dan menampilkan kuota baru sebelum tagihan dibuat.',
      },
      {
        title: 'Periksa saran perubahan tingkat',
        body: 'Jika tingkat yang lebih tinggi lebih hemat daripada menumpuk kursi tambahan, Zenko menampilkan perbandingan agar kamu dapat memilih opsi yang lebih sesuai.',
      },
      {
        title: 'Bayar dan tunggu verifikasi',
        body: 'Buat tagihan, selesaikan pembayaran, lalu isi nama pengirim dan lampirkan bukti bila ada. Kursi ditandai "menunggu pembayaran" dan baru masuk ke kuota aktif setelah pembayaran disetujui.',
      },
    ],
    troubleshooting: [
      {
        question: 'Kenapa tombol Tambah kursi tidak tersedia menjelang masa berakhir?',
        answer: 'Jika sisa masa aktif kurang dari satu bulan, sistem mengarahkan ke perpanjangan agar kamu tidak membayar satu bulan penuh untuk kursi yang hanya berlaku beberapa hari.',
      },
      {
        question: 'Pembayaran sudah dikirim, tetapi siswa baru belum bisa diaktifkan.',
        answer: 'Kuota tidak bertambah sebelum pembayaran diverifikasi. Lihat jumlah kursi yang menunggu pembayaran pada halaman Langganan atau Siswa, lalu hubungi kami kalau verifikasinya melewati 1×24 jam.',
      },
    ],
    keywords: ['tambah kursi', 'kuota siswa', 'kursi penuh', 'seat addon', 'menunggu pembayaran'],
  },
  {
    slug: 'kelola-siswa-dan-kelas-bimbel',
    categorySlug: 'bimbel-institusi',
    title: 'Kelola Siswa dan Kelas Bimbel',
    roles: ['bimbel'],
    updated: '10 September 2026',
    readMinutes: 4,
    summary: 'Undang siswa, aktifkan keanggotaan, dan kelompokkan siswa ke kelas tanpa mengubah akses paket.',
    prerequisites: ['Sudah masuk ke dashboard Bimbel.', 'Siswa sudah memiliki akun Zenko untuk undangan melalui email.'],
    steps: [
      {
        title: 'Tambahkan siswa',
        body: 'Buka menu Siswa, klik "Tambah siswa", lalu masukkan email akun Zenko. Kamu juga dapat membagikan kode bergabung; permintaan melalui kode tetap perlu disetujui pengelola.',
      },
      {
        title: 'Aktifkan keanggotaan',
        body: 'Temukan siswa berstatus menunggu lalu klik "Aktifkan". Hanya siswa aktif yang memakai kursi; siswa yang ditangguhkan tidak memakai kapasitas aktif.',
      },
      {
        title: 'Buat kelas',
        body: 'Buka menu Kelas, klik "Buat kelas", dan beri nama sesuai rombel atau program. Dari daftar kelas, pilih "Atur siswa" untuk mengelompokkan anggota.',
      },
      {
        title: 'Pahami fungsi kelas',
        body: 'Kelas membantu administrasi dan pembacaan daftar. Kelas tidak membatasi akses bank soal: seluruh siswa aktif Bimbel tetap dapat membuka paket privat yang sedang tayang.',
      },
    ],
    troubleshooting: [
      {
        question: 'Kenapa siswa tidak dapat diaktifkan?',
        answer: 'Periksa apakah kuota sudah penuh. Jika penuh, buat tagihan kursi tambahan atau perpanjang langganan, lalu tunggu pembayaran diverifikasi sebelum mencoba lagi.',
      },
      {
        question: 'Apa yang terjadi jika kelas dihapus?',
        answer: 'Siswa tidak dihapus dari Bimbel dan tetap dapat mengakses bank soal privat. Hanya pengelompokan kelasnya yang hilang.',
      },
    ],
    keywords: ['anggota bimbel', 'tambah siswa', 'kode bergabung', 'kelas', 'rombel', 'aktivasi siswa'],
  },
  {
    slug: 'paket-privat-dan-marketplace-bimbel',
    categorySlug: 'bimbel-institusi',
    title: 'Paket Privat dan Penjualan Marketplace Bimbel',
    roles: ['bimbel'],
    updated: '10 September 2026',
    readMinutes: 4,
    summary: 'Tayangkan paket untuk siswa internal atau ajukan salinannya ke marketplace dengan bagi hasil sesuai tingkat.',
    prerequisites: ['Langganan atau uji coba Bimbel masih dapat digunakan.', 'Memiliki akses untuk membuat paket; penjualan marketplace memerlukan peran pemilik atau admin.'],
    steps: [
      {
        title: 'Buat paket Bimbel',
        body: 'Buka menu Paket dan klik "Buat paket baru". Susun identitas paket, soal, kunci, pembahasan, serta aturan pengerjaan sampai indikator kelengkapan terpenuhi.',
      },
      {
        title: 'Tayangkan sebagai paket privat',
        body: 'Pilih tindakan "Tayangkan" untuk membuka paket kepada seluruh siswa aktif Bimbel. Paket privat tidak muncul di katalog marketplace publik.',
      },
      {
        title: 'Ajukan ke marketplace',
        body: 'Pada paket privat yang sudah tayang, pemilik atau admin dapat memilih "Jual di marketplace". Zenko membuat salinan publik untuk ditinjau tanpa mengubah paket privat sumbernya.',
      },
      {
        title: 'Pantau penjualan dan hasil',
        body: 'Gunakan menu Penjualan untuk melihat transaksi marketplace dan menu hasil paket untuk membaca performa siswa internal. Bagian Bimbel adalah 70% pada Dasar, 75% pada Pro, atau 80% pada Institusi.',
        note: {
          appearance: 'warning',
          title: 'Persentase disimpan saat transaksi',
          body: 'Perubahan tingkat setelah penjualan tidak mengubah pembagian transaksi lama. Pembagian internal dengan tutor penulis dikelola oleh Bimbel.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Kenapa tombol Jual di marketplace tidak muncul?',
        answer: 'Pastikan paket privat sudah berstatus tayang dan akunmu berperan sebagai pemilik atau admin Bimbel.',
      },
      {
        question: 'Apakah mengarsipkan salinan marketplace menutup paket privat?',
        answer: 'Tidak. Paket privat dan salinan marketplace memiliki status terpisah sehingga akses siswa internal dapat dikelola tanpa bergantung pada katalog publik.',
      },
    ],
    keywords: ['paket privat', 'marketplace bimbel', 'jual paket', 'bagi hasil bimbel', '70%', '75%', '80%'],
  },

  // ======================================================================
  // Kategori 6: Kendala Teknis, Troubleshooting, dan Kebijakan
  // ======================================================================
  {
    slug: 'qris-berhasil-paket-belum-aktif',
    categorySlug: 'kendala-teknis-kebijakan',
    title: 'Sudah Bayar, Paket Belum Muncul',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Langkah kalau pembayaranmu sudah berhasil tapi paketnya belum muncul.',
    prerequisites: ['Berlaku untuk paket berbayar yang sudah kamu bayar.'],
    steps: [
      {
        title: 'Muat ulang Paket saya',
        body: 'Tunggu sebentar, lalu muat ulang halaman /akun/paket.',
      },
      {
        title: 'Cek status di Riwayat pembelian',
        body:
          'Buka /akun/pembelian. Status "Menunggu verifikasi" berarti pembayaranmu sedang dicek tim Zenko, paling lama 1×24 jam. Kamu mendapat email saat keputusannya dibuat.',
      },
      {
        title: 'Siapkan data pembayaran',
        body:
          'Kalau sudah lewat 1×24 jam, atau statusnya masih "Menunggu pembayaran" padahal saldomu sudah terpotong, catat nomor invoice dan simpan bukti pembayaran dari aplikasi bank atau e-wallet.',
      },
      {
        title: 'Hubungi kami',
        body: `Kirim nomor invoice dan bukti bayar lewat WhatsApp ke ${SUPPORT_CONTACT.phoneDisplay} atau email ke ${SUPPORT_CONTACT.email}.`,
      },
    ],
    troubleshooting: [
      {
        question: 'Kapan pesan saya dibalas?',
        answer: `Tim Zenko membalas pada jam layanan ${SUPPORT_CONTACT.hours}.`,
      },
    ],
    keywords: ['qris tertunda', 'sudah bayar', 'paket belum aktif', 'paket tidak muncul', 'menunggu verifikasi', 'nyangkut'],
  },
  {
    slug: 'koneksi-terputus-saat-ujian',
    categorySlug: 'kendala-teknis-kebijakan',
    title: 'Koneksi Putus atau Halaman Tertutup saat Ujian',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Apa yang tersimpan, apa yang hilang, dan cara melanjutkan try out yang terputus.',
    prerequisites: [],
    steps: [
      {
        title: 'Jangan tutup tab ujian',
        body:
          'Jawaban dan posisi soalmu disimpan di tab browser tempat kamu mengerjakan. Selama tab itu tetap terbuka, menunggu koneksi kembali atau memuat ulang halaman tidak menghapus jawabanmu.',
      },
      {
        title: 'Muat ulang setelah koneksi kembali',
        body: 'Begitu internet tersambung lagi, muat ulang halaman ujian di tab yang sama untuk melanjutkan dari soal terakhir.',
        note: {
          appearance: 'warning',
          body: 'Waktu terus berjalan selama koneksi putus. Hasil yang dikirim lebih dari sekitar 2 menit setelah waktu habis ditolak server.',
        },
      },
      {
        title: 'Kalau tab sudah tertutup',
        body:
          'Menutup tab atau browser menghapus jawaban yang belum dikirim. Buka paketnya lagi dan klik "Mulai try out" atau "Kerjakan lagi" untuk memulai percobaan baru.',
      },
    ],
    troubleshooting: [
      {
        question: 'Bisakah saya melanjutkan dari perangkat lain?',
        answer: 'Tidak. Jawaban yang belum dikirim hanya tersimpan di tab tempat kamu mengerjakan.',
      },
    ],
    keywords: ['koneksi terputus', 'internet putus', 'browser tertutup', 'refresh', 'lanjutkan ujian', 'sesi ujian'],
  },
  {
    slug: 'rumus-katex-atau-gambar-tidak-muncul',
    categorySlug: 'kendala-teknis-kebijakan',
    title: 'Rumus atau Gambar Tidak Muncul',
    roles: ['siswa', 'tutor', 'bimbel'],
    updated: '11 September 2026',
    readMinutes: 2,
    summary: 'Langkah dasar memperbaiki tampilan rumus dan gambar soal.',
    prerequisites: [],
    steps: [
      {
        title: 'Pastikan JavaScript aktif',
        body: 'Periksa pengaturan browser untuk memastikan JavaScript tidak dinonaktifkan.',
      },
      {
        title: 'Muat ulang halaman sepenuhnya',
        body: 'Muat ulang halaman dengan Ctrl+F5 (Windows) atau Cmd+Shift+R (Mac).',
      },
      {
        title: 'Nonaktifkan ad-blocker sementara',
        body: 'Ekstensi ad-blocker terkadang memblokir skrip atau font yang dibutuhkan untuk menampilkan rumus. Nonaktifkan sementara, lalu muat ulang halaman.',
      },
    ],
    troubleshooting: [
      {
        question: 'Masalah masih berlanjut setelah semua langkah di atas?',
        answer: 'Coba buka di browser atau perangkat lain. Kalau tetap bermasalah, hubungi kami dengan menyertakan tangkapan layar.',
      },
    ],
    keywords: ['katex tidak muncul', 'rumus error', 'gambar tidak muncul'],
  },
  {
    slug: 'prosedur-refund',
    categorySlug: 'kendala-teknis-kebijakan',
    title: 'Prosedur Pengajuan Refund',
    roles: ['siswa'],
    updated: '11 September 2026',
    readMinutes: 3,
    summary: 'Syarat, batas waktu, dan cara mengajukan pengembalian dana.',
    prerequisites: ['Pembayaranmu berhasil tidak lebih dari 7 hari kalender yang lalu.'],
    steps: [
      {
        title: 'Periksa syaratnya',
        body:
          'Refund hanya dipertimbangkan untuk pembayaran ganda pada paket dan akun yang sama, kegagalan teknis di sisi Zenko yang membuat paket sama sekali tidak bisa diakses, atau isi paket yang berbeda secara material dari deskripsinya. Rincian lengkapnya ada di /kebijakan-refund.',
      },
      {
        title: 'Siapkan data pendukung',
        body: 'Siapkan nomor invoice, email akun yang dipakai membeli, alasan pengajuan, dan bukti pendukung seperti tangkapan layar.',
      },
      {
        title: 'Kirim pengajuan',
        body: `Kirim pengajuan ke ${SUPPORT_CONTACT.email} paling lambat 7 hari kalender setelah pembayaran berhasil.`,
      },
      {
        title: 'Tunggu peninjauan',
        body:
          'Untuk laporan kegagalan akses, tim Zenko lebih dulu berupaya memperbaikinya dalam 3 hari kerja. Refund yang disetujui diproses dalam 5–14 hari kerja.',
      },
      {
        title: 'Terima pengembalian dana',
        body:
          'Refund yang disetujui dikirim lewat transfer manual ke rekening atas nama pembeli. Siapkan nama bank, nomor rekening, dan nama pemilik rekening saat diminta.',
      },
    ],
    troubleshooting: [
      {
        question: 'Transaksi saya tidak memenuhi syarat refund, apa opsi lain?',
        answer: 'Hubungi kami untuk menceritakan kendalanya. Setiap kasus ditinjau berdasarkan situasinya.',
      },
    ],
    keywords: ['refund', 'pengembalian dana', 'uang kembali', 'kebijakan refund', 'batal'],
  },
]

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return helpArticles.find(article => article.slug === slug)
}

export function getHelpCategory(slug: string): HelpCategory | undefined {
  return helpCategories.find(category => category.slug === slug)
}
