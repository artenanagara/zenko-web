<script setup lang="ts">
/**
 * Sign-up panel visual: a glimpse of the catalogue.
 *
 * A new account has no history to show, so this answers the question a
 * first-time visitor actually has — what is in there, and what does it cost.
 *
 * Thumbnails are gradient tiles rather than remote images: the auth pages
 * should not wait on network requests for decoration.
 */
const packages = [
  { category: 'SKD/CPNS', title: 'Latihan CPNS 2026 Intensif', tutor: 'Budi Santoso', rating: '4.9', price: 'Rp189.000', tone: 'from-[#4c86f0] to-[#2557c9]' },
  { category: 'BUMN', title: 'Prediksi BUMN 2026', tutor: 'Mira Azzahra', rating: '4.8', price: 'Rp149.000', tone: 'from-[#5c93f5] to-[#2f6feb]' },
  { category: 'SNBT', title: 'SNBT Master Class', tutor: 'Dimas Prasetya', rating: '4.7', price: 'Rp219.000', tone: 'from-[#7da8fa] to-[#3f7bf0]' },
]
</script>

<template>
  <div class="relative" aria-hidden="true">
    <div class="grid gap-3">
      <article
        v-for="(item, index) in packages"
        :key="item.title"
        class="anim-item flex items-center gap-3.5 rounded-md bg-white/85 p-3.5 shadow-float backdrop-blur-sm"
        :style="{ '--delay': `${120 + index * 180}ms` }"
      >
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-linear-160 text-[0.62rem] font-bold text-white"
          :class="item.tone"
        >
          {{ item.category.split('/')[0] }}
        </span>

        <span class="min-w-0 flex-1">
          <span class="block truncate text-[0.92rem] font-bold tracking-[-0.02em]">
            {{ item.title }}
          </span>
          <span class="mt-0.5 block truncate text-[0.78rem] text-muted">
            {{ item.tutor }} · <span class="text-star">★</span> {{ item.rating }}
          </span>
        </span>

        <span class="shrink-0 text-[0.86rem] font-bold tracking-[-0.02em]">
          {{ item.price }}
        </span>
      </article>
    </div>

    <p
      class="anim-item absolute -right-3 -bottom-4 flex items-center gap-2 rounded-pill bg-white px-4 py-2.5 text-[0.8rem] font-semibold shadow-lift"
      style="--delay: 700ms"
    >
      <IconSeal class="h-5 w-5 shrink-0" />
      120+ paket siap dikerjakan
    </p>
  </div>
</template>
