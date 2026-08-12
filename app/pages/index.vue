<script setup lang="ts">
import type { SortKey } from '~~/types/catalog'

const sort = ref<SortKey>('featured')

const { data: packages, pending, error } = usePackages(sort)
const { data: testimonials } = useTestimonials()
</script>

<template>
  <main>
    <HeroSection>
      <template #tabs>
        <SortTabs v-model="sort" />
      </template>
    </HeroSection>

    <PackageGrid :items="packages" :pending="pending" :error="error" />
    <FeatureSection />
    <TestimonialSection :items="testimonials" />
    <TutorCta />
  </main>
</template>
