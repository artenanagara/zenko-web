import type { PublicTutorDetail } from '#shared/types/public-tutor'
import type { ProductReview } from '#shared/types/product-review'

export async function usePublicTutor(username: string): Promise<Ref<PublicTutorDetail>> {
  const { public: config } = useRuntimeConfig()
  const { data, error } = await useFetch<PublicTutorDetail>(`/tutors/${encodeURIComponent(username)}`, {
    baseURL: config.apiBase,
  })
  if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: 'Tutor tidak ditemukan', fatal: true })
  return data as Ref<PublicTutorDetail>
}

export function usePublicTutorReviews(username: string) {
  const { public: config } = useRuntimeConfig()
  const data = ref<ProductReview[]>([])
  const pending = ref(false)
  async function refresh() {
    pending.value = true
    try { data.value = await $fetch<ProductReview[]>(`/tutors/${encodeURIComponent(username)}/reviews`, { baseURL: config.apiBase }) }
    finally { pending.value = false }
  }
  return { data, pending, refresh }
}
