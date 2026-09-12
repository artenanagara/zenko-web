import type { ProductReview, ProductReviewInput } from '#shared/types/product-review'

export function useProductReviews(slug: string) {
  const { public: config } = useRuntimeConfig()
  const { data, pending, error: requestError, refresh: fetchReviews } = useFetch<ProductReview[]>(
    `/packages/${encodeURIComponent(slug)}/reviews`,
    { baseURL: config.apiBase, default: () => [] },
  )
  const mine = ref<ProductReview | null>(null)
  const error = ref('')

  async function refresh() {
    error.value = ''
    await fetchReviews()
    if (requestError.value) error.value = tutorApiMessage(requestError.value, 'Ulasan belum berhasil dimuat.')
  }

  async function refreshMine() {
    try { mine.value = await useApiFetch<ProductReview | null>(`/packages/${encodeURIComponent(slug)}/reviews/my-review`, { baseURL: config.apiBase, credentials: 'include' }) }
    catch { mine.value = null }
  }

  // Deliberately does not call refresh(): only the public paket page shows the
  // full list, and on the account page that extra request fetches a list
  // nothing renders. Call sites that display the list refresh it themselves.
  async function save(input: ProductReviewInput) {
    const saved = await useApiFetch<ProductReview>(`/packages/${encodeURIComponent(slug)}/reviews`, { baseURL: config.apiBase, method: 'POST', body: input, credentials: 'include' })
    mine.value = saved
    return saved
  }

  return { data, mine, pending, error, refresh, refreshMine, save }
}
