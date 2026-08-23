/**
 * Password change from inside the account — the signed-in counterpart of
 * useAccountRecovery: proof is the current password, not an email token.
 * Gated by its own NUXT_PUBLIC_PASSWORD_CHANGE_ENABLED.
 */

export type PasswordChangeState = 'idle' | 'submitting' | 'success' | 'not-connected' | 'error'

const NOT_CONNECTED_MESSAGE =
  'Ubah kata sandi belum tersedia. Untuk sekarang, akun Zenko masuk lewat Google.'

export function useAccountPassword() {
  const { public: config } = useRuntimeConfig()

  const state = ref<PasswordChangeState>('idle')
  const error = ref('')

  async function change(currentPassword: string, newPassword: string) {
    error.value = ''

    if (!config.passwordChangeEnabled) {
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
  }

  return { state, error, change, reset }
}

/** zenko-api renders every error as { error, requestId }. */
function messageFor(cause: unknown): string {
  const status = (cause as { statusCode?: number, status?: number })?.statusCode
    ?? (cause as { status?: number })?.status

  if (status === 401 || status === 403) return 'Kata sandi saat ini tidak cocok.'

  const message = (cause as { data?: { error?: string } })?.data?.error
  return message || 'Gagal menghubungi server. Coba lagi sebentar lagi.'
}
