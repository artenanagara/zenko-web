import type { TutorApplication, TutorApplicationDraft } from '#shared/types/tutor-application'
import { adminApplications } from '~/mocks/dashboard'

/**
 * Tutor applications: submitting one, reading your own, and the admin review
 * list.
 *
 * Every call carries the session cookie — applying requires an account, since
 * approval grants the tutor role to one.
 *
 * Mirrors useCatalog — when NUXT_PUBLIC_USE_MOCK is on, the admin list resolves
 * from fixtures so the dashboard can be worked on without the backend running.
 */

/** Admin-only list. The API rejects this with 403 for any other role. */
export function useAdminTutorApplications() {
  const { public: config } = useRuntimeConfig()

  if (config.useMock) {
    return {
      data: computed(() => adminApplications),
      pending: ref(false),
      error: ref<unknown>(null),
      refresh: async () => {},
    }
  }

  const { data, pending, error, refresh } = useFetch<TutorApplication[]>('/admin/tutor-applications', {
    baseURL: config.apiBase,
    credentials: 'include',
    default: () => [],
  })

  return { data, pending, error, refresh }
}

/** Submits the become-a-tutor form. Throws on any non-2xx. */
export async function submitTutorApplication(draft: TutorApplicationDraft): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await $fetch('/tutor-applications', {
    baseURL: config.apiBase,
    method: 'POST',
    body: draft,
    credentials: 'include',
  })
}

/**
 * The caller's most recent application, or null when they have never applied.
 *
 * Client-only, and not a useFetch: the session lives in a cookie the Nuxt
 * server cannot read, so asking during SSR would always answer "none" and then
 * contradict itself on hydration.
 */
export function useMyTutorApplication() {
  const { public: config } = useRuntimeConfig()

  const data = ref<TutorApplication | null>(null)
  const pending = ref(false)

  async function refresh() {
    pending.value = true
    try {
      data.value = await $fetch<TutorApplication>('/tutor-applications/me', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch {
      // 404 is the ordinary "hasn't applied yet" answer, and a signed-out 401
      // is handled by the page showing the sign-in prompt instead.
      data.value = null
    }
    finally {
      pending.value = false
    }
  }

  return { data, pending, refresh }
}
