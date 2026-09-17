declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

export default defineNuxtPlugin(() => {
  const measurementId = useRuntimeConfig().public.analyticsMeasurementId
  if (typeof measurementId !== 'string' || !measurementId) return

  window.dataLayer = window.dataLayer || []
  window.gtag = (...args: unknown[]) => window.dataLayer.push(args)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(script)

  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })

  const router = useRouter()
  const sendPageView = (path: string) => {
    window.gtag('event', 'page_view', {
      page_location: `${window.location.origin}${path}`,
      page_path: path,
    })
  }

  sendPageView(router.currentRoute.value.fullPath)
  router.afterEach((to) => sendPageView(to.fullPath))
})
