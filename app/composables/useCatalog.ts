import type { Package, SortKey, Testimonial } from '~~/types/catalog'
import { mockPackages, mockTestimonials, sortMockPackages } from '~/mocks/catalog'

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

/** Rp1.234.567 — the API returns plain integers in rupiah. */
export function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`
}
