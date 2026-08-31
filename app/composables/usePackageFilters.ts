import type { Package, SortKey } from '#shared/types/catalog'

/**
 * Search + facet filtering for the catalogue page.
 *
 * Filtering runs in the browser over the whole package list rather than through
 * the API. zenko-api does support `q` and `category`, but only one category at
 * a time, and neither price nor rating — and the catalogue still fits in a
 * single response, so filtering locally keeps typing instant and lets the
 * sidebar show honest counts. Move this server-side once the catalogue outgrows
 * one response.
 */

/** One selectable row in the sidebar. */
export interface FacetOption {
  value: string
  label: string
  count: number
}

/** An active selection, plus the callback its chip needs to drop it. */
export interface ActiveFilter {
  key: string
  label: string
  remove: () => void
}

interface PriceBand {
  value: string
  label: string
  min: number
  /** Inclusive. Infinity for the open-ended top band. */
  max: number
}

interface RatingBand {
  value: string
  label: string
  min: number
}

const PRICE_BANDS: PriceBand[] = [
  { value: 'di-bawah-100', label: 'Di bawah Rp100rb', min: 0, max: 99_999 },
  { value: '100-150', label: 'Rp100rb – Rp150rb', min: 100_000, max: 150_000 },
  { value: '150-200', label: 'Rp150rb – Rp200rb', min: 150_001, max: 200_000 },
  { value: 'di-atas-200', label: 'Di atas Rp200rb', min: 200_001, max: Infinity },
]

/** Sentinel for "no rating filter", so the radio group always has a selection. */
const RATING_ANY = 'semua'

const RATING_BANDS: RatingBand[] = [
  { value: RATING_ANY, label: 'Semua rating', min: 0 },
  { value: '4.7', label: '4,7 ke atas', min: 4.7 },
  { value: '4.8', label: '4,8 ke atas', min: 4.8 },
  { value: '4.9', label: '4,9 ke atas', min: 4.9 },
]

/** Mirrors slugify in zenko-api/internal/store/memory.go. */
function slugifyCategory(label: string): string {
  return label.toLowerCase().replace(/[/\s]/g, '-')
}

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

export function usePackageFilters(source: Ref<Package[]>, sort: Ref<SortKey>) {
  const route = useRoute()
  const router = useRouter()

  const search = ref(readText(route.query.q))
  const categories = ref(readList(route.query.kategori))
  const subcategories = ref(readList(route.query.subkategori))
  const prices = ref(readList(route.query.harga))
  const rating = ref(readText(route.query.rating) || RATING_ANY)

  /** Only the non-default values, so a plain view keeps a clean URL. */
  function buildQuery(): Record<string, string> {
    const query: Record<string, string> = {}
    const term = search.value.trim()

    if (term) query.q = term
    if (categories.value.length > 0) query.kategori = categories.value.join(',')
    if (subcategories.value.length > 0) query.subkategori = subcategories.value.join(',')
    if (prices.value.length > 0) query.harga = prices.value.join(',')
    if (rating.value !== RATING_ANY) query.rating = rating.value
    if (sort.value !== 'featured') query.urutkan = sort.value

    return query
  }

  // State is mirrored into the URL so a filtered view survives a reload and can
  // be shared. replace(), not push(): Back should leave the page, not walk
  // backwards through every keystroke.
  watch([search, categories, subcategories, prices, rating, sort], () => {
    router.replace({ query: buildQuery() })
  })

  // Menghapus centang sebuah kategori ikut melepas sub-kategori miliknya —
  // sub-kategori tanpa induk terpilih akan memfilter diam-diam tanpa ada
  // chip kategori yang menjelaskannya. Berlaku juga saat kategori TERAKHIR
  // di-uncheck: semua sub-kategori terpilih ikut dibersihkan, bukan dibiarkan
  // yatim (watcher lama early-return pada daftar kosong).
  watch(categories, (selected, previous) => {
    if (subcategories.value.length === 0) return
    if (selected.length === 0) {
      // Hanya saat benar-benar transisi "ada kategori → tidak ada" — memilih
      // sub-kategori langsung tanpa kategori tetap sah dan tidak lewat sini.
      if (previous.length > 0) subcategories.value = []
      return
    }
    const allowed = new Set(
      source.value
        .filter((pkg) => pkg.subcategory && selected.includes(slugifyCategory(pkg.category)))
        .map((pkg) => slugifyCategory(pkg.subcategory)),
    )
    const kept = subcategories.value.filter((value) => allowed.has(value))
    if (kept.length !== subcategories.value.length) subcategories.value = kept
  })

  /**
   * Peta kategori induk → sub-kategori miliknya (slug), diturunkan dari
   * katalog itu sendiri. Ini yang membuat filter sub-kategori berlaku
   * per-kategori-induk: centang CPNS hanya menyaring paket SKD — paket TKA
   * tidak punya sub-kategori CPNS untuk dicocokkan, jadi tidak ikut tersaring.
   */
  const subcategoriesByCategory = computed(() => {
    const map = new Map<string, Set<string>>()
    for (const pkg of source.value) {
      if (!pkg.subcategory) continue
      const category = slugifyCategory(pkg.category)
      const set = map.get(category) ?? new Set<string>()
      set.add(slugifyCategory(pkg.subcategory))
      map.set(category, set)
    }
    return map
  })

  function matchesSearch(pkg: Package): boolean {
    const term = search.value.trim().toLowerCase()
    if (!term) return true

    return (
      pkg.title.toLowerCase().includes(term) ||
      pkg.author.name.toLowerCase().includes(term) ||
      pkg.category.toLowerCase().includes(term)
    )
  }

  function matchesCategory(pkg: Package): boolean {
    if (categories.value.length === 0) return true
    return categories.value.includes(slugifyCategory(pkg.category))
  }

  /**
   * Filter sub-kategori berlaku PER KATEGORI INDUK: sebuah paket hanya diadu
   * dengan sub-kategori terpilih yang memang milik kategorinya sendiri. Tidak
   * ada yang relevan untuk kategori itu → paketnya lolos, bukan tersaring
   * oleh sub-kategori kategori lain (CPNS terpilih tidak menyembunyikan TKA).
   */
  function matchesSubcategory(pkg: Package): boolean {
    if (subcategories.value.length === 0) return true
    const own = subcategoriesByCategory.value.get(slugifyCategory(pkg.category))
    const relevant = own ? subcategories.value.filter((value) => own.has(value)) : []
    if (relevant.length === 0) return true
    return !!pkg.subcategory && relevant.includes(slugifyCategory(pkg.subcategory))
  }

  function matchesPrice(pkg: Package): boolean {
    if (prices.value.length === 0) return true
    return PRICE_BANDS.some(
      (band) => prices.value.includes(band.value) && inBand(pkg.price, band),
    )
  }

  function matchesRating(pkg: Package): boolean {
    const band = RATING_BANDS.find((option) => option.value === rating.value)
    return !band || pkg.rating >= band.min
  }

  /**
   * Every filter except the one in `skip`. Leaving a group out of its own
   * counts is what makes a number read as "what you get if you tick this row"
   * rather than "what you have already".
   */
  function passes(pkg: Package, skip?: 'category' | 'subcategory' | 'price' | 'rating'): boolean {
    // Sub-kategori TIDAK ikut di-skip saat menghitung count kategori: dengan
    // semantik per-kategori-induk di matchesSubcategory, count sebuah
    // kategori sudah jujur — sub-kategori terpilih milik kategori lain tidak
    // menyaringnya, sedangkan sub-kategori miliknya sendiri memang akan tetap
    // berlaku saat baris kategori itu dicentang.
    return (
      matchesSearch(pkg) &&
      (skip === 'category' || matchesCategory(pkg)) &&
      (skip === 'subcategory' || matchesSubcategory(pkg)) &&
      (skip === 'price' || matchesPrice(pkg)) &&
      (skip === 'rating' || matchesRating(pkg))
    )
  }

  const filtered = computed(() => source.value.filter((pkg) => passes(pkg)))

  const categoryOptions = computed<FacetOption[]>(() => {
    // Categories come from the catalogue itself, so a new exam type on the API
    // shows up here without a frontend change.
    const labels = [...new Set(source.value.map((pkg) => pkg.category))]
    const pool = source.value.filter((pkg) => passes(pkg, 'category'))

    return labels.map((label) => ({
      value: slugifyCategory(label),
      label,
      count: pool.filter((pkg) => pkg.category === label).length,
    }))
  })

  /**
   * Facet level kedua (kategori -> sub-kategori). Pilihannya mengikuti
   * kategori yang sedang dicentang (semua kategori saat belum ada yang
   * dicentang), dan seperti facet lain, count-nya menghitung "apa yang kamu
   * dapat kalau baris ini dicentang".
   */
  const subcategoryOptions = computed<FacetOption[]>(() => {
    const inScope = (pkg: Package) =>
      !!pkg.subcategory &&
      (categories.value.length === 0 || categories.value.includes(slugifyCategory(pkg.category)))

    const labels: string[] = []
    for (const pkg of source.value) {
      if (inScope(pkg) && !labels.includes(pkg.subcategory)) labels.push(pkg.subcategory)
    }
    const pool = source.value.filter((pkg) => passes(pkg, 'subcategory'))

    return labels.map((label) => ({
      value: slugifyCategory(label),
      label,
      count: pool.filter((pkg) => pkg.subcategory === label).length,
    }))
  })

  const priceOptions = computed<FacetOption[]>(() => {
    const pool = source.value.filter((pkg) => passes(pkg, 'price'))

    return PRICE_BANDS.map((band) => ({
      value: band.value,
      label: band.label,
      count: pool.filter((pkg) => inBand(pkg.price, band)).length,
    }))
  })

  const ratingOptions = computed<FacetOption[]>(() => {
    const pool = source.value.filter((pkg) => passes(pkg, 'rating'))

    return RATING_BANDS.map((band) => ({
      value: band.value,
      label: band.label,
      count: pool.filter((pkg) => pkg.rating >= band.min).length,
    }))
  })

  const activeFilters = computed<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = []
    const term = search.value.trim()

    if (term) {
      chips.push({
        key: `q:${term}`,
        label: `“${term}”`,
        remove: () => {
          search.value = ''
        },
      })
    }

    for (const value of categories.value) {
      chips.push({
        key: `kategori:${value}`,
        label: labelFor(categoryOptions.value, value),
        remove: () => {
          categories.value = categories.value.filter((item) => item !== value)
        },
      })
    }

    for (const value of subcategories.value) {
      chips.push({
        key: `subkategori:${value}`,
        label: labelFor(subcategoryOptions.value, value),
        remove: () => {
          subcategories.value = subcategories.value.filter((item) => item !== value)
        },
      })
    }

    for (const value of prices.value) {
      chips.push({
        key: `harga:${value}`,
        label: labelFor(PRICE_BANDS, value),
        remove: () => {
          prices.value = prices.value.filter((item) => item !== value)
        },
      })
    }

    if (rating.value !== RATING_ANY) {
      chips.push({
        key: `rating:${rating.value}`,
        label: labelFor(RATING_BANDS, rating.value),
        remove: () => {
          rating.value = RATING_ANY
        },
      })
    }

    return chips
  })

  function reset() {
    search.value = ''
    categories.value = []
    subcategories.value = []
    prices.value = []
    rating.value = RATING_ANY
  }

  return {
    search,
    categories,
    subcategories,
    prices,
    rating,
    filtered,
    categoryOptions,
    subcategoryOptions,
    priceOptions,
    ratingOptions,
    activeFilters,
    activeCount: computed(() => activeFilters.value.length),
    reset,
  }
}

function inBand(price: number, band: PriceBand): boolean {
  return price >= band.min && price <= band.max
}

function labelFor(options: { value: string, label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}
