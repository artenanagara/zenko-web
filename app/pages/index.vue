<script setup lang="ts">
import type { SortKey } from '#shared/types/catalog'

// Beranda ditutup dengan ajakan untuk siswa di dalam footer (lihat AppFooter).
definePageMeta({ footerCta: true })

const sort = ref<SortKey>('featured')

const { data: packages, pending, error } = usePackages(sort)
const { data: testimonials } = useTestimonials()

useSeoMeta({
  title: 'Paket Tryout Online untuk Berbagai Ujian | Zenko',
  description:
    'Temukan latihan SKD, PPPK, UTBK-SNBT, TKA, rekrutmen BUMN, dan ujian lainnya. Kerjakan simulasi CBT, pahami hasilnya, lalu belajar lebih terarah.',
  ogTitle: 'Paket Tryout Online untuk Berbagai Ujian | Zenko',
  ogDescription:
    'Temukan latihan SKD, PPPK, UTBK-SNBT, TKA, rekrutmen BUMN, dan ujian lainnya. Kerjakan simulasi CBT, pahami hasilnya, lalu belajar lebih terarah.',
  ...DEFAULT_OG,
  ogUrl: 'https://zenkoedu.id/',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/' }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(useOrganizationSchema()) }],
})
</script>

<template>
  <main>
    <HeroSection />

    <!-- #paket is the anchor the package detail breadcrumb jumps back to. -->
    <div id="paket" class="container-page flex justify-center py-8">
      <SortTabs v-model="sort" />
    </div>

    <div class="container-page pb-18 md:pb-22">
      <PackageGrid :items="packages" :pending="pending" :error="error" />
      <CatalogAssurance class="mt-6" />
    </div>

    <FeatureSection />
    <TestimonialSection :items="testimonials" />
  </main>
</template>
