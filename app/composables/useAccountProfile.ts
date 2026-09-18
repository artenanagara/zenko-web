import type { User } from '#shared/types/user'

/**
 * Identity fields every signed-in account can edit about itself: name,
 * avatar photo, and (via its own two-step OTP flow below) email.
 * updateAccountName/uploadAccountAvatar write straight into useAuth's shared
 * `user` state on success, since the API hands back the full updated User —
 * no separate refresh() round trip needed.
 */
export async function updateAccountName(name: string): Promise<void> {
  const { public: config } = useRuntimeConfig()
  const { user } = useAuth()

  user.value = await useApiFetch<User>('/auth/profile', {
    baseURL: config.apiBase,
    method: 'PUT',
    body: { name },
    credentials: 'include',
  })
}

export async function updateLeaderboardHidden(hidden: boolean): Promise<void> {
  const { public: config } = useRuntimeConfig()
  const { user } = useAuth()

  user.value = await useApiFetch<User>('/auth/profile', {
    baseURL: config.apiBase,
    method: 'PUT',
    body: { leaderboardHidden: hidden },
    credentials: 'include',
  })
}

/** POST /auth/avatar — uploads and applies the photo in one call. */
export async function uploadAccountAvatar(file: File): Promise<void> {
  const { public: config } = useRuntimeConfig()
  const { user } = useAuth()

  const form = new FormData()
  form.append('image', file)

  user.value = await useApiFetch<User>('/auth/avatar', {
    baseURL: config.apiBase,
    method: 'POST',
    body: form,
    credentials: 'include',
  })
}

/**
 * POST /auth/email/change/request — sends a 6-digit code to newEmail. Does
 * not touch useAuth's `user` state: the address only takes effect once
 * confirmEmailChange proves the caller actually holds it, the same
 * hold-before-trust rule registration's OTP follows.
 */
export async function requestEmailChange(newEmail: string): Promise<void> {
  const { public: config } = useRuntimeConfig()

  await useApiFetch('/auth/email/change/request', {
    baseURL: config.apiBase,
    method: 'POST',
    body: { newEmail },
    credentials: 'include',
  })
}

/** POST /auth/email/change/confirm — the code typed back; moves the account's email on success. */
export async function confirmEmailChange(newEmail: string, code: string): Promise<void> {
  const { public: config } = useRuntimeConfig()
  const { user } = useAuth()

  user.value = await useApiFetch<User>('/auth/email/change/confirm', {
    baseURL: config.apiBase,
    method: 'POST',
    body: { newEmail, code },
    credentials: 'include',
  })
}

/** zenko-api renders errors as { error, requestId }; fall back for the rest. */
export function accountApiMessage(cause: unknown, fallback: string): string {
  const message = (cause as { data?: { error?: string } })?.data?.error
  return message || fallback
}
