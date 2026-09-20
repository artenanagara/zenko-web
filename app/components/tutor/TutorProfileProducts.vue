<script setup lang="ts">
import type { Author, Package } from '#shared/types/catalog'
import type { PublicTutorProduct } from '#shared/types/public-tutor'

const props = defineProps<{
  items: PublicTutorProduct[]
  /** The tutor being viewed — every card on this page has the same author. */
  author: Author
  tutorName: string
}>()

/** How many cards render before the first "muat lagi". */
const PAGE_SIZE = 12

/**
 * The one place PublicTutorProduct becomes a Package.
 *
 * The profile used to draw its own card, which drifted from the catalogue's:
 * same paket, two different treatments depending on where you found it. It
 * renders catalog/PackageCard now, and this adapter is the price — the tutor
 * endpoint sends a leaner product than the catalogue does, and `author` is not
 * on it at all because every product in this list belongs to the tutor whose
 * profile you are reading.
 *
 * `rating` and `attemptLabel` come straight off the API. Nothing here invents
 * a value for them: a fabricated rating is worse than no card at all.
 */
function toPackage(item: PublicTutorProduct): Package {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    category: item.category,
    subcategory: item.subcategory,
    thumbnailUrl: item.thumbnailUrl,
    author: props.author,
    rating: item.rating,
    attemptLabel: item.attemptLabel,
    price: item.price,
    priceOriginal: item.priceOriginal,
  }
}

/* ── Filter & sort ─────────────────────────────────────────────────────── */

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'rating'

const SORT_OPTIONS: { key: SortKey, label: string }[] = [
  { key: 'newest', label: 'Terbaru' },
  { key: 'price-asc', label: 'Harga terendah' },
  { key: 'price-desc', label: 'Harga tertinggi' },
  { key: 'rating', label: 'Rating tertinggi' },
]

const ALL_CATEGORIES = '__all__'

const category = ref<string>(ALL_CATEGORIES)
const sort = ref<SortKey>('newest')

/**
 * Built from this tutor's own products, never from the global category list:
 * a tutor who only writes SKD paket must not be offered an SNBT filter that
 * can only ever return nothing.
 */
const categoryOptions = computed(() => {
  const counts = new Map<string, number>()
  for (const item of props.items) counts.set(item.category, (counts.get(item.category) ?? 0) + 1)

  return [
    { key: ALL_CATEGORIES, label: `Semua kategori (${props.items.length})` },
    ...[...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'id-ID'))
      .map(([label, count]) => ({ key: label, label: `${label} (${count})` })),
  ]
})

/** One option is not a choice, so the control would only be noise. */
const showCategoryFilter = computed(() => categoryOptions.value.length > 2)

const filteredItems = computed(() => {
  const matching = category.value === ALL_CATEGORIES
    ? props.items
    : props.items.filter(item => item.category === category.value)

  // Sorting a copy — props.items is the array the page owns.
  return [...matching].sort((a, b) => {
    switch (sort.value) {
      case 'price-asc': return a.price - b.price
      case 'price-desc': return b.price - a.price
      // Ties on rating fall back to newest, otherwise every unrated product
      // (rating 0) would sit in whatever order the API happened to send.
      case 'rating': return b.rating - a.rating || b.updatedAt - a.updatedAt
      default: return b.updatedAt - a.updatedAt
    }
  })
})

const isFiltered = computed(() => category.value !== ALL_CATEGORIES)

function clearFilters() {
  category.value = ALL_CATEGORIES
}

/* ── Paging ────────────────────────────────────────────────────────────── */

// Purely a render limit — the whole list already arrived with the page, so
// this costs no request and exists to keep a prolific tutor's profile from
// laying out 60 cards nobody scrolled to.
const visibleCount = ref(PAGE_SIZE)
const visibleItems = computed(() => filteredItems.value.slice(0, visibleCount.value))
const remaining = computed(() => filteredItems.value.length - visibleItems.value.length)

// A category chosen from one tutor's list must not survive into another's —
// same rule as the star filter on the Ulasan tab. Without this, navigating
// between profiles could leave a filter set to a category the new tutor does
// not have, which is the only way the empty state below is reachable at all.
watch(() => props.items, () => {
  category.value = ALL_CATEGORIES
  visibleCount.value = PAGE_SIZE
})

// Changing what the list contains, or the order it is in, restarts paging —
// keeping the old offset would cut the new list at a position chosen for the
// old one. Same rule as the star filter on the Ulasan tab.
watch([category, sort], () => (visibleCount.value = PAGE_SIZE))

const productList = ref<HTMLElement | null>(null)

/**
 * The button unmounts as soon as the list is exhausted, which would leave
 * keyboard focus on <body>. In that case focus lands on the first card that
 * just appeared instead — each card's title is a link, so it is focusable.
 */
function loadMore() {
  const firstNewIndex = visibleCount.value
  visibleCount.value += PAGE_SIZE
  nextTick(() => {
    if (remaining.value > 0) return
    const cards = productList.value?.querySelectorAll<HTMLElement>('[data-product-item] h3 a')
    cards?.[firstNewIndex]?.focus()
  })
}
</script>

<template>
  <section>
    <div v-if="items.length">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-[1.25rem] font-bold tracking-[-0.03em]">Paket tryout</h2>
          <p class="mt-1 text-[0.92rem] text-muted" aria-live="polite">
            Menampilkan {{ visibleItems.length }} dari {{ filteredItems.length }} paket
            {{ isFiltered ? `kategori ${category}` : `aktif dari ${tutorName}` }}.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <AppMenuSelect
            v-if="showCategoryFilter"
            v-model="category"
            :options="categoryOptions"
            label="Kategori"
            menu-label="Saring paket menurut kategori"
            menu-width-class="w-60"
          />
          <AppMenuSelect
            v-model="sort"
            :options="SORT_OPTIONS"
            label="Urutkan"
            menu-label="Urutkan paket tutor"
          />
        </div>
      </div>

      <div
        v-if="visibleItems.length"
        ref="productList"
        class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <PackageCard
          v-for="item in visibleItems"
          :key="item.id"
          :item="toPackage(item)"
          data-product-item
        />
      </div>

      <!-- Reachable only through the category filter, and the way out is the
           filter itself — an empty grid with the control still set would look
           like the tutor lost their paket. -->
      <div v-else class="mt-5 rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
        <p class="font-bold tracking-[-0.02em]">Paket di kategori {{ category }} belum tersedia.</p>
        <p class="mx-auto mt-1.5 max-w-100 text-[0.92rem] leading-[1.6] text-muted">
          Kategori lain milik {{ tutorName }} masih ada isinya.
        </p>
        <AppButton variant="outline" size="sm" class="mt-5 min-h-11 bg-surface" @click="clearFilters">
          Tampilkan semua kategori
        </AppButton>
      </div>

      <div v-if="remaining > 0" class="mt-8 flex justify-center">
        <AppButton variant="outline" size="sm" class="min-h-11 bg-surface" @click="loadMore">
          Muat {{ Math.min(remaining, PAGE_SIZE) }} paket lagi
          <AppIcon name="caret-down" :size="16" weight="bold" />
        </AppButton>
      </div>
    </div>

    <TutorProfileEmpty
      v-else
      icon="squares-four"
      title="Paketnya belum tayang"
      :description="`${tutorName} belum menerbitkan paket tryout. Cari paket dari tutor lain sambil menunggu.`"
    >
      <template #action>
        <AppButton to="/paket" variant="outline" size="sm" class="min-h-11 bg-surface">
          Jelajahi paket
        </AppButton>
      </template>
    </TutorProfileEmpty>
  </section>
</template>
