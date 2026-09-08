<script setup lang="ts">
// English file name, Indonesian URL.
definePageMeta({ path: '/tentang' })

useSeoMeta({
  title: 'Tentang Kami | Zenko',
  description:
    'Zenko adalah marketplace try out CBT untuk SKD (CPNS & Sekolah Kedinasan) dan TKA (SD–SMK): katalog paket dari banyak tutor, dikurasi sebelum tayang, dikerjakan sebagai simulasi ujian dengan skor dan pembahasan otomatis.',
  ogTitle: 'Tentang Kami | Zenko',
  ogDescription:
    'Zenko adalah marketplace try out CBT untuk SKD (CPNS & Sekolah Kedinasan) dan TKA (SD–SMK): katalog paket dari banyak tutor, dikurasi sebelum tayang, dikerjakan sebagai simulasi ujian dengan skor dan pembahasan otomatis.',
  ogImage: 'https://zenkoedu.id/brand/zenko-lockup-horizontal-blue.png',
  ogUrl: 'https://zenkoedu.id/tentang',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/tentang' }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(useOrganizationSchema()) }],
})

/**
 * Halaman ini menjelaskan Zenko lewat kemampuan yang benar-benar berjalan
 * hari ini — katalog terkurasi, contoh soal gratis, mesin CBT, penilaian
 * server, riwayat attempt, dan ruang bimbel. Jumlah pengguna sengaja tidak
 * disebut: social proof menyusul kalau datanya sudah nyata.
 */

/**
 * Perbandingan keadaan sebelum dan sesudah Zenko, dibaca berpasangan baris
 * per baris. Sisi kanan hanya memuat kemampuan yang sudah berjalan, supaya
 * bagian ini tidak berubah jadi daftar janji.
 */
const withoutZenko = [
  'Soal berserak di grup percakapan dan berkas unduhan',
  'Tidak ada yang memastikan mutu dan kesesuaian kisi-kisinya',
  'Latihan dikerjakan tanpa timer dan dinilai manual',
  'Pengajar dengan bank soal bagus berhenti di urusan teknis',
] as const

const withZenko = [
  'Satu katalog paket yang bisa dicari dan dibandingkan',
  'Tiap paket dikurasi tim Zenko, dengan rating dan ulasan siswa',
  'Simulasi CBT dengan timer dan penilaian mengikuti ujian aslinya',
  'Tutor cukup menyiapkan soal — sistem ujiannya sudah tersedia',
] as const

/** Alur marketplace, dari paket disusun sampai dikerjakan siswa. */
const steps = [
  {
    title: 'Tutor menyusun paket',
    description:
      'Soal, kunci, pembahasan, dan aturan waktunya disiapkan di editor paket Zenko — tanpa perlu membangun sistem ujian sendiri.',
  },
  {
    title: 'Zenko mengkurasi',
    description:
      'Tim kami memeriksa struktur dan kelayakan tiap paket sebelum mengizinkannya tayang di katalog publik.',
  },
  {
    title: 'Siswa mengerjakan',
    description:
      'Paket dijalankan sebagai simulasi CBT, skornya dihitung server begitu selesai, lalu pembahasannya terbuka.',
  },
] as const

/** Rincian subtes SKD pada mock kartu skor — angka resmi formasi umum CPNS. */
const scoreBreakdown = [
  { name: 'TWK', score: 100, max: 150, threshold: 65 },
  { name: 'TIU', score: 115, max: 175, threshold: 80 },
  { name: 'TKP', score: 189, max: 225, threshold: 166 },
] as const

/** Opsi pada mock contoh soal gratis; satu di antaranya tampil terpilih. */
const sampleOptions = [
  { label: 'Pancasila sebagai dasar negara', chosen: true },
  { label: 'Pancasila sebagai alat politik', chosen: false },
  { label: 'Pancasila sebagai simbol negara', chosen: false },
] as const

/** Baris riwayat pada mock kartu attempt. */
const attemptHistory = [
  { label: 'Percobaan ke-3', score: 404, latest: true },
  { label: 'Percobaan ke-2', score: 372, latest: false },
  { label: 'Percobaan ke-1', score: 341, latest: false },
] as const

/** Tiga peran yang dilayani produk hari ini, masing-masing punya pintu masuknya sendiri. */
const audiences = [
  {
    icon: 'student',
    label: 'Siswa',
    title: 'Sedang mengejar seleksi',
    description:
      'Berlatih terarah untuk ujian yang kamu tuju, tanpa mengumpulkan materi ke sana ke mari.',
    points: [
      'Simulasi SKD (CPNS & Kedinasan) dan TKA (SD–SMK)',
      'Skor, ambang kelulusan, dan pembahasan tiap soal',
      'Riwayat pengerjaan tersimpan di akunmu',
    ],
    to: '/paket',
    cta: 'Lihat katalog paket',
  },
  {
    icon: 'chalkboard-teacher',
    label: 'Tutor',
    title: 'Punya bank soal sendiri',
    description:
      'Susun paketmu di editor Zenko dan biarkan urusan teknis ujiannya kami yang tangani.',
    points: [
      'Editor paket dengan mesin CBT yang sudah jadi',
      'Kurasi tim Zenko sebelum paket tayang',
      'Profil tutor publik berisi paket dan ulasanmu',
    ],
    to: '/jadi-tutor',
    cta: 'Cara jadi tutor',
  },
  {
    icon: 'buildings',
    label: 'Bimbel',
    title: 'Mengelola banyak siswa',
    description:
      'Punya ruang try out sendiri untuk siswa bimbelmu, terpisah dari katalog publik.',
    points: [
      'Kelas dan roster siswa dalam satu dashboard',
      'Bank soal privat yang hanya untuk siswamu',
      'Rekap hasil dan peringkat tiap paket',
    ],
    to: '/untuk-bimbel',
    cta: 'Zenko untuk bimbel',
  },
] as const

/** Prinsip yang menentukan bentuk produknya, bukan slogan tanpa dasar. */
const principles = [
  {
    icon: 'seal-check',
    title: 'Kurasi sebelum tayang',
    description:
      'Paket masuk katalog hanya setelah diperiksa tim Zenko, bukan begitu tutor menekan tombol terbit.',
  },
  {
    icon: 'currency-circle-dollar',
    title: 'Bagi hasil 70:30',
    description:
      'Tutor menerima 70% dari harga tiap paket yang terjual, dicatat per penjualan dan bisa dilacak sendiri.',
  },
  {
    icon: 'lightning',
    title: 'Akses tanpa menunggu',
    description:
      'Begitu paket menjadi milikmu, latihannya bisa langsung dibuka — tidak ada verifikasi manual.',
  },
  {
    icon: 'users-three',
    title: 'Terbuka untuk siapa saja',
    description:
      'Siapa pun yang punya keahlian mengajar bisa mengajukan diri jadi tutor, bukan hanya lembaga besar.',
  },
] as const

/**
 * Makna tiap unsur logo. Sumbernya pedoman merek di zenko-design-system
 * (`app/pages/brand/logo.vue`), bukan tafsir baru.
 */
type MarkMeaning = {
  /** Nama ikon Phosphor; kosong kalau unsurnya ditampilkan sebagai glif huruf. */
  icon?: string
  glyph?: string
  title: string
  meaning: string
}

const markMeanings: MarkMeaning[] = [
  { glyph: 'Z', title: 'Huruf “Z”', meaning: 'Inisial nama Zenko' },
  { icon: 'ear', title: 'Telinga rubah', meaning: 'Siaga menyimak kebutuhan belajarmu' },
  { icon: 'smiley', title: 'Senyum ramah', meaning: 'Pendamping, bukan penguji' },
]

const faqs = [
  {
    question: 'Zenko itu bimbel atau marketplace?',
    answer:
      'Marketplace. Paketnya disusun oleh banyak tutor berbeda, sedangkan Zenko menyediakan sistem ujiannya dan mengkurasi setiap paket sebelum tayang di katalog.',
  },
  {
    question: 'Ujian apa saja yang tersedia?',
    answer:
      'SKD untuk CPNS dan Sekolah Kedinasan, serta TKA untuk jenjang SD, SMP, SMA, dan SMK — tersedia sebagai simulasi penuh maupun mini try out satu subtes atau satu mata pelajaran.',
  },
  {
    question: 'Bisakah mencoba dulu sebelum mengambil paket?',
    answer:
      'Bisa. Paket satuan menyediakan sebagian soal aslinya sebagai contoh gratis, dan hasilnya dinilai di server tanpa membocorkan kunci jawaban paket penuhnya.',
  },
  {
    question: 'Soalnya bisa diunduh?',
    answer:
      'Tidak. Semua paket dikerjakan langsung di sistem CBT Zenko, sehingga karya tutor tidak beredar sebagai berkas yang mudah disebar ulang.',
  },
  {
    question: 'Siapa yang menghitung skor saya?',
    answer:
      'Server Zenko, dari rekaman jawabanmu sendiri. Simulasi SKD dinilai pada skala 550 beserta ambang batas tiap subtes, sedangkan TKA memakai skala 0–100 per mata pelajaran.',
  },
  {
    question: 'Saya tutor atau punya bimbel — bagaimana cara bergabung?',
    answer:
      'Tutor mendaftar lewat halaman Jadi Tutor dan menunggu persetujuan admin. Bimbel mendaftar di halaman Untuk Bimbel, dan ruang bimbelnya langsung aktif tanpa antrean persetujuan.',
  },
] as const
</script>

<template>
  <main>
    <!-- ==================================================================
         1. Hero — proporsi yang sama dengan /jadi-tutor dan /untuk-bimbel.
         ================================================================== -->
    <section class="container-page pt-3 md:pt-5">
      <div
        class="dot-grid dot-grid-hero hero-aurora relative overflow-hidden rounded-[26px] px-5 pt-12 pb-16 md:rounded-xl md:px-10 md:pt-16 md:pb-20"
      >
        <div class="relative z-1 mx-auto max-w-190 text-center">
          <span
            class="mb-5 inline-flex items-center gap-2 rounded-pill border border-primary/20 bg-white/80 py-2 pr-4 pl-3 text-[0.82rem] font-semibold shadow-[0_2px_8px_rgba(47,111,235,0.06)] backdrop-blur-[6px]"
          >
            <span class="h-2 w-2 rounded-full bg-success shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" aria-hidden="true" />
            Marketplace try out SKD &amp; TKA
          </span>

          <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter">
            Satu tempat untuk latihan
            <span class="text-accent mt-1 block">ujian yang kamu tuju</span>
          </h1>

          <p class="mx-auto mt-4 max-w-160 text-[1.02rem] text-muted">
            Zenko mempertemukan tutor yang menyusun paket try out dengan siswa yang
            membutuhkannya. Tiap paket dikurasi lebih dulu, lalu dikerjakan sebagai
            simulasi CBT dengan skor dan pembahasan yang keluar otomatis.
          </p>

          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <AppButton to="/paket" size="lg">Cari paket try out</AppButton>
            <AppButton to="/jadi-tutor" size="lg" variant="outline">Jadi tutor</AppButton>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         2. Latar belakang — dua panel berhadapan: keadaan yang biasa
         dihadapi di kiri, dan yang Zenko ubah di kanan. Barisnya sengaja
         berpasangan supaya perbandingannya terbaca baris per baris.
         ================================================================== -->
    <section class="py-18 md:py-22" aria-labelledby="latar-heading">
      <div class="container-page">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Latar belakang
          </p>
          <h2 id="latar-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter text-balance">
            Kenapa Zenko <span class="text-accent">dibangun</span>
          </h2>
          <p class="mt-3.5 text-[1.02rem] text-pretty text-muted">
            Dua keluhan yang saling berhadapan: siswa sulit menemukan latihan yang
            bermutu, dan pengajar sulit menyalurkan soal yang sudah mereka punya.
          </p>
        </div>

        <div class="mx-auto grid max-w-300 grid-cols-1 gap-4 rounded-4xl bg-surface-alt p-4 md:grid-cols-2 md:p-6">
          <article class="rounded-[26px] border border-hairline bg-surface p-6 shadow-xs md:p-8">
            <span class="inline-flex rounded-pill bg-surface-sunken px-3 py-1 text-[0.72rem] font-bold tracking-[0.12em] text-muted uppercase">
              Tanpa Zenko
            </span>
            <h3 class="mt-4 mb-6 text-[1.28rem] font-bold tracking-[-0.03em]">
              Persiapan yang serba diurus sendiri
            </h3>

            <ul class="grid gap-4">
              <li
                v-for="item in withoutZenko"
                :key="item"
                class="flex items-start gap-3 leading-[1.55] text-muted"
              >
                <AppIcon name="x-circle" :size="20" class="mt-0.5 text-faint" />
                {{ item }}
              </li>
            </ul>
          </article>

          <article class="panel-inset rounded-[26px] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark p-6 md:p-8">
            <span class="inline-flex rounded-pill bg-white/15 px-3 py-1 text-[0.72rem] font-bold tracking-[0.12em] text-white uppercase">
              Dengan Zenko
            </span>
            <h3 class="mt-4 mb-6 text-[1.28rem] font-bold tracking-[-0.03em] text-white">
              Satu alur yang sudah tertata
            </h3>

            <ul class="grid gap-4">
              <li
                v-for="item in withZenko"
                :key="item"
                class="flex items-start gap-3 leading-[1.55] text-white/85"
              >
                <AppIcon name="check-circle" :size="20" weight="fill" class="mt-0.5 text-white" />
                {{ item }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         3. Cara kerja — tiga langkah bernomor dalam satu pita abu.
         ================================================================== -->
    <section class="py-18 md:py-22" aria-labelledby="cara-kerja-heading">
      <div class="container-page">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Cara kerja
          </p>
          <h2 id="cara-kerja-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter text-balance">
            Dari bank soal tutor sampai <span class="text-accent">layar ujianmu</span>
          </h2>
        </div>

        <!-- Nomor langkah adalah isi, bukan hiasan, jadi ia hidup di dalam
             <ol> dan tidak ikut animasi apa pun. -->
        <ol class="mx-auto grid max-w-300 gap-4 rounded-4xl bg-surface-alt p-4 md:grid-cols-3 md:p-6">
          <li
            v-for="(step, index) in steps"
            :key="step.title"
            class="flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
          >
            <span
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-[13px] bg-linear-to-b from-primary-light to-primary font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_rgba(47,111,235,0.22)]"
              aria-hidden="true"
            >{{ index + 1 }}</span>

            <h3 class="mt-6 mb-2 text-[1.2rem] font-bold tracking-[-0.03em]">{{ step.title }}</h3>
            <p class="leading-[1.62] text-muted">{{ step.description }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- ==================================================================
         4. Fitur ruang ujian — bento: satu kartu lebar, satu kartu tinggi
         setinggi dua baris, lalu dua kartu biasa.
         ================================================================== -->
    <section class="py-18 md:py-22" aria-labelledby="fitur-heading">
      <div class="container-page">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Yang ada di Zenko
          </p>
          <h2 id="fitur-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter text-balance">
            Dari memilih paket sampai <span class="text-accent">membaca pembahasan</span>
          </h2>
          <p class="mt-3.5 text-[1.02rem] text-pretty text-muted">
            Semuanya berjalan di satu tempat — tidak ada berkas soal yang perlu
            diunduh, dan tidak ada penilaian yang perlu dihitung manual.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
          <!-- 1. Simulasi CBT (kartu lebar) -->
          <article
            class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:col-span-2 md:p-7"
          >
            <div class="mb-6 rounded-xl bg-surface-sunken p-6" aria-hidden="true">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <p class="text-[0.8rem] font-bold tracking-[-0.02em]">Simulasi SKD CPNS</p>
                <span class="rounded-pill bg-surface px-3 py-1 font-mono text-[0.78rem] font-bold text-primary shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
                  01:39:12
                </span>
              </div>

              <span class="mt-4 block h-2.5 overflow-hidden rounded-pill bg-skeleton/70">
                <span class="block h-full w-[38%] rounded-pill bg-linear-to-r from-primary-light to-primary" />
              </span>

              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="chip in ['TWK · 30 soal', 'TIU · 35 soal', 'TKP · 45 soal', '100 menit · satu timer']"
                  :key="chip"
                  class="rounded-pill bg-surface px-3 py-1.5 text-[0.76rem] font-semibold text-muted shadow-[0_2px_8px_rgba(15,23,42,0.05)]"
                >{{ chip }}</span>
              </div>
            </div>

            <h3 class="mb-2.5 text-[1.2rem] font-bold tracking-[-0.03em]">Simulasi yang mengikuti aturan aslinya</h3>
            <p class="leading-[1.62] text-muted">
              Jumlah soal, durasi, dan cara berpindah antar subtes disetel mengikuti
              ujian yang ditiru — SKD berjalan dengan satu timer untuk 110 soal, TKA
              per mata pelajaran.
            </p>
          </article>

          <!-- 2. Hasil dan pembahasan (kartu tinggi) -->
          <article
            class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:row-span-2 md:flex md:flex-col md:p-7"
          >
            <div class="rounded-xl bg-surface-sunken p-6 md:flex md:flex-1 md:flex-col md:justify-center" aria-hidden="true">
              <div class="flex items-end justify-between gap-3">
                <span>
                  <span class="block text-[0.76rem] font-semibold text-muted">Skor akhir</span>
                  <b class="text-[1.7rem] font-extrabold tracking-[-0.04em]">404</b>
                  <span class="ml-1 text-[0.85rem] font-semibold text-muted">/ 550</span>
                </span>
                <span class="rounded-pill bg-success-soft px-3 py-1 text-[0.72rem] font-bold text-success-ink">
                  LULUS
                </span>
              </div>

              <ul class="mt-6 grid gap-4">
                <li v-for="part in scoreBreakdown" :key="part.name">
                  <span class="flex items-baseline justify-between gap-2 text-[0.78rem]">
                    <b class="font-bold tracking-[-0.02em]">{{ part.name }}</b>
                    <span class="font-semibold text-muted">
                      {{ part.score }}<span class="text-faint">/{{ part.max }}</span>
                    </span>
                  </span>
                  <span class="mt-2 block h-2 overflow-hidden rounded-pill bg-skeleton/70">
                    <span
                      class="block h-full rounded-pill bg-linear-to-r from-primary-light to-primary"
                      :style="{ width: `${Math.round((part.score / part.max) * 100)}%` }"
                    />
                  </span>
                  <span class="mt-1.5 block text-[0.72rem] text-faint">Ambang batas {{ part.threshold }}</span>
                </li>
              </ul>

              <span class="mt-6 flex items-center justify-center gap-2 rounded-[11px] bg-surface py-2.5 text-[0.76rem] font-bold text-primary shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
                <AppIcon name="list-checks" :size="15" />
                Pembahasan 110 soal terbuka
              </span>
            </div>

            <h3 class="mt-6 mb-2.5 text-[1.2rem] font-bold tracking-[-0.03em]">Skor dan pembahasan otomatis</h3>
            <p class="leading-[1.62] text-muted">
              Begitu ujian selesai, server menghitung skor tiap subtes beserta ambang
              kelulusannya, lalu membuka pembahasan soal demi soal.
            </p>
          </article>

          <!-- 3. Contoh soal gratis -->
          <article
            class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-7"
          >
            <div class="mb-6 rounded-xl bg-surface-sunken p-6" aria-hidden="true">
              <span class="inline-flex items-center gap-2 rounded-pill bg-primary-soft px-3 py-1.5 text-[0.74rem] font-bold text-primary">
                <AppIcon name="play-circle" :size="14" weight="fill" />
                Coba gratis
              </span>

              <ul class="mt-4 grid gap-2.5">
                <li
                  v-for="option in sampleOptions"
                  :key="option.label"
                  class="flex items-center gap-3 rounded-[11px] px-3.5 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]"
                  :class="option.chosen ? 'bg-primary-soft' : 'bg-surface'"
                >
                  <span
                    class="h-3.5 w-3.5 shrink-0 rounded-full border-2"
                    :class="option.chosen ? 'border-primary bg-primary' : 'border-line'"
                  />
                  <span
                    class="min-w-0 flex-1 truncate text-[0.78rem] font-semibold"
                    :class="option.chosen ? 'text-primary' : 'text-muted'"
                  >{{ option.label }}</span>
                </li>
              </ul>
            </div>

            <h3 class="mb-2.5 text-[1.2rem] font-bold tracking-[-0.03em]">Contoh soal gratis</h3>
            <p class="leading-[1.62] text-muted">
              Paket satuan menyediakan sebagian soal aslinya untuk dicoba gratis, jadi
              kamu tahu isinya sebelum mengambil paketnya.
            </p>
          </article>

          <!-- 4. Riwayat pengerjaan -->
          <article
            class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-7"
          >
            <div class="mb-6 rounded-xl bg-surface-sunken p-6" aria-hidden="true">
              <ul class="grid gap-2.5">
                <li
                  v-for="attempt in attemptHistory"
                  :key="attempt.label"
                  class="flex items-center gap-3 rounded-[11px] bg-surface px-3.5 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]"
                >
                  <span
                    class="h-2 w-2 shrink-0 rounded-full"
                    :class="attempt.latest ? 'bg-primary' : 'bg-skeleton'"
                  />
                  <span class="min-w-0 flex-1 truncate text-[0.78rem] font-semibold text-muted">
                    {{ attempt.label }}
                  </span>
                  <b class="shrink-0 text-[0.8rem] font-extrabold tracking-[-0.02em]" :class="attempt.latest ? 'text-primary' : 'text-muted'">
                    {{ attempt.score }}
                  </b>
                </li>
              </ul>
            </div>

            <h3 class="mb-2.5 text-[1.2rem] font-bold tracking-[-0.03em]">Riwayat yang tersimpan</h3>
            <p class="leading-[1.62] text-muted">
              Paket yang sudah kamu miliki bisa dikerjakan ulang, dan tiap percobaan
              lama tetap bisa ditinjau kembali beserta pembahasannya.
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         5. Untuk siapa — tiga peran, masing-masing dengan yang didapatnya
         dan tautan ke pintu masuknya.
         ================================================================== -->
    <section class="dot-grid relative border-y border-hairline bg-surface-alt py-18 md:py-22" aria-labelledby="untuk-siapa-heading">
      <div class="container-page relative z-1">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Untuk siapa Zenko
          </p>
          <h2 id="untuk-siapa-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter text-balance">
            Satu platform, <span class="text-accent">tiga sisi</span>
          </h2>
        </div>

        <div class="mx-auto grid max-w-300 grid-cols-1 gap-5 md:grid-cols-3">
          <NuxtLink
            v-for="audience in audiences"
            :key="audience.label"
            :to="audience.to"
            class="group flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow,border-color] duration-300 ease-smooth hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift md:p-8"
          >
            <span
              class="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-linear-to-b from-primary-light to-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_rgba(47,111,235,0.22)]"
              aria-hidden="true"
            >
              <AppIcon :name="audience.icon" :size="24" />
            </span>

            <p class="mt-5 text-[0.72rem] font-bold tracking-[0.12em] text-primary uppercase">
              {{ audience.label }}
            </p>
            <h3 class="mt-1.5 mb-2.5 text-[1.28rem] font-bold tracking-[-0.03em]">{{ audience.title }}</h3>
            <p class="leading-[1.62] text-muted">{{ audience.description }}</p>

            <ul class="mt-5 grid gap-2.5 border-t border-hairline pt-5">
              <li
                v-for="point in audience.points"
                :key="point"
                class="flex items-start gap-2.5 text-[0.95rem] leading-[1.55] text-muted"
              >
                <AppIcon name="check-circle" :size="18" weight="fill" class="mt-0.5 text-primary" />
                {{ point }}
              </li>
            </ul>

            <span class="mt-auto inline-flex items-center gap-2 pt-6 font-semibold text-primary">
              {{ audience.cta }}
              <AppIcon
                name="arrow-right"
                :size="18"
                class="transition-transform duration-200 ease-smooth group-hover:translate-x-1"
              />
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         6. Prinsip — empat aturan main yang menentukan bentuk produknya.
         ================================================================== -->
    <section class="py-18 md:py-22" aria-labelledby="prinsip-heading">
      <div class="container-page">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Prinsip kami
          </p>
          <h2 id="prinsip-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter text-balance">
            Aturan main yang <span class="text-accent">kami pegang</span>
          </h2>
        </div>

        <ul class="mx-auto grid max-w-300 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <li
            v-for="principle in principles"
            :key="principle.title"
            class="flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift"
          >
            <span
              class="inline-flex h-11 w-11 items-center justify-center rounded-[13px] bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <AppIcon :name="principle.icon" :size="22" />
            </span>

            <h3 class="mt-5 mb-2 text-[1.08rem] font-bold tracking-[-0.03em]">{{ principle.title }}</h3>
            <p class="text-[0.97rem] leading-[1.62] text-muted">{{ principle.description }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- ==================================================================
         7. Nama dan lambang — satu-satunya bagian yang bicara identitas.
         ================================================================== -->
    <section class="border-t border-hairline py-18 md:py-22" aria-labelledby="lambang-heading">
      <div class="container-page">
        <div class="relative flex items-center justify-center py-4">
          <span
            class="pointer-events-none absolute h-48 w-48 rounded-full bg-primary/25 blur-[100px] md:h-64 md:w-64"
            aria-hidden="true"
          />
          <img
            src="/brand/zenko-icon-gradient.png"
            alt="Lambang Zenko: huruf Z berbentuk wajah rubah"
            width="174"
            height="174"
            class="relative h-24 w-24 object-contain md:h-28 md:w-28"
          >
        </div>

        <div class="mx-auto mt-6 max-w-160 text-center">
          <h2 id="lambang-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter text-balance">
            Rubah baik hati di balik <span class="text-accent">nama Zenko</span>
          </h2>
          <p class="mt-3.5 text-[1.02rem] leading-[1.7] text-pretty text-muted">
            Dalam mitologi Jepang, <strong class="font-semibold text-ink">Zenko (善狐)</strong> adalah rubah
            surgawi yang melambangkan kebaikan, kebijaksanaan, dan perlindungan — persis peran yang
            kami ambil: menemani persiapan ujianmu, bukan menghakiminya.
          </p>
        </div>

        <ul class="mx-auto mt-9 grid w-fit grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          <li
            v-for="mark in markMeanings"
            :key="mark.title"
            class="flex w-full max-w-72 items-center gap-4 rounded-[20px] border border-hairline bg-surface p-5 shadow-xs sm:max-w-64 sm:flex-col sm:items-center sm:gap-0 sm:text-center"
          >
            <span
              class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary-soft text-[1.25rem] leading-none font-extrabold text-primary"
              aria-hidden="true"
            >
              <AppIcon v-if="mark.icon" :name="mark.icon" :size="24" />
              <template v-else>{{ mark.glyph }}</template>
            </span>
            <div class="sm:mt-4">
              <h3 class="mb-1 text-[1.02rem] font-bold tracking-[-0.03em]">{{ mark.title }}</h3>
              <p class="text-[0.92rem] leading-[1.55] text-muted">{{ mark.meaning }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- ==================================================================
         8. FAQ — memakai <details> asli seperti /jadi-tutor: tetap bisa
         dibuka tanpa JavaScript dan sudah punya semantik expand/collapse.
         ================================================================== -->
    <section class="border-t border-hairline py-18 md:py-22" aria-labelledby="faq-heading">
      <div class="container-page">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Pertanyaan umum
          </p>
          <h2 id="faq-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter text-balance">
            Hal yang paling sering <span class="text-accent">ditanyakan</span>
          </h2>
        </div>

        <!-- `name` yang sama membuat keenamnya jadi satu grup eksklusif:
             membuka satu otomatis menutup yang lain, tanpa JavaScript. -->
        <div class="mx-auto grid max-w-300 gap-3 rounded-4xl bg-surface-alt p-4 md:p-6">
          <details
            v-for="faq in faqs"
            :key="faq.question"
            name="faq-tentang"
            class="group rounded-xl border border-hairline bg-surface px-5 py-4 shadow-xs transition-[box-shadow,border-color] duration-300 ease-smooth hover:shadow-lift open:shadow-lift md:px-6 md:py-5"
          >
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-4 font-bold tracking-[-0.02em] [&::-webkit-details-marker]:hidden"
            >
              {{ faq.question }}

              <span class="relative h-4 w-4 shrink-0" aria-hidden="true">
                <span class="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rounded-pill bg-primary" />
                <span
                  class="absolute top-0 left-1/2 h-4 w-0.5 -translate-x-1/2 rounded-pill bg-primary transition-[opacity,rotate] duration-300 ease-smooth group-open:rotate-90 group-open:opacity-0"
                />
              </span>
            </summary>

            <p class="mt-3 leading-[1.7] text-muted">{{ faq.answer }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         9. CTA penutup — pita penuh lebar, jadi halaman ini punya titik
         henti yang tegas sebelum footer.
         ================================================================== -->
    <section
      class="dot-grid relative overflow-hidden [--dot-color:rgba(255,255,255,0.14)] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark py-18 text-center md:py-22"
      aria-labelledby="cta-heading"
    >
      <div class="container-page relative z-1">
        <h2
          id="cta-heading"
          class="mx-auto max-w-[18ch] text-[clamp(2rem,3.4vw,3rem)] leading-[1.12] tracking-[-0.04em] text-balance text-white"
        >
          Mulai dari paket yang paling kamu butuhkan
        </h2>
        <p class="mx-auto mt-4 max-w-[52ch] text-[1.02rem] text-white/80">
          Cari simulasi untuk ujian yang kamu tuju, atau bagikan bank soalmu
          sendiri sebagai tutor.
        </p>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
          <AppButton to="/paket" variant="light" size="lg">Cari paket try out</AppButton>
          <NuxtLink
            to="/jadi-tutor"
            class="inline-flex min-h-13 items-center justify-center rounded-xs border border-white/40 px-8 font-semibold text-white transition-[transform,background] duration-200 ease-smooth hover:-translate-y-px hover:bg-white/10 focus-visible:-translate-y-px"
          >
            Jadi tutor
          </NuxtLink>
        </div>

        <p class="mt-9 text-[0.85rem] text-white/60">
          Zenko dikelola oleh PT Zenko Edukasi Digital.
        </p>
      </div>
    </section>
  </main>
</template>
