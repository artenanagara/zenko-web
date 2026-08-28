import type { Ref } from 'vue'

/**
 * Shared plumbing for the signed-in learner's own data (/me/*).
 *
 * These endpoints are gated by the session cookie, which is HttpOnly and
 * belongs to the API origin — the Nuxt server cannot read it, so asking during
 * SSR would always answer 401 and then contradict itself on hydration. So the
 * fetch is client-only, exactly like useAuth and useMyTutorApplication: the
 * server renders the loading state, the browser resolves it after mount with
 * `credentials: 'include'` so the cookie rides along.
 *
 * Every resource exposes the same four fields, so a page can render one set of
 * loading / error / empty / success branches regardless of which one it reads.
 */
export interface AsyncResource<T> {
  data: Ref<T>
  pending: Ref<boolean>
  error: Ref<unknown>
  refresh: () => Promise<void>
}

/**
 * Best-effort HTTP status from an ofetch error, for branching on 404/409
 * without reaching for `any`.
 */
export function apiErrorStatus(cause: unknown): number | undefined {
  const err = cause as { statusCode?: number, status?: number, response?: { status?: number } }
  return err?.statusCode ?? err?.status ?? err?.response?.status
}

/** A GET returning a list. Starts pending so SSR renders a skeleton, resolves on mount. */
export function useSessionCollection<T>(path: string): AsyncResource<T[]> {
  const { public: config } = useRuntimeConfig()

  const data = ref<T[]>([]) as Ref<T[]>
  const pending = ref(true)
  const error = ref<unknown>(null)

  async function refresh() {
    pending.value = true
    error.value = null
    try {
      data.value = await useApiFetch<T[]>(path, {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      error.value = cause
    }
    finally {
      pending.value = false
    }
  }

  onMounted(refresh)
  return { data, pending, error, refresh }
}

/**
 * A GET returning one record. A 404 hands off to the Nuxt error page — the
 * same outcome the mock path reaches by throwing synchronously — so an unknown
 * slug or invoice never renders an empty shell. Any other failure lands in
 * `error` for the page to offer a retry.
 */
export function useSessionItem<T>(path: string, notFoundMessage: string): AsyncResource<T | null> {
  const { public: config } = useRuntimeConfig()

  const data = ref<T | null>(null) as Ref<T | null>
  const pending = ref(true)
  const error = ref<unknown>(null)

  async function refresh() {
    pending.value = true
    error.value = null
    try {
      data.value = await useApiFetch<T>(path, {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch (cause) {
      if (apiErrorStatus(cause) === 404) {
        showError(createError({ statusCode: 404, statusMessage: notFoundMessage, fatal: true }))
        return
      }
      error.value = cause
    }
    finally {
      pending.value = false
    }
  }

  onMounted(refresh)
  return { data, pending, error, refresh }
}
