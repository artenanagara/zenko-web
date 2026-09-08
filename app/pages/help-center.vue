<script setup lang="ts">
import {
  IconUser,
  IconWallet,
  IconTarget,
  IconHandshake,
  IconUsers,
  IconSettings,
  IconSearch,
  IconArrowRight,
  IconLink,
  IconMail,
  IconRocket,
} from '#components'
import { helpArticles, helpCategories, type HelpArticle, type HelpCategoryIcon, type HelpRole } from '~/data/help-center'

// English file name, Indonesian URL.
definePageMeta({ path: '/pusat-bantuan' })

useSeoMeta({
  title: 'Pusat Bantuan | Zenko',
  description:
    'Pusat Bantuan Zenko — panduan langkah demi langkah seputar akun, pembayaran, ujian CBT, portal tutor, dan bimbel, atau hubungi tim kami langsung.',
  ogTitle: 'Pusat Bantuan | Zenko',
  ogDescription:
    'Pusat Bantuan Zenko — panduan langkah demi langkah seputar akun, pembayaran, ujian CBT, portal tutor, dan bimbel, atau hubungi tim kami langsung.',
  ogImage: 'https://zenkoedu.id/brand/zenko-lockup-horizontal-blue.png',
  ogUrl: 'https://zenkoedu.id/pusat-bantuan',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/pusat-bantuan' }],
})

const categoryIcons: Record<HelpCategoryIcon, unknown> = {
  user: IconUser,
  wallet: IconWallet,
  target: IconTarget,
  handshake: IconHandshake,
  users: IconUsers,
  settings: IconSettings,
}

interface RoleTab {
  value: 'semua' | HelpRole
  label: string
}

const roleTabs: RoleTab[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'siswa', label: 'Siswa' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'bimbel', label: 'Bimbel & Institusi' },
]

const activeRole = ref<RoleTab['value']>('semua')

const visibleCategories = computed(() =>
  helpCategories
    .map(category => ({
      ...category,
      articles: helpArticles.filter(
        article =>
          article.categorySlug === category.slug
          && (activeRole.value === 'semua' || article.roles.includes(activeRole.value as HelpRole)),
      ),
    }))
    .filter(category => category.articles.length > 0),
)

// ------------------------------------------------------------------------
// Bilah pencarian: daftar saran instan sambil mengetik, tanpa panggilan API
// — seluruh 28 artikel sudah ada di client lewat data/help-center.
// ------------------------------------------------------------------------
const searchQuery = ref('')
const searchFocused = ref(false)

const searchResults = computed<HelpArticle[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []
  return helpArticles
    .filter(
      article =>
        article.title.toLowerCase().includes(query)
        || article.summary.toLowerCase().includes(query)
        || (article.keywords ?? []).some(keyword => keyword.toLowerCase().includes(query)),
    )
    .slice(0, 8)
})

const showSuggestions = computed(() => searchFocused.value && searchQuery.value.trim().length > 0)

function categoryTitleFor(article: HelpArticle) {
  return helpCategories.find(category => category.slug === article.categorySlug)?.title ?? ''
}

// Delay menutup dropdown supaya klik pada hasil sempat terdaftar sebelum
// blur menyembunyikannya.
function onSearchBlur() {
  setTimeout(() => {
    searchFocused.value = false
  }, 150)
}

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
         1. Hero + pencarian
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
            Cari panduan langkah demi langkah di bawah, atau hubungi tim Zenko
            langsung kalau belum ketemu yang kamu cari.
          </p>

          <div class="relative mx-auto mt-8 max-w-130 text-left">
            <IconSearch class="pointer-events-none absolute top-1/2 left-4.5 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari, misalnya “ganti rekening” atau “qris tertunda”"
              class="h-13 w-full rounded-xl border border-hairline bg-surface pr-4.5 pl-12 text-[0.95rem] text-ink shadow-xs transition-[box-shadow,border-color] duration-200 ease-smooth placeholder:text-muted focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none"
              @focus="searchFocused = true"
              @blur="onSearchBlur"
            >

            <!-- Daftar saran instan -->
            <div
              v-if="showSuggestions"
              class="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 max-h-100 overflow-y-auto rounded-xl border border-hairline bg-surface p-2 text-left shadow-lift"
            >
              <template v-if="searchResults.length">
                <NuxtLink
                  v-for="result in searchResults"
                  :key="result.slug"
                  :to="`/pusat-bantuan/${result.slug}`"
                  class="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-surface-alt"
                >
                  <span class="min-w-0">
                    <span class="block truncate font-semibold text-ink">{{ result.title }}</span>
                    <span class="mt-0.5 block text-[0.8rem] text-muted">{{ categoryTitleFor(result) }}</span>
                  </span>
                  <span
                    v-if="result.comingSoon"
                    class="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-pill bg-purple-50 px-2 py-0.5 text-[0.68rem] font-bold text-purple-700"
                  >
                    Segera Hadir
                  </span>
                </NuxtLink>
              </template>
              <p v-else class="px-3 py-2.5 text-[0.9rem] text-muted">
                Tidak ada panduan yang cocok. Coba kata kunci lain.
              </p>
            </div>
          </div>

          <!-- Filter peran -->
          <div class="mt-6 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Filter berdasarkan peran">
            <button
              v-for="tab in roleTabs"
              :key="tab.value"
              type="button"
              role="tab"
              :aria-selected="activeRole === tab.value"
              class="rounded-pill px-4 py-2 text-[0.86rem] font-semibold transition-colors duration-200 ease-smooth"
              :class="
                activeRole === tab.value
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface text-muted hover:text-ink'
              "
              @click="activeRole = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         2. Kategori dan artikel panduan
         ================================================================== -->
    <section
      v-for="(category, index) in visibleCategories"
      :key="category.slug"
      class="pt-16 md:pt-20"
      :class="index === 0 ? 'pt-20 md:pt-24' : 'border-t border-line/60'"
      :aria-labelledby="`${category.slug}-heading`"
    >
      <div class="container-page">
        <div class="mx-auto max-w-300">
          <div class="mb-9 flex items-start gap-4">
            <span
              class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <component :is="categoryIcons[category.icon]" class="h-5.5 w-5.5" />
            </span>
            <div class="pt-0.5">
              <h2 :id="`${category.slug}-heading`" class="text-[clamp(1.3rem,2.2vw,1.6rem)] leading-[1.2] tracking-tighter">
                {{ category.title }}
              </h2>
              <p class="mt-1.5 leading-[1.6] text-muted">{{ category.description }}</p>
            </div>
          </div>

          <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <NuxtLink
              v-for="article in category.articles"
              :key="article.slug"
              :to="`/pusat-bantuan/${article.slug}`"
              class="group flex flex-col rounded-2xl border border-hairline bg-surface p-7 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift"
            >
              <div class="mb-2.5 flex items-start justify-between gap-3">
                <h3 class="leading-[1.4] font-bold tracking-[-0.02em]">
                  {{ article.title }}
                </h3>
                <span
                  v-if="article.comingSoon"
                  class="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-pill bg-purple-50 px-2.5 py-1 text-[0.68rem] font-bold text-purple-700"
                >
                  <IconRocket class="h-3 w-3" />
                  Segera Hadir
                </span>
              </div>
              <p class="grow text-[0.9rem] leading-[1.7] text-muted">{{ article.summary }}</p>
              <span class="mt-5 inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-primary">
                Baca panduan
                <IconArrowRight class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </NuxtLink>
          </div>
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
              href="mailto:support@zenkoedu.id"
              class="inline-flex min-h-13 items-center gap-2 rounded-xs bg-surface px-8 font-bold text-primary shadow-[0_8px_20px_rgba(12,40,100,0.18)] transition-[transform] duration-200 ease-smooth hover:-translate-y-px"
            >
              <IconMail class="h-4.5 w-4.5" aria-hidden="true" />
              support@zenkoedu.id
            </a>
            <a
              href="tel:+6288227663468"
              class="inline-flex min-h-13 items-center justify-center rounded-xs border border-white/40 px-8 font-semibold text-white transition-[transform,background] duration-200 ease-smooth hover:-translate-y-px hover:bg-white/10 focus-visible:-translate-y-px"
            >
              0882-2766-3468
            </a>
          </div>

          <!-- Identitas penyelenggara ikut disebut di kanal bantuan, bukan
               hanya di halaman legal: pembeli (dan reviewer payment gateway)
               harus bisa memastikan siapa yang mereka hubungi. -->
          <p class="mx-auto mt-8 max-w-[60ch] border-t border-white/15 pt-6 text-[0.88rem] leading-[1.7] text-white/70">
            Zenko diselenggarakan oleh <strong class="font-semibold text-white">PT Zenko Edukasi Digital</strong>,
            Klaten, Jawa Tengah, Indonesia. Pembayaran diproses melalui QRIS oleh
            <strong class="font-semibold text-white">DOKU</strong>. Zenko tidak pernah
            meminta PIN, OTP, atau kata sandi lewat email maupun telepon.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
