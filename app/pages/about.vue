<script setup lang="ts">
// English file name, Indonesian URL.
definePageMeta({ path: '/tentang' })

useSeoMeta({
  title: 'Tentang Kami | Zenko',
  description:
    'Zenko adalah marketplace try out CBT untuk SKD (CPNS & Sekolah Kedinasan) dan TKA (SD–SMK). Tutor menyusun paketnya, tim Zenko mengkurasi, siswa berlatih di simulasi yang mendekati ujian aslinya.',
  ogTitle: 'Tentang Kami | Zenko',
  ogDescription:
    'Zenko adalah marketplace try out CBT untuk SKD (CPNS & Sekolah Kedinasan) dan TKA (SD–SMK). Tutor menyusun paketnya, tim Zenko mengkurasi, siswa berlatih di simulasi yang mendekati ujian aslinya.',
  ogImage: 'https://zenkoedu.id/brand/zenko-lockup-horizontal-blue.png',
  ogUrl: 'https://zenkoedu.id/tentang',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/tentang' }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(useOrganizationSchema()) }],
})

/**
 * Copy halaman ini dibatasi pada yang benar-benar berjalan hari ini: kategori
 * SKD & TKA, kurasi paket sebelum tayang, sistem CBT, dan ruang bimbel.
 * Angka pemakaian (jumlah siswa/tutor) dan klaim penghasilan sengaja tidak
 * disebut — pembayaran masih di balik `paymentEnabled`, dan social proof
 * menyusul kalau datanya sudah nyata.
 */

/** Tiga simpul alur marketplace, dibaca kiri ke kanan pada visual hero. */
const flow = [
  {
    icon: 'note-pencil',
    role: 'Tutor',
    title: 'Menyusun paket',
    description: 'Soal, kunci, dan pembahasannya disusun tutor di editor paket Zenko.',
  },
  {
    icon: 'seal-check',
    role: 'Zenko',
    title: 'Mengkurasi',
    description: 'Tiap paket diperiksa tim kami dulu sebelum boleh tayang di katalog.',
  },
  {
    icon: 'exam',
    role: 'Siswa',
    title: 'Berlatih',
    description: 'Dikerjakan sebagai simulasi CBT, lalu ditinjau lewat skor dan pembahasan.',
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

/** Tiga peran yang dilayani produk hari ini, masing-masing punya pintu masuk sendiri. */
const audiences = [
  {
    icon: 'student',
    label: 'Siswa',
    title: 'Yang sedang mengejar seleksi',
    description:
      'Kerjakan simulasi SKD atau TKA dengan timer dan aturan penilaian yang mengikuti ujian aslinya, lalu pelajari pembahasannya.',
    to: '/paket',
    cta: 'Lihat katalog paket',
  },
  {
    icon: 'chalkboard-teacher',
    label: 'Tutor',
    title: 'Yang punya bank soal sendiri',
    description:
      'Susun paketmu di editor Zenko tanpa memikirkan sistem CBT-nya. Setelah lolos kurasi, paketmu tayang di katalog publik.',
    to: '/jadi-tutor',
    cta: 'Cara jadi tutor',
  },
  {
    icon: 'buildings',
    label: 'Bimbel',
    title: 'Yang mengelola banyak siswa',
    description:
      'Kelola kelas dan roster siswa, terbitkan bank soal privat milik bimbelmu, dan lihat rekap hasil tiap paket dalam satu dashboard.',
    to: '/untuk-bimbel',
    cta: 'Zenko untuk bimbel',
  },
]
</script>

<template>
  <main>
    <!-- ==================================================================
         1. Hero — pernyataan tunggal di tengah, lalu visual alur sebagai
         kartu putih yang mengambang di atas wash biru panel.
         ================================================================== -->
    <section class="container-page pt-3 md:pt-5">
      <div
        class="dot-grid dot-grid-hero hero-aurora relative overflow-hidden rounded-[26px] px-5 pt-14 pb-14 md:rounded-xl md:px-10 md:pt-20 md:pb-16"
      >
        <div class="relative z-1 mx-auto max-w-190 text-center">
          <p class="mb-3 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Tentang kami
          </p>

          <h1 class="mx-auto max-w-[20ch] text-[clamp(2.3rem,5vw,4rem)] leading-[1.05] tracking-tighter text-balance">
            Belajar terarah, bukan sekadar
            <span class="text-accent mt-1 block">menumpuk soal</span>
          </h1>

          <p class="mx-auto mt-5 max-w-[52ch] text-[1.08rem] leading-[1.6] text-pretty text-muted md:text-[1.22rem]">
            Zenko adalah marketplace try out CBT untuk SKD (CPNS &amp; Sekolah Kedinasan)
            dan TKA (SD–SMK) — tempat tutor menyusun paket latihannya, dan siswa
            mengerjakannya sebagai simulasi yang mendekati ujian sebenarnya.
          </p>
        </div>

        <!-- Alur marketplace: tutor → kurasi → siswa. Panah hanya muncul di
             layar lebar; pada mobile urutannya sudah dibawa oleh tumpukan. -->
        <ol
          class="relative z-1 mx-auto mt-12 grid max-w-260 items-stretch gap-3 rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-float backdrop-blur-[6px] md:mt-14 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-4 md:p-5"
        >
          <template v-for="(node, index) in flow" :key="node.title">
            <li
              v-if="index"
              class="hidden justify-center text-primary/40 md:flex"
              aria-hidden="true"
            >
              <AppIcon name="arrow-right" :size="22" />
            </li>

            <li class="rounded-[18px] bg-surface-alt p-5 md:bg-transparent md:p-3">
              <span
                class="inline-flex h-11 w-11 items-center justify-center rounded-[13px] bg-linear-to-b from-primary-light to-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_rgba(47,111,235,0.22)]"
                aria-hidden="true"
              >
                <AppIcon :name="node.icon" :size="22" />
              </span>

              <p class="mt-4 text-[0.72rem] font-bold tracking-[0.12em] text-primary uppercase">
                {{ node.role }}
              </p>
              <p class="mt-1 mb-1.5 text-[1.15rem] font-bold tracking-[-0.03em]">{{ node.title }}</p>
              <p class="text-[0.95rem] leading-[1.6] text-muted">{{ node.description }}</p>
            </li>
          </template>
        </ol>
      </div>
    </section>

    <!-- ==================================================================
         2. Nama dan lambang — satu visual besar dengan cahaya lembut di
         belakangnya, lalu makna tiap unsurnya dalam tiga kartu ringkas.
         ================================================================== -->
    <section class="py-20 md:py-28" aria-labelledby="lambang-heading">
      <div class="container-page">
        <div class="relative flex items-center justify-center py-6 md:py-10">
          <span
            class="pointer-events-none absolute h-56 w-56 rounded-full bg-primary/25 blur-[110px] md:h-80 md:w-80"
            aria-hidden="true"
          />
          <img
            src="/brand/zenko-icon-gradient.png"
            alt="Lambang Zenko: huruf Z berbentuk wajah rubah"
            width="174"
            height="174"
            class="relative h-28 w-28 object-contain md:h-36 md:w-36"
          >
        </div>

        <div class="mx-auto mt-8 max-w-160 text-center">
          <h2 id="lambang-heading" class="mx-auto max-w-[24ch] text-[clamp(1.9rem,3.4vw,2.9rem)] leading-[1.12] tracking-tighter text-balance">
            Rubah baik hati di balik <span class="text-accent">nama Zenko</span>
          </h2>
          <p class="mt-4 text-[1.02rem] leading-[1.7] text-pretty text-muted">
            Dalam mitologi Jepang, <strong class="font-semibold text-ink">Zenko (善狐)</strong> adalah rubah
            surgawi yang melambangkan kebaikan, kebijaksanaan, dan perlindungan. Lambang kami
            menggabungkan huruf “Z” dengan wajah rubah yang tersenyum — persis peran yang kami ambil:
            menemani persiapan ujianmu, bukan menghakiminya.
          </p>
        </div>

        <ul class="mx-auto mt-12 grid w-fit grid-cols-1 gap-5 sm:grid-cols-3 md:mt-16 md:gap-6 lg:gap-10">
          <li
            v-for="mark in markMeanings"
            :key="mark.title"
            class="w-full max-w-72 rounded-[22px] border border-hairline bg-surface p-6 text-center shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift sm:max-w-64"
          >
            <span
              class="inline-flex h-13 w-13 items-center justify-center rounded-[16px] bg-primary-soft text-[1.4rem] leading-none font-extrabold text-primary"
              aria-hidden="true"
            >
              <AppIcon v-if="mark.icon" :name="mark.icon" :size="26" />
              <template v-else>{{ mark.glyph }}</template>
            </span>
            <h3 class="mt-5 mb-1.5 text-[1.08rem] font-bold tracking-[-0.03em]">{{ mark.title }}</h3>
            <p class="text-[0.95rem] leading-[1.6] text-muted">{{ mark.meaning }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- ==================================================================
         3. Untuk siapa — tiga peran yang dilayani produk, masing-masing
         menautkan ke pintu masuknya sendiri.
         ================================================================== -->
    <section class="border-t border-hairline py-20 md:py-28" aria-labelledby="untuk-siapa-heading">
      <div class="container-page">
        <div class="mx-auto mb-12 max-w-160 text-center md:mb-16">
          <p class="mb-3 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Untuk siapa Zenko
          </p>
          <h2 id="untuk-siapa-heading" class="text-[clamp(1.9rem,3.4vw,2.9rem)] leading-[1.12] tracking-tighter text-balance">
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

            <span class="mt-6 inline-flex items-center gap-2 font-semibold text-primary">
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
         4. CTA penutup — pita penuh lebar, bukan panel membulat seperti
         halaman lain, supaya halaman ini punya titik henti yang tegas.
         ================================================================== -->
    <section
      class="dot-grid relative overflow-hidden [--dot-color:rgba(255,255,255,0.14)] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark py-20 text-center md:py-28"
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

        <div class="mt-9 flex flex-wrap items-center justify-center gap-4">
          <AppButton to="/paket" variant="light" size="lg">Cari paket try out</AppButton>
          <NuxtLink
            to="/jadi-tutor"
            class="inline-flex min-h-13 items-center justify-center rounded-xs border border-white/40 px-8 font-semibold text-white transition-[transform,background] duration-200 ease-smooth hover:-translate-y-px hover:bg-white/10 focus-visible:-translate-y-px"
          >
            Jadi tutor
          </NuxtLink>
        </div>

        <p class="mt-10 text-[0.85rem] text-white/60">
          Zenko dikelola oleh PT Zenko Edukasi Digital.
        </p>
      </div>
    </section>
  </main>
</template>
