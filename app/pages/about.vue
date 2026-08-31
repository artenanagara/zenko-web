<script setup lang="ts">
import {
  IconTarget,
  IconStar,
  IconLightning,
  IconHandshake,
  IconCheckCircle,
  IconRocket,
  IconPlant,
  IconAlert,
  IconUser,
  IconTrophy,
} from '#components'

// English file name, Indonesian URL.
definePageMeta({ path: '/tentang' })

useSeoMeta({
  title: 'Tentang Kami | Zenko',
  description:
    'Zenko adalah platform marketplace try out untuk SKD (CPNS & Sekolah Kedinasan) dan TKA (SD–SMK). Tempat siswa menemukan simulasi ujian terbaik dari tutor terpercaya, dan tempat tutor membagikan karyanya secara profesional.',
  ogTitle: 'Tentang Kami | Zenko',
  ogDescription:
    'Zenko adalah platform marketplace try out untuk SKD (CPNS & Sekolah Kedinasan) dan TKA (SD–SMK). Tempat siswa menemukan simulasi ujian terbaik dari tutor terpercaya, dan tempat tutor membagikan karyanya secara profesional.',
  ogImage: 'https://zenkoedu.id/brand/zenko-lockup-horizontal-blue.png',
  ogUrl: 'https://zenkoedu.id/tentang',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/tentang' }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(useOrganizationSchema()) }],
})

/**
 * Copy menghindari klaim angka yang belum benar ("ribuan siswa", tahun
 * berdiri, nama tim) — social proof menyusul kalau datanya sudah nyata.
 */
const problems = [
  {
    label: 'Sisi siswa',
    title: 'Bahan latihan tersebar tanpa arah',
    description:
      'Jutaan pejuang SKD CPNS, Sekolah Kedinasan, BUMN, SNBT, dan TKA bersaing tiap tahun, tapi materi latihan menumpuk di berbagai grup percakapan tanpa kurasi mutu dan tanpa simulasi ujian yang realistis.',
  },
  {
    label: 'Sisi tutor',
    title: 'Keahlian terkendala infrastruktur',
    description:
      'Banyak pendidik dan lulusan berprestasi punya bank soal bermutu, namun terkendala hal teknis seperti sistem CBT dan payment gateway otomatis untuk mendistribusikan ilmunya.',
  },
]

const differentiators = [
  {
    icon: IconTarget,
    title: 'Beragam pilihan tutor',
    description: 'Banyak pilihan paket dari berbagai tutor berpengalaman, bukan hanya satu sumber.',
  },
  {
    icon: IconStar,
    title: 'Ulasan transparan',
    description: 'Rating dan testimoni nyata dari siswa yang sudah mencoba langsung.',
  },
  {
    icon: IconLightning,
    title: 'Langsung latihan',
    description: 'Beli paket, akses sistem CBT secara instan tanpa ribet verifikasi manual.',
  },
]

const studentSteps = [
  'Cari kategori ujian yang kamu tuju',
  'Pilih paket try out sesuai target dan kebutuhanmu',
  'Kerjakan simulasi ujian CBT',
  'Pelajari evaluasi skor dan pembahasan lengkapnya',
]

const tutorSteps = [
  'Daftar sebagai tutor dan lengkapi profilmu',
  'Unggah paket try out dan susun pembahasannya',
  'Paket tayang di katalog setelah dikurasi oleh tim Zenko',
  'Dapatkan penghasilan bersih dari setiap paket yang terjual',
]

const featuredValue = {
  icon: IconHandshake,
  title: 'Adil untuk semua pihak',
  description:
    'Bagi hasil yang adil dan transparan. Siswa mendapatkan materi berkualitas dengan harga wajar, dan tutor memperoleh apresiasi yang layak atas karyanya.',
}

const supportingValues = [
  {
    icon: IconCheckCircle,
    title: 'Kualitas di atas kuantitas',
    description:
      'Setiap paket soal melewati kurasi ketat tim Zenko untuk memastikan relevansi dan akurasi kisi-kisi.',
  },
  {
    icon: IconRocket,
    title: 'Terus bergerak maju',
    description:
      'Kami percaya progres kecil yang konsisten dalam latihan jauh lebih bermakna daripada janji instan.',
  },
  {
    icon: IconPlant,
    title: 'Membuka kesempatan luas',
    description:
      'Siapa pun yang memiliki keahlian dan dedikasi mengajar berhak mendapatkan ruang untuk berkarya dan berdaya.',
  },
]

const audiences = [
  {
    icon: IconUser,
    tag: 'Siswa',
    title: 'Siswa dan pejuang seleksi',
    description:
      'Sedang bersiap menghadapi SKD CPNS, SKD Sekolah Kedinasan, atau TKA, dan ingin latihan terarah dengan soal berkualitas tanpa bingung mencari materi ke sana ke mari.',
  },
  {
    icon: IconTrophy,
    tag: 'Tutor & kreator',
    title: 'Tutor dan kreator edukasi',
    description:
      'Punya materi dan keahlian mengajar (tutor bimbel, alumni berprestasi, atau konten kreator edukasi) yang ingin mendistribusikan soal secara profesional dan mendapatkan penghasilan mandiri.',
  },
]
</script>

<template>
  <main>
    <!-- ==================================================================
         1. Hero
         ================================================================== -->
    <section class="container-page pt-3 md:pt-5">
      <div
        class="dot-grid dot-grid-hero hero-aurora relative overflow-hidden rounded-[26px] px-5 pt-12 pb-16 md:rounded-xl md:px-10 md:pt-16 md:pb-20"
      >
        <div class="relative z-1 mx-auto max-w-190 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-widest text-primary uppercase">
            Tentang kami
          </p>

          <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter">
            Persiapan ujian yang nggak perlu bikin bingung
            <span class="text-accent mt-1 block">harus belajar dari mana</span>
          </h1>

          <p class="mx-auto mt-4 max-w-160 text-[1.02rem] text-muted">
            Zenko adalah marketplace try out untuk SKD (CPNS & Sekolah Kedinasan) dan TKA (SD–SMK). Tempat siswa menemukan paket latihan terbaik dari berbagai tutor terpercaya, dan wadah bagi tutor untuk membagikan keahliannya.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         2. Kenapa Zenko hadir — heading + lead di kiri, dua panel masalah
         (siswa & tutor) bertumpuk di kanan. Memutus pola "blok teks
         tengah" yang dipakai hero.
         ================================================================== -->
    <section class="pt-18 md:pt-22" aria-labelledby="masalah-heading">
      <div class="container-page">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] md:gap-12">
          <div>
            <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-widest text-primary uppercase">
              Latar Belakang
            </p>
            <h2 id="masalah-heading" class="max-w-[13ch] text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
              Kenapa Zenko <span class="text-accent">hadir</span>
            </h2>
            <p class="mt-5 max-w-[46ch] text-[1.15rem] leading-[1.6] font-semibold tracking-[-0.01em] text-ink">
              Kami percaya ada cara yang lebih adil dan terstruktur untuk menjembatani semangat belajar siswa dengan keahlian para pendidik.
            </p>
          </div>

          <div class="grid gap-4">
            <article
              v-for="problem in problems"
              :key="problem.title"
              class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs"
            >
              <AppBadge variant="warning" size="sm">{{ problem.label }}</AppBadge>
              <h3 class="mt-3.5 mb-2 flex items-start gap-2.5 text-[1.05rem] font-bold tracking-[-0.02em]">
                <IconAlert class="mt-0.5 h-4.5 w-4.5 shrink-0 text-warning" aria-hidden="true" />
                {{ problem.title }}
              </h3>
              <p class="leading-[1.62] text-muted">{{ problem.description }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         3. Apa itu Zenko — solusi & diferensiasi. Baris fitur tanpa kartu
         berbingkai besar, dipisah garis vertikal — kontras dengan panel
         abu-abu di bagian lain halaman.
         ================================================================== -->
    <section class="pt-18 md:pt-22" aria-labelledby="solusi-heading">
      <div class="container-page">
        <div class="max-w-160">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-widest text-primary uppercase">
            Solusi Zenko
          </p>
          <h2 id="solusi-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Satu tempat, banyak pilihan <span class="text-accent">tutor terbaik</span>
          </h2>
          <p class="mt-3.5 text-[1.02rem] leading-[1.7] text-muted">
            Zenko adalah marketplace try out terbuka, bukan sekadar platform satu arah. Setiap paket soal disusun oleh tutor yang memiliki spesialisasi masing-masing — semakin banyak pendidik berdedikasi yang bergabung, semakin kaya pilihan latihan yang kamu miliki.
          </p>
        </div>

        <div class="mt-11 grid grid-cols-1 divide-y divide-hairline border-t border-hairline md:grid-cols-3 md:divide-x md:divide-y-0 md:border-t-0">
          <article
            v-for="point in differentiators"
            :key="point.title"
            class="flex flex-col gap-3 py-6 md:px-7 md:py-2 md:first:pl-0"
          >
            <span
              class="inline-flex h-11 w-11 items-center justify-center rounded-[13px] bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <component :is="point.icon" class="h-5.5 w-5.5" />
            </span>
            <h3 class="text-[1.1rem] font-bold tracking-[-0.03em]">{{ point.title }}</h3>
            <p class="leading-[1.62] text-muted">{{ point.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         4. Cara kerja singkat — pita penuh dengan daftar bernomor besar,
         bukan dua kartu kotak. Satu-satunya pita bg-surface-alt di halaman
         ini, jadi terasa sebagai jeda ritme, bukan pengulangan.
         ================================================================== -->
    <section class="dot-grid mt-18 border-y border-hairline bg-surface-alt py-18 md:mt-22 md:py-22" aria-labelledby="cara-kerja-heading">
      <div class="container-page relative z-1">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-widest text-primary uppercase">
            Cara kerja singkat
          </p>
          <h2 id="cara-kerja-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Sederhana dari <span class="text-accent">dua sisi</span>
          </h2>
        </div>

        <div class="mx-auto grid max-w-300 gap-x-12 gap-y-10 md:grid-cols-2">
          <div>
            <h3 class="mb-6 text-[1.2rem] font-bold tracking-[-0.03em]">Untuk siswa</h3>
            <ol class="grid">
              <li
                v-for="(step, index) in studentSteps"
                :key="step"
                class="relative flex gap-5 border-l border-hairline-strong py-4 pl-7 last:border-transparent last:pb-0"
              >
                <span
                  class="absolute top-3 -left-4.5 flex h-9 w-9 items-center justify-center rounded-full border border-hairline-strong bg-surface text-[0.85rem] font-extrabold text-primary"
                  aria-hidden="true"
                >{{ index + 1 }}</span>
                <span class="pt-1.5 leading-[1.55] text-muted">{{ step }}</span>
              </li>
            </ol>
          </div>

          <div>
            <h3 class="mb-6 text-[1.2rem] font-bold tracking-[-0.03em]">Untuk tutor</h3>
            <ol class="grid">
              <li
                v-for="(step, index) in tutorSteps"
                :key="step"
                class="relative flex gap-5 border-l border-hairline-strong py-4 pl-7 last:border-transparent last:pb-0"
              >
                <span
                  class="absolute top-3 -left-4.5 flex h-9 w-9 items-center justify-center rounded-full border border-hairline-strong bg-surface text-[0.85rem] font-extrabold text-primary"
                  aria-hidden="true"
                >{{ index + 1 }}</span>
                <span class="pt-1.5 leading-[1.55] text-muted">{{ step }}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         5. Nilai yang kami pegang — satu nilai utama tampil penuh sebagai
         panel unggulan, tiga nilai pendukung berbaris di bawahnya (bento),
         bukan grid 2x2 yang seragam.
         ================================================================== -->
    <section class="pt-18 md:pt-22" aria-labelledby="nilai-heading">
      <div class="container-page">
        <div class="mx-auto mb-9 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-widest text-primary uppercase">
            Nilai yang kami pegang
          </p>
          <h2 id="nilai-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Yang kami <span class="text-accent">percaya</span>
          </h2>
        </div>

        <div class="mx-auto grid max-w-300 gap-5">
          <article
            class="flex flex-col items-start gap-5 rounded-[26px] border border-hairline bg-primary-soft/60 p-7 sm:flex-row sm:items-center md:p-9"
          >
            <span
              class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_10px_24px_rgba(47,111,235,0.25)]"
              aria-hidden="true"
            >
              <component :is="featuredValue.icon" class="h-7 w-7" />
            </span>
            <div>
              <h3 class="mb-1.5 text-[1.3rem] font-bold tracking-[-0.03em]">{{ featuredValue.title }}</h3>
              <p class="max-w-[62ch] leading-[1.62] text-muted">{{ featuredValue.description }}</p>
            </div>
          </article>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
            <article
              v-for="value in supportingValues"
              :key="value.title"
              class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-7"
            >
              <span
                class="inline-flex h-11 w-11 items-center justify-center rounded-[13px] bg-primary-soft text-primary"
                aria-hidden="true"
              >
                <component :is="value.icon" class="h-5.5 w-5.5" />
              </span>
              <h3 class="mt-4 mb-2 text-[1.05rem] font-bold tracking-[-0.03em]">{{ value.title }}</h3>
              <p class="leading-[1.62] text-muted">{{ value.description }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         6. Untuk siapa Zenko — kartu dengan avatar ikon + label peran,
         bukan sekadar garis aksen di atas judul.
         ================================================================== -->
    <section class="py-18 md:py-22" aria-labelledby="untuk-siapa-heading">
      <div class="container-page">
        <div class="mx-auto mb-9 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-widest text-primary uppercase">
            Untuk siapa Zenko
          </p>
          <h2 id="untuk-siapa-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Dibuat untuk <span class="text-accent">kamu yang…</span>
          </h2>
        </div>

        <div class="mx-auto grid max-w-300 gap-5 md:grid-cols-2">
          <article
            v-for="audience in audiences"
            :key="audience.title"
            class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs md:p-8"
          >
            <span
              class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-linear-160 from-primary-light to-primary-dark text-white"
              aria-hidden="true"
            >
              <component :is="audience.icon" class="h-5.5 w-5.5" />
            </span>
            <AppBadge class="mt-4" variant="neutral" size="sm">{{ audience.tag }}</AppBadge>
            <h3 class="mt-3 mb-2.5 text-[1.2rem] font-bold tracking-[-0.03em]">{{ audience.title }}</h3>
            <p class="leading-[1.62] text-muted">{{ audience.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         7. CTA penutup
         ================================================================== -->
    <section class="pb-18 md:pb-22" aria-labelledby="cta-heading">
      <div class="container-page">
        <div
          class="panel-inset rounded-[24px] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark px-6 py-12 text-center min-[901px]:rounded-xl min-[901px]:px-15 min-[901px]:py-16"
        >
          <h2 id="cta-heading" class="text-[clamp(2rem,3.4vw,3rem)] leading-[1.12] tracking-[-0.04em] text-white">
            Siap mulai?
          </h2>
          <p class="mx-auto mt-4 max-w-[52ch] text-[1.02rem] text-white/80">
            Temukan paket try out yang cocok buatmu, atau mulai hasilkan dari
            keahlianmu hari ini.
          </p>

          <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
            <AppButton to="/" variant="light" size="lg">Cari paket try out</AppButton>
            <NuxtLink
              to="/jadi-tutor"
              class="inline-flex min-h-13 items-center justify-center rounded-xs border border-white/40 px-8 font-semibold text-white transition-[transform,background] duration-200 ease-smooth hover:-translate-y-px hover:bg-white/10 focus-visible:-translate-y-px"
            >
              Jadi tutor
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
