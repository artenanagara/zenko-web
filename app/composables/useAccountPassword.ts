/**
 * Password change from inside the account — the signed-in counterpart of
 * useAccountRecovery: proof is the current password, not an email token.
 * Gated by its own NUXT_PUBLIC_PASSWORD_CHANGE_ENABLED, with the same mock
 * behaviour as recovery.
 */

export type PasswordChangeState = 'idle' | 'submitting' | 'success' | 'not-connected' | 'error'

const NOT_CONNECTED_MESSAGE =
  'Ubah kata sandi belum tersedia. Untuk sekarang, akun Zenko masuk lewat Google.'

export function useAccountPassword() {
  const { public: config } = useRuntimeConfig()

  const state = ref<PasswordChangeState>('idle')
  const error = ref('')
  /** True when the change was only simulated, so the page can say so. */
  const mocked = ref(false)

  async function change(currentPassword: string, newPassword: string) {
    error.value = ''
    mocked.value = false

    if (!config.passwordChangeEnabled) {
      if (config.useMock) {
        state.value = 'submitting'
        // Artificial delay; without it the pending state just flickers.
        await new Promise(resolve => setTimeout(resolve, 700))
        mocked.value = true
        state.value = 'success'
        return
      }

      state.value = 'not-connected'
      error.value = NOT_CONNECTED_MESSAGE
      return
    }

    state.value = 'submitting'
    try {
      await $fetch('/auth/password/change', {
        baseURL: config.apiBase,
        method: 'POST',
        body: { currentPassword, newPassword },
        // The session decides whose password changes; no id in the body.
        credentials: 'include',
      })
      state.value = 'success'
    }
    catch (cause) {
      state.value = 'error'
      error.value = messageFor(cause)
    }
  }

  function reset() {
    state.value = 'idle'
    error.value = ''
    mocked.value = false
  }

  return { state, error, mocked, change, reset }
}

/** zenko-api renders every error as { error, requestId }. */
function messageFor(cause: unknown): string {
  const status = (cause as { statusCode?: number, status?: number })?.statusCode
    ?? (cause as { status?: number })?.status

  if (status === 401 || status === 403) return 'Kata sandi saat ini tidak cocok.'

  const message = (cause as { data?: { error?: string } })?.data?.error
  return message || 'Gagal menghubungi server. Coba lagi sebentar lagi.'
}
