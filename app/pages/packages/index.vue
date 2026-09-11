<script setup lang="ts">
// English file name, Indonesian URL.
definePageMeta({ path: '/paket' })

useSeoMeta({
  title: 'Katalog Paket Tryout | Zenko',
  description:
    'Jelajahi paket latihan tryout SKD (CPNS & Sekolah Kedinasan) dan TKA (SD, SMP, SMA, SMK) di Zenko. Beli per paket, akses langsung, tanpa langganan.',
  ogTitle: 'Katalog Paket Tryout | Zenko',
  ogDescription:
    'Jelajahi paket latihan tryout SKD (CPNS & Sekolah Kedinasan) dan TKA (SD, SMP, SMA, SMK) di Zenko. Beli per paket, akses langsung, tanpa langganan.',
  ...DEFAULT_OG,
  ogUrl: 'https://zenkoedu.id/paket',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/paket' }],
})

// Sort is read from the URL first: the request needs an order before there is
// anything to show.
const sort = useSortQuery()

// One composable now: it owns the selection AND the request, because the
// server does the matching and returns the page and its facet counts together.
const {
  search,
  categories,
  subcategories,
  prices,
  rating,
  page,
  total,
  pageCount,
  filtered,
  pending,
  error,
  categoryOptions,
  subcategoryOptions,
  priceOptions,
  ratingOptions,
  activeFilters,
  activeCount,
  reset,
} = usePackageFilters(sort)

const resultsRef = ref<HTMLElement | null>(null)

/**
 * Turning a page scrolls back to the top of the results, not the top of the
 * document: the sidebar stays where it was, and the first new card is what
 * the reader is looking for.
 */
function goToPage(target: number) {
  page.value = Math.min(Math.max(target, 1), pageCount.value)
  resultsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// The sidebar is a plain disclosure on mobile rather than a modal: it sits
// above the results, so closing it lands you right on what changed.
const showFilters = ref(false)
</script>

<template>
  <main>
    <div class="container-page">
      <!-- No items-start: the sidebar column stretches, which is what lets the
           panel inside it stick for the whole length of the results. -->
      <div class="grid grid-cols-1 min-[901px]:grid-cols-[276px_minmax(0,1fr)] min-[901px]:gap-8">
        <div class="py-4 min-[901px]:py-8">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-xs border border-hairline-strong bg-surface px-4 py-3 font-semibold shadow-xs min-[901px]:hidden"
            :aria-expanded="showFilters"
            aria-controls="catalog-filters"
            @click="showFilters = !showFilters"
          >
            <span>
              Filter
              <span v-if="activeCount > 0" class="ml-1 text-primary">({{ activeCount }})</span>
            </span>
            <IconChevron
              class="h-4 w-4 shrink-0 text-faint transition-transform duration-200 ease-smooth"
              :class="showFilters ? '' : '-rotate-90'"
            />
          </button>

          <div
            id="catalog-filters"
            :class="showFilters ? 'block' : 'hidden'"
            class="mt-4 min-[901px]:mt-0 min-[901px]:block min-[901px]:sticky min-[901px]:top-24"
          >
            <!-- The panel can outgrow a short viewport, and a stuck element
                 taller than the screen puts its last rows out of reach — so it
                 scrolls inside itself. Overflow on the panel does not clip its
                 own shadow, and the ancestors stay overflow-visible, which is
                 what keeps the sticky working. -->
            <FilterSidebar
              class="min-[901px]:max-h-[calc(100vh-7rem)] min-[901px]:overflow-y-auto"
              v-model:categories="categories"
              v-model:subcategories="subcategories"
              v-model:prices="prices"
              v-model:rating="rating"
              :category-options="categoryOptions"
              :subcategory-options="subcategoryOptions"
              :price-options="priceOptions"
              :rating-options="ratingOptions"
              :active-count="activeCount"
              @reset="reset"
            />
          </div>
        </div>

        <div class="pb-8 min-[901px]:pt-8">
          <!-- Left: what you are looking at. Right: the two controls that
               change it. -->
          <div class="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <h1 class="flex items-center gap-2.5 text-[1.1rem] font-bold tracking-[-0.03em]">
              <IconGrid class="h-5 w-5 text-primary" />
              Semua paket
              <!-- The total across every page, not this page's length: a
                   number that read "24" on each of four pages would describe
                   nothing the reader is looking at. -->
              <span class="font-medium text-muted" aria-live="polite">
                <template v-if="pending">(memuat…)</template>
                <template v-else>({{ total }})</template>
              </span>
            </h1>

            <div class="flex w-full flex-col gap-3 min-[560px]:w-auto min-[560px]:flex-row min-[560px]:items-center">
              <CatalogSearch v-model="search" class="min-[560px]:w-64 min-[1101px]:w-72" />
              <SortDropdown v-model="sort" />
            </div>
          </div>

          <ul v-if="activeFilters.length > 0" class="mb-6 flex flex-wrap items-center gap-2">
            <li v-for="filter in activeFilters" :key="filter.key">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xs bg-primary-soft py-1.5 pr-2 pl-3 text-[0.85rem] font-semibold text-primary transition-colors duration-200 ease-smooth hover:bg-primary/15"
                :aria-label="`Hapus filter ${filter.label}`"
                @click="filter.remove()"
              >
                {{ filter.label }}
                <IconClose class="h-3.5 w-3.5" />
              </button>
            </li>
            <li>
              <button
                type="button"
                class="rounded-xs px-2 py-1.5 text-[0.85rem] font-semibold text-muted transition-colors duration-200 hover:text-ink"
                @click="reset"
              >
                Hapus semua filter
              </button>
            </li>
          </ul>

          <div ref="resultsRef" class="scroll-mt-24" />

          <PackageGrid :items="filtered" :pending="pending" :error="error" :skeleton-count="9">
            <template #empty>
              <div class="rounded-lg bg-surface-sunken px-6 py-16 text-center">
                <p class="font-bold tracking-[-0.02em]">Paketnya belum ketemu</p>
                <p class="mx-auto mt-2 max-w-90 text-[0.94rem] text-muted">
                  Coba kata kunci lain atau kurangi filter yang aktif. Siapa tahu paket yang pas sedang bersembunyi.
                </p>
                <AppButton class="mt-6" @click="reset">Atur ulang filter</AppButton>
              </div>
            </template>
          </PackageGrid>

          <!-- Pager. Hidden on a single page, because a control that cannot do
               anything still asks to be read. -->
          <nav
            v-if="pageCount > 1"
            class="mt-8 flex flex-wrap items-center justify-center gap-2"
            aria-label="Halaman katalog"
          >
            <AppButton
              variant="outline"
              size="sm"
              :disabled="page <= 1 || pending"
              @click="goToPage(page - 1)"
            >
              Sebelumnya
            </AppButton>

            <span class="px-3 text-[0.9rem] font-semibold text-muted tabular-nums" aria-live="polite">
              Halaman {{ page }} dari {{ pageCount }}
            </span>

            <AppButton
              variant="outline"
              size="sm"
              :disabled="page >= pageCount || pending"
              @click="goToPage(page + 1)"
            >
              Berikutnya
            </AppButton>
          </nav>
        </div>
      </div>
    </div>
  </main>
</template>
