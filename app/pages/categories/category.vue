<script setup lang="ts">
import type { Category, Package } from '#shared/types/catalog'

definePageMeta({ path: '/kategori/:categorySlug()' })

const route = useRoute()
const slug = String(route.params.categorySlug)
const { public: config } = useRuntimeConfig()
const { data: categories } = await useFetch<Category[]>('/categories', {
  baseURL: config.apiBase,
  default: () => [],
})
const category = categories.value.find(item => item.slug === slug)

if (!category) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan', fatal: true })

const { data: packages, pending, error } = await useFetch<Package[]>('/packages', {
  baseURL: config.apiBase,
  query: { category: category.label, sort: 'featured' },
  default: () => [],
})

const pageUrl = `https://zenkoedu.id/kategori/${category.slug}`
const shouldIndex = category.count >= 2
const pageTitle = `Tryout ${category.label} Online | Zenko`
const description = `Temukan paket tryout dan latihan ${category.label} online dari tutor dan bimbel di Zenko. Pilih paket sesuai target ujianmu dan mulai belajar lebih terarah.`

useSeoMeta({
  title: pageTitle,
  description,
  ogTitle: pageTitle,
  ogDescription: description,
  ...DEFAULT_OG,
  ogUrl: pageUrl,
  robots: shouldIndex ? 'index,follow' : 'noindex,follow',
  twitterCard: 'summary_large_image',
})

const itemList = computed(() => packages.value.map((item, index) => ({
  '@type': 'ListItem',
  position: index + 1,
  name: item.title,
  url: `https://zenkoedu.id/paket/${item.slug}`,
})))

useHead({
  link: [{ rel: 'canonical', href: pageUrl }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: pageTitle,
        numberOfItems: packages.value.length,
        itemListElement: itemList.value,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://zenkoedu.id/' },
          { '@type': 'ListItem', position: 2, name: 'Paket', item: 'https://zenkoedu.id/paket' },
          { '@type': 'ListItem', position: 3, name: category.label, item: pageUrl },
        ],
      },
    ]),
  }],
})
</script>

<template>
  <main>
    <section class="container-page py-10 md:py-14">
      <nav class="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <NuxtLink to="/" class="hover:text-primary">Beranda</NuxtLink>
        <span aria-hidden="true"> / </span>
        <NuxtLink to="/paket" class="hover:text-primary">Paket</NuxtLink>
        <span aria-hidden="true"> / </span>
        <span>{{ category.label }}</span>
      </nav>

      <header class="max-w-190">
        <h1 class="text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight">Tryout {{ category.label }} online</h1>
        <p class="mt-4 leading-[1.75] text-muted">
          Latihan {{ category.label }} di Zenko membantu kamu membiasakan diri dengan format soal,
          mengukur kesiapan, dan memahami bagian yang masih perlu dikuatkan. Pilih paket dari tutor
          atau bimbel, kerjakan simulasi CBT, lalu gunakan hasilnya untuk menyusun strategi belajar.
        </p>
      </header>

      <section class="mt-10" aria-labelledby="category-packages-heading">
        <h2 id="category-packages-heading" class="mb-5 text-xl font-bold">Paket {{ category.label }}</h2>
        <PackageGrid :items="packages" :pending="pending" :error="error" />
      </section>
    </section>
  </main>
</template>
