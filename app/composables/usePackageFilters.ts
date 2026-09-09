import type { FacetCount, SortKey } from '#shared/types/catalog'

/**
 * Search + facet state for the catalogue page.
 *
 * This composable owns the selection and keeps it in the URL; the matching,
 * counting and paging happen in zenko-api (GET /catalog/browse). It used to do
 * all of that here, over the whole catalogue fetched in one response — fine
 * while the catalogue was small, and explicitly marked to move server-side
 * before it outgrew one response. School practice packages are what outgrow
 * it: they are counted in thousands (docs/riset-latihan-mapel-sekolah.md §5).
 *
 * Facet rows now arrive already counted, so the labels and the price/rating
 * bands live server-side too — the label a reader sees and the range that
 * filtered them can no longer drift apart.
 */

/** One selectable row in the sidebar, as the server counted it. */
export type FacetOption = FacetCount

/** An active selection, plus the callback its chip needs to drop it. */
export interface ActiveFilter {
  key: string
  label: string
  remove: () => void
}

/**
 * Sentinel for "no rating filter", so the radio group always has a selection.
 * Mirrors service.RatingAny in zenko-api.
 */
const RATING_ANY = 'semua'

function parseSort(raw: unknown): SortKey {
  return raw === 'bestseller' || raw === 'newest' ? raw : 'featured'
}

function readText(raw: unknown): string {
  return typeof raw === 'string' ? raw : ''
}

function readList(raw: unknown): string[] {
  return readText(raw)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

/**
 * Sort order taken from the URL. Separate from usePackageFilters because the
 * fetch needs it before there is any package list to filter.
 */
export function useSortQuery(): Ref<SortKey> {
  return ref(parseSort(useRoute().query.urutkan))
}

export function usePackageFilters(sort: Ref<SortKey>) {
  const route = useRoute()
  const router = useRouter()

  const search = ref(readText(route.query.q))
  const categories = ref(readList(route.query.kategori))
  const subcategories = ref(readList(route.query.subkategori))
  const prices = ref(readList(route.query.harga))
  const rating = ref(readText(route.query.rating) || RATING_ANY)
  const page = ref(Number(readText(route.query.halaman)) || 1)

  /**
   * Typing is debounced before it reaches the server; every other control is
   * a single click and refetches at once. Without this, one search term costs
   * a request per keystroke — the thing the old local filtering never had to
   * worry about.
   */
  const debouncedSearch = ref(search.value)
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  watch(search, (value) => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => { debouncedSearch.value = value }, 300)
  })
  onScopeDispose(() => clearTimeout(searchTimer))

  /** Only the non-default values, so a plain view keeps a clean URL. */
  function buildQuery(): Record<string, string> {
    const query: Record<string, string> = {}
    const term = search.value.trim()
    if (term) query.q = term
    if (categories.value.length) query.kategori = categories.value.join(',')
    if (subcategories.value.length) query.subkategori = subcategories.value.join(',')
    if (prices.value.length) query.harga = prices.value.join(',')
    if (rating.value !== RATING_ANY) query.rating = rating.value
    if (sort.value !== 'featured') query.urutkan = sort.value
    if (page.value > 1) query.halaman = String(page.value)
    return query
  }

  // Any change to what is being filtered puts you back on page one: staying on
  // page 4 of a result set that just shrank to one page shows nothing at all.
  watch([debouncedSearch, categories, subcategories, prices, rating, sort], () => {
    page.value = 1
  }, { deep: true })

  watch([search, categories, subcategories, prices, rating, sort, page], () => {
    router.replace({ query: buildQuery() })
  }, { deep: true })

  const requestQuery = computed<Record<string, string | number>>(() => {
    const query: Record<string, string | number> = { sort: sort.value, page: page.value }
    const term = debouncedSearch.value.trim()
    if (term) query.q = term
    if (categories.value.length) query.kategori = categories.value.join(',')
    if (subcategories.value.length) query.subkategori = subcategories.value.join(',')
    if (prices.value.length) query.harga = prices.value.join(',')
    if (rating.value !== RATING_ANY) query.rating = rating.value
    return query
  })

  const { data, pending, error } = useBrowsePackages(requestQuery)

  const facets = computed(() => data.value.facets)
  const activeFilters = computed<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = []
    const term = search.value.trim()

    if (term) {
      chips.push({ key: `q:${term}`, label: `“${term}”`, remove: () => { search.value = '' } })
    }
    const drop = (list: Ref<string[]>, value: string) => () => {
      list.value = list.value.filter(item => item !== value)
    }
    for (const value of categories.value) {
      chips.push({ key: `kategori:${value}`, label: labelFor(facets.value.categories, value), remove: drop(categories, value) })
    }
    for (const value of subcategories.value) {
      chips.push({ key: `subkategori:${value}`, label: labelFor(facets.value.subcategories, value), remove: drop(subcategories, value) })
    }
    for (const value of prices.value) {
      chips.push({ key: `harga:${value}`, label: labelFor(facets.value.prices, value), remove: drop(prices, value) })
    }
    if (rating.value !== RATING_ANY) {
      chips.push({
        key: `rating:${rating.value}`,
        label: labelFor(facets.value.ratings, rating.value),
        remove: () => { rating.value = RATING_ANY },
      })
    }
    return chips
  })

  function reset() {
    search.value = ''
    debouncedSearch.value = ''
    categories.value = []
    subcategories.value = []
    prices.value = []
    rating.value = RATING_ANY
    page.value = 1
  }

  const perPage = computed(() => data.value.perPage)
  const total = computed(() => data.value.total)

  return {
    search,
    categories,
    subcategories,
    prices,
    rating,
    page,
    perPage,
    total,
    pageCount: computed(() => Math.max(1, Math.ceil(total.value / Math.max(perPage.value, 1)))),
    /** The current page of results. Named for the page component it feeds. */
    filtered: computed(() => data.value.items),
    pending,
    error,
    categoryOptions: computed(() => facets.value.categories),
    subcategoryOptions: computed(() => facets.value.subcategories),
    priceOptions: computed(() => facets.value.prices),
    ratingOptions: computed(() => facets.value.ratings),
    activeFilters,
    activeCount: computed(() => activeFilters.value.length),
    reset,
  }
}

function labelFor(options: FacetOption[], value: string): string {
  return options.find(option => option.value === value)?.label ?? value
}
