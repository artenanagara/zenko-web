/**
 * Account recovery: email verification and password reset.
 *
 * The only place the recovery pages touch the network. Calls return typed
 * results instead of throwing — each page has its own state machine, and
 * translating throws in three places would yield three different translations.
 *
 * Each flow is gated on the flag for its own endpoints — verification is live
 * in zenko-api, password reset is not — so a flow that exists is never held
 * back by one that does not.
 *
 * Email verification is a 6-digit code entered on the page, not a link —
 * password reset still is, so `verifyEmail` and `resendVerification` are the
 * only calls here that never carry a `token`.
 */

export type RecoveryFailure = 'not-connected' | 'invalid-token' | 'error'

export type RecoveryResult =
  | { ok: true }
  | { ok: false, reason: RecoveryFailure, message: string }

/**
 * Email verification now runs on a 6-digit code instead of a link, so its
 * failures need to be told apart: a wrong code (still under the attempt cap)
 * is fixable in place, while an expired/consumed/exhausted code (410) needs a
 * fresh one from resend. Collapsing those into one "invalid" bucket, like the
 * token flows do, would leave the form unable to tell a typo from a dead end.
 */
export type VerifyEmailFailure = 'invalid-code' | 'expired' | 'not-connected' | 'error'

export type VerifyEmailResult =
  | { ok: true }
  | { ok: false, reason: VerifyEmailFailure, message: string }

const NOT_CONNECTED_MESSAGE =
  'Pemulihan akun lewat email belum tersedia. Untuk sekarang, masuk dengan Google.'

const INVALID_TOKEN_MESSAGE =
  'Tautan ini sudah kedaluwarsa atau pernah dipakai. Minta tautan baru untuk melanjutkan.'

const EXPIRED_CODE_MESSAGE = 'Kode verifikasi sudah kedaluwarsa, minta kode baru.'

const GENERIC_ERROR_MESSAGE = 'Gagal menghubungi server. Coba lagi sebentar lagi.'

export function useAccountRecovery() {
  const { public: config } = useRuntimeConfig()

  async function post(
    path: string,
    body: Record<string, string>,
    enabled: boolean,
  ): Promise<RecoveryResult> {
    if (!enabled) {
      return { ok: false, reason: 'not-connected', message: NOT_CONNECTED_MESSAGE }
    }

    try {
      await $fetch(path, {
        baseURL: config.apiBase,
        method: 'POST',
        body,
        credentials: 'include',
      })
      return { ok: true }
    }
    catch (cause) {
      return failureFor(cause)
    }
  }

  /**
   * The server's answer deliberately doesn't reveal whether the email is
   * registered — distinguishing would turn this form into an account oracle.
   */
  function requestPasswordReset(email: string) {
    return post('/auth/password/forgot', { email }, config.passwordResetEnabled)
  }

  function resetPassword(token: string, password: string) {
    return post('/auth/password/reset', { token, password }, config.passwordResetEnabled)
  }

  /**
   * Verification is now a 6-digit code, not a link, and its failure shapes
   * don't match the other recovery calls: a wrong code (400) is fixable in
   * place, while an expired/consumed/exhausted code (410) is not — the
   * generic `post` helper only knows how to collapse both into one bucket, so
   * this talks to the endpoint directly.
   */
  async function verifyEmail(email: string, code: string): Promise<VerifyEmailResult> {
    if (!config.emailVerificationEnabled) {
      return { ok: false, reason: 'not-connected', message: NOT_CONNECTED_MESSAGE }
    }

    try {
      await $fetch('/auth/email/verify', {
        baseURL: config.apiBase,
        method: 'POST',
        body: { email, code },
        credentials: 'include',
      })
      return { ok: true }
    }
    catch (cause) {
      return verifyFailureFor(cause)
    }
  }

  /**
   * `name` is sent so the email can greet by name. The server ignores it for
   * any address it does not already know, so it cannot be used to put chosen
   * text in front of a stranger.
   */
  function resendVerification(email: string, name = '') {
    return post('/auth/email/resend', { email, name }, config.emailVerificationEnabled)
  }

  return { requestPasswordReset, resetPassword, verifyEmail, resendVerification }
}

/**
 * zenko-api renders every error as { error, requestId }. On token flows a
 * 400/410 means the token is bad, not the server — that deserves a different
 * screen, not just a red message.
 */
function failureFor(cause: unknown): RecoveryResult {
  const status = (cause as { statusCode?: number, status?: number })?.statusCode
    ?? (cause as { status?: number })?.status

  // 404 is deliberately absent: a route that does not exist is a deployment
  // problem, and blaming the user's link for it sends them to fetch a fresh
  // one that will fail exactly the same way.
  if (status === 400 || status === 410) {
    return { ok: false, reason: 'invalid-token', message: INVALID_TOKEN_MESSAGE }
  }

  const message = (cause as { data?: { error?: string } })?.data?.error
  return {
    ok: false,
    reason: 'error',
    message: message || GENERIC_ERROR_MESSAGE,
  }
}

/**
 * The verify endpoint distinguishes a fixable mistake from a dead end: 400
 * covers a wrong code (still under the attempt cap) and the rarer malformed
 * inputs client-side validation should already catch; 410 means the code is
 * gone (expired, consumed, or attempts exhausted) and only a resend fixes it.
 * The server's own message is precise about which of those three 410 cases
 * happened, so it is used as-is rather than flattened to one string.
 */
function verifyFailureFor(cause: unknown): VerifyEmailResult {
  const status = (cause as { statusCode?: number, status?: number })?.statusCode
    ?? (cause as { status?: number })?.status
  const message = (cause as { data?: { error?: string } })?.data?.error

  if (status === 410) {
    return { ok: false, reason: 'expired', message: message || EXPIRED_CODE_MESSAGE }
  }

  if (status === 400) {
    return { ok: false, reason: 'invalid-code', message: message || GENERIC_ERROR_MESSAGE }
  }

  return { ok: false, reason: 'error', message: message || GENERIC_ERROR_MESSAGE }
}
