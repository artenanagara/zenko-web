/**
 * Search + filter + sort for a dashboard table, in one place.
 *
 * Every dashboard table used to filter with AppTabs, which could only ever
 * express one axis (and hid the rest of the rows behind a second click). The
 * admin queues and the tutor's own lists now share this composable and
 * DashboardTableToolbar instead, so they behave identically: the page supplies
 * the searchable fields, the filter predicates and the sort comparators, and
 * gets back the rows to render plus the state the toolbar needs.
 *
 * Filtering runs in the browser over the list the page already fetched — same
 * reasoning as usePackageFilters: these datasets fit in a single response, and
 * local filtering keeps typing instant. Move it server-side once a table
 * outgrows one response. Where the server already owns an axis (tutor
 * Penjualan's period), the matching predicates are `() => true` and the page
 * watches the filter ref to refetch.
 */

/** One option in the toolbar's filter or sort dropdown (AppSelect's shape). */
export interface TableControlOption {
  value: string
  label: string
}

export interface TableControlsConfig<T> {
  /**
   * The text a row can be found by. Nullish entries are skipped, so an
   * optional field can be listed without a guard at the call site.
   */
  searchFields: (row: T) => (string | null | undefined)[]
  /** Filter value → predicate. Needs an entry for every filter option. */
  filters: Record<string, (row: T) => boolean>
  /** Sort value → comparator. Needs an entry for every sort option. */
  sorts: Record<string, (a: T, b: T) => number>
  /**
   * What the page lands on. For a queue this must be the actionable subset
   * (Menunggu, Antrean, Belum diverifikasi …), never "Semua": an admin opening
   * the page still sees only what needs deciding, exactly like the old default
   * tab. An inventory table with no queue behind it (tutor "Produk saya") is
   * the exception — it lands on every row, because that is what its owner came
   * to see; the actionable count then rides in the toolbar summary instead.
   */
  defaultFilter: string
  /** The page's default ordering. */
  defaultSort: string
}

export function useTableControls<T>(source: MaybeRefOrGetter<T[]>, config: TableControlsConfig<T>) {
  const search = ref('')
  const filter = ref(config.defaultFilter)
  const sort = ref(config.defaultSort)

  /** Case-insensitive: both the term and the fields are lowercased once. */
  const term = computed(() => search.value.trim().toLowerCase())

  function matchesSearch(row: T): boolean {
    if (!term.value) return true
    return config.searchFields(row).some(
      field => typeof field === 'string' && field.toLowerCase().includes(term.value),
    )
  }

  function matchesFilter(row: T): boolean {
    const predicate = config.filters[filter.value]
    // An unknown value can only come from a bad option list; showing everything
    // is the safe read (never silently blank the table).
    return predicate ? predicate(row) : true
  }

  const total = computed(() => toValue(source).length)

  const rows = computed<T[]>(() => {
    const matched = toValue(source).filter(row => matchesFilter(row) && matchesSearch(row))
    const compare = config.sorts[sort.value]
    if (!compare) return matched

    // Decorated with the incoming index so ties keep their original order.
    // Array#sort is stable per spec; the explicit tiebreak also keeps rows put
    // when a comparator returns 0 for two genuinely different rows (same
    // timestamp, same name), which is where "stable" actually gets noticed.
    return matched
      .map((row, index) => ({ row, index }))
      .sort((a, b) => compare(a.row, b.row) || a.index - b.index)
      .map(entry => entry.row)
  })

  /**
   * True while anything sits off its default. Drives two things: whether Reset
   * is offered, and which empty state the page shows — an empty default view is
   * "the queue is clear", an empty filtered view is "nothing matched".
   */
  const isActive = computed(() =>
    term.value !== ''
    || filter.value !== config.defaultFilter
    || sort.value !== config.defaultSort,
  )

  function reset() {
    search.value = ''
    filter.value = config.defaultFilter
    sort.value = config.defaultSort
  }

  return { search, filter, sort, rows, total, isActive, reset }
}
