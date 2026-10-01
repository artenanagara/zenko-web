/**
 * Copy for the category landing pages (/kategori/:slug and
 * /kategori/:slug/:subSlug), keyed by the slug zenko-api publishes for each
 * category label (see app/utils/categorySlug.ts).
 *
 * This is marketing copy only. Everything factual about an exam's structure —
 * subtests, question counts, durations, ambang batas, disclaimers — is NOT
 * written here: the page renders it from GET /exam-types, so the landing page
 * and the tryout engine can never disagree. When copy below mentions a number,
 * it is one the exam type seed states in its own description.
 *
 * Tone: humble (no "pasti lolos", no "#1", no "soal bocoran"), fun, and
 * encouraging — the same voice as /jadi-tutor. Every page links onward to the
 * catalogue and to package pages; that is its job.
 *
 * A category that appears in the API but has no entry here still renders,
 * with copy generated from its label (see resolveLanding).
 */

export interface LandingFaq {
  question: string
  answer: string
}

export interface LandingCopy {
  /** `<title>`; keep under ~60 characters including " | Zenko". */
  title: string
  /** Meta description; keep under ~155 characters. */
  description: string
  /** H1 first line; carries the primary keyword. */
  h1: string
  /** H1 second line, styled as the accent. */
  accent: string
  /** Hero paragraph under the H1. */
  intro: string
}

export interface SubcategoryLanding extends Partial<LandingCopy> {
  /**
   * Display label, needed only where neither GET /categories nor an exam type
   * can name the subcategory yet (Latihan Mapel's jenjang has no exam type).
   */
  label?: string
  /** Replaces the generated "<category term> <label>" noun phrase. */
  term?: string
  /** Replaces the generated "<category label> <label>" in badges and buttons. */
  displayLabel?: string
  faqs?: LandingFaq[]
  /** Extra paragraphs for the "tentang ujian" section. */
  about?: string[]
}

export interface CategoryLanding extends LandingCopy {
  /** Display label, used before the API lists the category (0 live packages). */
  label: string
  /**
   * Noun phrase for headings and generated copy, e.g. "tryout SKD" or
   * "latihan TKA". Lowercase first letter; the page capitalises where needed.
   */
  term: string
  /** Who the page speaks to, e.g. "calon ASN". Used in generated copy. */
  audience: string
  /** Two or three paragraphs for the "tentang ujian" section (SEO body copy). */
  about: string[]
  /** Category-specific FAQs; the shared ones are appended after these. */
  faqs: LandingFaq[]
  /** Words matched against article titles and categories for "artikel terkait". */
  articleKeywords: string[]
  /** One-line pitch to teachers of this subject, linking to /jadi-tutor. */
  tutorPitch: string
  /** Order on the /kategori hub; lower first. */
  order: number
  subcategories?: Record<string, SubcategoryLanding>
}

export const CATEGORY_LANDINGS: Record<string, CategoryLanding> = {
  'skd': {
    order: 1,
    label: 'SKD',
    term: 'tryout SKD',
    audience: 'calon ASN dan calon taruna sekolah kedinasan',
    title: 'Tryout SKD CPNS & Kedinasan Online: TWK, TIU, TKP | Zenko',
    description: 'Latihan SKD online format CAT: TWK, TIU, dan TKP dengan timer, skor per subtes, dan pembahasan. Coba 5 soal gratis dulu, tanpa daftar.',
    h1: 'Tryout SKD online',
    accent: 'Selangkah demi selangkah, makin siap.',
    intro: 'Latihan TWK, TIU, dan TKP dalam format CAT, cek skormu terhadap ambang batas tiap subtes, lalu ulangi bagian yang masih goyah. Pelan-pelan juga nggak apa-apa, yang penting terus jalan.',
    about: [
      'Seleksi Kompetensi Dasar (SKD) dipakai untuk seleksi CPNS dan sekolah kedinasan. Ada tiga subtes: Tes Wawasan Kebangsaan (TWK), Tes Intelegensi Umum (TIU), dan Tes Karakteristik Pribadi (TKP). Tiap subtes punya ambang batasnya sendiri, jadi skor total yang tinggi belum cukup kalau salah satu subtesnya masih di bawah batas.',
      'Makanya latihan yang paling berguna bukan cuma mengerjakan banyak soal, tapi tahu subtes mana yang perlu dikejar. Di Zenko, hasil tiap tryout memecah skormu per subtes dan menandai mana yang sudah lewat ambang batas, lengkap dengan pembahasan tiap soal.',
    ],
    faqs: [
      {
        question: 'Apa beda tryout SKD CPNS dan SKD kedinasan?',
        answer: 'Subtesnya sama: TWK, TIU, dan TKP. Yang berbeda adalah ambang batas TKP-nya, dan paket di Zenko mengikuti ambang batas sesuai jalur yang kamu pilih. Kamu bisa langsung masuk ke halaman jalur CPNS atau Kedinasan di atas.',
      },
      {
        question: 'Kenapa TKP dinilai berbeda dari TWK dan TIU?',
        answer: 'Di TWK dan TIU hanya ada satu jawaban benar. Di TKP setiap pilihan punya bobot nilai, jadi tidak ada jawaban yang benar-benar salah, hanya ada yang lebih tepat. Pembahasan di Zenko menunjukkan bobot tiap pilihan supaya kamu paham polanya.',
      },
    ],
    articleKeywords: ['SKD', 'CPNS', 'TWK', 'TIU', 'TKP', 'kedinasan', 'ASN'],
    tutorPitch: 'Kamu tutor SKD atau alumni yang sudah lolos? Bagikan bank soalmu di Zenko.',
    subcategories: {
      'cpns': {
        title: 'Tryout SKD CPNS 2026 Online: TWK, TIU, TKP | Zenko',
        description: 'Tryout SKD CPNS online format CAT: TWK, TIU, TKP dengan ambang batas tiap subtes dan pembahasan lengkap. Coba 5 soal gratis, tanpa daftar.',
        h1: 'Tryout SKD CPNS online',
        accent: 'Langkah kecil hari ini, NIP di kemudian hari.',
        intro: 'Biasakan diri dengan format CAT SKD CPNS: kerjakan TWK, TIU, dan TKP, lihat skor tiap subtes terhadap ambang batasnya, lalu pelajari pembahasannya. Kami temani prosesnya.',
      },
      'kedinasan': {
        title: 'Tryout SKD Sekolah Kedinasan Online | Zenko',
        description: 'Latihan SKD sekolah kedinasan online: TWK, TIU, dan TKP dengan ambang batas kedinasan, timer CAT, dan pembahasan. Coba 5 soal gratis dulu.',
        h1: 'Tryout SKD kedinasan online',
        accent: 'Mimpi sekolah ikatan dinas, kita latih bareng.',
        intro: 'Latihan SKD dengan ambang batas yang dipakai seleksi sekolah kedinasan. Kerjakan, lihat hasilnya per subtes, lalu perbaiki satu per satu.',
      },
    },
  },

  'utbk-snbt': {
    order: 2,
    label: 'UTBK-SNBT',
    term: 'tryout UTBK-SNBT',
    audience: 'pejuang kampus impian',
    title: 'Tryout UTBK-SNBT 2026 Online: TPS & Literasi | Zenko',
    description: 'Simulasi UTBK-SNBT online: 7 subtes TPS dan Literasi, 160 soal, 195 menit, timer per subtes seperti hari-H. Coba 5 soal gratis dulu.',
    h1: 'Tryout UTBK-SNBT online',
    accent: 'Kampus impianmu layak diperjuangkan.',
    intro: 'Simulasi Tes Potensi Skolastik dan Tes Literasi dengan timer per subtes, persis alurnya: sekali lewat, tidak bisa kembali. Mulai dari satu paket dulu, lalu lihat bagian mana yang paling perlu dikejar.',
    about: [
      'UTBK-SNBT terdiri dari Tes Potensi Skolastik (penalaran umum, pengetahuan dan pemahaman umum, pemahaman bacaan dan menulis, pengetahuan kuantitatif) dan Tes Literasi (Bahasa Indonesia, Bahasa Inggris, dan penalaran matematika). Tiap subtes punya waktunya sendiri dan kamu tidak bisa kembali ke subtes yang sudah lewat.',
      'Skor UTBK resmi dihitung dengan Item Response Theory dari pola jawaban seluruh peserta, jadi tidak ada tryout yang bisa mereproduksinya dengan tepat. Skor di Zenko adalah perkiraan dari jawaban benar. Tetap berguna untuk melihat subtes mana yang masih lemah dan melatih manajemen waktu per subtes.',
    ],
    faqs: [
      {
        question: 'Apakah skor tryout UTBK di Zenko sama dengan skor UTBK asli?',
        answer: 'Tidak, dan kami tidak mau pura-pura sama. UTBK memakai Item Response Theory yang membobot tiap soal dari jawaban seluruh peserta. Skor di Zenko adalah perkiraan berdasarkan jawaban benar, paling berguna untuk membandingkan kemajuanmu sendiri dari satu tryout ke tryout berikutnya.',
      },
      {
        question: 'Apakah timernya per subtes seperti UTBK?',
        answer: 'Ya. Simulasi UTBK-SNBT di Zenko memakai waktu per subtes, dan subtes yang sudah selesai tidak bisa dibuka lagi, sama seperti alur ujian sebenarnya.',
      },
    ],
    articleKeywords: ['UTBK', 'SNBT', 'TPS', 'literasi', 'PTN', 'kuliah'],
    tutorPitch: 'Kamu pengajar TPS atau literasi? Bantu lebih banyak siswa masuk kampus impiannya lewat Zenko.',
  },

  'tka': {
    order: 3,
    label: 'TKA',
    term: 'latihan TKA',
    audience: 'siswa SD, SMP, SMA, SMK dan orang tua yang menemani',
    title: 'Tryout TKA Online SD, SMP, SMA, SMK | Zenko',
    description: 'Latihan Tes Kemampuan Akademik (TKA) online untuk SD, SMP, SMA, dan SMK. Soal per mapel, timer, dan pembahasan. Coba 5 soal gratis dulu.',
    h1: 'Tryout TKA online',
    accent: 'Biar hari-H terasa seperti latihan biasa.',
    intro: 'Pilih jenjangnya, kerjakan soal sesuai mapel TKA, dan lihat bagian mana yang perlu diulang. Sedikit demi sedikit, lama-lama terbiasa.',
    about: [
      'Tes Kemampuan Akademik (TKA) mengukur kemampuan akademik siswa per mata pelajaran. Mapel yang diujikan berbeda di tiap jenjang: SD dan SMP berfokus pada Bahasa Indonesia dan Matematika (SMP juga Bahasa Inggris), sedangkan SMA dan SMK punya mapel wajib ditambah mapel pilihan.',
      'Karena formatnya masih baru bagi banyak siswa, latihan dengan format komputer (CBT) membantu mengurangi rasa kaget di hari-H. Di Zenko, tiap latihan dilengkapi pembahasan, jadi siswa bisa belajar dari kesalahan, dan orang tua bisa ikut melihat perkembangannya.',
    ],
    faqs: [
      {
        question: 'Latihan TKA di Zenko untuk jenjang apa saja?',
        answer: 'Ada jalur SD, SMP, SMA, dan SMK. Mapel dan jumlah soalnya mengikuti jenjang masing-masing. Kamu bisa melihat rinciannya di bagian format di halaman ini.',
      },
      {
        question: 'Anak saya masih SD. Apakah bisa mengerjakan sendiri?',
        answer: 'Bisa, tampilannya sederhana dan bisa dibuka di HP maupun laptop. Untuk latihan pertama, kami sarankan ditemani supaya anak terbiasa dengan cara menjawab dan timernya.',
      },
    ],
    articleKeywords: ['TKA', 'Tes Kemampuan Akademik', 'asesmen', 'SD', 'SMP', 'SMA', 'SMK'],
    tutorPitch: 'Kamu guru atau pengajar mapel? Susun latihan TKA untuk jenjangmu di Zenko.',
    subcategories: {
      sd: {
        title: 'Tryout TKA SD Online: Bahasa Indonesia & Matematika | Zenko',
        description: 'Latihan TKA SD online: Bahasa Indonesia dan Matematika dengan timer dan pembahasan yang mudah dipahami. Coba 5 soal gratis bersama si kecil.',
        h1: 'Tryout TKA SD online',
        accent: 'Belajar bareng, biar si kecil makin pede.',
        intro: 'Latihan Bahasa Indonesia dan Matematika untuk TKA SD dengan tampilan yang ramah anak. Temani latihan pertamanya, lalu biarkan ia makin percaya diri.',
      },
      smp: {
        title: 'Tryout TKA SMP Online: Bahasa & Matematika | Zenko',
        description: 'Latihan TKA SMP online: Bahasa Indonesia & Literasi, Matematika, dan Bahasa Inggris, dengan timer dan pembahasan. Coba 5 soal gratis dulu.',
        h1: 'Tryout TKA SMP online',
        accent: 'Satu mapel sehari, pelan tapi pasti.',
        intro: 'Latihan per mapel TKA SMP dalam format CBT. Lihat mapel mana yang sudah aman dan mana yang masih perlu ditambah jam latihannya.',
      },
      sma: {
        title: 'Tryout TKA SMA Online: Mapel Wajib & Pilihan | Zenko',
        description: 'Latihan TKA SMA online untuk mapel wajib dan mapel pilihan, format CBT dengan timer dan pembahasan. Coba 5 soal gratis dulu.',
        h1: 'Tryout TKA SMA online',
        accent: 'Mapel wajib dan pilihan, kita cicil bareng.',
        intro: 'Latihan mapel wajib (Bahasa Indonesia, Bahasa Inggris, Matematika) dan mapel pilihan TKA SMA. Fokus ke mapel yang paling kamu butuhkan.',
      },
      smk: {
        title: 'Tryout TKA SMK Online | Zenko',
        description: 'Latihan TKA SMK online: mapel wajib dan pilihan dalam format CBT dengan timer dan pembahasan. Coba 5 soal gratis dulu, tanpa daftar.',
        h1: 'Tryout TKA SMK online',
        accent: 'Praktik di bengkel, latihan akademik di sini.',
        intro: 'Latihan mapel wajib dan pilihan TKA SMK. Kerjakan kapan pun sempat, lalu pelajari pembahasannya.',
      },
    },
  },

  'pppk': {
    order: 4,
    label: 'PPPK',
    term: 'tryout PPPK',
    audience: 'guru honorer, tenaga kesehatan, dan tenaga teknis',
    title: 'Tryout PPPK 2026 Online: Guru, Nakes, Teknis | Zenko',
    description: 'Latihan seleksi kompetensi PPPK online: teknis, manajerial, sosial kultural, dan wawancara. Format CAT, 145 soal. Coba 5 soal gratis dulu.',
    h1: 'Tryout PPPK online',
    accent: 'Pengabdianmu pantas disiapkan dengan baik.',
    intro: 'Latihan kompetensi teknis, manajerial, sosial kultural, dan wawancara sesuai formasimu. Bisa dicicil di sela jam kerja, sedikit-sedikit juga tetap berarti.',
    about: [
      'Seleksi kompetensi PPPK berbasis CAT terdiri dari kompetensi teknis sesuai formasi, kompetensi manajerial, kompetensi sosial kultural, dan wawancara. Soal manajerial, sosial kultural, dan wawancara dinilai dengan bobot per pilihan, bukan benar atau salah.',
      'Kelulusan PPPK ditentukan oleh peringkat terhadap pelamar lain di formasi yang sama, bukan oleh satu angka batas. Jadi skor latihan paling berguna untuk melihat kompetensi mana yang masih bisa kamu dongkrak.',
    ],
    faqs: [
      {
        question: 'Apakah ada ambang batas per bagian di PPPK?',
        answer: 'Tidak lagi sejak 2024. Kelulusan ditentukan peringkat terhadap pelamar lain pada formasi yang sama, jadi skor latihan di Zenko bukan penentu kelulusan. Gunakan skor itu untuk melihat bagian mana yang paling perlu ditingkatkan.',
      },
      {
        question: 'Formasi apa saja yang tersedia?',
        answer: 'Saat ini ada jalur Guru, Tenaga Kesehatan, dan Teknis. Pilih jalurmu di bagian atas halaman untuk melihat paket yang sesuai.',
      },
    ],
    articleKeywords: ['PPPK', 'ASN', 'guru', 'nakes', 'kompetensi'],
    tutorPitch: 'Kamu berpengalaman di seleksi PPPK? Bantu rekan seprofesi lewat paket latihan di Zenko.',
    subcategories: {
      'guru': {
        title: 'Tryout PPPK Guru Online 2026 | Zenko',
        description: 'Latihan PPPK Guru online: kompetensi teknis, manajerial, sosial kultural, dan wawancara dalam format CAT. Coba 5 soal gratis dulu.',
        h1: 'Tryout PPPK Guru online',
        accent: 'Terima kasih sudah mengajar. Sekarang giliran kami menemanimu.',
        intro: 'Latihan seleksi kompetensi PPPK Guru, dari kompetensi teknis hingga wawancara, yang bisa dicicil sepulang mengajar.',
      },
      'tenaga-kesehatan': {
        title: 'Tryout PPPK Tenaga Kesehatan Online | Zenko',
        description: 'Latihan PPPK Nakes online: kompetensi teknis kesehatan, manajerial, sosial kultural, dan wawancara, format CAT. Coba 5 soal gratis dulu.',
        h1: 'Tryout PPPK Tenaga Kesehatan online',
        accent: 'Merawat banyak orang, jangan lupa siapkan dirimu juga.',
        intro: 'Latihan seleksi kompetensi PPPK untuk tenaga kesehatan. Kerjakan di sela jadwal jaga, pelajari pembahasannya kapan pun sempat.',
      },
      'teknis': {
        title: 'Tryout PPPK Teknis Online | Zenko',
        description: 'Latihan PPPK Teknis online: kompetensi teknis, manajerial, sosial kultural, dan wawancara dalam format CAT. Coba 5 soal gratis dulu.',
        h1: 'Tryout PPPK Teknis online',
        accent: 'Keahlianmu nyata, tinggal dibiasakan dengan formatnya.',
        intro: 'Latihan seleksi kompetensi PPPK untuk formasi teknis dalam format CAT, lengkap dengan pembahasan.',
      },
    },
  },

  'rekrutmen-bumn': {
    order: 5,
    label: 'Rekrutmen BUMN',
    term: 'tryout Rekrutmen BUMN',
    audience: 'pencari kerja yang mengincar BUMN',
    title: 'Tryout Rekrutmen Bersama BUMN Online: TKD & AKHLAK | Zenko',
    description: 'Latihan Rekrutmen Bersama BUMN online: Tes Kemampuan Dasar dan Core Values AKHLAK dengan ambang batas resmi 58 dan 65. Coba 5 soal gratis.',
    h1: 'Tryout Rekrutmen BUMN online',
    accent: 'Latih TKD dan AKHLAK, sisanya biar kamu yang bersinar.',
    intro: 'Latihan Tes Kemampuan Dasar dan Core Values AKHLAK dengan ambang batas yang diumumkan. Kerjakan, cek skormu, lalu ulangi bagian yang masih kurang.',
    about: [
      'Rekrutmen Bersama BUMN diawali tes online yang terdiri dari Tes Kemampuan Dasar (TKD) dan tes Core Values AKHLAK. Ambang batasnya diumumkan, sedangkan jumlah soal dan durasinya bisa berubah di tiap gelombang.',
      'Karena itu susunan paket BUMN di Zenko ditentukan oleh tutornya, dan yang mengikuti ketentuan resmi adalah ambang batasnya. Fokuskan latihanmu pada pola soal TKD dan pemahaman nilai AKHLAK.',
    ],
    faqs: [
      {
        question: 'Kenapa jumlah soal paket BUMN bisa berbeda-beda?',
        answer: 'Jumlah soal dan durasi Rekrutmen Bersama BUMN berubah tiap gelombang dan tidak diumumkan jauh hari, jadi tutor menyusun paketnya sendiri. Yang dikunci mengikuti ketentuan resmi adalah ambang batas TKD dan AKHLAK.',
      },
      {
        question: 'Apa itu Core Values AKHLAK?',
        answer: 'AKHLAK adalah nilai inti BUMN: Amanah, Kompeten, Harmonis, Loyal, Adaptif, dan Kolaboratif. Soalnya berupa situasi kerja dan tiap pilihan punya bobot nilai, jadi pembahasannya menjelaskan kenapa satu respons lebih tepat dari yang lain.',
      },
    ],
    articleKeywords: ['BUMN', 'AKHLAK', 'TKD', 'rekrutmen', 'kerja'],
    tutorPitch: 'Kamu paham pola tes BUMN? Bagikan paket latihanmu di Zenko.',
  },

  'tni-polri': {
    order: 6,
    label: 'TNI & Polri',
    term: 'latihan akademik TNI & Polri',
    audience: 'calon taruna, bintara, dan tamtama',
    title: 'Latihan Soal Akademik TNI & Polri Online | Zenko',
    description: 'Latihan tes akademik seleksi Akpol, Akmil, Bintara, dan Tamtama online: pengetahuan umum, wawasan kebangsaan, numerik, dan bahasa. Coba gratis.',
    h1: 'Latihan akademik TNI & Polri',
    accent: 'Fisik dilatih di lapangan, akademik di sini.',
    intro: 'Pengetahuan umum, wawasan kebangsaan, penalaran numerik, Bahasa Indonesia, dan Bahasa Inggris untuk seleksi Akpol, Akmil, Bintara, dan Tamtama. Tambah juga latihan psikotes kognitifnya.',
    about: [
      'Seleksi TNI dan Polri punya beberapa tahap, dan tes akademik salah satunya. Materinya umumnya meliputi pengetahuan umum, wawasan kebangsaan, matematika atau penalaran numerik, Bahasa Indonesia, dan Bahasa Inggris.',
      'Panitia tidak memublikasikan jumlah soal maupun durasi per mata pelajaran. Jadi paket di Zenko adalah susunan latihan, bukan replika ujian resmi. Tujuannya membiasakanmu dengan materi dan tekanan waktu, bukan menebak skor kelulusan.',
    ],
    faqs: [
      {
        question: 'Apakah soalnya sama dengan tes akademik resmi TNI/Polri?',
        answer: 'Bukan. Panitia tidak memublikasikan kisi-kisi rinci, jumlah soal, atau durasinya, jadi paket di Zenko adalah susunan latihan dari materi yang diumumkan. Skornya juga bukan penentu kelulusan.',
      },
      {
        question: 'Ada latihan psikotesnya?',
        answer: 'Ada latihan psikotes bagian kognitif: verbal, numerik, penalaran logis, dan figural. Ini latihan kemampuan kognitif, bukan asesmen psikologi, dan bagian menggambar maupun tes koran tidak bisa direplikasi lewat CBT.',
      },
    ],
    articleKeywords: ['TNI', 'Polri', 'Akpol', 'Akmil', 'Bintara', 'Tamtama', 'taruna'],
    tutorPitch: 'Kamu pelatih atau alumni seleksi TNI/Polri? Bagikan latihanmu di Zenko.',
    subcategories: {
      'akpol': {
        term: 'latihan akademik Akpol',
        displayLabel: 'Akpol',
        title: 'Latihan Soal Akademik Akpol Online | Zenko',
        description: 'Latihan tes akademik seleksi Akpol: pengetahuan umum, wawasan kebangsaan, numerik, dan bahasa, format CBT dengan pembahasan. Coba gratis.',
        h1: 'Latihan akademik Akpol',
        accent: 'Mimpi jadi perwira, kita siapkan akademiknya.',
      },
      'akmil': {
        term: 'latihan akademik Akmil',
        displayLabel: 'Akmil',
        title: 'Latihan Soal Akademik Akmil Online | Zenko',
        description: 'Latihan tes akademik seleksi Akmil: pengetahuan umum, wawasan kebangsaan, numerik, dan bahasa, format CBT dengan pembahasan. Coba gratis.',
        h1: 'Latihan akademik Akmil',
        accent: 'Mimpi jadi perwira, kita siapkan akademiknya.',
      },
      'bintara-polri': {
        term: 'latihan akademik Bintara Polri',
        displayLabel: 'Bintara Polri',
        title: 'Latihan Soal Akademik Bintara Polri Online | Zenko',
        description: 'Latihan tes akademik seleksi Bintara Polri: pengetahuan umum, wawasan kebangsaan, numerik, dan bahasa, format CBT dengan pembahasan. Coba gratis.',
        h1: 'Latihan akademik Bintara Polri',
        accent: 'Seragam impian, dimulai dari latihan hari ini.',
      },
      'bintara-tni': {
        term: 'latihan akademik Bintara TNI',
        displayLabel: 'Bintara TNI',
        title: 'Latihan Soal Akademik Bintara TNI Online | Zenko',
        description: 'Latihan tes akademik seleksi Bintara TNI: pengetahuan umum, wawasan kebangsaan, numerik, dan bahasa, format CBT dengan pembahasan. Coba gratis.',
        h1: 'Latihan akademik Bintara TNI',
        accent: 'Seragam impian, dimulai dari latihan hari ini.',
      },
      'tamtama-polri': {
        term: 'latihan akademik Tamtama Polri',
        displayLabel: 'Tamtama Polri',
        title: 'Latihan Soal Akademik Tamtama Polri Online | Zenko',
        description: 'Latihan tes akademik seleksi Tamtama Polri: pengetahuan umum, wawasan kebangsaan, numerik, dan bahasa, format CBT dengan pembahasan. Coba gratis.',
        h1: 'Latihan akademik Tamtama Polri',
        accent: 'Semangatmu sudah ada, tinggal diasah.',
      },
      'psikotes': {
        title: 'Latihan Psikotes TNI & Polri Online | Zenko',
        description: 'Latihan psikotes kognitif seleksi TNI dan Polri: verbal, numerik, penalaran logis, dan figural dalam format CBT. Coba 5 soal gratis dulu.',
        term: 'latihan psikotes TNI & Polri',
        displayLabel: 'Psikotes TNI & Polri',
        h1: 'Latihan psikotes TNI & Polri',
        accent: 'Tenang, fokus, dan terbiasa dengan polanya.',
        intro: 'Latihan bagian kognitif psikotes: verbal, numerik, penalaran logis, dan figural. Biar polanya nggak asing lagi di hari-H.',
      },
    },
  },

  'psikotes-kerja': {
    order: 7,
    label: 'Psikotes Kerja',
    term: 'latihan psikotes kerja',
    audience: 'pencari kerja dan fresh graduate',
    title: 'Latihan Psikotes Kerja Online: Verbal & Numerik | Zenko',
    description: 'Latihan psikotes rekrutmen online bagian kognitif: verbal, numerik, penalaran logis, dan figural. Timer, skor, dan pembahasan. Coba gratis.',
    h1: 'Latihan psikotes kerja online',
    accent: 'Biar nggak kaget pas tes rekrutmen.',
    intro: 'Latihan bagian kognitif psikotes rekrutmen: verbal, numerik, penalaran logis, dan figural. Kerjakan dengan timer, lalu pelajari pola soalnya lewat pembahasan.',
    about: [
      'Banyak proses rekrutmen memakai psikotes, dan bagian kognitifnya (verbal, numerik, penalaran logis, figural) adalah bagian yang paling terbantu oleh latihan. Makin sering melihat polanya, makin tenang kamu mengerjakannya di bawah tekanan waktu.',
      'Latihan di Zenko adalah latihan kemampuan kognitif, bukan asesmen psikologi. Hasilnya tidak mengukur kepribadian atau kecocokan kerja, dan bagian menggambar serta tes koran tidak bisa direplikasi lewat CBT.',
    ],
    faqs: [
      {
        question: 'Apakah latihan ini bisa mengukur kepribadian saya?',
        answer: 'Tidak. Ini latihan kemampuan kognitif, bukan asesmen psikologi. Skornya membantu kamu terbiasa dengan pola soal verbal, numerik, logika, dan figural.',
      },
    ],
    articleKeywords: ['psikotes', 'rekrutmen', 'kerja', 'interview', 'fresh graduate'],
    tutorPitch: 'Kamu praktisi HR atau pengajar psikotes? Bagikan latihanmu di Zenko.',
  },

  'toefl-itp': {
    order: 8,
    label: 'TOEFL ITP',
    term: 'latihan TOEFL ITP',
    audience: 'mahasiswa dan pemburu beasiswa',
    title: 'Latihan TOEFL ITP Online: Structure & Reading | Zenko',
    description: 'Latihan TOEFL ITP online bagian Structure & Written Expression dan Reading Comprehension, dengan timer dan pembahasan. Coba 5 soal gratis.',
    h1: 'Latihan TOEFL ITP online',
    accent: 'Sedikit tiap hari, lama-lama lancar.',
    intro: 'Latihan bagian Structure & Written Expression dan Reading Comprehension TOEFL ITP. Kerjakan dengan timer, lalu pelajari pembahasannya soal demi soal.',
    about: [
      'TOEFL ITP punya tiga bagian: Listening, Structure & Written Expression, dan Reading Comprehension. Latihan di Zenko saat ini mencakup Structure dan Reading, dua bagian yang bisa dilatih dengan jujur lewat CBT tanpa audio.',
      'Hasilnya adalah skor latihan mentah, bukan skor 310–677 maupun sertifikat TOEFL. Gunakan untuk melihat jenis soal grammar dan bacaan mana yang paling sering membuatmu ragu.',
    ],
    faqs: [
      {
        question: 'Apakah ada latihan Listening?',
        answer: 'Belum. Soal dengan audio belum didukung, jadi latihan TOEFL ITP di Zenko saat ini mencakup Structure & Written Expression dan Reading Comprehension.',
      },
      {
        question: 'Apakah skornya setara skor TOEFL resmi?',
        answer: 'Tidak. Hasilnya skor latihan mentah, bukan skor 310–677 maupun sertifikat TOEFL.',
      },
    ],
    articleKeywords: ['TOEFL', 'bahasa inggris', 'english', 'beasiswa', 'grammar'],
    tutorPitch: 'Kamu pengajar bahasa Inggris? Susun latihan TOEFL di Zenko.',
  },

  'ielts': {
    order: 9,
    label: 'IELTS',
    term: 'latihan IELTS Reading',
    audience: 'calon mahasiswa luar negeri dan pemburu beasiswa',
    title: 'Latihan IELTS Academic Reading Online | Zenko',
    description: 'Latihan IELTS Academic Reading online: 40 soal, 60 menit, tiga teks, dengan pembahasan. Skor latihan, bukan band resmi. Coba 5 soal gratis.',
    h1: 'Latihan IELTS Reading online',
    accent: 'Satu teks lagi, satu langkah lebih dekat.',
    intro: 'Latihan IELTS Academic Reading dengan tiga teks, timer, dan pembahasan. Latih kecepatan membaca dan ketelitian menjawab tipe soal seperti True/False/Not Given.',
    about: [
      'IELTS Academic Reading berisi 40 soal dari tiga teks panjang dalam 60 menit. Tantangannya bukan hanya kosakata, tapi juga membagi waktu dan membedakan tipe soal seperti True/False/Not Given dan matching headings.',
      'Latihan di Zenko memberi skor latihan mentah, bukan band IELTS. Bagian Writing dan Speaking butuh penilai manusia, jadi belum tersedia.',
    ],
    faqs: [
      {
        question: 'Apakah ada latihan Writing dan Speaking?',
        answer: 'Belum. Writing dan Speaking butuh penilai manusia, jadi yang tersedia saat ini adalah Academic Reading.',
      },
    ],
    articleKeywords: ['IELTS', 'bahasa inggris', 'english', 'beasiswa', 'reading'],
    tutorPitch: 'Kamu pengajar IELTS? Bagikan latihan Reading-mu di Zenko.',
  },

  'latihan-mapel': {
    order: 10,
    label: 'Latihan Mapel',
    term: 'latihan soal mapel',
    audience: 'siswa SD, SMP, SMA, dan SMK',
    title: 'Latihan Soal Online per Mapel dan Kelas | Zenko',
    description: 'Latihan soal online per mata pelajaran, kelas, dan bab untuk SD, SMP, SMA, dan SMK, dengan pembahasan. Cocok untuk persiapan ulangan dan ujian sekolah.',
    h1: 'Latihan soal per mapel',
    accent: 'Ulangan besok? Tenang, kita pemanasan dulu.',
    intro: 'Pilih jenjang, kelas, dan mata pelajaran, lalu latihan sesuai bab yang sedang dipelajari. Singkat, fokus, dan ada pembahasannya.',
    about: [
      'Latihan mapel adalah paket soal kurikulum sekolah yang disusun per jenjang, kelas, mata pelajaran, dan bab. Jumlah soal dan durasinya diatur oleh tutor, jadi ada yang singkat untuk pemanasan dan ada yang lebih panjang untuk persiapan ujian.',
      'Cocok dipakai sebelum ulangan harian, penilaian tengah semester, atau ujian akhir. Setiap latihan dilengkapi pembahasan, jadi kesalahan hari ini bisa jadi pelajaran untuk besok.',
    ],
    faqs: [
      {
        question: 'Latihan mapel mengikuti kurikulum apa?',
        answer: 'Latihan disusun per jenjang, kelas, dan mata pelajaran sekolah, dengan bab atau materi yang ditulis oleh tutornya. Cek judul dan deskripsi paket untuk melihat bab yang dibahas.',
      },
    ],
    articleKeywords: ['latihan soal', 'ulangan', 'ujian sekolah', 'kurikulum', 'mapel'],
    tutorPitch: 'Kamu guru mapel? Ubah bank soal kelasmu jadi latihan di Zenko.',
    subcategories: {
      sd: {
        label: 'SD',
        term: 'latihan soal SD',
        title: 'Latihan Soal SD Online per Mapel & Kelas | Zenko',
        description: 'Latihan soal online SD per mata pelajaran, kelas, dan bab, lengkap dengan pembahasan. Cocok untuk persiapan ulangan dan ujian sekolah.',
        h1: 'Latihan soal SD online',
        accent: 'Belajar sambil main, sedikit-sedikit jadi bisa.',
      },
      smp: {
        label: 'SMP',
        term: 'latihan soal SMP',
        title: 'Latihan Soal SMP Online per Mapel & Kelas | Zenko',
        description: 'Latihan soal online SMP per mata pelajaran, kelas, dan bab, lengkap dengan pembahasan. Cocok untuk persiapan ulangan dan ujian sekolah.',
        h1: 'Latihan soal SMP online',
        accent: 'Satu bab sehari, rapor makin berseri.',
      },
      sma: {
        label: 'SMA',
        term: 'latihan soal SMA',
        title: 'Latihan Soal SMA Online per Mapel & Kelas | Zenko',
        description: 'Latihan soal online SMA per mata pelajaran, kelas, dan bab, lengkap dengan pembahasan. Cocok untuk persiapan ulangan dan ujian sekolah.',
        h1: 'Latihan soal SMA online',
        accent: 'Cicil dari sekarang, biar ujian nggak menegangkan.',
      },
      smk: {
        label: 'SMK',
        term: 'latihan soal SMK',
        title: 'Latihan Soal SMK Online per Mapel & Kelas | Zenko',
        description: 'Latihan soal online SMK per mata pelajaran, kelas, dan bab, lengkap dengan pembahasan. Cocok untuk persiapan ulangan dan ujian sekolah.',
        h1: 'Latihan soal SMK online',
        accent: 'Teori dikuatkan, praktik makin mantap.',
      },
    },
  },
}

/** FAQs every category page ends with. Only claims the platform keeps. */
export function sharedFaqs(term: string): LandingFaq[] {
  return [
    {
      question: `Bisa coba ${term} gratis dulu?`,
      answer: 'Bisa. Di halaman paket tunggal ada tombol untuk mencoba 5 soal contoh, tanpa perlu daftar dan dinilai langsung. Kalau cocok, baru beli paket lengkapnya.',
    },
    {
      question: 'Apakah soalnya sama dengan soal ujian asli?',
      answer: 'Bukan. Soal di Zenko disusun oleh tutor dan bimbel, lalu ditinjau tim Zenko sebelum tayang. Formatnya mengikuti struktur ujian yang dijelaskan di halaman ini, tapi kami tidak menjual soal resmi atau bocoran.',
    },
    {
      question: 'Apakah ada pembahasan setelah selesai mengerjakan?',
      answer: 'Ada. Setelah selesai, kamu bisa membuka hasil per bagian, kunci jawaban, dan pembahasan tiap soal. Riwayat pengerjaanmu tetap bisa dibaca kapan pun.',
    },
    {
      question: 'Boleh mengerjakan ulang?',
      answer: 'Boleh. Kamu bisa mengulang untuk melihat kemajuanmu. Khusus papan peringkat, yang dihitung hanya percobaan pertama supaya adil untuk semua peserta.',
    },
    {
      question: 'Bagaimana cara bayarnya?',
      answer: 'Pembayaran lewat QRIS, bisa dari e-wallet atau aplikasi mobile banking apa pun. Setelah pembayaran terkonfirmasi, paket langsung muncul di akunmu.',
    },
  ]
}

export interface ResolvedLanding extends LandingCopy {
  label: string
  term: string
  audience: string
  about: string[]
  faqs: LandingFaq[]
  articleKeywords: string[]
  tutorPitch: string
  /** True when the copy comes from CATEGORY_LANDINGS rather than a fallback. */
  curated: boolean
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * The copy for one category page or one subcategory page. Curated entries win;
 * anything missing is generated from the labels so a new exam type the API
 * adds tomorrow still gets a decent, honest page.
 */
export function resolveLanding(
  categorySlug: string,
  categoryLabel: string,
  subcategory?: { slug: string, label: string },
): ResolvedLanding {
  const base = CATEGORY_LANDINGS[categorySlug]
  const label = base?.label ?? categoryLabel
  const term = base?.term ?? `tryout ${label}`
  const faqsOf = (own: LandingFaq[] = [], t = term) => [...own, ...sharedFaqs(t)]

  if (!subcategory) {
    if (base) {
      return { ...base, faqs: faqsOf(base.faqs), curated: true }
    }
    return {
      label,
      term,
      audience: `peserta ${label}`,
      title: `${capitalise(term)} Online | Zenko`,
      description: `Latihan ${label} online dari tutor dan bimbel di Zenko: format CBT, timer, skor, dan pembahasan. Coba 5 soal gratis dulu, tanpa daftar.`,
      h1: `${capitalise(term)} online`,
      accent: 'Pelan-pelan, yang penting mulai.',
      intro: `Kerjakan simulasi ${label}, lihat hasilnya per bagian, lalu pelajari pembahasannya. Satu paket dulu juga sudah langkah yang bagus.`,
      about: [],
      faqs: faqsOf(),
      articleKeywords: [label],
      tutorPitch: `Kamu pengajar ${label}? Bagikan keahlianmu di Zenko.`,
      curated: false,
    }
  }

  const sub = base?.subcategories?.[subcategory.slug]
  const subTerm = sub?.term ?? `${term} ${subcategory.label}`
  return {
    label: sub?.displayLabel ?? `${label} ${subcategory.label}`,
    term: subTerm,
    audience: base?.audience ?? `peserta ${label}`,
    title: sub?.title ?? `${capitalise(subTerm)} Online | Zenko`,
    description: sub?.description
      ?? `Latihan ${label} ${subcategory.label} online di Zenko: format CBT, timer, skor per bagian, dan pembahasan. Coba 5 soal gratis dulu, tanpa daftar.`,
    h1: sub?.h1 ?? `${capitalise(subTerm)} online`,
    accent: sub?.accent ?? base?.accent ?? 'Pelan-pelan, yang penting mulai.',
    intro: sub?.intro
      ?? `Latihan ${label} jalur ${subcategory.label}: kerjakan simulasinya, lihat skor tiap bagian, lalu ulangi yang masih perlu dikuatkan.`,
    about: [...(sub?.about ?? []), ...(base?.about ?? [])],
    faqs: faqsOf([...(sub?.faqs ?? []), ...(base?.faqs ?? [])], subTerm),
    articleKeywords: [subcategory.label, ...(base?.articleKeywords ?? [label])],
    tutorPitch: base?.tutorPitch ?? `Kamu pengajar ${label}? Bagikan keahlianmu di Zenko.`,
    curated: Boolean(base),
  }
}
