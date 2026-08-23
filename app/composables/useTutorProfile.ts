import type { TutorProfile, TutorProfileInput } from '#shared/types/tutor-profile'

/**
 * The tutor-authored side of a tutor's account: bio, experience,
 * specialisation tags, social links. Client-only, same reason as
 * useTutorBankAccount — the session cookie never reaches the Nuxt server.
 *
 * Unlike the bank account endpoints, GET never 404s: a settings form always
 * has something to render, so an unsaved profile comes back as empty fields
 * rather than an error to special-case.
 */
export function useTutorProfile() {
  const { public: config } = useRuntimeConfig()

  const data = ref<TutorProfile | null>(null)
  const pending = ref(false)
  const error = ref('')

  async function refresh() {
    pending.value = true
    error.value = ''
    try {
      data.value = await $fetch<TutorProfile>('/tutor/profile', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = tutorApiMessage(cause, 'Gagal memuat profil tutor.')
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, error, refresh }
}

/** PUT /tutor/profile — a full replace; there is no partial-field update. */
export async function saveTutorProfile(input: TutorProfileInput): Promise<TutorProfile> {
  const { public: config } = useRuntimeConfig()

  return await $fetch<TutorProfile>('/tutor/profile', {
    baseURL: config.apiBase,
    method: 'PUT',
    body: input,
    credentials: 'include',
  })
}
