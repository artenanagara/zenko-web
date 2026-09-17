<script setup lang="ts">
import type { Article } from '#shared/types/article'

/**
 * An article's cover, with a branded stand-in when it has none.
 *
 * A cover is optional in the Marketing Hub editor, and most articles are
 * written without one — an empty `<img>` would render as a broken-image icon,
 * and a grey box reads as a loading failure. The stand-in instead states the
 * article's own category over a brand gradient, so a card without a
 * photograph still looks deliberate.
 *
 * The gradient is picked from the slug rather than at random: the same
 * article must look the same on the index, in the "baca juga" strip, and
 * after a reload.
 */
const props = defineProps<{
  article: Article
  eager?: boolean
}>()

// v-if/v-else makes this component a fragment at compile time, and Vue
// switches attribute inheritance off for a fragment root — the caller's
// sizing classes (`aspect-16/9 w-full`) were silently dropped, which left
// every cover collapsed to the height of its own padding. Binding $attrs by
// hand on each branch is what puts them back.
defineOptions({ inheritAttrs: false })

/** Brand-blue ramps only — the palette carries no orange (see brand guide). */
const GRADIENTS = [
  'from-[#2f6feb] to-[#1e3a8a]',
  'from-[#4c86f0] to-[#2557c9]',
  'from-[#1d4ed8] to-[#0f2c6b]',
  'from-[#3b82f6] to-[#1e40af]',
] as const

const gradient = computed(() => {
  const slug = props.article.slug
  let hash = 0
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) % GRADIENTS.length
  }
  return GRADIENTS[hash] ?? GRADIENTS[0]
})
</script>

<template>
  <img
    v-if="article.coverUrl"
    v-bind="$attrs"
    :src="article.coverUrl"
    :alt="article.coverAlt || article.title"
    :loading="eager ? 'eager' : 'lazy'"
    class="object-cover"
  >

  <!-- aria-hidden: the stand-in carries no information the card's own title
       and category do not already give a screen reader. -->
  <div
    v-else
    v-bind="$attrs"
    aria-hidden="true"
    class="dot-grid relative flex items-end overflow-hidden bg-linear-150 p-5"
    :class="gradient"
    style="--dot-color: rgba(255, 255, 255, 0.22)"
  >
    <AppIcon name="file-text" :size="22" class="absolute top-5 right-5 text-white/35" />
    <p class="relative z-1 max-w-[80%] text-[0.78rem] font-bold tracking-[0.16em] text-white/85 uppercase">
      {{ article.categoryName || 'Artikel Zenko' }}
    </p>
  </div>
</template>
