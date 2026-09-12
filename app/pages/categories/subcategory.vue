<script setup lang="ts">
import type { Category, Package } from '#shared/types/catalog'

definePageMeta({ path: '/kategori/:categorySlug()/:subcategorySlug()' })

const route = useRoute()
const categorySlug = String(route.params.categorySlug)
const subcategorySlug = String(route.params.subcategorySlug)
const { public: config } = useRuntimeConfig()
const { data: categories } = await useFetch<Category[]>('/categories', {
  baseURL: config.apiBase,
  default: () => [],
})
const category = categories.value.find(item => item.slug === categorySlug)
const subcategory = category?.subcategories?.find(item => item.slug === subcategorySlug)

if (!category || !subcategory) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan', fatal: true })

const { data: packages, pending, error } = await useFetch<Package[]>('/packages', {
  baseURL: config.apiBase,
  query: { category: category.label, subcategory: subcategory.label, sort: 'featured' },
  default: () => [],
})

const pageUrl = `https://zenkoedu.id/kategori/${category.slug}/${subcategory.slug}`
const shouldIndex = subcategory.count >= 2
const pageTitle = `Tryout ${category.label} ${subcategory.label} Online | Zenko`
const description = `Paket tryout ${category.label} ${subcategory.label} online untuk latihan dan simulasi ujian. Belajar dengan paket pilihan tutor dan bimbel di Zenko.`

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
          { '@type': 'ListItem', position: 2, name: category.label, item: `https://zenkoedu.id/kategori/${category.slug}` },
          { '@type': 'ListItem', position: 3, name: subcategory.label, item: pageUrl },
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
        <NuxtLink :to="`/kategori/${category.slug}`" class="hover:text-primary">{{ category.label }}</NuxtLink>
        <span aria-hidden="true"> / </span>
        <span>{{ subcategory.label }}</span>
      </nav>

      <header class="max-w-190">
        <h1 class="text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight">Tryout {{ category.label }} {{ subcategory.label }} online</h1>
        <p class="mt-4 leading-[1.75] text-muted">
          Siapkan diri dengan latihan {{ category.label }} untuk {{ subcategory.label }}.
          Kerjakan simulasi, lihat hasilnya, dan ulangi materi yang masih perlu kamu kuasai.
        </p>
      </header>

      <section class="mt-10" aria-labelledby="subcategory-packages-heading">
        <h2 id="subcategory-packages-heading" class="mb-5 text-xl font-bold">Paket latihan tersedia</h2>
        <PackageGrid :items="packages" :pending="pending" :error="error" />
      </section>
    </section>
  </main>
</template>
