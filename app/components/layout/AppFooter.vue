<script setup lang="ts">
import type { Category } from '#shared/types/catalog'
import { SUPPORT_CONTACT, supportMailto } from '~/data/support-contact'

const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

/**
 * Halaman yang ingin ditutup dengan ajakan belajar menyalakan
 * `definePageMeta({ footerCta: true })`. Ajakan itu tinggal di dalam footer,
 * bukan section sendiri di atasnya: dua blok berat yang dipisah pita putih
 * (padding section + margin footer) terbaca sebagai dua akhir halaman.
 */
const route = useRoute()
const showCta = computed(() => !props.compact && route.meta.footerCta === true)

type FooterLink = {
  label: string
  to: string
}

type FooterColumn = {
  title: string
  links: FooterLink[]
}

/**
 * Jenis ujian di kolom "Paket". Tautannya menunjuk halaman kategori
 * (`/kategori/:slug`) begitu kategori itu punya paket live: halaman itulah
 * target SEO per ujian, dan footer tampil di setiap halaman — tautan internal
 * terkuat yang dimiliki situs. Kategori yang belum punya paket jatuh ke
 * pencarian katalog (`q`), karena `/kategori/:slug` untuk kategori kosong
 * adalah 404.
 */
const examLinks = [
  { label: 'CPNS / SKD', category: 'SKD', q: 'SKD' },
  { label: 'PPPK', category: 'PPPK', q: 'PPPK' },
  { label: 'UTBK-SNBT', category: 'UTBK-SNBT', q: 'UTBK SNBT' },
  { label: 'TKA', category: 'TKA', q: 'TKA' },
  { label: 'Rekrutmen BUMN', category: 'Rekrutmen BUMN', q: 'BUMN' },
]

const { public: config } = useRuntimeConfig()
const { data: categories } = await useFetch<Category[]>('/categories', {
  baseURL: config.apiBase,
  key: 'footer-categories',
  default: () => [],
})

const columns = computed<FooterColumn[]>(() => {
  const liveSlugs = new Set(categories.value.filter(item => item.count > 0).map(item => item.slug))
  return [
    {
      title: 'Paket',
      links: [
        ...examLinks.map(({ label, category, q }) => {
          const slug = categorySlug(category)
          return {
            label,
            to: liveSlugs.has(slug) ? `/kategori/${slug}` : `/paket?${new URLSearchParams({ q })}`,
          }
        }),
        { label: 'Semua paket', to: '/paket' },
      ],
    },
    {
      title: 'Zenko',
      links: [
        { label: 'Tentang Kami', to: '/tentang' },
        { label: 'Cara Kerja', to: '/#cara-kerja' },
        { label: 'Artikel', to: '/artikel' },
      ],
    },
    {
      // Rekrutmen dipisah dari info perusahaan: pembacanya berbeda.
      title: 'Mengajar di Zenko',
      links: [
        { label: 'Jadi Tutor', to: '/jadi-tutor' },
        { label: 'Syarat Tutor', to: '/syarat-tutor' },
        { label: 'Untuk Bimbel', to: '/untuk-bimbel' },
      ],
    },
    {
      title: 'Bantuan',
      links: [
        { label: 'Pusat Bantuan', to: '/pusat-bantuan' },
        { label: 'FAQ', to: '/faq' },
        { label: 'Kebijakan Refund', to: '/kebijakan-refund' },
      ],
    },
  ]
})

const year = new Date().getFullYear()
</script>

<template>
  <footer
    class="flow-root bg-[#07172f] text-white"
    :class="compact ? 'mt-12' : showCta ? '' : 'mt-20'"
  >
    <!-- Ajakan penutup untuk siswa, menyatu dengan footer. Tanpa margin atas:
         jarak dari section sebelumnya cukup padding section itu sendiri. -->
    <div v-if="showCta" class="border-b border-white/12">
      <!-- Urutan DOM = urutan bertumpuk di layar kecil: pesan, tombol utama,
           baru ajakan tutor. Di lg tombol pindah ke kanan (dua baris) dan
           ajakan tutor jatuh ke baris kedua kolom kiri. -->
      <section
        class="container-page grid gap-y-7 py-14 md:py-18 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-12 lg:gap-y-6"
        aria-labelledby="footer-cta-heading"
      >
        <div>
          <h2
            id="footer-cta-heading"
            class="max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.12] tracking-[-0.04em] text-balance text-white"
          >
            Sudah tahu ujian yang kamu tuju?
            <span class="text-accent mt-0.5 block text-[#8fb4ff]">Yuk, mulai latihan.</span>
          </h2>
          <p class="mt-4 max-w-[48ch] text-[1rem] leading-[1.7] text-white/68">
            Temukan latihan yang pas, ukur kemampuanmu, lalu fokus ke materi yang masih perlu dikejar.
          </p>
        </div>

        <div class="flex flex-col items-start gap-3 lg:row-span-2 lg:items-end lg:self-end">
          <AppButton to="/paket" size="lg">
            Temukan latihan
            <IconArrowRight class="h-4 w-4" />
          </AppButton>
          <p class="text-[0.85rem] text-white/52">
            Coba 5 soal gratis di halaman paket, tanpa daftar.
          </p>
        </div>

        <p class="text-[0.9rem] text-white/52">
          Punya bank soal sendiri?
          <NuxtLink
            to="/jadi-tutor"
            class="inline-flex items-center gap-1.5 font-semibold text-white/85 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline"
          >
            Jadi tutor di Zenko
            <IconArrowRight class="h-3.5 w-3.5" />
          </NuxtLink>
        </p>
      </section>
    </div>

    <!-- Account pages keep a compact brand row; public pages show the complete
         menu requested for the marketplace. -->
    <div v-if="compact" class="container-page flex flex-wrap items-center justify-between gap-x-8 gap-y-5 py-8">
      <BrandMark
        theme="dark"
        img-class="h-9 w-auto object-contain"
        aria-label="Zenko"
      />
      <!-- Halaman akun tidak memuat menu lengkap, tapi jalan ke bantuan
           tetap harus ada di sini: di sinilah pesanan dan ujian dikerjakan. -->
      <nav aria-label="Bantuan">
        <ul class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.88rem]">
          <li>
            <NuxtLink to="/pusat-bantuan" class="text-white/68 transition-colors duration-200 hover:text-white">
              Pusat Bantuan
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/faq" class="text-white/68 transition-colors duration-200 hover:text-white">
              FAQ
            </NuxtLink>
          </li>
          <li>
            <a
              :href="SUPPORT_CONTACT.whatsappUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white/68 transition-colors duration-200 hover:text-white"
            >
              WhatsApp {{ SUPPORT_CONTACT.phoneDisplay }}
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <div v-else class="container-page pb-8 md:pb-10">
      <!-- Brand dan kontak di kiri; empat grup menu mengikuti dengan ritme
           sama. Di tablet brand mengambil satu baris penuh supaya empat kolom
           menu tidak berdesakan di sampingnya. -->
      <div class="grid gap-8 pt-10 md:grid-cols-4 md:gap-x-9 md:gap-y-10 md:pt-12 lg:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))] lg:gap-x-10 lg:pt-14">
        <div class="max-w-95 md:col-span-4 lg:col-span-1 lg:pr-4">
          <BrandMark
            theme="dark"
            img-class="h-10 w-auto object-contain md:h-11"
            aria-label="Zenko"
          />
          <p class="mt-4 text-[0.88rem] leading-[1.7] text-white/60 md:mt-5 md:text-[0.9rem]">
            Tempat menemukan latihan untuk berbagai tujuan ujian. Siswa belajar lewat simulasi, sementara tutor dan bimbel membagikan keahliannya.
          </p>

          <!-- Kontak ditulis terang-terangan, bukan disembunyikan di balik
               menu: pembeli dan reviewer merchant sama-sama mencarinya. -->
          <ul class="mt-6 grid gap-2.5 text-[0.9rem]" aria-label="Kontak Zenko">
            <li>
              <a
                :href="SUPPORT_CONTACT.whatsappUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2.5 text-white/75 transition-colors duration-200 hover:text-white"
              >
                <IconWhatsapp class="h-4.5 w-4.5 shrink-0 text-white/50" />
                WhatsApp {{ SUPPORT_CONTACT.phoneDisplay }}
              </a>
            </li>
            <li>
              <a
                :href="supportMailto()"
                class="inline-flex items-center gap-2.5 text-white/75 transition-colors duration-200 hover:text-white"
              >
                <IconMail class="h-4.5 w-4.5 shrink-0 text-white/50" />
                {{ SUPPORT_CONTACT.email }}
              </a>
            </li>
          </ul>
          <p class="mt-2.5 text-[0.8rem] text-white/45">
            Jam layanan {{ SUPPORT_CONTACT.hours }}
          </p>
        </div>

        <nav
          v-for="column in columns"
          :key="`desktop-${column.title}`"
          class="hidden md:block"
          :aria-label="column.title"
        >
          <h2 class="text-[1rem] font-semibold tracking-[-0.02em] text-white/92">
            {{ column.title }}
          </h2>
          <ul class="mt-4 grid gap-3">
            <li v-for="link in column.links" :key="link.label">
              <NuxtLink
                :to="link.to"
                class="text-[0.94rem] text-white/68 transition-colors duration-200 hover:text-white"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <div class="border-t border-white/10 md:hidden">
          <details
            v-for="column in columns"
            :key="`mobile-${column.title}`"
            class="group border-b border-white/10"
          >
            <summary
              class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-[0.95rem] font-semibold text-white [&::-webkit-details-marker]:hidden"
            >
              {{ column.title }}
              <IconChevron
                aria-hidden="true"
                class="h-4 w-4 shrink-0 -rotate-90 text-white/45 transition-transform duration-200 group-open:rotate-0"
              />
            </summary>
            <ul class="grid gap-3 pb-5">
              <li v-for="link in column.links" :key="link.label">
                <NuxtLink
                  :to="link.to"
                  class="block py-0.5 text-[0.9rem] text-white/66 transition-colors duration-200 hover:text-white"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </details>
        </div>
      </div>
    </div>

    <!-- Legal and social links intentionally form the lowest row, matching
         the reference and keeping them separate from the navigation menu. -->
    <div class="border-t border-white/12">
      <div
        class="container-page grid gap-4 py-6 text-[0.82rem] text-white/52 sm:grid-cols-[1fr_auto] sm:items-center lg:grid-cols-[1fr_auto_1fr]"
      >
        <!-- Badan hukum penyelenggara disebut di sini, bukan hanya di
             halaman legal, supaya identitas usaha terlihat di setiap halaman
             (dicek saat review merchant payment gateway). -->
        <p>&copy; {{ year }} PT Zenko Edukasi Digital</p>

        <nav aria-label="Dokumen legal" class="sm:justify-self-end lg:justify-self-center">
          <ul class="flex flex-wrap items-center gap-x-3 gap-y-2">
            <li>
              <NuxtLink to="/ketentuan-layanan" class="transition-colors hover:text-white">
                Ketentuan Layanan
              </NuxtLink>
            </li>
            <li aria-hidden="true" class="text-white/24">&bull;</li>
            <li>
              <NuxtLink to="/kebijakan-privasi" class="transition-colors hover:text-white">
                Kebijakan Privasi
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <ul
          class="flex items-center gap-2 sm:col-span-2 sm:justify-self-end lg:col-span-1"
          aria-label="Media sosial Zenko"
        >
          <li>
            <a
              href="https://www.instagram.com/zenkoedu.id"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Zenko di Instagram"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 text-white/60 transition-[background,border-color,color] duration-200 hover:border-white/25 hover:bg-white/8 hover:text-white"
            >
              <IconInstagram class="h-4 w-4" />
            </a>
          </li>
          <li>
            <a
              href="https://www.tiktok.com/@zenkoedu.id"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Zenko di TikTok"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 text-white/60 transition-[background,border-color,color] duration-200 hover:border-white/25 hover:bg-white/8 hover:text-white"
            >
              <IconTiktok class="h-4 w-4" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>
