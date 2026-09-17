const MARKETING_HOSTS = new Set([
  'marketing.zenkoedu.id',
  'marketing-staging.zenkoedu.id',
])

const AUTH_PATHS = new Set([
  '/masuk',
  '/daftar',
  '/lupa-password',
  '/password-baru',
  '/verifikasi-email',
])

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server || !MARKETING_HOSTS.has(window.location.hostname)) return

  const path = to.path
  const isMarketingRoute = path === '/dashboard/marketing' || path.startsWith('/dashboard/marketing/')
  const isAuthRoute = AUTH_PATHS.has(path)

  if (path === '/') return navigateTo('/dashboard/marketing', { replace: true })
  if (!isMarketingRoute && !isAuthRoute) return navigateTo('/dashboard/marketing', { replace: true })
})
