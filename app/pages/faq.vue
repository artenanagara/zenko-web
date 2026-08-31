<script setup lang="ts">
// English file name, Indonesian URL.
definePageMeta({ path: '/faq' })

useSeoMeta({
  title: 'FAQ | Zenko',
  description:
    'Pertanyaan yang sering ditanyakan seputar Zenko: cara kerja try out CBT, pembayaran QRIS, akun dan login, refund, dan menjadi tutor.',
  ogTitle: 'FAQ | Zenko',
  ogDescription:
    'Pertanyaan yang sering ditanyakan seputar Zenko: cara kerja try out CBT, pembayaran QRIS, akun dan login, refund, dan menjadi tutor.',
  ogImage: 'https://zenkoedu.id/brand/zenko-lockup-horizontal-blue.png',
  ogUrl: 'https://zenkoedu.id/faq',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/faq' }],
})

/**
 * Broader platform FAQ than become-tutor.vue's own FAQ (which stays focused
 * on the tutor application flow). Each category is its own exclusive
 * <details> group — accordions in different categories can stay open
 * together, only within a category does opening one close the rest.
 */
interface FaqCategory {
  id: string
  title: string
  items: { question: string, answer: string }[]
}

const categories: FaqCategory[] = [
  {
    id: 'tentang-zenko',
    title: 'Tentang Zenko',
    items: [
      {
        question: 'Apa itu Zenko?',
        answer:
          'Zenko adalah marketplace try out untuk persiapan SKD (CPNS & Sekolah Kedinasan) dan TKA (SD, SMP, SMA, SMK). Siswa membeli paket try out dari berbagai tutor, lalu mengerjakannya langsung di sistem CBT (Computer Based Test) Zenko.',
      },
      {
        question: 'Bagaimana cara kerja try out CBT-nya?',
        answer:
          'Setelah membeli sebuah paket, akses langsung aktif di akunmu. Kamu mengerjakan soal di dalam sistem CBT Zenko dengan waktu pengerjaan sesuai pengaturan paket, lalu mendapatkan skor dan pembahasan begitu selesai atau waktu habis.',
      },
      {
        question: 'Apakah paket yang sudah dibeli punya masa kedaluwarsa?',
        answer:
          'Tidak, kecuali dinyatakan lain secara jelas sebelum pembelian. Paket yang sudah dibayar bisa diakses selama akunmu aktif dan Zenko tetap mengoperasikan Platform.',
      },
    ],
  },
  {
    id: 'akun-login',
    title: 'Akun & Login',
    items: [
      {
        question: 'Bagaimana cara membuat akun di Zenko?',
        answer:
          'Kamu bisa mendaftar dengan akun Google dalam satu klik, atau mendaftar manual menggunakan email dan kata sandi. Untuk pendaftaran email, kamu perlu memverifikasi alamat email terlebih dahulu sebelum bisa masuk.',
      },
      {
        question: 'Saya lupa kata sandi, bagaimana cara mengatur ulang?',
        answer:
          'Gunakan tautan "Lupa kata sandi" di halaman masuk. Kami akan mengirim tautan reset ke email terdaftar. Jika akunmu dibuat lewat Google, masuk langsung menggunakan tombol Google tanpa memerlukan kata sandi.',
      },
      {
        question: 'Bisakah satu akun dipakai lebih dari satu orang?',
        answer:
          'Tidak. Sesuai Ketentuan Layanan, satu akun hanya boleh digunakan oleh satu orang dan tidak boleh dipindahtangankan atau dibagikan ke pihak lain.',
      },
    ],
  },
  {
    id: 'pembayaran-refund',
    title: 'Pembayaran & Refund',
    items: [
      {
        question: 'Metode pembayaran apa yang tersedia?',
        answer:
          'Zenko menerima pembayaran QRIS yang diproses melalui Duitku, sehingga bisa dibayar dari aplikasi bank maupun e-wallet apa pun yang mendukung QRIS.',
      },
      {
        question: 'Pembayaran saya sudah berhasil, tapi paketnya belum muncul di akun. Bagaimana?',
        answer:
          'Biasanya akses aktif otomatis begitu pembayaran terkonfirmasi. Jika sudah lewat beberapa menit dan paket masih belum muncul di "Paketku", cek status pesanan di Riwayat Pembelian, lalu hubungi kami lewat Pusat Bantuan jika belum juga aktif.',
      },
      {
        question: 'Bagaimana cara mengajukan refund?',
        answer:
          'Refund dapat diajukan untuk keadaan tertentu seperti pembayaran ganda atau kegagalan akses total. Lihat syarat lengkap dan cara pengajuannya di Kebijakan Refund.',
      },
    ],
  },
  {
    id: 'jadi-tutor',
    title: 'Jadi Tutor',
    items: [
      {
        question: 'Bagaimana cara menjadi tutor di Zenko?',
        answer:
          'Ajukan permohonan melalui halaman Jadi Tutor. Tim kami akan meninjau pengajuanmu, biasanya dalam 1 sampai 3 hari kerja, sebelum akses tutor diaktifkan di akun yang sama.',
      },
      {
        question: 'Apa saja yang perlu dipatuhi setelah menjadi tutor?',
        answer:
          'Setiap tutor terikat pada Syarat dan Ketentuan Tutor, yang mengatur kepemilikan konten, standar mutu soal, bagi hasil 70:30, dan jadwal pencairan penghasilan.',
      },
    ],
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: categories.flatMap(category =>
    category.items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  ),
}

useHead({
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(faqJsonLd) }],
})
</script>

<template>
  <main>
    <!-- ==================================================================
         1. Hero
         ================================================================== -->
    <section class="container-page pt-3 md:pt-5">
      <div
        class="dot-grid dot-grid-hero hero-aurora relative overflow-hidden rounded-[26px] px-5 pt-12 pb-16 text-center md:rounded-xl md:px-10 md:pt-16 md:pb-20"
      >
        <div class="relative z-1 mx-auto max-w-160">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-widest text-primary uppercase">
            Pertanyaan umum
          </p>
          <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter">
            Semua yang perlu kamu tahu
            <span class="text-accent mt-1 block">tentang Zenko</span>
          </h1>
          <p class="mx-auto mt-4 max-w-140 text-[1.02rem] text-muted">
            Jawaban singkat seputar cara kerja Zenko, pembayaran, akun, refund,
            dan menjadi tutor. Tidak menemukan jawabannya di sini?
            <NuxtLink to="/pusat-bantuan" class="font-semibold text-primary hover:underline">
              Kunjungi Pusat Bantuan
            </NuxtLink>.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         2. Kategori FAQ
         ================================================================== -->
    <section
      v-for="(category, index) in categories"
      :key="category.id"
      :id="category.id"
      class="pt-14 md:pt-16"
      :class="index === 0 ? 'pt-18 md:pt-22' : ''"
      :aria-labelledby="`${category.id}-heading`"
    >
      <div class="container-page">
        <h2
          :id="`${category.id}-heading`"
          class="mb-6 text-[clamp(1.4rem,2.4vw,1.8rem)] leading-[1.2] tracking-tighter"
        >
          {{ category.title }}
        </h2>

        <div class="mx-auto grid max-w-300 gap-3 rounded-4xl bg-surface-alt p-4 md:p-6">
          <!-- Shared `name` per category makes each group exclusive on its
               own, without JavaScript. -->
          <details
            v-for="item in category.items"
            :key="item.question"
            :name="`faq-${category.id}`"
            class="group rounded-xl border border-hairline bg-surface px-5 py-4 shadow-xs transition-[box-shadow,border-color] duration-300 ease-smooth hover:shadow-lift open:shadow-lift md:px-6 md:py-5"
          >
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-4 font-bold tracking-[-0.02em] [&::-webkit-details-marker]:hidden"
            >
              {{ item.question }}

              <!-- Plus that becomes a minus when open -->
              <span class="relative h-4 w-4 shrink-0" aria-hidden="true">
                <span class="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rounded-pill bg-primary" />
                <span
                  class="absolute top-0 left-1/2 h-4 w-0.5 -translate-x-1/2 rounded-pill bg-primary transition-[opacity,rotate] duration-300 ease-smooth group-open:rotate-90 group-open:opacity-0"
                />
              </span>
            </summary>

            <p class="mt-3 leading-[1.7] text-muted">{{ item.answer }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         3. CTA penutup
         ================================================================== -->
    <section class="py-18 md:py-22" aria-labelledby="cta-heading">
      <div class="container-page">
        <div
          class="panel-inset rounded-[24px] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark px-6 py-12 text-center min-[901px]:rounded-xl min-[901px]:px-15 min-[901px]:py-16"
        >
          <h2 id="cta-heading" class="text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.15] tracking-[-0.04em] text-white">
            Masih ada pertanyaan?
          </h2>
          <p class="mx-auto mt-4 max-w-[52ch] text-[1.02rem] text-white/80">
            Tim Zenko siap membantu lewat Pusat Bantuan atau kontak langsung.
          </p>

          <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
            <AppButton to="/pusat-bantuan" variant="light" size="lg">Pusat Bantuan</AppButton>
            <a
              href="mailto:support@zenkoedu.id"
              class="inline-flex min-h-13 items-center justify-center rounded-xs border border-white/40 px-8 font-semibold text-white transition-[transform,background] duration-200 ease-smooth hover:-translate-y-px hover:bg-white/10 focus-visible:-translate-y-px"
            >
              Hubungi kami
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
