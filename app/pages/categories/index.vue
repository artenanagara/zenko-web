<script setup lang="ts">
import type { Category } from '#shared/types/catalog'
import { CATEGORY_LANDINGS } from '~/data/category-landing'

/**
 * Hub of every category landing page: the one page the header links to, so
 * each /kategori/:slug is reachable from anywhere in two clicks and crawlers
 * find them all through normal links, not just the sitemap.
 */
definePageMeta({ path: '/kategori', footerCta: true })

const { public: config } = useRuntimeConfig()
const { data: categories } = await useFetch<Category[]>('/categories', {
  baseURL: config.apiBase,
  key: 'categories',
  default: () => [],
})

// Bundles are a product type, not an exam: they get no landing page.
const NOT_AN_EXAM = new Set(['bundel'])

const cards = computed(() => {
  const live = new Map(categories.value.map(category => [category.slug, category]))
  const curated = Object.entries(CATEGORY_LANDINGS)
    .sort(([, left], [, right]) => left.order - right.order)
    .map(([slug, landing]) => {
      const category = live.get(slug)
      return {
        slug,
        label: category?.label ?? landing.label,
        accent: landing.accent,
        audience: landing.audience,
        count: category?.count ?? 0,
        subcategories: category?.subcategories ?? [],
      }
    })
  const extra = categories.value
    .filter(category => !CATEGORY_LANDINGS[category.slug] && !NOT_AN_EXAM.has(category.slug))
    .map(category => ({
      slug: category.slug,
      label: category.label,
      accent: 'Pelan-pelan, yang penting mulai.',
      audience: `peserta ${category.label}`,
      count: category.count,
      subcategories: category.subcategories ?? [],
    }))
  return [...curated, ...extra]
})

const title = 'Kategori Tryout & Latihan Ujian Online | Zenko'
const description = 'Pilih ujianmu: SKD CPNS, UTBK-SNBT, TKA, PPPK, BUMN, TNI & Polri, psikotes, TOEFL, IELTS, dan latihan mapel. Tryout CBT dengan pembahasan di Zenko.'
const pageUrl = 'https://zenkoedu.id/kategori'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ...DEFAULT_OG,
  ogUrl: pageUrl,
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: pageUrl }],
  script: [{
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': title,
        'description': description,
        'url': pageUrl,
        'inLanguage': 'id-ID',
        'mainEntity': {
          '@type': 'ItemList',
          'itemListElement': cards.value.map((card, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': card.label,
            'url': `${pageUrl}/${card.slug}`,
          })),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Beranda', 'item': 'https://zenkoedu.id/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Kategori', 'item': pageUrl },
        ],
      },
    ])),
  }],
})
</script>

<template>
  <main>
    <section class="container-page pt-3 md:pt-5">
      <div class="dot-grid dot-grid-hero hero-aurora relative overflow-hidden rounded-[26px] px-5 pt-8 pb-14 md:rounded-xl md:px-10 md:pt-10 md:pb-18">
        <AppBreadcrumbs
          class="relative z-1 mb-8 justify-center"
          :items="[{ label: 'Beranda', to: '/' }, { label: 'Kategori' }]"
        />
        <div class="relative z-1 mx-auto max-w-190 text-center">
          <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter text-balance">
            Kategori tryout dan latihan ujian
            <span class="text-accent mt-1 block">Apa pun tujuanmu, kita mulai dari sini.</span>
          </h1>
          <p class="mx-auto mt-4 max-w-160 text-[1.02rem] text-muted">
            Pilih ujian yang sedang kamu siapkan, kenali formatnya, lalu mulai dari paket yang paling pas.
            Setiap langkah kecil tetap berarti.
          </p>
        </div>
      </div>
    </section>

    <section class="container-page py-14 md:py-18" aria-label="Daftar kategori ujian">
      <ul class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="card in cards" :key="card.slug">
          <article class="flex h-full flex-col rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift">
            <div class="flex items-start justify-between gap-3">
              <h2 class="text-[1.3rem] font-bold tracking-[-0.03em]">
                <NuxtLink :to="`/kategori/${card.slug}`" class="hover:text-primary">{{ card.label }}</NuxtLink>
              </h2>
              <span
                class="shrink-0 rounded-pill px-2.5 py-1 text-[0.74rem] font-bold"
                :class="card.count ? 'bg-primary-soft text-primary' : 'bg-surface-sunken text-muted'"
              >{{ card.count ? `${card.count} paket` : 'Segera' }}</span>
            </div>
            <p class="mt-2 text-[0.95rem] font-semibold text-primary">{{ card.accent }}</p>
            <p class="mt-1 text-[0.9rem] text-muted">Untuk {{ card.audience }}.</p>

            <ul v-if="card.subcategories.length" class="mt-4 flex flex-wrap gap-2">
              <li v-for="sub in card.subcategories" :key="sub.slug">
                <NuxtLink
                  :to="`/kategori/${card.slug}/${sub.slug}`"
                  class="inline-block rounded-pill border border-hairline px-3 py-1 text-[0.8rem] font-medium hover:border-primary/35 hover:text-primary"
                >{{ sub.label }}</NuxtLink>
              </li>
            </ul>

            <NuxtLink
              :to="`/kategori/${card.slug}`"
              class="mt-auto inline-flex items-center gap-1.5 pt-6 font-semibold text-primary hover:underline"
              :aria-label="`Lihat kategori ${card.label}`"
            >
              Lihat latihan {{ card.label }} <IconArrowRight class="h-4 w-4" />
            </NuxtLink>
          </article>
        </li>
      </ul>
    </section>
  </main>
</template>
