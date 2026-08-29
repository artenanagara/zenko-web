<script setup lang="ts">
import type { Author, Package } from '#shared/types/catalog'

/**
 * The card used to be a single <NuxtLink> wrapping everything. That had to go
 * once the tutor name became its own link: an <a> inside an <a> is invalid
 * HTML, and browsers recover from it by closing the outer anchor early, which
 * silently breaks the rest of the card.
 *
 * Replaced with the stretched-link pattern: the paket link wraps only the
 * title, and its ::after is blown up to cover the whole (position: relative)
 * card, so clicking anywhere still opens the paket. The tutor link sits above
 * that overlay on z-1, so it keeps its own click target. Net result is two
 * honest tab stops instead of one giant anchor, and no nesting anywhere.
 *
 * NuxtLink is imported rather than resolved by name — same reason as
 * AppButton: auto-import registers nothing for resolveComponent to find.
 */
import { NuxtLink } from '#components'

defineProps<{ item: Package }>()

function authorProfilePath(author: Author) {
  const identifier = author.username || author.id
  return identifier ? `/tutor/${encodeURIComponent(identifier)}` : undefined
}
</script>

<template>
  <!-- Outer tray; the white card sits inside it and lifts as one on hover.
       `has-[a:focus-visible]` stands in for the old focus-visible on the root
       anchor — the root is no longer focusable itself, so the lift has to come
       from whichever inner link has focus. -->
  <article
    class="group relative flex flex-col rounded-lg bg-surface-sunken px-2 pt-2 pb-0.5 transition-transform duration-300 ease-smooth hover:-translate-y-1 has-[a:focus-visible]:-translate-y-1"
  >
    <div
      class="flex flex-1 flex-col rounded-md bg-surface p-2.5 shadow-xs transition-shadow duration-300 ease-smooth group-hover:shadow-lift group-has-[a:focus-visible]:shadow-lift"
    >
      <img
        :src="item.thumbnailUrl"
        :alt="`Thumbnail paket ${item.title}`"
        loading="lazy"
        class="aspect-16/10 w-full rounded-sm bg-[#edf3ff] object-cover"
      >

      <div class="flex flex-1 flex-col px-1.5 pt-3.5 pb-1.5">
        <h3 class="clamp-2 text-[1.06rem] leading-[1.35] font-bold tracking-[-0.03em] md:min-h-[2.7em]">
          <NuxtLink
            :to="`/paket/${item.slug}`"
            class="after:absolute after:inset-0 after:z-0 after:content-['']"
          >
            {{ item.title }}
          </NuxtLink>
        </h3>

        <!-- Avatar and name are one target so the tutor link clears a usable
             tap size; the negative margin keeps that padding from moving the
             price row down. `authorProfilePath` also handles legacy tutors
             whose account exists but whose public username is still empty. -->
        <component
          :is="authorProfilePath(item.author) ? NuxtLink : 'div'"
          :to="authorProfilePath(item.author)"
          class="relative z-1 mt-3 -mb-2 flex w-fit items-center gap-2 py-2 text-[0.88rem] text-muted"
          :class="authorProfilePath(item.author) ? 'transition-colors duration-200 ease-smooth hover:text-primary hover:underline' : ''"
        >
          <img :src="item.author.avatarUrl" alt="" loading="lazy" class="h-6 w-6 shrink-0 rounded-full object-cover">
          <span>{{ item.author.name }}</span>
        </component>

        <p class="mt-4 flex items-center gap-1.5 text-[0.82rem] text-muted">
          <IconStar class="h-3.5 w-3.5 shrink-0 text-star" /> {{ item.rating.toFixed(1) }}
          <span class="opacity-60">·</span>
          {{ item.attemptLabel }} dikerjakan
        </p>

        <!-- mt-auto pins the price to the bottom of every card -->
        <p class="mt-auto pt-3 font-bold tracking-[-0.02em]">
          <span :class="item.price > 0 ? '' : 'text-success-ink'">
            {{ item.price > 0 ? formatRupiah(item.price) : 'Gratis' }}
          </span>
          <span
            v-if="item.priceOriginal > item.price"
            class="ml-1.5 text-[0.8rem] font-medium text-muted line-through"
          >
            {{ formatRupiah(item.priceOriginal) }}
          </span>
        </p>
      </div>
    </div>

    <p class="px-1.5 pt-2.5 pb-2 text-center text-[0.7rem] font-bold tracking-[0.14em] text-muted uppercase">
      {{ item.category }}
    </p>
  </article>
</template>
