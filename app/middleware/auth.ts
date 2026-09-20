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
import { homePathFor } from '#shared/types/user'
import { workspaceForHost } from '~/utils/workspace'

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
    // admin-staging): marketing-scope.global.ts sends every off-workspace path
    // back to the workspace home, which this guard then rejects again. There
    // the workspace login is the only honest destination — it lets the visitor
    // replace the session rather than watch the browser ping-pong.
    if (workspaceForHost(window.location.hostname) !== 'public') {
      return navigateTo({ path: '/masuk', query: { lanjut: to.fullPath } })
    }

    // The public domain has no such trap, and every role's home accepts that
    // role, so there is nothing to bounce off. Sending someone who *is* signed
    // in to a sign-in form reads like a bug to them; send them somewhere they
    // can actually use instead.
    return navigateTo(homePathFor(user.value.role))
  }
})
