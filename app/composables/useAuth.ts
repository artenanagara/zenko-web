import type { User } from '#shared/types/user'

export type EmailAuthFailure = 'invalid' | 'unverified' | 'duplicate' | 'error'

export type EmailLoginResult =
  | { ok: true, user: User }
  | { ok: false, reason: EmailAuthFailure, message: string }

export type EmailRegistrationResult =
  | { ok: true, email: string }
  | { ok: false, reason: EmailAuthFailure, message: string }

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
      user.value = await useApiFetch<User>('/auth/me', {
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

  async function signInWithEmail(
    email: string,
    password: string,
    remember: boolean,
  ): Promise<EmailLoginResult> {
    try {
      const signedIn = await useApiFetch<User>('/auth/login', {
        baseURL: config.apiBase,
        method: 'POST',
        body: { email, password, remember },
        credentials: 'include',
      })
      user.value = signedIn
      return { ok: true, user: signedIn }
    }
    catch (cause) {
      return emailAuthFailure(cause)
    }
  }

  async function registerWithEmail(
    name: string,
    email: string,
    password: string,
  ): Promise<EmailRegistrationResult> {
    try {
      const created = await useApiFetch<{ email: string }>('/auth/register', {
        baseURL: config.apiBase,
        method: 'POST',
        body: { name, email, password },
        credentials: 'include',
      })
      return { ok: true, email: created.email }
    }
    catch (cause) {
      return emailAuthFailure(cause)
    }
  }

  async function signOut() {
    try {
      await useApiFetch('/auth/logout', {
        baseURL: config.apiBase,
        method: 'POST',
        credentials: 'include',
      })
    }
    finally {
      user.value = null
    }
  }

  /**
   * Signs out of every device: the API bumps the account's session_version,
   * so all session cookies — including this device's — are rejected on the
   * next request. That makes it a superset of signOut(), so it clears the
   * local user the same way; the caller sends the reader somewhere public
   * afterwards, exactly as it does after an ordinary sign-out.
   */
  async function signOutAllDevices() {
    try {
      await useApiFetch('/auth/logout-all', {
        baseURL: config.apiBase,
        method: 'POST',
        credentials: 'include',
      })
    }
    finally {
      user.value = null
    }
  }

  return {
    user,
    isSignedIn,
    isLoading,
    refresh,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    signOut,
    signOutAllDevices,
  }
}

function emailAuthFailure(cause: unknown): {
  ok: false
  reason: EmailAuthFailure
  message: string
} {
  const status = (cause as { statusCode?: number, status?: number })?.statusCode
    ?? (cause as { status?: number })?.status
  const serverMessage = (cause as { data?: { error?: string } })?.data?.error

  if (status === 401) {
    return { ok: false, reason: 'invalid', message: 'Email atau kata sandi tidak cocok.' }
  }
  if (status === 403) {
    return {
      ok: false,
      reason: 'unverified',
      message: 'Email belum diverifikasi. Buka email dari Zenko atau kirim ulang tautannya.',
    }
  }
  if (status === 409) {
    return {
      ok: false,
      reason: 'duplicate',
      message: 'Email ini sudah terdaftar. Masuk atau gunakan lupa kata sandi.',
    }
  }
  return {
    ok: false,
    reason: 'error',
    message: serverMessage || 'Server belum bisa dihubungi. Coba lagi sebentar lagi.',
  }
}
