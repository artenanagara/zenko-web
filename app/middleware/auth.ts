import { homePathFor } from '#shared/types/user'

/**
 * Guards routes that need a session, and narrows them further when the route
 * declares `meta.roles`.
 *
 * Client-only by necessity: the session cookie is HttpOnly and belongs to the
 * API origin, so the Nuxt server cannot see it. Guessing during SSR would
 * render the wrong thing and flash on hydration.
 *
 * This is a usability guard, not a security boundary — the real check lives in
 * zenko-api, which rejects the underlying requests with 401/403 regardless of
 * what the browser lets someone navigate to.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { user, isSignedIn, refresh } = useAuth()

  // The auth plugin resolves the session at boot, but a direct navigation can
  // land here first — and a session may have expired since. Re-checking costs
  // one request and is the difference between a guard and a guess.
  if (!isSignedIn.value) await refresh()

  if (!isSignedIn.value) {
    return navigateTo({ path: '/masuk', query: { lanjut: to.fullPath } })
  }

  const allowed = to.meta.roles
  if (allowed?.length && user.value && !allowed.includes(user.value.role)) {
    // Send them somewhere they belong rather than to a dead end.
    return navigateTo(homePathFor(user.value.role))
  }
})
