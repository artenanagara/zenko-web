/**
 * Resolve the session once after Nuxt has hydrated the SSR markup. The API
 * session cookie belongs to another origin, so the server cannot render the
 * signed-in state. Updating `user` before hydration would make the client
 * render a different header/layout tree and produce Vue hydration warnings.
 * Protected routes still call refresh from the route middleware when needed.
 */
export default defineNuxtPlugin(() => {
  onNuxtReady(() => {
    void useAuth().refresh()
  })
})
