<script setup lang="ts">
import type { SortKey, SortOption } from '#shared/types/catalog'

/**
 * Catalogue sort. Only the option list and the labels live here now — the
 * control itself is core/AppMenuSelect, shared with the tutor profile's own
 * sort and category dropdowns.
 */
const model = defineModel<SortKey>({ required: true })

const options: SortOption[] = [
  { key: 'featured', label: 'Pilihan' },
  // Kuncinya tetap 'bestseller' — itu parameter URL yang mungkin sudah
  // dibagikan orang — tapi yang diurutkan sekarang jumlah pengerjaan, bukan
  // penjualan, jadi labelnya menyesuaikan.
  { key: 'bestseller', label: 'Banyak dikerjakan' },
  { key: 'newest', label: 'Terbaru' },
]
</script>

<template>
  <AppMenuSelect
    v-model="model"
    :options="options"
    label="Urutkan"
    menu-label="Urutkan daftar paket"
  />
</template>
