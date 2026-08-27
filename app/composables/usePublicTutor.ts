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

/**
 * Reviews are fetched after hydration, so the caller renders a skeleton while
 * `pending`. It starts `true`, not `false`: the server-rendered HTML would
 * otherwise say "belum ada ulasan" and flip to a list a moment later — a lie
 * on first paint, and the worst one on a `?tab=ulasan` deep link.
 *
 * `refresh()` swallows nothing: a failed `$fetch` used to escape as an
 * unhandled rejection and leave the panel silently empty forever, which is
 * indistinguishable from a tutor with no reviews. `error` lets the panel say
 * so and offer a retry.
 */
export function usePublicTutorReviews(username: string) {
  const { public: config } = useRuntimeConfig()
  const data = ref<ProductReview[]>([])
  const pending = ref(true)
  const error = ref(false)
  async function refresh() {
    pending.value = true
    error.value = false
    try { data.value = await $fetch<ProductReview[]>(`/tutors/${encodeURIComponent(username)}/reviews`, { baseURL: config.apiBase }) }
    catch { error.value = true }
    finally { pending.value = false }
  }
  return { data, pending, error, refresh }
}
