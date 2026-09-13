import type { Package, PackageDetail, PackagePage, SortKey, Testimonial } from '#shared/types/catalog'
import type { TryoutAnswerState, TryoutBlueprint, TryoutSampleScore } from '#shared/types/tryout'

/**
 * Thin wrappers around the zenko-api endpoints.
 */

/** The shape these wrappers expose to components. */
interface CatalogSource<T> {
  data: Ref<T>
  pending: Ref<boolean>
  error: Ref<unknown>
}

export function usePackages(sort: Ref<SortKey>): CatalogSource<Package[]> {
  const { public: config } = useRuntimeConfig()

  // `sort` is reactive, so switching tabs refetches automatically.
  const { data, pending, error } = useFetch<Package[]>('/packages', {
    baseURL: config.apiBase,
    // The homepage is a showcase, not the full catalogue. Keep the SSR
    // payload bounded as the number of live packages grows.
    query: { sort, limit: 12 },
    default: () => [],
  })

  return { data, pending, error }
}

/**
 * One page of the catalogue plus its facet counts, filtered server-side.
 *
 * `query` is reactive, so every filter change refetches. The catalogue used to
 * be fetched whole and filtered in the browser; that stops working once school
 * practice packages arrive in the thousands, and the facet counts can only be
 * computed over the whole matching set, which the client no longer holds.
 */
export function useBrowsePackages(query: Ref<Record<string, string | number>>) {
  const { public: config } = useRuntimeConfig()

  return useFetch<PackagePage>('/catalog/browse', {
    baseURL: config.apiBase,
    query,
    default: () => EMPTY_PAGE,
  })
}

/** Served while the first request is in flight, and after a failed one. */
const EMPTY_PAGE: PackagePage = {
  items: [],
  total: 0,
  page: 1,
  perPage: 24,
  facets: { categories: [], subcategories: [], prices: [], ratings: [] },
}

export function useTestimonials(): CatalogSource<Testimonial[]> {
  const { public: config } = useRuntimeConfig()

  const { data, pending, error } = useFetch<Testimonial[]>('/testimonials', {
    baseURL: config.apiBase,
    // Testimonials sit below the fold and are not part of the first paint.
    // Fetch them after hydration so a slow public endpoint cannot delay the
    // homepage's hero and catalogue response.
    server: false,
    lazy: true,
    default: () => [],
  })

  return { data, pending, error }
}

/**
 * Fetches one package. Throws a 404 so the Nuxt error page handles unknown
 * slugs, rather than rendering an empty detail page.
 */
export async function usePackageDetail(slug: string): Promise<Ref<PackageDetail>> {
  const { public: config } = useRuntimeConfig()

  const { data, error } = await useFetch<PackageDetail>(`/packages/${slug}`, {
    baseURL: config.apiBase,
  })

  if (error.value || !data.value) throw notFound()

  return data as Ref<PackageDetail>
}

/**
 * The free sample: a handful of the package's real questions, served without a
 * session so the catalogue can show what is inside. The API answers 404 for a
 * package that is not live or has no questions yet, which surfaces as the same
 * Nuxt error page as an unknown slug.
 *
 * The payload carries no answer keys — it is a showcase, and anything a public
 * endpoint returns is published.
 */
export async function useSampleBlueprint(slug: string): Promise<Ref<TryoutBlueprint>> {
  const { public: config } = useRuntimeConfig()

  const { data, error } = await useFetch<TryoutBlueprint>(`/packages/${slug}/sample`, {
    baseURL: config.apiBase,
  })

  if (error.value || !data.value) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Contoh soal untuk paket ini belum tersedia',
      fatal: true,
    })
  }

  return data as Ref<TryoutBlueprint>
}

/**
 * Grades a finished sample sitting. The API holds the answer key for these
 * questions — useSampleBlueprint deliberately arrives without one — so the
 * tally comes back over the wire instead of being computed in the browser.
 *
 * Answers go as a flat questionId → label map; a question left blank is simply
 * absent. Totals come from the sample the API itself picked, so skipping
 * questions lowers the score, never the number of questions.
 *
 * Errors are left to the caller: the try-out session turns a rejection into a
 * retry on the result screen rather than a score of zero.
 */
export async function gradeSampleAnswers(
  slug: string,
  answers: Record<string, TryoutAnswerState>,
): Promise<TryoutSampleScore> {
  const { public: config } = useRuntimeConfig()

  const picked: Record<string, string> = {}
  for (const [questionId, answer] of Object.entries(answers)) {
    if (answer?.selected) picked[questionId] = answer.selected
  }

  return await useApiFetch<TryoutSampleScore>(`/packages/${slug}/sample/score`, {
    baseURL: config.apiBase,
    method: 'POST',
    body: { answers: picked },
  })
}

/** Other packages in the same category, excluding the one being viewed. */
export function useRelatedPackages(category: string, excludeSlug: string) {
  const { public: config } = useRuntimeConfig()
  const limit = 4

  const { data } = useFetch<Package[]>('/packages', {
    baseURL: config.apiBase,
    // Fetch one extra so removing the current package still leaves `limit`.
    query: { category, limit: limit + 1 },
    default: () => [],
  })

  return computed(() =>
    (data.value ?? []).filter((item) => item.slug !== excludeSlug).slice(0, limit),
  )
}

function notFound() {
  return createError({
    statusCode: 404,
    statusMessage: 'Paket tidak ditemukan',
    fatal: true,
  })
}

/** Rp1.234.567 — the API returns plain integers in rupiah. */
export function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`
}
