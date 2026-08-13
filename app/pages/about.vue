<script setup lang="ts">
// English file name, Indonesian URL.
definePageMeta({ path: '/tentang' })

useHead({
  title: 'Tentang Kami — Zenko',
  meta: [
    {
      name: 'description',
      content:
        'Zenko adalah marketplace try out untuk SKD/CPNS, BUMN, SNBT, dan TKA — tempat siswa menemukan paket latihan terbaik dari berbagai tutor terpercaya, dan tempat tutor mengubah keahliannya jadi penghasilan.',
    },
  ],
})

/**
 * Copy menghindari klaim angka yang belum benar ("ribuan siswa", tahun
 * berdiri, nama tim) — social proof menyusul kalau datanya sudah nyata.
 */
const differentiators = [
  {
    icon: '🎯',
    title: 'Beragam pilihan',
    description: 'Paket dari banyak tutor, bukan satu sumber.',
  },
  {
    icon: '⭐',
    title: 'Transparan',
    description: 'Rating & ulasan asli dari siswa yang sudah mencoba.',
  },
  {
    icon: '⚡',
    title: 'Langsung kerjakan',
    description: 'Beli, akses, langsung latihan tanpa ribet.',
  },
]

const studentSteps = [
  'Cari kategori ujian',
  'Pilih paket sesuai kebutuhan & budget',
  'Kerjakan langsung',
  'Lihat hasil dan pembahasan',
]

const tutorSteps = [
  'Daftar sebagai tutor',
  'Upload paket soal',
  'Siswa menemukan dan membeli paketmu',
  'Kamu dapat penghasilan dari setiap paket yang terjual',
]

const values = [
  {
    icon: '🤝',
    title: 'Adil untuk semua pihak',
    description:
      'Bagi hasil yang transparan, siswa dapat harga wajar, tutor dapat porsi yang pantas.',
  },
  {
    icon: '✅',
    title: 'Kualitas di atas kuantitas',
    description:
      'Setiap konten yang tayang melewati proses moderasi, bukan sekadar upload asal jadi.',
  },
  {
    icon: '🚀',
    title: 'Terus bergerak maju',
    description:
      'Kami percaya progres kecil yang konsisten lebih berarti daripada janji besar yang lambat.',
  },
  {
    icon: '🌱',
    title: 'Membuka kesempatan',
    description:
      'Siapa pun dengan keahlian yang tepat berhak dapat kesempatan menghasilkan dari ilmunya.',
  },
]

const audiences = [
  {
    title: 'Siswa & pencari kerja',
    description:
      'Sedang bersiap menghadapi SKD/CPNS, seleksi BUMN, SNBT, atau ujian TKA, dan ingin latihan dengan soal berkualitas tanpa harus bingung mencari ke sana kemari.',
  },
  {
    title: 'Tutor & kreator konten',
    description:
      'Punya pengalaman atau keahlian di bidang ini — baik sebagai pengajar bimbel, lulusan yang sudah berhasil, atau content creator edukasi — dan ingin membagikannya sekaligus mendapat penghasilan.',
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
            Zenko adalah marketplace try out untuk SKD/CPNS, BUMN, SNBT, dan TKA —
            tempat siswa menemukan paket latihan terbaik dari berbagai tutor
            terpercaya, dan tempat tutor mengubah keahliannya jadi penghasilan.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         2. Masalah yang kami lihat
         ================================================================== -->
    <section class="pt-18 md:pt-22" aria-labelledby="masalah-heading">
      <div class="container-page">
        <div class="mx-auto mb-9 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-widest text-primary uppercase">
            Masalah yang kami lihat
          </p>
          <h2 id="masalah-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Kenapa Zenko <span class="text-accent">ada</span>
          </h2>
        </div>

        <div class="mx-auto grid max-w-160 gap-5 text-[1.02rem] leading-[1.7] text-muted">
          <p>
            Setiap tahun, jutaan Gen Z Indonesia bersaing memperebutkan kursi CPNS,
            BUMN, atau kampus impian lewat SNBT. Tapi persiapannya sering
            berantakan — soal latihan tersebar di grup WhatsApp, kualitasnya nggak
            jelas, dan susah tahu mana yang benar-benar sesuai standar ujian
            sebenarnya.
          </p>
          <p>
            Di sisi lain, banyak tutor dan lulusan yang sudah berhasil punya materi
            bagus, tapi terjebak jualan manual satu-satu lewat chat pribadi — capek
            ngurus pembayaran, kirim file, dan susah berkembang lebih besar dari
            itu.
          </p>
          <p class="font-semibold text-ink">
            Kami percaya ada cara yang lebih baik untuk mempertemukan keduanya.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         3. Apa itu Zenko — solusi & diferensiasi
         ================================================================== -->
    <section class="pt-18 md:pt-22" aria-labelledby="solusi-heading">
      <div class="container-page">
        <div class="mx-auto mb-9 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-widest text-primary uppercase">
            Apa itu Zenko
          </p>
          <h2 id="solusi-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Satu tempat, banyak pilihan <span class="text-accent">tutor terbaik</span>
          </h2>
        </div>

        <div class="mx-auto grid max-w-160 gap-5 text-[1.02rem] leading-[1.7] text-muted">
          <p>
            Zenko adalah marketplace try out — bukan platform dari satu vendor
            saja. Setiap paket soal di Zenko dibuat oleh tutor dan kreator konten
            yang berbeda-beda, jadi kamu bisa membandingkan, memilih, dan
            mempercayai paket berdasarkan rating dan ulasan nyata dari siswa lain —
            bukan cuma percaya klaim satu pihak.
          </p>
          <p>
            Ini yang membedakan Zenko dari platform try out kebanyakan: kami nggak
            membatasi kamu pada satu sudut pandang atau satu gaya mengajar. Semakin
            banyak tutor berkualitas bergabung, semakin banyak juga pilihan yang
            kamu punya untuk menemukan cara belajar yang paling cocok.
          </p>
        </div>

        <div class="mx-auto mt-11 grid max-w-300 gap-5 rounded-[32px] bg-surface-alt p-4 md:grid-cols-3 md:p-6">
          <article
            v-for="point in differentiators"
            :key="point.title"
            class="rounded-3xl border border-hairline bg-surface p-6 text-center shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
          >
            <span
              class="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary-soft text-[1.4rem]"
              aria-hidden="true"
            >{{ point.icon }}</span>
            <h3 class="mt-4 mb-2 text-[1.15rem] font-bold tracking-[-0.03em]">{{ point.title }}</h3>
            <p class="leading-[1.62] text-muted">{{ point.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         4. Cara kerja singkat
         ================================================================== -->
    <section class="pt-18 md:pt-22" aria-labelledby="cara-kerja-heading">
      <div class="container-page">
        <div class="mx-auto mb-9 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-widest text-primary uppercase">
            Cara kerja singkat
          </p>
          <h2 id="cara-kerja-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Sederhana dari <span class="text-accent">dua sisi</span>
          </h2>
        </div>

        <div class="mx-auto grid max-w-300 gap-5 rounded-[32px] bg-surface-alt p-4 md:grid-cols-2 md:p-6">
          <article class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs md:p-8">
            <h3 class="mb-5 text-[1.2rem] font-bold tracking-[-0.03em]">Untuk siswa</h3>
            <ol class="grid gap-4">
              <li v-for="(step, index) in studentSteps" :key="step" class="flex items-start gap-3.5">
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[0.8rem] font-bold text-primary"
                  aria-hidden="true"
                >{{ index + 1 }}</span>
                <span class="pt-0.5 leading-[1.55] text-muted">{{ step }}</span>
              </li>
            </ol>
          </article>

          <article class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs md:p-8">
            <h3 class="mb-5 text-[1.2rem] font-bold tracking-[-0.03em]">Untuk tutor</h3>
            <ol class="grid gap-4">
              <li v-for="(step, index) in tutorSteps" :key="step" class="flex items-start gap-3.5">
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[0.8rem] font-bold text-primary"
                  aria-hidden="true"
                >{{ index + 1 }}</span>
                <span class="pt-0.5 leading-[1.55] text-muted">{{ step }}</span>
              </li>
            </ol>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         5. Nilai yang kami pegang
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

        <div class="mx-auto grid max-w-300 gap-5 rounded-[32px] bg-surface-alt p-4 md:grid-cols-2 md:p-6">
          <article
            v-for="value in values"
            :key="value.title"
            class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
          >
            <span
              class="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary-soft text-[1.4rem]"
              aria-hidden="true"
            >{{ value.icon }}</span>
            <h3 class="mt-4 mb-2.5 text-[1.2rem] font-bold tracking-[-0.03em]">{{ value.title }}</h3>
            <p class="leading-[1.62] text-muted">{{ value.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         6. Untuk siapa Zenko
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
              class="block h-0.5 w-8 rounded-pill bg-linear-to-r from-primary-light to-primary"
              aria-hidden="true"
            />
            <h3 class="mt-4 mb-2.5 text-[1.2rem] font-bold tracking-[-0.03em]">{{ audience.title }}</h3>
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
