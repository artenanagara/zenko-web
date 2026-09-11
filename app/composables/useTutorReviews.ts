import type { ProductReview } from '#shared/types/product-review'

export function useTutorReviews() {
  const { public: config } = useRuntimeConfig()
  const data = ref<ProductReview[]>([])
  const pending = ref(false)
  const error = ref('')
  async function refresh() {
    pending.value = true
    error.value = ''
    try { data.value = await useApiFetch<ProductReview[]>('/tutor/reviews', { baseURL: config.apiBase, credentials: 'include' }) }
    catch (cause) { error.value = tutorApiMessage(cause, 'Ulasan tutor belum berhasil dimuat.') }
    finally { pending.value = false }
  }
  async function reply(reviewId: string, text: string) {
    await useApiFetch(`/tutor/reviews/${reviewId}/reply`, { baseURL: config.apiBase, method: 'POST', body: { reply: text }, credentials: 'include' })
    await refresh()
  }
  return { data, pending, error, refresh, reply }
}
