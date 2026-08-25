<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

type FooterLink = {
  label: string
  to: string
}

type FooterColumn = {
  title: string
  links: FooterLink[]
}

/**
 * Search links use the catalogue's existing `q` query. They stay useful even
 * when the API introduces a new category label or changes its category slug.
 */
const columns: FooterColumn[] = [
  {
    title: 'Paket',
    links: [
      { label: 'CPNS / SKD', to: '/paket?q=SKD' },
      { label: 'Kedinasan', to: '/paket?q=Kedinasan' },
      { label: 'BUMN', to: '/paket?q=BUMN' },
      { label: 'SNBT', to: '/paket?q=SNBT' },
      { label: 'TKA', to: '/paket?q=TKA' },
    ],
  },
  {
    title: 'Tentang Zenko',
    links: [
      { label: 'Cara Kerja', to: '/#cara-kerja' },
      { label: 'Tentang Kami', to: '/tentang' },
      { label: 'Jadi Tutor', to: '/jadi-tutor' },
      { label: 'Syarat Tutor', to: '/syarat-tutor' },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'Pusat Bantuan', to: '/pusat-bantuan' },
      { label: 'Hubungi Kami', to: 'mailto:artenanagara22@gmail.com' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Kebijakan Refund', to: '/kebijakan-refund' },
    ],
  },
]

const year = new Date().getFullYear()
</script>

<template>
  <footer
    class="flow-root bg-[#07172f] text-white"
    :class="compact ? 'mt-12' : 'mt-20'"
  >
    <!-- Account pages keep a compact brand row; public pages show the complete
         menu requested for the marketplace. -->
    <div v-if="compact" class="container-page py-8">
      <BrandMark
        theme="dark"
        img-class="h-9 w-auto object-contain"
        aria-label="Zenko"
      />
    </div>

    <div v-else class="container-page pb-8 md:pb-10">
      <!-- Brand anchors the left edge; the three menu groups follow with equal
           rhythm. Future content destinations are reserved now. -->
      <div class="hidden grid-cols-[1.25fr_repeat(3,minmax(0,1fr))] gap-9 pt-12 md:grid lg:gap-14 lg:pt-14">
        <div class="max-w-90 pr-4">
          <BrandMark
            theme="dark"
            img-class="h-11 w-auto object-contain"
            aria-label="Zenko"
          />
          <p class="mt-5 text-[0.9rem] leading-[1.7] text-white/60">
            Platform try out interaktif terkurasi untuk persiapan SKD CPNS, Rekrutmen BUMN, SNBT UTBK, dan Tes Kedinasan. Beli per paket, akses langsung, tanpa langganan.
          </p>
        </div>

        <nav
          v-for="column in columns"
          :key="`desktop-${column.title}`"
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
      </div>

      <div class="pt-10 md:hidden">
        <BrandMark
          theme="dark"
          img-class="h-10 w-auto object-contain"
          aria-label="Zenko"
        />
        <p class="mt-4 max-w-95 text-[0.88rem] leading-[1.7] text-white/60">
          Platform try out interaktif terkurasi untuk persiapan SKD CPNS, Rekrutmen BUMN, SNBT UTBK, dan Tes Kedinasan. Beli per paket, akses langsung, tanpa langganan.
        </p>

        <div class="mt-7 border-t border-white/10">
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
