<script setup lang="ts">
import {
  IconTarget,
  IconStar,
  IconLightning,
  IconHandshake,
  IconCheckCircle,
  IconRocket,
  IconPlant,
} from '#components'

// English file name, Indonesian URL.
definePageMeta({ path: '/tentang' })

useSeoMeta({
  title: 'Tentang Kami | Zenko',
  description:
    'Zenko adalah platform marketplace try out untuk SKD CPNS, BUMN, SNBT, dan Tes Kedinasan. Tempat siswa menemukan simulasi ujian terbaik dari tutor terpercaya, dan tempat tutor membagikan karyanya secara profesional.',
  ogTitle: 'Tentang Kami | Zenko',
  ogDescription:
    'Zenko adalah platform marketplace try out untuk SKD CPNS, BUMN, SNBT, dan Tes Kedinasan. Tempat siswa menemukan simulasi ujian terbaik dari tutor terpercaya, dan tempat tutor membagikan karyanya secara profesional.',
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

const values = [
  {
    icon: IconHandshake,
    title: 'Adil untuk semua pihak',
    description:
      'Bagi hasil yang adil dan transparan. Siswa mendapatkan materi berkualitas dengan harga wajar, dan tutor memperoleh apresiasi yang layak.',
  },
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
    title: 'Siswa dan pejuang seleksi',
    description:
      'Sedang bersiap menghadapi SKD CPNS, Rekrutmen BUMN, SNBT UTBK, atau Tes Kedinasan, dan ingin latihan terarah dengan soal berkualitas tanpa bingung mencari materi ke sana ke mari.',
  },
  {
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
            Zenko adalah marketplace try out untuk SKD CPNS, BUMN, SNBT, dan Tes Kedinasan. Tempat siswa menemukan paket latihan terbaik dari berbagai tutor terpercaya, dan wadah bagi tutor untuk membagikan keahliannya.
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
            Latar Belakang
          </p>
          <h2 id="masalah-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Kenapa Zenko <span class="text-accent">hadir</span>
          </h2>
        </div>

        <div class="mx-auto grid max-w-160 gap-5 text-[1.02rem] leading-[1.7] text-muted">
          <p>
            Setiap tahun, jutaan pejuang ujian di Indonesia bersaing memperebutkan posisi di instansi pemerintahan, BUMN, atau perguruan tinggi negeri impian. Sayangnya, proses persiapan sering terasa membingungkan karena bahan latihan tersebar di berbagai grup percakapan tanpa kurasi mutu dan tanpa simulasi ujian yang realistis.
          </p>
          <p>
            Di sisi lain, banyak pendidik dan lulusan berprestasi yang memiliki bank soal bermutu, namun terkendala infrastruktur teknis seperti sistem CBT dan payment gateway otomatis untuk mendistribusikan ilmunya.
          </p>
          <p class="font-semibold text-ink">
            Kami percaya ada cara yang lebih adil dan terstruktur untuk menjembatani semangat belajar siswa dengan keahlian para pendidik.
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
            Solusi Zenko
          </p>
          <h2 id="solusi-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Satu tempat, banyak pilihan <span class="text-accent">tutor terbaik</span>
          </h2>
        </div>

        <div class="mx-auto grid max-w-160 gap-5 text-[1.02rem] leading-[1.7] text-muted">
          <p>
            Zenko adalah marketplace try out terbuka, bukan sekadar platform satu arah. Setiap paket soal disusun oleh tutor yang memiliki spesialisasi masing-masing. Siswa dapat membandingkan paket, melihat ulasan jujur, dan memilih materi yang paling pas dengan gaya belajarnya.
          </p>
          <p>
            Kami tidak membatasi siswa pada satu metode pembelajaran saja. Semakin banyak pendidik berdedikasi yang bergabung, semakin kaya pilihan latihan yang kamu miliki untuk meraih impianmu.
          </p>
        </div>

        <div class="mx-auto mt-11 grid max-w-300 gap-5 rounded-[32px] bg-surface-alt p-4 md:grid-cols-3 md:p-6">
          <article
            v-for="point in differentiators"
            :key="point.title"
            class="rounded-3xl border border-hairline bg-surface p-6 text-center shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
          >
            <span
              class="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <component :is="point.icon" class="h-6 w-6" />
            </span>
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
              class="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <component :is="value.icon" class="h-6 w-6" />
            </span>
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
         7. Identitas penyelenggara
         ==================================================================
         Badan hukum, alamat, dan kanal kontak dikumpulkan di satu tempat yang
         mudah ditemukan. Halaman legal tetap memuat detail yang sama; blok ini
         ada supaya identitas usaha terbaca tanpa harus membuka Ketentuan
         Layanan — hal pertama yang dicari saat review merchant payment gateway.
         ================================================================== -->
    <section class="pb-18 md:pb-22" aria-labelledby="identitas-heading">
      <div class="container-page">
        <div class="mx-auto max-w-300 rounded-[32px] bg-surface-alt p-6 md:p-8">
          <h2 id="identitas-heading" class="mb-5 text-[1.2rem] font-bold tracking-[-0.03em]">
            Identitas penyelenggara
          </h2>

          <dl class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt class="text-[0.82rem] font-bold tracking-widest text-muted uppercase">Badan hukum</dt>
              <dd class="mt-1 font-semibold">PT Zenko Edukasi Digital</dd>
            </div>
            <div>
              <dt class="text-[0.82rem] font-bold tracking-widest text-muted uppercase">Alamat</dt>
              <dd class="mt-1">Klaten, Jawa Tengah, Indonesia</dd>
            </div>
            <div>
              <dt class="text-[0.82rem] font-bold tracking-widest text-muted uppercase">Email</dt>
              <dd class="mt-1">
                <a href="mailto:halo@zenkoedu.id" class="font-semibold text-primary hover:underline">
                  halo@zenkoedu.id
                </a>
              </dd>
            </div>
            <div>
              <dt class="text-[0.82rem] font-bold tracking-widest text-muted uppercase">Telepon / WhatsApp</dt>
              <dd class="mt-1">
                <a href="tel:+6288227663468" class="font-semibold text-primary hover:underline">
                  0882-2766-3468
                </a>
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-[0.82rem] font-bold tracking-widest text-muted uppercase">Pembayaran</dt>
              <dd class="mt-1 leading-[1.7] text-muted">
                Transaksi di Zenko diproses melalui QRIS oleh
                <strong class="text-ink">Duitku</strong>, penyedia payment gateway
                berizin Bank Indonesia. Zenko tidak pernah menyimpan nomor kartu,
                PIN, maupun kredensial rekeningmu.
              </dd>
            </div>
          </dl>

          <ul class="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-hairline pt-5 text-[0.9rem] font-semibold">
            <li>
              <NuxtLink to="/ketentuan-layanan" class="text-primary hover:underline">Ketentuan Layanan</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/kebijakan-privasi" class="text-primary hover:underline">Kebijakan Privasi</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/kebijakan-refund" class="text-primary hover:underline">Kebijakan Refund</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/pusat-bantuan" class="text-primary hover:underline">Pusat Bantuan</NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         8. CTA penutup
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
