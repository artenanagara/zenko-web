<script setup lang="ts">
import type { Author } from '#shared/types/catalog'

definePageMeta({ path: '/bimbel/:slug()' })

const route = useRoute()
const requestedSlug = String(route.params.slug)
const bimbel = await usePublicBimbel(requestedSlug)
const displayName = computed(() => bimbel.value.name || 'Bimbel Zenko')
const logoUrl = computed(() => bimbel.value.logoUrl || '')
const products = computed(() => bimbel.value.products.filter(item => item.status === 'live'))
const canonicalUrl = computed(() => `https://zenkoedu.id/bimbel/${bimbel.value.slug || requestedSlug}`)
const cardAuthor = computed<Author>(() => ({
  name: displayName.value,
  avatarUrl: logoUrl.value,
  type: 'bimbel',
  slug: bimbel.value.slug || requestedSlug,
  username: '',
}))
const description = computed(() => metaDescription(
  bimbel.value.description || `Profil ${displayName.value} dan paket tryout yang tersedia di Zenko.`,
))

useSeoMeta({
  title: `${displayName.value} | Bimbel Zenko`,
  description: description.value,
  ogTitle: `${displayName.value} | Bimbel Zenko`,
  ogDescription: description.value,
  ogImage: logoUrl.value || undefined,
  ogUrl: canonicalUrl.value,
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: displayName.value,
      url: canonicalUrl.value,
      ...(logoUrl.value ? { logo: logoUrl.value, image: logoUrl.value } : {}),
      ...(bimbel.value.city ? { address: { '@type': 'PostalAddress', addressLocality: bimbel.value.city } } : {}),
    }),
  }],
})
</script>

<template>
  <main>
    <section class="border-b border-line bg-surface-muted">
      <div class="container-page flex flex-col gap-5 py-10 md:flex-row md:items-center md:py-14">
        <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface shadow-sm md:h-28 md:w-28">
          <img v-if="logoUrl" :src="logoUrl" :alt="`Logo ${displayName}`" class="h-full w-full object-cover">
          <AppIcon v-else name="buildings" :size="42" class="text-primary" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Profil bimbel</p>
          <h1 class="mt-2 text-3xl font-bold tracking-[-0.04em] md:text-4xl">{{ displayName }}</h1>
          <p v-if="bimbel.city" class="mt-2 text-muted">{{ bimbel.city }}</p>
        </div>
      </div>
    </section>

    <div class="container-page py-8 md:py-12">
      <section v-if="bimbel.description" class="mb-10 max-w-3xl">
        <h2 class="text-xl font-bold tracking-[-0.03em]">Tentang bimbel ini</h2>
        <p class="mt-3 whitespace-pre-line leading-7 text-muted">{{ bimbel.description }}</p>
      </section>

      <TutorProfileProducts
        :items="products"
        :author="cardAuthor"
        :tutor-name="displayName"
      />
    </div>
  </main>
</template>
