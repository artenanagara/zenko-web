<script setup lang="ts">
import type { Package } from '~~/types/catalog'

defineProps<{ item: Package }>()
</script>

<template>
  <!-- Outer tray; the white card sits inside it and lifts as one on hover. -->
  <NuxtLink
    :to="`/paket/${item.slug}`"
    class="group flex flex-col rounded-lg bg-surface-sunken px-2 pt-2 pb-0.5 transition-transform duration-300 ease-smooth hover:-translate-y-1 focus-visible:-translate-y-1"
    :aria-label="`Lihat detail paket ${item.title}`"
  >
    <article
      class="flex flex-1 flex-col rounded-md bg-surface p-2.5 shadow-xs transition-shadow duration-300 ease-smooth group-hover:shadow-lift group-focus-visible:shadow-lift"
    >
      <img
        :src="item.thumbnailUrl"
        :alt="`Thumbnail paket ${item.title}`"
        loading="lazy"
        class="aspect-16/10 w-full rounded-sm bg-[#edf3ff] object-cover"
      >

      <div class="flex flex-1 flex-col px-1.5 pt-3.5 pb-1.5">
        <h3 class="clamp-2 text-[1.06rem] leading-[1.35] font-bold tracking-[-0.03em] md:min-h-[2.7em]">
          {{ item.title }}
        </h3>

        <div class="mt-3 flex items-center gap-2 text-[0.88rem] text-muted">
          <img :src="item.author.avatarUrl" alt="" loading="lazy" class="h-6 w-6 shrink-0 rounded-full object-cover">
          <span>{{ item.author.name }}</span>
        </div>

        <p class="mt-2 flex items-center gap-1.5 text-[0.82rem] text-muted">
          <span class="text-star">★</span> {{ item.rating.toFixed(1) }}
          <span class="opacity-60">·</span>
          {{ item.soldLabel }} terjual
        </p>

        <!-- mt-auto pins the price to the bottom of every card -->
        <p class="mt-auto pt-3 font-bold tracking-[-0.02em]">
          {{ formatRupiah(item.price) }}
          <span class="ml-1.5 text-[0.8rem] font-medium text-muted line-through">
            {{ formatRupiah(item.priceOriginal) }}
          </span>
        </p>
      </div>
    </article>

    <p class="px-1.5 pt-2.5 pb-2 text-center text-[0.7rem] font-bold tracking-[0.14em] text-faint uppercase">
      {{ item.category }}
    </p>
  </NuxtLink>
</template>
