interface ProductEvent {
  name: 'product_view' | 'product_click' | 'checkout_start' | 'purchase'
  productId?: string
  productSlug: string
  productName: string
}

export function trackMarketingEvent(event: ProductEvent) {
  if (!import.meta.client) return
  const { public: config } = useRuntimeConfig()
  const sessionKey = localStorage.getItem('zenko-marketing-session') || crypto.randomUUID()
  localStorage.setItem('zenko-marketing-session', sessionKey)
  const payload = { ...event, path: window.location.pathname, referrer: document.referrer, sessionKey }
  useApiFetch('/marketing-events', { baseURL: config.apiBase, method: 'POST', body: payload }).catch(() => {})

  if (typeof window.gtag === 'function') {
    window.gtag('event', event.name, {
      item_id: event.productId || event.productSlug,
      item_name: event.productName,
      items: [{ item_id: event.productId || event.productSlug, item_name: event.productName }],
    })
  }
}
