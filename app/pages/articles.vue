<script setup lang="ts">
import type { Article } from '#shared/types/article'

// English file name, Indonesian URL — same convention as help-center.vue.
// Kept as a flat file rather than pages/artikel/index.vue so it does not
// become the parent route of article.vue, which has no <NuxtPage /> outlet.
definePageMeta({ path: '/artikel' })

const TITLE = 'Artikel & Tips Persiapan Ujian | Zenko'
const DESCRIPTION
  = 'Panduan strategi belajar, pembahasan pola soal, dan tips persiapan SKD CPNS, '
    + 'UTBK-SNBT, serta ujian lainnya — ditulis tim dan tutor Zenko.'
const PAGE_URL = 'https://zenkoedu.id/artikel'

useSeoMeta({
  title: TITLE,
  description: DESCRIPTION,
  ogTitle: TITLE,
  ogDescription: DESCRIPTION,
  ...DEFAULT_OG,
  ogUrl: PAGE_URL,
  twitterCard: 'summary_large_image',
})

const { data: articles, pending, error } = usePublishedArticles()

useHead({
  link: [{ rel: 'canonical', href: PAGE_URL }],
  script: [{
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      'name': 'Artikel Zenko',
      'description': DESCRIPTION,
      'url': PAGE_URL,
      'blogPost': (articles.value ?? []).slice(0, 20).map(article => ({
        '@type': 'BlogPosting',
        'headline': article.title,
        'url': `${PAGE_URL}/${article.slug}`,
        'datePublished': article.publishedAt ?? article.createdAt,
        'author': { '@type': 'Person', name: article.authorName || 'Tim Zenko' },
      })),
    })),
  }],
})

// --------------------------------------------------------------------------
// Penyaringan: kategori ikut ke URL supaya tautannya bisa dibagikan dan
// tombol back mengembalikan pilihan; pencarian tinggal di client karena
// seluruh daftar artikel sudah ada di sini (isinya sudah dipangkas API).
// --------------------------------------------------------------------------
const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const activeCategory = computed(() => String(route.query.kategori ?? ''))

interface CategoryChip {
  slug: string
  name: string
  count: number
}

const categories = computed<CategoryChip[]>(() => {
  const counted = new Map<string, CategoryChip>()
  for (const article of articles.value ?? []) {
    const name = article.categoryName.trim()
    if (!name) continue
    const slug = categorySlug(name)
    const existing = counted.get(slug)
    if (existing) existing.count += 1
    else counted.set(slug, { slug, name, count: 1 })
  }
  return [...counted.values()].sort((a, b) => a.name.localeCompare(b.name, 'id'))
})

const filtered = computed<Article[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return (articles.value ?? []).filter((article) => {
    if (activeCategory.value && categorySlug(article.categoryName) !== activeCategory.value) return false
    if (!query) return true
    return `${article.title} ${article.subtitle} ${article.categoryName}`.toLowerCase().includes(query)
  })
})

/**
 * The newest article gets a wide card of its own, but only on the unfiltered
 * view: inside a filter or a search the reader is looking for a specific
 * article, and singling one out just makes the list harder to scan.
 */
const isBrowsingAll = computed(() => !activeCategory.value && !searchQuery.value.trim())
const featured = computed(() => (isBrowsingAll.value ? filtered.value[0] : undefined))
const rest = computed(() => (featured.value ? filtered.value.slice(1) : filtered.value))

function selectCategory(slug: string) {
  // `replace` rather than `push`: filtering is not a destination, and a back
  // button that walks through every chip the reader tried is a nuisance.
  router.replace({ query: slug ? { kategori: slug } : {} })
}

/** The API sends category names, not slugs, so the query value is derived. */
function categorySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
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
            Artikel Zenko
          </p>
          <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter">
            Strategi belajar yang
            <span class="text-accent mt-1 block">terbukti di ruang ujian</span>
          </h1>
          <p class="mx-auto mt-4 max-w-140 text-[1.02rem] text-muted">
            Pembahasan pola soal, cara membaca hasil tryout, dan persiapan
            menjelang hari ujian — ditulis tim dan tutor Zenko.
          </p>

          <div class="relative mx-auto mt-8 max-w-130 text-left">
            <label for="article-search" class="sr-only">Cari artikel</label>
            <AppIcon
              name="magnifying-glass"
              :size="18"
              class="pointer-events-none absolute top-1/2 left-4.5 -translate-y-1/2 text-muted"
            />
            <input
              id="article-search"
              v-model="searchQuery"
              type="search"
              placeholder="Cari, misalnya “TKP” atau “memilih jurusan”"
              class="h-13 w-full rounded-xl border border-hairline bg-surface pr-4.5 pl-12 text-[0.95rem] text-ink shadow-xs transition-[box-shadow,border-color] duration-200 ease-smooth placeholder:text-muted focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none"
            >
          </div>

          <!-- Tombol filter (aria-pressed), bukan tab: tidak ada panel yang
               berganti, daftar di bawahnya hanya disaring. -->
          <div
            v-if="categories.length > 1"
            class="mt-6 flex flex-wrap items-center justify-center gap-2"
            role="group"
            aria-label="Saring artikel berdasarkan kategori"
          >
            <button
              type="button"
              :aria-pressed="!activeCategory"
              class="rounded-pill px-4 py-2 text-[0.86rem] font-semibold transition-colors duration-200 ease-smooth"
              :class="!activeCategory ? 'bg-primary text-white shadow-xs' : 'bg-surface text-muted hover:text-ink'"
              @click="selectCategory('')"
            >
              Semua
            </button>
            <button
              v-for="category in categories"
              :key="category.slug"
              type="button"
              :aria-pressed="activeCategory === category.slug"
              class="rounded-pill px-4 py-2 text-[0.86rem] font-semibold transition-colors duration-200 ease-smooth"
              :class="
                activeCategory === category.slug
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface text-muted hover:text-ink'
              "
              @click="selectCategory(category.slug)"
            >
              {{ category.name }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         2. Daftar artikel
         ================================================================== -->
    <section class="container-page pt-14 pb-20 md:pt-20 md:pb-24" aria-labelledby="daftar-artikel">
      <h2 id="daftar-artikel" class="sr-only">Daftar artikel</h2>

      <div class="mx-auto max-w-300">
        <!-- Memuat -->
        <div v-if="pending && !articles?.length" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="placeholder in 6"
            :key="placeholder"
            class="overflow-hidden rounded-2xl border border-hairline bg-surface"
          >
            <div class="aspect-16/9 w-full animate-pulse bg-skeleton" />
            <div class="space-y-3 p-6">
              <div class="h-3 w-24 animate-pulse rounded-pill bg-skeleton" />
              <div class="h-4 w-full animate-pulse rounded-pill bg-skeleton" />
              <div class="h-4 w-4/5 animate-pulse rounded-pill bg-skeleton" />
            </div>
          </div>
        </div>

        <!-- Gagal dimuat. Tidak ada tombol muat ulang buatan sendiri: refresh
             halaman melakukan hal yang sama dan tidak bisa salah. -->
        <AppSectionMessage
          v-else-if="error"
          appearance="error"
          title="Artikel belum berhasil dimuat"
        >
          Koneksi ke server sedang bermasalah. Muat ulang halaman ini sebentar lagi,
          atau <NuxtLink to="/pusat-bantuan" class="font-semibold underline">hubungi tim Zenko</NuxtLink>
          kalau terus berulang.
        </AppSectionMessage>

        <!-- Belum ada artikel sama sekali -->
        <div
          v-else-if="!articles?.length"
          class="rounded-[28px] border border-hairline bg-surface-alt px-6 py-16 text-center"
        >
          <AppIcon name="file-text" :size="30" class="mx-auto text-primary" />
          <p class="mt-4 text-[1.15rem] font-bold tracking-[-0.03em]">Artikelnya sedang disiapkan</p>
          <p class="mx-auto mt-2 max-w-[46ch] text-muted">
            Tulisan pertama akan terbit di sini. Sementara itu, panduan langkah demi
            langkah sudah tersedia di Pusat Bantuan.
          </p>
          <AppButton to="/pusat-bantuan" class="mt-6">Buka Pusat Bantuan</AppButton>
        </div>

        <!-- Hasil saring/pencarian kosong -->
        <div
          v-else-if="!filtered.length"
          class="rounded-[28px] border border-hairline bg-surface-alt px-6 py-16 text-center"
        >
          <AppIcon name="magnifying-glass" :size="30" class="mx-auto text-primary" />
          <p class="mt-4 text-[1.15rem] font-bold tracking-[-0.03em]">Belum ada yang cocok</p>
          <p class="mx-auto mt-2 max-w-[46ch] text-muted">
            Coba kata yang lebih umum, atau lihat seluruh artikel.
          </p>
          <button
            type="button"
            class="mt-6 font-semibold text-primary hover:underline"
            @click="searchQuery = ''; selectCategory('')"
          >
            Tampilkan semua artikel
          </button>
        </div>

        <template v-else>
          <!-- Artikel terbaru, satu kartu lebar -->
          <NuxtLink
            v-if="featured"
            :to="`/artikel/${featured.slug}`"
            class="group mb-6 grid overflow-hidden rounded-[28px] border border-hairline bg-surface shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
          >
            <MarketingArticleCover
              :article="featured"
              eager
              class="aspect-16/9 w-full lg:aspect-auto lg:h-full lg:min-h-80"
            />
            <div class="flex flex-col justify-center p-7 md:p-10">
              <p class="flex flex-wrap items-center gap-2 text-[0.72rem] font-bold tracking-[0.14em] uppercase">
                <span class="rounded-pill bg-primary-soft px-3 py-1 text-primary">Terbaru</span>
                <!-- Sama seperti kartu biasa: kategori hanya diulang di sini
                     kalau sampulnya gambar sungguhan, bukan gambar cadangan
                     yang sudah menuliskannya. -->
                <span v-if="featured.categoryName && featured.coverUrl" class="text-muted">
                  {{ featured.categoryName }}
                </span>
              </p>
              <h3 class="mt-4 text-[clamp(1.35rem,2.4vw,1.85rem)] leading-[1.22] font-bold tracking-[-0.035em]">
                {{ featured.title }}
              </h3>
              <p class="clamp-3 mt-3.5 leading-[1.7] text-muted">
                {{ articleExcerpt(featured, 240) }}
              </p>
              <p class="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.82rem] text-faint">
                <span>{{ featured.authorName || 'Tim Zenko' }}</span>
                <span v-if="featured.publishedAt" aria-hidden="true">·</span>
                <span v-if="featured.publishedAt">{{ formatIsoDateLong(featured.publishedAt) }}</span>
                <span aria-hidden="true">·</span>
                <span>{{ featured.readingMinutes }} menit baca</span>
              </p>
              <span class="mt-6 inline-flex items-center gap-1.5 font-semibold text-primary">
                Baca artikel
                <AppIcon
                  name="arrow-right"
                  :size="16"
                  class="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </NuxtLink>

          <div v-if="rest.length" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <MarketingArticleCard
              v-for="(article, index) in rest"
              :key="article.id"
              :article="article"
              :eager="!featured && index < 3"
            />
          </div>
        </template>
      </div>
    </section>
  </main>
</template>
