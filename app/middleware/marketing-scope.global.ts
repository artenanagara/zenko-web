import { workspaceForHost, workspaceHome } from '~/utils/workspace'

const AUTH_PATHS = new Set([
  '/masuk',
  '/lupa-password',
  '/password-baru',
  '/verifikasi-email',
])

export default defineNuxtRouteMiddleware((to) => {
  const hostname = import.meta.server
    ? useRequestHeaders(['host']).host?.split(':')[0]
    : window.location.hostname
  if (!hostname) return
  const workspace = workspaceForHost(hostname)
  if (workspace === 'public') return

  const path = to.path
  const home = workspaceHome(workspace)
  const isWorkspaceRoute = path === home || path.startsWith(`${home}/`)
  const isAuthRoute = AUTH_PATHS.has(path)

  if (path === '/') return navigateTo(home, { replace: true })
  if (!isWorkspaceRoute && !isAuthRoute) return navigateTo(home, { replace: true })
})
