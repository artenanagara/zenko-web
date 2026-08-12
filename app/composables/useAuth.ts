import type { User } from '~~/types/catalog'

/**
 * Session state, backed by the HttpOnly cookie zenko-api sets.
 *
 * The cookie belongs to the API origin and is never readable from JavaScript,
 * so "am I signed in?" is answered by asking the API, not by inspecting
 * document.cookie. That check is client-only: during SSR the browser's cookie
 * is not available to the Nuxt server, and guessing would flash the wrong
 * state on hydration.
 */
export function useAuth() {
  const { public: config } = useRuntimeConfig()

  const user = useState<User | null>('auth-user', () => null)
  const isLoading = useState<boolean>('auth-loading', () => false)

  const isSignedIn = computed(() => user.value !== null)

  async function refresh() {
    if (!import.meta.client) return

    isLoading.value = true
    try {
      user.value = await $fetch<User>('/auth/me', {
        baseURL: config.apiBase,
        credentials: 'include',
      })
    }
    catch {
      // 401 is the normal signed-out answer, not a failure worth surfacing.
      user.value = null
    }
    finally {
      isLoading.value = false
    }
  }

  /** Full-page navigation: the OAuth consent screen cannot run in an iframe. */
  function signInWithGoogle() {
    window.location.href = `${config.apiBase}/auth/google`
  }

  async function signOut() {
    try {
      await $fetch('/auth/logout', {
        baseURL: config.apiBase,
        method: 'POST',
        credentials: 'include',
      })
    }
    finally {
      user.value = null
    }
  }

  return { user, isSignedIn, isLoading, refresh, signInWithGoogle, signOut }
}
