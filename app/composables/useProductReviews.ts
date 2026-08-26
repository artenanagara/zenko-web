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
    try { data.value = await $fetch<ProductReview[]>(`/packages/${encodeURIComponent(slug)}/reviews`, { baseURL: config.apiBase }) }
    catch (cause) { error.value = tutorApiMessage(cause, 'Gagal memuat ulasan.') }
    finally { pending.value = false }
  }

  async function refreshMine() {
    try { mine.value = await $fetch<ProductReview | null>(`/packages/${encodeURIComponent(slug)}/reviews/my-review`, { baseURL: config.apiBase, credentials: 'include' }) }
    catch { mine.value = null }
  }

  async function save(input: ProductReviewInput) {
    const saved = await $fetch<ProductReview>(`/packages/${encodeURIComponent(slug)}/reviews`, { baseURL: config.apiBase, method: 'POST', body: input, credentials: 'include' })
    mine.value = saved
    await refresh()
    return saved
  }

  return { data, mine, pending, error, refresh, refreshMine, save }
}
