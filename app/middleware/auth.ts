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

  const allowed = to.meta.roles

  // The auth plugin resolves the session at boot, but a direct navigation can
  // land here first — and a role may have changed since it last ran. Re-check
  // role-gated pages so an approved tutor does not keep the stale student role.
  if (!isSignedIn.value || allowed?.length) await refresh()

  if (!isSignedIn.value) {
    return navigateTo({ path: '/masuk', query: { lanjut: to.fullPath } })
  }

  if (allowed?.length && user.value && !allowed.includes(user.value.role)) {
    // Workspace subdomains must not bounce a session belonging to another
    // workspace back and forth forever (for example a marketing session on
    // admin-staging). Let the workspace login replace that session instead of
    // sending the browser to a home path that the host guard rejects again.
    return navigateTo({ path: '/masuk', query: { lanjut: to.fullPath } })
  }
})
