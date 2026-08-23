import type { User } from '#shared/types/user'

/**
 * Identity fields every signed-in account can edit about itself: name and
 * avatar photo. Both write straight into useAuth's shared `user` state on
 * success, since the API hands back the full updated User — no separate
 * refresh() round trip needed.
 *
 * Email is deliberately absent: zenko-api's /auth/profile does not accept
 * it, since changing an already-verified address needs a re-verification
 * flow that does not exist yet.
 */
export async function updateAccountName(name: string): Promise<void> {
  const { public: config } = useRuntimeConfig()
  const { user } = useAuth()

  user.value = await $fetch<User>('/auth/profile', {
    baseURL: config.apiBase,
    method: 'PUT',
    body: { name },
    credentials: 'include',
  })
}

/** POST /auth/avatar — uploads and applies the photo in one call. */
export async function uploadAccountAvatar(file: File): Promise<void> {
  const { public: config } = useRuntimeConfig()
  const { user } = useAuth()

  const form = new FormData()
  form.append('image', file)

  user.value = await $fetch<User>('/auth/avatar', {
    baseURL: config.apiBase,
    method: 'POST',
    body: form,
    credentials: 'include',
  })
}

/** zenko-api renders errors as { error, requestId }; fall back for the rest. */
export function accountApiMessage(cause: unknown, fallback: string): string {
  const message = (cause as { data?: { error?: string } })?.data?.error
  return message || fallback
}
