import type { ProductReview, ProductReviewInput } from '#shared/types/product-review'

export function useProductReviews(slug: string) {
  const { public: config } = useRuntimeConfig()
  const data = ref<ProductReview[]>([])
  const mine = ref<ProductReview | null>(null)
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try { data.value = await useApiFetch<ProductReview[]>(`/packages/${encodeURIComponent(slug)}/reviews`, { baseURL: config.apiBase }) }
    catch (cause) { error.value = tutorApiMessage(cause, 'Ulasan belum berhasil dimuat.') }
    finally { pending.value = false }
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
