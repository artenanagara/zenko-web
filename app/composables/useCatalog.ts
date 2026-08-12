import type { Package, SortKey, Testimonial } from '~~/types/catalog'

/**
 * Thin wrappers around the zenko-api endpoints.
 *
 * `sort` is a ref so switching tabs refetches automatically — useFetch
 * re-runs whenever a reactive URL or query value changes.
 */
export function usePackages(sort: Ref<SortKey>) {
  const { public: config } = useRuntimeConfig()

  return useFetch<Package[]>('/packages', {
    baseURL: config.apiBase,
    query: { sort },
    default: () => [],
  })
}

export function useTestimonials() {
  const { public: config } = useRuntimeConfig()

  return useFetch<Testimonial[]>('/testimonials', {
    baseURL: config.apiBase,
    default: () => [],
  })
}

/** Rp1.234.567 — the API returns plain integers in rupiah. */
export function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`
}
