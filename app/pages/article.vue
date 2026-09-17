<script setup lang="ts">
definePageMeta({ path: '/artikel/:slug()' })

interface Article { id: string, slug: string, title: string, subtitle: string, content: string, categoryName: string, authorName: string, coverUrl: string, coverAlt: string, metaTitle: string, metaDescription: string, publishedAt?: string, updatedAt: string, readingMinutes: number }
const route = useRoute()
const { public: config } = useRuntimeConfig()
const article = await useApiFetch<Article>(`/articles/${encodeURIComponent(String(route.params.slug))}`, { baseURL: config.apiBase })
const canonicalUrl = `https://zenkoedu.id/artikel/${article.slug}`
const pageTitle = article.metaTitle || `${article.title} | Zenko`
const description = article.metaDescription || article.subtitle || `Baca panduan ${article.title} dari Zenko.`

useSeoMeta({ title: pageTitle, description, ogTitle: pageTitle, ogDescription: description, ogUrl: canonicalUrl, ogImage: article.coverUrl || undefined, twitterCard: 'summary_large_image' })
useHead({ link: [{ rel: 'canonical', href: canonicalUrl }], script: [{ type: 'application/ld+json', innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description, image: article.coverUrl || undefined, author: { '@type': 'Person', name: article.authorName || 'Zenko' }, dateModified: article.updatedAt, datePublished: article.publishedAt || article.updatedAt, mainEntityOfPage: canonicalUrl }) }] })
</script>

<template>
  <main class="bg-surface py-10 md:py-16">
    <article class="container-page mx-auto max-w-190">
      <nav class="mb-6 text-sm text-muted" aria-label="Breadcrumb"><NuxtLink to="/" class="font-semibold text-primary hover:underline">Beranda</NuxtLink><span aria-hidden="true"> / </span><span>Artikel</span><span aria-hidden="true"> / </span><span>{{ article.title }}</span></nav>
      <header class="border-b border-hairline pb-8"><p v-if="article.categoryName" class="text-sm font-semibold text-primary">{{ article.categoryName }}</p><h1 class="mt-2 text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-[-0.04em]">{{ article.title }}</h1><p v-if="article.subtitle" class="mt-4 text-lg leading-7 text-muted">{{ article.subtitle }}</p><p class="mt-5 text-sm text-faint">Oleh {{ article.authorName || 'Zenko' }} · {{ article.readingMinutes }} menit baca</p></header>
      <img v-if="article.coverUrl" :src="article.coverUrl" :alt="article.coverAlt || article.title" class="mt-8 aspect-[16/7] w-full rounded-lg object-cover">
      <div class="prose-zenko mt-10" v-html="article.content" />
    </article>
  </main>
</template>
