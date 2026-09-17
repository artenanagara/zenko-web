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
const props = withDefaults(
  defineProps<{
    article: Article
    /**
     * This cover is above the fold — on the detail page it is the page's LCP
     * element. Loads eagerly and at high priority rather than queueing behind
     * whatever the browser discovers first.
     */
    eager?: boolean
    /**
     * How much surface the stand-in has to fill. The detail page's plate is
     * several times the width of a card, so the same label set in the same
     * size reads as an accident there rather than as cover art.
     */
    size?: 'card' | 'page'
  }>(),
  { size: 'card' },
)

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

/** Padding, icon and label, scaled to the surface. */
const PLATE = {
  card: { pad: 'p-5', icon: 'top-5 right-5', iconSize: 22, label: 'text-[0.78rem] tracking-[0.16em]' },
  page: { pad: 'p-7 md:p-9', icon: 'top-7 right-7 md:top-9 md:right-9', iconSize: 30, label: 'text-[0.85rem] md:text-[0.95rem] tracking-[0.18em]' },
} as const

const plate = computed(() => PLATE[props.size])

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
    :fetchpriority="eager ? 'high' : 'auto'"
    class="object-cover"
  >

  <!-- aria-hidden: the stand-in carries no information the card's own title
       and category do not already give a screen reader. -->
  <div
    v-else
    v-bind="$attrs"
    aria-hidden="true"
    class="dot-grid relative flex items-end overflow-hidden bg-linear-150"
    :class="[gradient, plate.pad]"
    style="--dot-color: rgba(255, 255, 255, 0.22)"
  >
    <AppIcon name="file-text" :size="plate.iconSize" class="absolute text-white/35" :class="plate.icon" />
    <p class="relative z-1 max-w-[80%] font-bold text-white/85 uppercase" :class="plate.label">
      {{ article.categoryName || 'Artikel Zenko' }}
    </p>
  </div>
</template>
