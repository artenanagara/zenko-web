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
 * server, riwayat attempt, dan ruang bimbel. Angka pemakaian dan klaim
 * penghasilan sengaja tidak disebut: pembayaran masih di balik
 * `paymentEnabled`, dan social proof menyusul kalau datanya sudah nyata.
 */
const features = [
  {
    icon: 'storefront',
    title: 'Katalog dari banyak tutor',
    description:
      'Paket try out datang dari berbagai tutor dengan spesialisasi berbeda, lengkap dengan rating dan ulasan siswa yang sudah mengerjakannya.',
  },
  {
    icon: 'seal-check',
    title: 'Dikurasi sebelum tayang',
    description:
      'Tiap paket diperiksa tim Zenko lebih dulu. Yang belum memenuhi standar tidak akan sampai ke katalog publik.',
  },
  {
    icon: 'play-circle',
    title: 'Contoh soal gratis',
    description:
      'Paket satuan menyediakan sebagian soal aslinya untuk dicoba gratis, jadi kamu tahu isinya sebelum mengambil paketnya.',
  },
  {
    icon: 'timer',
    title: 'Simulasi CBT sungguhan',
    description:
      'Timer, navigator soal, dan aturan pengerjaan mengikuti ujian aslinya — SKD satu timer untuk 110 soal, TKA per mata pelajaran.',
  },
  {
    icon: 'list-checks',
    title: 'Skor dan pembahasan otomatis',
    description:
      'Begitu selesai, server menghitung skor per subtes beserta ambang kelulusan SKD, lalu membuka pembahasan tiap soal.',
  },
  {
    icon: 'clock-counter-clockwise',
    title: 'Riwayat yang tersimpan',
    description:
      'Paket yang sudah kamu miliki bisa dikerjakan ulang, dan tiap percobaan lama tetap bisa ditinjau kembali.',
  },
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
</script>

<template>
  <main>
    <!-- ==================================================================
         1. Hero — proporsi yang sama dengan /jadi-tutor dan /untuk-bimbel,
         supaya halaman marketing Zenko dibuka dengan bentuk yang seragam.
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
         2. Fitur — enam kemampuan inti platform.
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

        <ul class="mx-auto grid max-w-300 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <li
            v-for="feature in features"
            :key="feature.title"
            class="flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-7"
          >
            <span
              class="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-linear-to-b from-primary-light to-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_rgba(47,111,235,0.22)]"
              aria-hidden="true"
            >
              <AppIcon :name="feature.icon" :size="24" />
            </span>

            <h3 class="mt-5 mb-2 text-[1.15rem] font-bold tracking-[-0.03em]">{{ feature.title }}</h3>
            <p class="leading-[1.62] text-muted">{{ feature.description }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- ==================================================================
         3. Untuk siapa — tiga peran, masing-masing dengan yang didapatnya
         dan tautan ke pintu masuknya.
         ================================================================== -->
    <section class="dot-grid border-y border-hairline bg-surface-alt py-18 md:py-22" aria-labelledby="untuk-siapa-heading">
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
                <AppIcon name="check-circle" :size="18" class="mt-0.5 text-primary" weight="fill" />
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
         4. Nama dan lambang — satu-satunya bagian "tentang kami" yang
         bicara soal identitas, ditutup tiga kartu makna yang ringkas.
         ================================================================== -->
    <section class="py-18 md:py-22" aria-labelledby="lambang-heading">
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
         5. CTA penutup — pita penuh lebar, jadi halaman ini punya titik
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
