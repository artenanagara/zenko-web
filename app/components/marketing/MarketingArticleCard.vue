<script setup lang="ts">
import type { Article } from '#shared/types/article'
import { NuxtLink } from '#components'

/**
 * One article in a grid — the index page's list and the detail page's
 * "baca juga" strip use the same card, so an article looks the same wherever
 * it is linked from.
 *
 * Stretched-link pattern rather than an anchor around the whole card, for the
 * reason spelled out in PackageCard: the card carries a second link (the
 * category), and an <a> inside an <a> is invalid HTML that browsers "fix" by
 * closing the outer one early.
 */
defineProps<{
  article: Article
  /** Above-the-fold cards should not be lazy-loaded behind the LCP. */
  eager?: boolean
}>()
</script>

<template>
  <article
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift has-[a:focus-visible]:-translate-y-1 has-[a:focus-visible]:shadow-lift"
  >
    <MarketingArticleCover
      :article="article"
      :eager="eager"
      class="aspect-16/9 w-full"
    />

    <div class="flex flex-1 flex-col p-6">
      <!-- Tanpa sampul, kategorinya sudah tercetak di atas gambar cadangan
           (MarketingArticleCover) — mencetaknya lagi di sini membuat kartu
           mengulang dirinya sendiri. -->
      <p
        v-if="article.categoryName && article.coverUrl"
        class="mb-2.5 text-[0.72rem] font-bold tracking-[0.14em] text-primary uppercase"
      >
        {{ article.categoryName }}
      </p>

      <h3 class="clamp-3 text-[1.08rem] leading-[1.4] font-bold tracking-[-0.03em]">
        <NuxtLink
          :to="`/artikel/${article.slug}`"
          class="after:absolute after:inset-0 after:content-['']"
        >
          {{ article.title }}
        </NuxtLink>
      </h3>

      <p class="clamp-3 mt-3 text-[0.9rem] leading-[1.7] text-muted">
        {{ articleExcerpt(article) }}
      </p>

      <!-- mt-auto pins the byline to the bottom, so cards of different
           excerpt lengths still line up across a row. -->
      <p class="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-5 text-[0.8rem] text-faint">
        <span v-if="article.publishedAt">{{ formatIsoDateLong(article.publishedAt) }}</span>
        <span v-if="article.publishedAt" aria-hidden="true">·</span>
        <span>{{ article.readingMinutes }} menit baca</span>
      </p>
    </div>
  </article>
</template>
