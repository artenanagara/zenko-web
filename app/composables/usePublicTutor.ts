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
 * Reviews are fetched through Nuxt's SSR-aware useFetch, so public review
 * content is present in the initial HTML and still supports client retries.
 *
 * `refresh()` swallows nothing: a failed `$fetch` used to escape as an
 * unhandled rejection and leave the panel silently empty forever, which is
 * indistinguishable from a tutor with no reviews. `error` lets the panel say
 * so and offer a retry.
 */
export function usePublicTutorReviews(username: string) {
  const { public: config } = useRuntimeConfig()
  const { data, pending, error, refresh: fetchReviews } = useFetch<ProductReview[]>(
    `/tutors/${encodeURIComponent(username)}/reviews`,
    { baseURL: config.apiBase, default: () => [] },
  )

  async function refresh() {
    await fetchReviews()
  }
  return { data, pending, error: computed(() => !!error.value), refresh }
}
