<script setup lang="ts">
import type { FacetOption } from '~/composables/usePackageFilters'

const categories = defineModel<string[]>('categories', { required: true })
const prices = defineModel<string[]>('prices', { required: true })
const rating = defineModel<string>('rating', { required: true })

defineProps<{
  categoryOptions: FacetOption[]
  priceOptions: FacetOption[]
  ratingOptions: FacetOption[]
  /** Drives the reset link; hidden while nothing is selected. */
  activeCount: number
}>()

defineEmits<{ reset: [] }>()
</script>

<template>
  <!-- Floats on the page rather than sitting in a bordered column, so it reads
       as the same kind of panel as the search bar and the purchase card. -->
  <aside
    class="rounded-lg border border-hairline bg-surface p-5 shadow-float"
    aria-label="Filter paket"
  >
    <div class="flex items-center justify-between gap-3 pb-3">
      <h2 class="font-bold tracking-[-0.02em]">Filter</h2>
      <button
        v-if="activeCount > 0"
        type="button"
        class="rounded-xs text-[0.85rem] font-semibold text-primary transition-colors duration-200 hover:text-primary-dark"
        @click="$emit('reset')"
      >
        Atur ulang
      </button>
    </div>

    <FilterGroup v-model="categories" title="Kategori" name="kategori" :options="categoryOptions" />
    <FilterGroup v-model="prices" title="Harga" name="harga" :options="priceOptions" />
    <FilterGroup v-model="rating" title="Rating" name="rating" :options="ratingOptions" />
  </aside>
</template>
