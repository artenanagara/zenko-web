/**
 * Resolves the session once, on the client, before the app renders anything
 * that depends on it. Without this every component would have to trigger its
 * own /auth/me call.
 */
export default defineNuxtPlugin(async () => {
  await useAuth().refresh()
})
