/**
 * Konten Pusat Bantuan. Sumber perencanaan: docs/pusat-bantuan-brainstorm-guide.md
 * (di root monorepo). Beberapa artikel di sana menjelaskan fitur yang belum
 * dibangun di produk (lihat flag `comingSoon` dan `note.appearance === 'discovery'`
 * di bawah) — artikel itu tetap diterbitkan sesuai permintaan, tapi ditandai
 * jelas "Segera Hadir" supaya tidak menyesatkan pengguna nyata.
 */

export type HelpRole = 'siswa' | 'tutor' | 'bimbel'

export interface HelpNote {
  appearance: 'warning' | 'discovery'
  title?: string
  body: string
}

export interface HelpStep {
  title: string
  body: string
  screenshot?: string
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
  /** Artikel menjelaskan alur yang belum tersedia di produk. */
  comingSoon?: boolean
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
    title: 'Pembelian, Pembayaran, dan Kode Akses',
    description: 'Coba gratis, bayar via QRIS, kode akses bimbel, dan riwayat transaksi.',
    icon: 'wallet',
  },
  {
    slug: 'ujian-cbt-pembahasan',
    title: 'Ujian CBT dan Analisis Pembahasan',
    description: 'Mengerjakan try out, navigasi soal, mode waktu, skor, dan pembahasan.',
    icon: 'target',
  },
  {
    slug: 'portal-tutor',
    title: 'Portal Tutor: Pembuatan Soal dan Penjualan',
    description: 'Ajukan akun tutor, buat paket, input soal, impor CSV, rekening, dan payout.',
    icon: 'handshake',
  },
  {
    slug: 'bimbel-institusi',
    title: 'Portal Bimbel, Langganan, dan Kelas',
    description: 'Mulai uji coba, pilih langganan, tambah kursi, kelola siswa dan kelas, serta jual paket.',
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
    updated: '25 Agustus 2026',
    readMinutes: 3,
    summary: 'Buat akun Zenko lewat Google satu klik, atau email dan kata sandi.',
    prerequisites: [
      'Punya alamat email aktif, atau akun Google yang bisa diakses.',
      'Menggunakan browser Google Chrome atau Safari versi terbaru.',
    ],
    steps: [
      {
        title: 'Buka halaman pendaftaran',
        body: 'Buka halaman /daftar dari tombol "Daftar" di bilah navigasi Zenko.',
        screenshot: 'Tampilan halaman /daftar dengan tombol "Daftar dengan Google" dan form Nama, Email, Kata Sandi.',
      },
      {
        title: 'Pilih metode pendaftaran',
        body:
          'Klik "Daftar dengan Google" untuk mendaftar satu klik memakai akun Google, atau lengkapi form Nama Lengkap, Email, dan Kata Sandi untuk mendaftar manual.',
      },
      {
        title: 'Verifikasi email (khusus pendaftaran manual)',
        body:
          'Kalau mendaftar lewat email, kamu akan diarahkan ke halaman /verifikasi-email. Buka kotak masuk emailmu dan masukkan 6 digit kode OTP yang dikirim Zenko.',
        screenshot: 'Tampilan input 6 digit kode verifikasi di halaman /verifikasi-email.',
        note: {
          appearance: 'warning',
          body: 'Pendaftaran lewat Google tidak memerlukan langkah verifikasi ini — akun langsung aktif.',
        },
      },
      {
        title: 'Masuk ke akun',
        body: 'Setelah verifikasi berhasil (atau langsung setelah masuk dengan Google), kamu otomatis masuk ke halaman akun Zenko.',
      },
    ],
    troubleshooting: [
      {
        question: 'Kode OTP tidak masuk ke email, apa yang harus dilakukan?',
        answer:
          'Periksa folder Spam/Promosi, tunggu 1–2 menit, lalu gunakan tombol kirim ulang kode di halaman /verifikasi-email. Pastikan alamat email yang didaftarkan sudah benar.',
      },
      {
        question: 'Email yang saya pakai sudah pernah terdaftar, apa solusinya?',
        answer:
          'Gunakan halaman /masuk dan coba masuk dengan email tersebut, atau reset kata sandi lewat /lupa-password kalau lupa kata sandinya.',
      },
    ],
    keywords: ['daftar', 'registrasi', 'buat akun', 'google', 'otp', 'verifikasi email'],
  },
  {
    slug: 'reset-kata-sandi',
    categorySlug: 'akun-keamanan',
    title: 'Reset Kata Sandi',
    roles: ['siswa', 'tutor', 'bimbel'],
    updated: '25 Agustus 2026',
    readMinutes: 2,
    summary: 'Pulihkan akses akun lewat tautan reset yang dikirim ke email.',
    prerequisites: ['Akun terdaftar menggunakan email dan kata sandi (bukan hanya lewat Google).', 'Bisa mengakses email yang didaftarkan.'],
    steps: [
      {
        title: 'Buka tautan lupa kata sandi',
        body: 'Di halaman /masuk, klik tautan "Lupa kata sandi" untuk menuju halaman /lupa-password.',
        screenshot: 'Halaman /masuk dengan tautan "Lupa kata sandi" disorot.',
      },
      {
        title: 'Kirim permintaan reset',
        body: 'Masukkan alamat email yang terdaftar di Zenko, lalu kirim permintaan reset kata sandi.',
      },
      {
        title: 'Buka email dan klik tautan reset',
        body: 'Buka pesan dari Zenko di kotak masukmu dan klik tautan reset yang akan membawamu ke halaman /password-baru.',
        screenshot: 'Contoh email berisi tautan reset kata sandi dari Zenko.',
      },
      {
        title: 'Buat kata sandi baru',
        body: 'Masukkan kata sandi baru beserta konfirmasinya, lalu simpan. Kamu bisa langsung masuk memakai kata sandi baru itu.',
        screenshot: 'Form input kata sandi baru dan konfirmasi di halaman /password-baru.',
        note: {
          appearance: 'warning',
          body: 'Tautan reset punya batas waktu berlaku. Kalau sudah kedaluwarsa, ulangi dari langkah pertama untuk mendapat tautan baru.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Akun saya dibuat lewat Google, kenapa tidak ada opsi reset kata sandi?',
        answer: 'Akun yang dibuat lewat Google tidak punya kata sandi Zenko — masuk langsung dengan tombol "Masuk dengan Google" di halaman /masuk.',
      },
      {
        question: 'Email reset tidak kunjung datang?',
        answer: 'Periksa folder Spam, pastikan email yang dimasukkan sama persis dengan email pendaftaran, lalu coba kirim ulang setelah beberapa menit.',
      },
    ],
    keywords: ['lupa password', 'lupa kata sandi', 'reset password', 'ganti sandi'],
  },
  {
    slug: 'perbarui-profil-dan-kata-sandi',
    categorySlug: 'akun-keamanan',
    title: 'Ubah Profil dan Kata Sandi',
    roles: ['siswa', 'tutor', 'bimbel'],
    updated: '25 Agustus 2026',
    readMinutes: 2,
    summary: 'Ganti nama, foto profil, dan kata sandi akun yang sudah aktif.',
    prerequisites: ['Sudah masuk ke akun Zenko.'],
    steps: [
      {
        title: 'Buka menu profil',
        body: 'Klik dropdown akun di navigasi kanan atas, lalu pilih "Profil Saya" untuk membuka halaman /akun/profil.',
        screenshot: 'Dropdown navigasi akun di bilah navigasi dengan opsi "Profil Saya" disorot.',
      },
      {
        title: 'Ubah data profil',
        body: 'Perbarui nama lengkap atau foto profil pada bagian Profil, lalu simpan perubahan.',
        screenshot: 'Halaman /akun/profil dengan bagian data profil disorot.',
      },
      {
        title: 'Ganti kata sandi',
        body: 'Pada bagian Keamanan di halaman yang sama, masukkan kata sandi lama lalu kata sandi baru, dan simpan.',
        screenshot: 'Bagian Keamanan di /akun/profil dengan form ganti kata sandi.',
      },
    ],
    troubleshooting: [
      {
        question: 'Tidak ada form ganti kata sandi di halaman profil saya, kenapa?',
        answer: 'Akun yang masuk lewat Google tidak memiliki kata sandi Zenko sehingga bagian ini tidak muncul.',
      },
    ],
    keywords: ['ubah profil', 'ganti nama', 'foto profil', 'ganti kata sandi akun'],
  },

  // ======================================================================
  // Kategori 2: Pembelian, Pembayaran, dan Kode Akses
  // ======================================================================
  {
    slug: 'coba-gratis-5-soal',
    categorySlug: 'pembayaran-kode-akses',
    title: 'Coba Gratis 5 Soal',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 2,
    summary: 'Cicipi lima soal asli sebuah paket, gratis, tanpa perlu membayar.',
    prerequisites: ['Tidak perlu punya akun untuk mencoba — cukup buka katalog paket.'],
    steps: [
      {
        title: 'Buka katalog paket',
        body: 'Kunjungi halaman /paket dan telusuri paket try out yang ingin dicoba.',
      },
      {
        title: 'Buka halaman detail paket',
        body: 'Klik paket yang dituju untuk membuka halaman /paket/[slug] miliknya.',
      },
      {
        title: 'Klik "Coba Gratis"',
        body: 'Pada halaman detail paket, klik tombol coba gratis untuk membuka /paket/[slug]/coba.',
        screenshot: 'Tombol "Coba Gratis" pada halaman detail paket.',
      },
      {
        title: 'Kerjakan simulasi 5 soal',
        body: 'Kerjakan lima soal asli dari paket tersebut untuk merasakan langsung format dan tingkat kesulitannya sebelum membeli.',
        screenshot: 'Tampilan antarmuka simulasi 5 soal.',
      },
    ],
    troubleshooting: [
      {
        question: 'Apakah hasil simulasi coba gratis ini disimpan atau memengaruhi skor?',
        answer: 'Tidak. Simulasi ini hanya untuk pratinjau soal, hasilnya tidak masuk ke riwayat nilai resmi paket.',
      },
    ],
    keywords: ['coba gratis', 'trial', '5 soal', 'preview soal'],
  },
  {
    slug: 'beli-dan-bayar-via-qris',
    categorySlug: 'pembayaran-kode-akses',
    title: 'Beli dan Bayar via QRIS',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 3,
    summary: 'Beli paket try out dan selesaikan pembayaran lewat QRIS.',
    prerequisites: ['Sudah masuk ke akun Zenko.', 'Punya aplikasi m-Banking atau e-Wallet yang mendukung QRIS.'],
    steps: [
      {
        title: 'Klik "Beli Sekarang"',
        body: 'Dari halaman detail paket (/paket/[slug]), klik tombol "Beli Sekarang".',
      },
      {
        title: 'Tinjau ringkasan checkout',
        body: 'Periksa rincian biaya di halaman /checkout/[slug] sebelum melanjutkan pembayaran.',
        screenshot: 'Rincian tagihan di halaman checkout.',
      },
      {
        title: 'Bayar dengan QRIS',
        body: 'Klik "Bayar Sekarang" untuk memunculkan kode QRIS, lalu scan menggunakan aplikasi m-Banking atau e-Wallet yang mendukung QRIS (pembayaran diproses lewat DOKU).',
        screenshot: 'Jendela pop-up kode QRIS beserta batas waktu pembayaran.',
      },
      {
        title: 'Tunggu konfirmasi otomatis',
        body: 'Setelah pembayaran berhasil, status akan terkonfirmasi otomatis dan paket muncul di halaman /akun/paket.',
        screenshot: 'Notifikasi transaksi berhasil dengan tautan menuju "Paket Saya".',
      },
    ],
    troubleshooting: [
      {
        question: 'Pembayaran sudah berhasil tapi paket belum muncul, harus bagaimana?',
        answer:
          'Lihat panduan "Panduan jika Pembayaran QRIS Berhasil tetapi Paket Belum Aktif" di kategori Kendala Teknis untuk langkah lengkapnya.',
      },
    ],
    keywords: ['beli paket', 'bayar qris', 'checkout', 'doku'],
  },
  {
    slug: 'aktivasi-kode-akses-bimbel',
    categorySlug: 'pembayaran-kode-akses',
    title: 'Aktivasi Kode Akses Bimbel',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 2,
    summary: 'Rencana klaim kode dari bimbel agar paket aktif tanpa biaya tambahan.',
    prerequisites: ['Sudah masuk ke akun Zenko.', 'Sudah menerima kode akses resmi dari bimbel atau institusi.'],
    comingSoon: true,
    steps: [
      {
        title: 'Buka menu klaim kode akses',
        body: 'Fitur klaim kode akses lewat menu profil sedang dalam pengembangan dan belum tersedia di akun Zenko saat ini.',
        note: {
          appearance: 'discovery',
          title: 'Segera hadir',
          body: 'Rencananya kamu akan bisa memasukkan kode dari dropdown menu profil, lalu paket otomatis terdaftar tanpa biaya tambahan.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Bimbel saya sudah punya kode akses, tapi saya tidak menemukan menunya di akun. Kenapa?',
        answer:
          'Fitur ini belum diluncurkan. Sambil menunggu, hubungi tim bimbel atau tim dukungan Zenko untuk cara aktivasi sementara yang berlaku.',
      },
    ],
    keywords: ['kode akses', 'klaim kode', 'voucher bimbel'],
  },
  {
    slug: 'riwayat-transaksi-dan-invoice',
    categorySlug: 'pembayaran-kode-akses',
    title: 'Riwayat Transaksi dan Invoice',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 2,
    summary: 'Temukan transaksi lama dan unduh bukti pembayaran resmi.',
    prerequisites: ['Sudah masuk ke akun Zenko dan pernah melakukan pembelian.'],
    steps: [
      {
        title: 'Buka riwayat pembelian',
        body: 'Buka menu akun dan pilih "Riwayat Pembelian" untuk menuju halaman /akun/pembelian.',
      },
      {
        title: 'Cari transaksi yang dituju',
        body: 'Telusuri daftar transaksi berdasarkan nama paket atau tanggal pembelian.',
        screenshot: 'Tabel daftar transaksi di /akun/pembelian.',
      },
      {
        title: 'Buka nota atau bukti bayar',
        body: 'Klik nomor invoice pada transaksi untuk melihat rincian nota dan mengunduh atau mencetak bukti bayar resmi.',
        screenshot: 'Lembar faktur (invoice) digital berstatus Lunas.',
      },
    ],
    troubleshooting: [
      {
        question: 'Statusnya masih "Menunggu Pembayaran" padahal saya sudah bayar, apa yang harus saya lakukan?',
        answer:
          'Tunggu beberapa menit untuk konfirmasi otomatis. Kalau masih belum berubah, lihat panduan pembayaran QRIS tertunda di kategori Kendala Teknis.',
      },
    ],
    keywords: ['invoice', 'riwayat transaksi', 'bukti pembayaran', 'nota'],
  },

  // ======================================================================
  // Kategori 3: Ujian CBT dan Analisis Pembahasan
  // ======================================================================
  {
    slug: 'mulai-tryout',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Memulai Try Out CBT',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 3,
    summary: 'Buka paket dan mulai pengerjaan try out CBT langkah demi langkah.',
    prerequisites: ['Sudah masuk ke akun Zenko.', 'Memiliki paket aktif di menu Paket Saya.'],
    steps: [
      {
        title: 'Buka Paket Saya',
        body: 'Buka menu /akun/paket dan pilih try out yang ingin dikerjakan.',
      },
      {
        title: 'Baca petunjuk teknis',
        body: 'Baca petunjuk pengerjaan pada halaman detail paket (/akun/paket/[slug]) sebelum memulai.',
        screenshot: 'Halaman detail paket berisi daftar subtes dan tombol pengerjaan.',
      },
      {
        title: 'Klik "Mulai Kerjakan"',
        body: 'Klik tombol "Mulai Kerjakan" untuk masuk ke ruang ujian di /akun/paket/[slug]/kerjakan.',
        screenshot: 'Tampilan ruang ujian CBT setelah try out dimulai.',
        note: {
          appearance: 'discovery',
          title: 'Segera hadir',
          body: 'Mode layar penuh (fullscreen lockdown) otomatis saat mulai ujian sedang direncanakan dan belum aktif di produk saat ini.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Tombol "Mulai Kerjakan" tidak muncul, kenapa?',
        answer: 'Pastikan paket masih dalam masa akses dan kamu masuk dengan akun yang sama saat membeli atau mengaktifkan paket.',
      },
    ],
    keywords: ['mulai try out', 'kerjakan ujian', 'cbt', 'fullscreen'],
  },
  {
    slug: 'navigasi-ujian-dan-tanda-ragu-ragu',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Navigasi Ujian dan Ragu-Ragu',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 3,
    summary: 'Berpindah nomor soal dan menandai jawaban yang masih ragu-ragu.',
    prerequisites: ['Sedang berada di dalam ruang ujian CBT.'],
    steps: [
      {
        title: 'Pilih jawaban',
        body: 'Klik salah satu opsi jawaban pada soal yang sedang ditampilkan.',
      },
      {
        title: 'Berpindah nomor soal',
        body: 'Gunakan tombol navigasi "Sebelumnya" dan "Berikutnya", atau klik langsung nomor soal pada panel navigasi untuk melompat ke soal tertentu.',
        screenshot: 'Panel navigasi nomor soal beserta legenda status warna.',
      },
      {
        title: 'Tandai status ragu-ragu',
        body: 'Gunakan tombol tanda ragu-ragu pada soal yang masih ingin ditinjau ulang sebelum waktu habis.',
      },
      {
        title: 'Baca kode warna grid navigasi',
        body: 'Perhatikan warna pada grid navigasi nomor: menandakan status Terjawab, Ragu-ragu, atau Belum Dijawab, supaya kamu tahu soal mana yang masih perlu dikerjakan.',
        note: {
          appearance: 'discovery',
          title: 'Segera hadir',
          body: 'Pintasan keyboard (A–E untuk memilih jawaban, panah untuk berpindah nomor) dan tampilan split-screen untuk wacana panjang sedang direncanakan dan belum tersedia saat ini.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Saya salah pilih jawaban, bisakah diubah?',
        answer: 'Bisa, selama subtes yang bersangkutan belum dikumpulkan atau waktunya belum habis, jawaban bisa diganti kapan saja.',
      },
    ],
    keywords: ['navigasi soal', 'ragu-ragu', 'grid nomor soal', 'pintasan keyboard'],
  },
  {
    slug: 'mode-waktu-flat-vs-sequential',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Mode Waktu: Flat vs Sequential',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 3,
    summary: 'Pahami dua mode waktu try out biar tidak kehabisan waktu.',
    prerequisites: ['Mengetahui mode waktu paket yang akan dikerjakan (biasanya tertera di halaman detail paket).'],
    steps: [
      {
        title: 'Mode Flat',
        body: 'Satu timer global berlaku untuk seluruh ujian. Kamu bebas berpindah antar subtes kapan saja selama waktu total belum habis.',
        screenshot: 'Indikator timer global tunggal pada mode Flat.',
      },
      {
        title: 'Mode Sequential',
        body: 'Setiap subtes punya timer terpisah. Begitu waktu subtes habis atau kamu klik "Selesaikan Subtes", subtes tersebut terkunci permanen dan tidak bisa diubah lagi.',
        screenshot: 'Indikator timer per subtes dan tombol konfirmasi penguncian subtes pada mode Sequential.',
        note: {
          appearance: 'warning',
          body: 'Pastikan benar-benar yakin dengan seluruh jawaban di subtes sebelum mengklik "Selesaikan Subtes" pada mode Sequential — tindakan ini tidak bisa dibatalkan.',
        },
      },
      {
        title: 'Pantau sisa waktu',
        body: 'Perhatikan bilah timer di bagian atas layar ruang ujian sepanjang pengerjaan.',
      },
    ],
    troubleshooting: [
      {
        question: 'Bagaimana cara tahu paket yang saya kerjakan memakai mode Flat atau Sequential?',
        answer: 'Perhatikan tampilan timer begitu ujian dimulai — timer tunggal berarti Flat, timer per subtes berarti Sequential.',
      },
    ],
    keywords: ['mode waktu', 'flat', 'sequential', 'timer ujian'],
  },
  {
    slug: 'peringatan-anti-kecurangan',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Anti-Kecurangan dan Watermark',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 2,
    summary: 'Rencana deteksi pindah tab dan watermark identitas saat ujian.',
    prerequisites: [],
    comingSoon: true,
    steps: [
      {
        title: 'Deteksi perpindahan tab atau jendela',
        body: 'Belum tersedia. Rencananya sistem akan mendeteksi saat kamu berpindah tab atau aplikasi lain selama ujian berlangsung.',
        note: {
          appearance: 'discovery',
          title: 'Segera hadir',
          body: 'Fitur ini, termasuk batas toleransi jumlah teguran sebelum ujian diselesaikan otomatis, masih dalam tahap perencanaan.',
        },
      },
      {
        title: 'Watermark identitas',
        body: 'Belum tersedia. Rencananya latar belakang ruang ujian akan menampilkan watermark berisi nama, email, dan waktu sesi untuk perlindungan kerahasiaan soal.',
      },
    ],
    troubleshooting: [],
    keywords: ['anti kecurangan', 'pindah tab', 'watermark'],
  },
  {
    slug: 'selesaikan-ujian-dan-baca-skor',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Selesaikan Ujian dan Baca Skor',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 3,
    summary: 'Kumpulkan try out lalu baca skor dan ringkasan performa.',
    prerequisites: ['Sedang mengerjakan try out hingga soal terakhir, atau waktu pengerjaan sudah habis.'],
    steps: [
      {
        title: 'Kumpulkan ujian',
        body: 'Klik tombol "Kumpulkan Ujian" setelah selesai mengerjakan seluruh soal (atau tunggu waktu habis untuk pengumpulan otomatis).',
      },
      {
        title: 'Periksa rekapitulasi jawaban',
        body: 'Tinjau modal rekapitulasi yang menampilkan jumlah soal terjawab, ragu-ragu, dan kosong sebelum konfirmasi akhir.',
        screenshot: 'Modal konfirmasi pengumpulan ujian beserta rekap sisa soal.',
      },
      {
        title: 'Lihat hasil skor',
        body: 'Setelah dikonfirmasi, tinjau nilai total, perbandingan dengan passing grade per subtes, dan ringkasan performa keseluruhan.',
        screenshot: 'Lembar rekapitulasi skor total dan indikator ambang batas kelulusan.',
      },
    ],
    troubleshooting: [
      {
        question: 'Bisakah try out yang sudah dikumpulkan dikerjakan ulang?',
        answer: 'Tergantung pengaturan paketnya — sebagian paket bisa dikerjakan lebih dari satu kali, cek keterangan di halaman detail paket sebelum membeli.',
      },
    ],
    keywords: ['kumpulkan ujian', 'skor', 'nilai', 'passing grade'],
  },
  {
    slug: 'membuka-lembar-pembahasan',
    categorySlug: 'ujian-cbt-pembahasan',
    title: 'Membuka Lembar Pembahasan',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 2,
    summary: 'Akses pembahasan lengkap dan kunci jawaban dari tutor.',
    prerequisites: ['Sudah menyelesaikan dan mengumpulkan try out.'],
    steps: [
      {
        title: 'Buka halaman hasil',
        body: 'Dari halaman riwayat nilai paket, klik tombol untuk melihat pembahasan lengkap menuju halaman pembahasan try out tersebut.',
      },
      {
        title: 'Pelajari kunci jawaban dan pembahasan',
        body: 'Baca kunci jawaban resmi, rincian perolehan poin per soal, dan uraian langkah penyelesaian yang ditulis tutor.',
        screenshot: 'Kotak pembahasan langkah demi langkah dari tutor beserta formula matematika.',
      },
    ],
    troubleshooting: [
      {
        question: 'Rumus matematika di pembahasan tidak tampil rapi, kenapa?',
        answer: 'Lihat panduan "Panduan jika Rumus Matematika (KaTeX) atau Gambar Tidak Muncul" di kategori Kendala Teknis.',
      },
    ],
    keywords: ['pembahasan', 'kunci jawaban', 'lihat pembahasan'],
  },

  // ======================================================================
  // Kategori 4: Portal Tutor
  // ======================================================================
  {
    slug: 'daftar-akun-tutor',
    categorySlug: 'portal-tutor',
    title: 'Mendaftar Akun Tutor',
    roles: ['tutor'],
    updated: '25 Agustus 2026',
    readMinutes: 3,
    summary: 'Ajukan diri jadi tutor Zenko dan pantau status pengajuan.',
    prerequisites: ['Sudah punya akun Zenko (siswa/umum).', 'Punya latar belakang atau portofolio yang relevan untuk menyusun soal.'],
    steps: [
      {
        title: 'Buka halaman Jadi Tutor',
        body: 'Kunjungi halaman /jadi-tutor untuk membaca ketentuan dan mulai pengajuan.',
      },
      {
        title: 'Lengkapi formulir pengajuan',
        body: 'Isi data diri, latar belakang atau institusi, dan tautan portofolio soal atau materi yang relevan.',
        screenshot: 'Formulir data kualifikasi pengajar dan portofolio.',
      },
      {
        title: 'Kirim dan pantau status',
        body: 'Kirim pengajuan untuk ditinjau tim kurasi Zenko, lalu pantau statusnya hingga disetujui (biasanya 1–3 hari kerja).',
        screenshot: 'Indikator status pengajuan dalam tahap peninjauan.',
      },
    ],
    troubleshooting: [
      {
        question: 'Pengajuan saya ditolak, bisakah mengajukan ulang?',
        answer: 'Bisa. Lengkapi kembali portofolio atau data yang kurang, lalu ajukan ulang melalui halaman /jadi-tutor.',
      },
    ],
    keywords: ['jadi tutor', 'daftar tutor', 'pengajuan tutor'],
  },
  {
    slug: 'wizard-buat-paket-tryout',
    categorySlug: 'portal-tutor',
    title: 'Wizard Buat Paket Try Out',
    roles: ['tutor'],
    updated: '25 Agustus 2026',
    readMinutes: 4,
    summary: 'Empat tahap membuat paket baru, dari jenis ujian sampai tayang.',
    prerequisites: ['Akun tutor sudah disetujui dan aktif.'],
    steps: [
      {
        title: 'Buka wizard pembuatan paket',
        body: 'Buka /dashboard/tutor/products/new untuk memulai wizard 4 tahap.',
      },
      {
        title: 'Tahap 1 — Tipe & Kategori',
        body: 'Tentukan apakah paket berupa Single atau Bundle, pilih kategori dan sub-kategori ujian (SKD CPNS/Kedinasan, atau TKA per jenjang), lalu jenis ujian (Simulasi atau Mini Tryout).',
        screenshot: 'Antarmuka Tahap 1 wizard berisi pilihan jenis ujian dan mode.',
      },
      {
        title: 'Tahap 2 — Info Produk',
        body: 'Lengkapi judul, deskripsi, unggah gambar sampul, kategori, dan opsi acak urutan soal.',
        screenshot: 'Antarmuka Tahap 2 wizard berisi form info produk dan unggah gambar.',
      },
      {
        title: 'Tahap 3 — Isi',
        body: 'Susun butir soal per subtes: pertanyaan, stimulus wacana (jika ada), kunci jawaban, dan pembahasan. Lihat panduan editor soal untuk detailnya.',
      },
      {
        title: 'Tahap 4 — Review & Ajukan',
        body: 'Periksa kelengkapan kuota soal dan ambang lulus, atur harga jual (dan harga coret bila ada), lalu ajukan paket untuk ditinjau sebelum tayang.',
        screenshot: 'Antarmuka Tahap 4 wizard berisi kartu validasi kesiapan dan tombol pengajuan.',
        note: {
          appearance: 'warning',
          body: 'Paket baru bisa diajukan setelah semua syarat validasi (kuota soal, kunci jawaban, pembahasan) terpenuhi — kartu validasi akan menandai bagian yang masih kurang.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Tombol "Ajukan" tidak bisa diklik, kenapa?',
        answer: 'Periksa kartu validasi kesiapan di Tahap 4 — biasanya ada soal, subtes, atau field wajib yang belum lengkap.',
      },
    ],
    keywords: ['buat paket', 'wizard tryout', 'produk baru tutor'],
  },
  {
    slug: 'input-soal-manual-katex-gambar',
    categorySlug: 'portal-tutor',
    title: 'Input Soal, KaTeX, dan Gambar',
    roles: ['tutor'],
    updated: '25 Agustus 2026',
    readMinutes: 4,
    summary: 'Tulis soal lengkap dengan rumus matematika dan gambar.',
    prerequisites: ['Sedang berada di Tahap 3 (Isi) pada wizard pembuatan paket.'],
    steps: [
      {
        title: 'Tulis pertanyaan',
        body: 'Ketik teks pertanyaan pada editor rich-text yang tersedia di setiap butir soal.',
      },
      {
        title: 'Sisipkan rumus matematika',
        body: 'Gunakan ikon simbol matematika pada toolbar editor untuk membuka pemilih formula KaTeX (pecahan, akar, eksponen, matriks, dan lainnya).',
        screenshot: 'Toolbar editor rich-text menyorot tombol formula KaTeX dan gambar.',
      },
      {
        title: 'Unggah gambar',
        body: 'Unggah gambar wacana atau gambar opsi jawaban untuk soal bertipe figural atau grafik.',
        screenshot: 'Form konfigurasi opsi jawaban dan tombol unggah gambar.',
      },
      {
        title: 'Tentukan kunci jawaban',
        body: 'Untuk soal pilihan ganda biasa, tentukan opsi jawaban yang benar. Untuk soal bertipe berbobot (gaya TKP), atur bobot nilai pada setiap opsi.',
      },
      {
        title: 'Tulis pembahasan',
        body: 'Lengkapi teks pembahasan — bagian ini wajib diisi sebelum paket bisa diajukan.',
      },
    ],
    troubleshooting: [
      {
        question: 'Rumus KaTeX yang saya tulis tidak tampil sesuai harapan, kenapa?',
        answer: 'Periksa kembali notasi yang dipilih dari pemilih formula. Kalau masalah berlanjut, lihat panduan troubleshooting KaTeX/gambar di kategori Kendala Teknis.',
      },
    ],
    keywords: ['editor soal', 'katex', 'rumus matematika', 'gambar soal', 'tkp berbobot'],
  },
  {
    slug: 'impor-soal-csv',
    categorySlug: 'portal-tutor',
    title: 'Impor Soal Massal via CSV',
    roles: ['tutor'],
    updated: '25 Agustus 2026',
    readMinutes: 3,
    summary: 'Unggah banyak soal sekaligus lewat file CSV, lebih cepat.',
    prerequisites: ['Sedang membuat atau mengedit subtes pada paket try out.', 'Punya aplikasi spreadsheet seperti Excel atau Google Sheets.'],
    steps: [
      {
        title: 'Buka tab impor CSV',
        body: 'Buka tab "Impor File CSV" pada editor subtes.',
      },
      {
        title: 'Unduh template resmi',
        body: 'Klik "Unduh Template CSV" untuk mendapat berkas contoh dengan kolom yang sesuai format Zenko.',
        screenshot: 'Tab impor CSV dan tombol unduh template resmi.',
      },
      {
        title: 'Lengkapi dan simpan',
        body: 'Buka template di Excel atau Google Sheets, lengkapi kolom sesuai panduan format, lalu simpan dalam format .csv (UTF-8).',
        screenshot: 'Contoh susunan kolom template CSV di spreadsheet.',
      },
      {
        title: 'Unggah dan tinjau hasil',
        body: 'Unggah berkas CSV yang sudah dilengkapi, lalu tinjau laporan baris yang berhasil maupun yang perlu diperbaiki.',
        screenshot: 'Laporan hasil impor baris soal.',
        note: {
          appearance: 'warning',
          body: 'Baris dengan kolom tidak lengkap atau format salah akan dilewati dan ditandai di laporan hasil — perbaiki lalu unggah ulang khusus baris tersebut.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Sebagian baris gagal diimpor, apa penyebab paling umum?',
        answer: 'Biasanya karena kolom wajib kosong, format kunci jawaban tidak sesuai template, atau file tidak disimpan sebagai CSV UTF-8.',
      },
    ],
    keywords: ['impor csv', 'upload soal', 'template csv', 'soal massal'],
  },
  {
    slug: 'rekening-bank-tutor',
    categorySlug: 'portal-tutor',
    title: 'Rekening Bank Tutor',
    roles: ['tutor'],
    updated: '25 Agustus 2026',
    readMinutes: 2,
    summary: 'Simpan rekening pencairan dan ajukan perubahan bila perlu.',
    prerequisites: ['Akun tutor sudah aktif.', 'Rekening bank atas nama sendiri.'],
    steps: [
      {
        title: 'Buka pengaturan rekening',
        body: 'Buka menu /dashboard/tutor/settings.',
      },
      {
        title: 'Isi data rekening pertama kali',
        body: 'Pilih bank, ketik nomor rekening, dan nama lengkap pemilik buku tabungan, lalu simpan.',
        screenshot: 'Form input data rekening bank pertama kali.',
        note: {
          appearance: 'warning',
          body: 'Rekening akan terkunci permanen setelah disimpan pertama kali — pastikan datanya benar sebelum menyimpan.',
        },
      },
      {
        title: 'Ajukan perubahan rekening',
        body: 'Kalau perlu mengganti rekening, klik "Ajukan Perubahan Rekening" dan tunggu verifikasi manual dari admin sebelum rekening baru aktif.',
        screenshot: 'Formulir pengajuan perubahan rekening bank baru.',
      },
    ],
    troubleshooting: [
      {
        question: 'Berapa lama proses verifikasi perubahan rekening?',
        answer: 'Verifikasi dilakukan manual oleh tim admin Zenko. Kalau sudah lebih dari beberapa hari kerja belum ada kabar, hubungi tim dukungan.',
      },
    ],
    keywords: ['rekening bank', 'ganti rekening', 'ubah rekening tutor'],
  },
  {
    slug: 'payout-dan-bagi-hasil',
    categorySlug: 'portal-tutor',
    title: 'Payout dan Bagi Hasil',
    roles: ['tutor'],
    updated: '25 Agustus 2026',
    readMinutes: 3,
    summary: 'Pahami saldo penghasilan dan ajukan pencairan dana.',
    prerequisites: ['Akun tutor aktif dan rekening bank sudah tersimpan.'],
    steps: [
      {
        title: 'Buka halaman payout',
        body: 'Buka menu /dashboard/tutor/payouts.',
      },
      {
        title: 'Pahami Saldo Tersedia vs Saldo Tertahan',
        body: 'Saldo Tersedia bisa langsung dicairkan. Saldo Tertahan adalah penghasilan dari transaksi yang masih dalam masa penahanan 7 hari sejak pembayaran siswa terverifikasi.',
        screenshot: 'Rincian tanggal pelepasan saldo tertahan (held balance).',
      },
      {
        title: 'Ajukan pencairan',
        body: 'Masukkan jumlah penarikan (minimal Rp100.000, maksimal senilai Saldo Tersedia), lalu klik "Ajukan Pencairan Dana".',
        screenshot: 'Formulir penarikan dana dan tabel riwayat status payout.',
      },
      {
        title: 'Pantau status transfer',
        body: 'Pantau status pencairan pada tabel riwayat payout hingga dana diterima.',
      },
    ],
    troubleshooting: [
      {
        question: 'Berapa pembagian hasil penjualan untuk tutor?',
        answer: 'Zenko menerapkan skema bagi hasil 70:30 sesuai Syarat dan Ketentuan Tutor — lihat halaman /syarat-tutor untuk detailnya.',
      },
      {
        question: 'Kenapa sebagian saldo saya masih "Tertahan"?',
        answer: 'Setiap transaksi punya masa penahanan 7 hari sejak pembayaran siswa terverifikasi, sebagai perlindungan terhadap pembatalan atau refund.',
      },
    ],
    keywords: ['payout', 'pencairan dana', 'saldo tertahan', 'bagi hasil'],
  },

  // ======================================================================
  // Kategori 5: Portal Bimbel, Langganan, dan Kelas
  // ======================================================================
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
    updated: '10 September 2026',
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
        body: 'Klik "Buat tagihan", ikuti instruksi pembayaran, lalu unggah bukti jika diminta. Status langganan berubah setelah tim Zenko memverifikasi pembayaran.',
        note: {
          appearance: 'warning',
          title: 'Jangan membuat tagihan berulang',
          body: 'Jika bukti sudah diunggah, tunggu verifikasi pada tagihan yang sama. Bukti yang sedang diperiksa juga mencegah ruang kerja terkunci hanya karena antrean verifikasi.',
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
    updated: '10 September 2026',
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
        body: 'Buat tagihan, selesaikan pembayaran, dan unggah bukti jika diminta. Kursi ditandai "menunggu pembayaran" dan baru masuk ke kuota aktif setelah pembayaran disetujui.',
      },
    ],
    troubleshooting: [
      {
        question: 'Kenapa tombol Tambah kursi tidak tersedia menjelang masa berakhir?',
        answer: 'Jika sisa masa aktif kurang dari satu bulan, sistem mengarahkan ke perpanjangan agar kamu tidak membayar satu bulan penuh untuk kursi yang hanya berlaku beberapa hari.',
      },
      {
        question: 'Pembayaran sudah dikirim, tetapi siswa baru belum bisa diaktifkan.',
        answer: 'Kuota tidak bertambah sebelum bukti diverifikasi. Lihat jumlah kursi yang menunggu pembayaran pada halaman Langganan atau Siswa, lalu hubungi dukungan jika verifikasi melewati waktu layanan.',
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
    title: 'QRIS Berhasil, Paket Belum Aktif',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 2,
    summary: 'Langkah kalau pembayaran sukses tapi paket belum muncul.',
    prerequisites: ['Sudah menyelesaikan pembayaran QRIS untuk sebuah paket.'],
    steps: [
      {
        title: 'Muat ulang halaman',
        body: 'Tunggu 1–3 menit, lalu muat ulang (refresh) halaman /akun/paket.',
      },
      {
        title: 'Periksa status order',
        body: 'Buka /akun/pembelian untuk memeriksa status transaksi.',
        screenshot: 'Letak Nomor Invoice pada tabel /akun/pembelian.',
      },
      {
        title: 'Siapkan bukti transaksi',
        body: 'Kalau status masih tertunda, catat Nomor Invoice dan simpan tangkapan layar bukti pembayaran dari aplikasi m-Banking atau e-Wallet.',
      },
      {
        title: 'Hubungi bantuan',
        body: 'Klik tombol "Hubungi Bantuan" pada rincian transaksi, atau kirim email ke tim dukungan untuk verifikasi manual.',
        screenshot: 'Tombol bantuan langsung pada rincian transaksi.',
      },
    ],
    troubleshooting: [
      {
        question: 'Berapa lama biasanya proses verifikasi manual ini?',
        answer: 'Tim dukungan Zenko biasanya membalas dalam 1–2 hari kerja pada jam operasional Senin–Jumat, 09.00–17.00 WIB.',
      },
    ],
    keywords: ['qris tertunda', 'pembayaran belum aktif', 'paket tidak muncul'],
  },
  {
    slug: 'koneksi-terputus-saat-ujian',
    categorySlug: 'kendala-teknis-kebijakan',
    title: 'Koneksi Terputus saat Ujian',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 2,
    summary: 'Lanjutkan try out yang sempat terputus, jawaban tetap aman.',
    prerequisites: ['Sedang atau baru saja mengerjakan try out yang terputus di tengah jalan.'],
    steps: [
      {
        title: 'Tetap tenang',
        body: 'Zenko memiliki fitur Penyelamat Sesi yang otomatis menyimpan jawaban dan sisa waktu di browser selama ujian berlangsung.',
      },
      {
        title: 'Sambungkan kembali',
        body: 'Pastikan koneksi internet kembali stabil, lalu buka ulang browser yang sama yang digunakan saat mengerjakan.',
      },
      {
        title: 'Lanjutkan ujian',
        body: 'Buka kembali halaman detail paket dan klik tombol untuk melanjutkan pengerjaan. Sesi akan melanjutkan dari nomor soal dan sisa waktu terakhir sebelum terputus.',
        screenshot: 'Tombol lanjutkan ujian pada halaman paket yang sedang dikerjakan.',
        note: {
          appearance: 'warning',
          body: 'Gunakan browser dan perangkat yang sama saat melanjutkan — penyimpanan sesi tersimpan secara lokal di browser tersebut.',
        },
      },
    ],
    troubleshooting: [
      {
        question: 'Saya membuka dari perangkat lain, apakah jawaban saya tetap tersimpan?',
        answer: 'Penyimpanan sesi tersimpan di browser tempat kamu mengerjakan. Gunakan perangkat dan browser yang sama untuk melanjutkan.',
      },
    ],
    keywords: ['koneksi terputus', 'browser tertutup', 'lanjutkan ujian', 'sesi ujian'],
  },
  {
    slug: 'rumus-katex-atau-gambar-tidak-muncul',
    categorySlug: 'kendala-teknis-kebijakan',
    title: 'Rumus atau Gambar Tidak Muncul',
    roles: ['siswa', 'tutor', 'bimbel'],
    updated: '25 Agustus 2026',
    readMinutes: 2,
    summary: 'Langkah dasar memperbaiki tampilan rumus dan gambar soal.',
    prerequisites: [],
    steps: [
      {
        title: 'Pastikan JavaScript aktif',
        body: 'Periksa pengaturan browser untuk memastikan JavaScript tidak dinonaktifkan.',
      },
      {
        title: 'Lakukan hard refresh',
        body: 'Muat ulang halaman secara penuh dengan Ctrl+F5 (Windows) atau Cmd+Shift+R (Mac).',
        screenshot: 'Contoh tampilan formula matematika normal versus formula yang tidak termuat.',
      },
      {
        title: 'Nonaktifkan ad-blocker sementara',
        body: 'Ekstensi ad-blocker pihak ketiga terkadang memblokir skrip atau font yang dibutuhkan untuk menampilkan rumus. Nonaktifkan sementara lalu muat ulang halaman.',
      },
    ],
    troubleshooting: [
      {
        question: 'Masalah masih berlanjut setelah semua langkah di atas?',
        answer: 'Coba buka di browser lain atau perangkat lain. Kalau tetap bermasalah, hubungi tim dukungan Zenko dengan menyertakan tangkapan layar.',
      },
    ],
    keywords: ['katex tidak muncul', 'rumus error', 'gambar tidak muncul'],
  },
  {
    slug: 'prosedur-refund',
    categorySlug: 'kendala-teknis-kebijakan',
    title: 'Prosedur Pengajuan Refund',
    roles: ['siswa'],
    updated: '25 Agustus 2026',
    readMinutes: 3,
    summary: 'Syarat dan cara mengajukan pengembalian dana ke Zenko.',
    prerequisites: ['Transaksi memenuhi kriteria eligibilitas refund (lihat Kebijakan Refund).'],
    steps: [
      {
        title: 'Periksa kriteria eligibilitas',
        body: 'Baca syarat lengkap di halaman /kebijakan-refund — misalnya pembayaran terpotong ganda untuk pesanan yang sama, atau kendala server total.',
        screenshot: 'Ringkasan poin penting pada halaman /kebijakan-refund.',
      },
      {
        title: 'Siapkan dokumen pendukung',
        body: 'Siapkan Nomor Invoice, bukti mutasi rekening, dan nomor rekening tujuan pengembalian.',
      },
      {
        title: 'Kirim pengajuan',
        body: 'Kirim email resmi ke tim dukungan Zenko dengan subjek pengajuan refund, lampirkan seluruh dokumen pendukung.',
        screenshot: 'Format baku draf email pengajuan refund resmi.',
      },
      {
        title: 'Tunggu proses verifikasi',
        body: 'Tim keuangan akan memverifikasi dan memproses transfer dana dalam 1–3 hari kerja setelah pengajuan lengkap diterima.',
      },
    ],
    troubleshooting: [
      {
        question: 'Transaksi saya tidak memenuhi kriteria refund, apa opsi lain?',
        answer: 'Hubungi tim dukungan Zenko untuk berdiskusi lebih lanjut mengenai kendala yang dialami — setiap kasus akan ditinjau berdasarkan situasinya.',
      },
    ],
    keywords: ['refund', 'pengembalian dana', 'kebijakan refund'],
  },
]

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return helpArticles.find(article => article.slug === slug)
}

export function getHelpCategory(slug: string): HelpCategory | undefined {
  return helpCategories.find(category => category.slug === slug)
}
