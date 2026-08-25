<script setup lang="ts">
import {
  IconUser,
  IconWallet,
  IconStar,
  IconHandshake,
  IconMail,
} from '#components'

// English file name, Indonesian URL.
definePageMeta({ path: '/pusat-bantuan' })

useHead({
  title: 'Pusat Bantuan | Zenko',
  meta: [
    {
      name: 'description',
      content:
        'Pusat Bantuan Zenko — temukan jawaban seputar akun, pembayaran, refund, paket try out, dan menjadi tutor, atau hubungi tim kami langsung.',
    },
  ],
})

/**
 * A navigation hub, not a document — each card sends the visitor to the
 * relevant FAQ category or dedicated policy page rather than restating any
 * content here.
 */
const categories = [
  {
    icon: IconUser,
    title: 'Akun & Login',
    description: 'Mendaftar, masuk dengan Google atau email, dan mengatur ulang kata sandi.',
    to: '/faq#akun-login',
  },
  {
    icon: IconWallet,
    title: 'Pembayaran & Refund',
    description: 'Metode pembayaran QRIS, status pesanan, dan cara mengajukan refund.',
    to: '/faq#pembayaran-refund',
  },
  {
    icon: IconStar,
    title: 'Paket & Try Out',
    description: 'Cara kerja try out CBT, masa akses paket, dan hasil pengerjaan.',
    to: '/faq#tentang-zenko',
  },
  {
    icon: IconHandshake,
    title: 'Jadi Tutor',
    description: 'Syarat, proses pengajuan, bagi hasil, dan ketentuan tutor.',
    to: '/faq#jadi-tutor',
  },
]

const quickLinks = [
  { label: 'FAQ selengkapnya', to: '/faq' },
  { label: 'Kebijakan Refund', to: '/kebijakan-refund' },
  { label: 'Syarat dan Ketentuan Tutor', to: '/syarat-tutor' },
  { label: 'Jadi Tutor', to: '/jadi-tutor' },
  { label: 'Ketentuan Layanan', to: '/ketentuan-layanan' },
  { label: 'Kebijakan Privasi', to: '/kebijakan-privasi' },
]
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
            Pusat bantuan
          </p>
          <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter">
            Ada yang bisa
            <span class="text-accent mt-1 block">kami bantu?</span>
          </h1>
          <p class="mx-auto mt-4 max-w-140 text-[1.02rem] text-muted">
            Pilih topik di bawah untuk jawaban cepat, atau hubungi tim Zenko
            langsung kalau belum ketemu yang kamu cari.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         2. Kategori bantuan
         ================================================================== -->
    <section class="pt-18 md:pt-22" aria-labelledby="kategori-heading">
      <div class="container-page">
        <h2 id="kategori-heading" class="sr-only">Kategori bantuan</h2>

        <div class="mx-auto grid max-w-300 gap-5 md:grid-cols-2">
          <NuxtLink
            v-for="category in categories"
            :key="category.title"
            :to="category.to"
            class="group rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
          >
            <span
              class="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <component :is="category.icon" class="h-6 w-6" />
            </span>
            <h3 class="mt-4 mb-2 text-[1.15rem] font-bold tracking-[-0.03em]">
              {{ category.title }}
            </h3>
            <p class="leading-[1.62] text-muted">{{ category.description }}</p>
            <span class="mt-4 inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-primary">
              Lihat jawaban
              <IconArrowRight class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         3. Tautan cepat
         ================================================================== -->
    <section class="pt-18 md:pt-22" aria-labelledby="tautan-heading">
      <div class="container-page">
        <div class="mx-auto max-w-300 rounded-[32px] bg-surface-alt p-6 md:p-8">
          <h2 id="tautan-heading" class="mb-5 text-[1.2rem] font-bold tracking-[-0.03em]">
            Tautan cepat
          </h2>
          <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="link in quickLinks" :key="link.to">
              <NuxtLink
                :to="link.to"
                class="flex items-center gap-2 rounded-lg px-3 py-2.5 font-semibold text-ink transition-colors duration-200 hover:bg-surface hover:text-primary"
              >
                <IconLink class="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         4. Kontak langsung
         ================================================================== -->
    <section class="py-18 md:py-22" aria-labelledby="kontak-heading">
      <div class="container-page">
        <div
          class="panel-inset rounded-[24px] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark px-6 py-12 text-center min-[901px]:rounded-xl min-[901px]:px-15 min-[901px]:py-16"
        >
          <h2 id="kontak-heading" class="text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.15] tracking-[-0.04em] text-white">
            Belum ketemu jawabannya?
          </h2>
          <p class="mx-auto mt-4 max-w-[52ch] text-[1.02rem] text-white/80">
            Kirim email atau hubungi WhatsApp tim Zenko. Kami melayani
            Senin&ndash;Jumat, 09.00&ndash;17.00 WIB, dan biasanya membalas dalam
            1&ndash;2 hari kerja.
          </p>

          <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:artenanagara22@gmail.com"
              class="inline-flex min-h-13 items-center gap-2 rounded-xs bg-surface px-8 font-bold text-primary shadow-[0_8px_20px_rgba(12,40,100,0.18)] transition-[transform] duration-200 ease-smooth hover:-translate-y-px"
            >
              <IconMail class="h-4.5 w-4.5" aria-hidden="true" />
              artenanagara22@gmail.com
            </a>
            <a
              href="tel:+628220840196"
              class="inline-flex min-h-13 items-center justify-center rounded-xs border border-white/40 px-8 font-semibold text-white transition-[transform,background] duration-200 ease-smooth hover:-translate-y-px hover:bg-white/10 focus-visible:-translate-y-px"
            >
              0822-0840-196
            </a>
          </div>

          <!-- Identitas penyelenggara ikut disebut di kanal bantuan, bukan
               hanya di halaman legal: pembeli (dan reviewer payment gateway)
               harus bisa memastikan siapa yang mereka hubungi. -->
          <p class="mx-auto mt-8 max-w-[60ch] border-t border-white/15 pt-6 text-[0.88rem] leading-[1.7] text-white/70">
            Zenko diselenggarakan oleh <strong class="font-semibold text-white">PT Zenko Edukasi Digital</strong>,
            Klaten, Jawa Tengah, Indonesia. Pembayaran diproses melalui QRIS oleh
            <strong class="font-semibold text-white">Duitku</strong>. Zenko tidak pernah
            meminta PIN, OTP, atau kata sandi lewat email maupun telepon.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
