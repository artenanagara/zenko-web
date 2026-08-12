import type { Package, PackageDetail, SortKey, Testimonial } from '~~/types/catalog'
import { mockPackages, mockTestimonials, sortMockPackages } from '~/mocks/catalog'
import { findMockDetail } from '~/mocks/detail'

/**
 * Thin wrappers around the zenko-api endpoints.
 *
 * When NUXT_PUBLIC_USE_MOCK=true they resolve from local fixtures instead, so
 * the UI can be developed without the backend running. The flag defaults to
 * false, so a production build never serves mock data by accident.
 */

/** The shape both the live and mock paths expose to components. */
interface CatalogSource<T> {
  data: Ref<T>
  pending: Ref<boolean>
  error: Ref<unknown>
}

export function usePackages(sort: Ref<SortKey>): CatalogSource<Package[]> {
  const { public: config } = useRuntimeConfig()

  if (config.useMock) {
    return {
      data: computed(() => sortMockPackages(mockPackages, sort.value)),
      pending: ref(false),
      error: ref(null),
    }
  }

  // `sort` is reactive, so switching tabs refetches automatically.
  const { data, pending, error } = useFetch<Package[]>('/packages', {
    baseURL: config.apiBase,
    query: { sort },
    default: () => [],
  })

  return { data, pending, error }
}

export function useTestimonials(): CatalogSource<Testimonial[]> {
  const { public: config } = useRuntimeConfig()

  if (config.useMock) {
    return {
      data: computed(() => mockTestimonials),
      pending: ref(false),
      error: ref(null),
    }
  }

  const { data, pending, error } = useFetch<Testimonial[]>('/testimonials', {
    baseURL: config.apiBase,
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

  if (config.useMock) {
    const detail = findMockDetail(slug)
    if (!detail) throw notFound()

    return ref(detail)
  }

  const { data, error } = await useFetch<PackageDetail>(`/packages/${slug}`, {
    baseURL: config.apiBase,
  })

  if (error.value || !data.value) throw notFound()

  return data as Ref<PackageDetail>
}

/** Other packages in the same category, excluding the one being viewed. */
export function useRelatedPackages(category: string, excludeSlug: string) {
  const { public: config } = useRuntimeConfig()
  const limit = 4

  if (config.useMock) {
    return computed(() =>
      mockPackages
        .filter((item) => item.category === category && item.slug !== excludeSlug)
        .slice(0, limit),
    )
  }

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
