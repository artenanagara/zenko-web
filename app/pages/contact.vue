<script setup lang="ts">
import { SUPPORT_CONTACT, supportMailto } from '~/data/support-contact'

// English file name, Indonesian URL.
definePageMeta({ path: '/kontak' })

useSeoMeta({
  title: 'Kontak Kami | Zenko',
  description:
    'Hubungi tim Zenko lewat WhatsApp atau email untuk pertanyaan seputar paket, pembayaran, akun, atau pengajuan tutor.',
  ogTitle: 'Kontak Kami | Zenko',
  ogDescription:
    'Hubungi tim Zenko lewat WhatsApp atau email untuk pertanyaan seputar paket, pembayaran, akun, atau pengajuan tutor.',
  ...DEFAULT_OG,
  ogUrl: 'https://zenkoedu.id/kontak',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/kontak' }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(useOrganizationSchema()) }],
})

/**
 * Dua kanal yang benar-benar dipantau tim Zenko (SUPPORT_CONTACT), bukan
 * formulir baru — belum ada endpoint pesan kontak di zenko-api, jadi halaman
 * ini mengarahkan ke WhatsApp dan email yang sudah berjalan.
 */
const channels = [
  {
    icon: 'whatsapp-logo',
    title: 'WhatsApp',
    description: `Balasan tercepat, terutama untuk urusan pesanan dan pembayaran. Jam layanan ${SUPPORT_CONTACT.hours}.`,
    label: SUPPORT_CONTACT.phoneDisplay,
    href: SUPPORT_CONTACT.whatsappUrl,
    external: true,
  },
  {
    icon: 'envelope-simple',
    title: 'Email',
    description: 'Cocok untuk pertanyaan yang lebih panjang atau perlu lampiran, seperti bukti pembayaran.',
    label: SUPPORT_CONTACT.email,
    href: supportMailto(),
    external: false,
  },
] as const

const quickLinks = [
  { label: 'Pusat Bantuan', to: '/pusat-bantuan' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Jadi Tutor', to: '/jadi-tutor' },
  { label: 'Untuk Bimbel', to: '/untuk-bimbel' },
] as const
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
            Kontak
          </p>
          <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter">
            Ada yang ingin
            <span class="text-accent mt-1 block">kamu tanyakan?</span>
          </h1>
          <p class="mx-auto mt-4 max-w-140 text-[1.02rem] text-muted">
            Tim Zenko siap membantu soal paket, pembayaran, akun, atau
            pengajuan tutor. Pertanyaan umum juga sudah kami rangkum di
            <NuxtLink to="/pusat-bantuan" class="font-semibold text-primary hover:underline">
              Pusat Bantuan
            </NuxtLink>.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         2. Kanal kontak
         ================================================================== -->
    <section class="pt-18 md:pt-22" aria-labelledby="kanal-heading">
      <div class="container-page">
        <div class="mx-auto max-w-300">
          <h2 id="kanal-heading" class="sr-only">Kanal kontak</h2>

          <div class="grid gap-5 sm:grid-cols-2">
            <a
              v-for="channel in channels"
              :key="channel.title"
              :href="channel.href"
              v-bind="channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}"
              class="group flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
            >
              <span
                class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-linear-to-b from-primary-light to-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_rgba(47,111,235,0.22)]"
                aria-hidden="true"
              >
                <AppIcon :name="channel.icon" :size="24" />
              </span>

              <h3 class="mt-5 mb-2 text-[1.2rem] font-bold tracking-[-0.03em]">{{ channel.title }}</h3>
              <p class="leading-[1.62] text-muted">{{ channel.description }}</p>

              <span class="mt-5 inline-flex items-center gap-1.5 font-semibold text-primary">
                {{ channel.label }}
                <AppIcon
                  name="arrow-right"
                  :size="16"
                  class="transition-transform duration-200 ease-smooth group-hover:translate-x-1"
                />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         3. Tautan cepat
         ================================================================== -->
    <section class="pt-14 md:pt-16" aria-labelledby="tautan-heading">
      <div class="container-page">
        <div class="mx-auto max-w-300 rounded-[32px] bg-surface-alt p-6 md:p-8">
          <h2 id="tautan-heading" class="mb-5 text-[1.2rem] font-bold tracking-[-0.03em]">
            Tautan cepat
          </h2>
          <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <li v-for="link in quickLinks" :key="link.to">
              <NuxtLink
                :to="link.to"
                class="flex items-center gap-2 rounded-lg px-3 py-2.5 font-semibold text-ink transition-colors duration-200 hover:bg-surface hover:text-primary"
              >
                <AppIcon name="link" :size="16" class="shrink-0 text-primary" aria-hidden="true" />
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         4. Identitas penyelenggara — sama seperti Pusat Bantuan dan halaman
         legal, supaya pembeli dan reviewer payment gateway bisa memastikan
         siapa yang mereka hubungi di halaman kontak resmi.
         ================================================================== -->
    <section class="py-18 md:py-22" aria-labelledby="identitas-heading">
      <div class="container-page">
        <div
          class="panel-inset mx-auto max-w-300 rounded-[24px] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark px-6 py-12 text-center min-[901px]:rounded-xl min-[901px]:px-15 min-[901px]:py-16"
        >
          <span
            class="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/15 text-white"
            aria-hidden="true"
          >
            <AppIcon name="buildings" :size="24" />
          </span>

          <h2 id="identitas-heading" class="mt-5 text-[clamp(1.6rem,2.6vw,2.1rem)] leading-[1.2] tracking-[-0.03em] text-white">
            PT Zenko Edukasi Digital
          </h2>
          <p class="mx-auto mt-3 max-w-[56ch] text-[1rem] leading-[1.7] text-white/80">
            Berkedudukan di Klaten, Jawa Tengah, Indonesia. Pembayaran QRIS
            Zenko diproses melalui iPaymu dan saat ini masih dalam proses
            aktivasi.
          </p>
          <p class="mx-auto mt-6 max-w-[60ch] border-t border-white/15 pt-6 text-[0.88rem] leading-[1.7] text-white/70">
            Zenko tidak pernah meminta PIN, OTP, atau kata sandi lewat email,
            telepon, maupun WhatsApp.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
