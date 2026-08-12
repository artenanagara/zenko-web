<script setup lang="ts">
import type { SortKey, SortOption } from '~~/types/catalog'

const model = defineModel<SortKey>({ required: true })

const options: SortOption[] = [
  { key: 'featured', label: 'Pilihan' },
  { key: 'bestseller', label: 'Terlaris' },
  { key: 'newest', label: 'Terbaru' },
]
</script>

<template>
  <div id="paket" class="py-8">
    <div class="container-page flex justify-center">
      <!-- Toggle group, not a tablist: there are no tabpanels to control. -->
      <div
        class="tab-track inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-pill p-1.5 shadow-[0_8px_22px_rgba(47,111,235,0.08)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Urutkan daftar paket"
      >
        <button
          v-for="option in options"
          :key="option.key"
          type="button"
          :aria-pressed="model === option.key"
          class="inline-flex shrink-0 items-center justify-center rounded-pill px-5 py-2.5 font-semibold tracking-[-0.01em] transition-[background,color,box-shadow] duration-200 ease-smooth md:px-8 md:py-3"
          :class="
            model === option.key
              ? 'bg-surface text-primary shadow-[0_1px_2px_rgba(15,23,42,0.06),0_6px_16px_rgba(15,23,42,0.06)]'
              : 'bg-transparent text-muted hover:text-ink'
          "
          @click="model = option.key"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
</template>
