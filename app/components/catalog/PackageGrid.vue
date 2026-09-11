<script setup lang="ts">
import type { Package } from '#shared/types/catalog'

withDefaults(
  defineProps<{
    items: Package[]
    pending?: boolean
    error?: unknown
    /** Placeholders shown while loading; match the expected page size. */
    skeletonCount?: number
  }>(),
  { skeletonCount: 8 },
)

// Column counts follow the grid's own width rather than the viewport, so the
// same component fits the full-bleed homepage and the narrower column beside
// the catalogue filters without a variant prop.
const grid =
  'grid grid-cols-1 gap-6 @min-[520px]:grid-cols-2 @min-[840px]:grid-cols-3 @min-[1120px]:grid-cols-4'
</script>

<template>
  <section class="@container" aria-label="Daftar paket tryout">
    <p v-if="error" class="rounded-lg bg-surface-sunken px-6 py-10 text-center text-muted">
      Paket belum berhasil dimuat. Tunggu sebentar, lalu coba lagi.
    </p>

    <div v-else-if="pending" :class="grid">
      <div v-for="n in skeletonCount" :key="n" class="h-85 animate-pulse rounded-lg bg-surface-sunken" />
    </div>

    <slot v-else-if="items.length === 0" name="empty">
      <p class="rounded-lg bg-surface-sunken px-6 py-10 text-center text-muted">
        Paketnya belum tersedia. Coba mampir lagi nanti, ya.
      </p>
    </slot>

    <div v-else :class="grid">
      <PackageCard v-for="item in items" :key="item.id" :item="item" />
    </div>
  </section>
</template>
