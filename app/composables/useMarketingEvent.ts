interface ProductEvent {
  name: 'product_view' | 'product_click' | 'checkout_start' | 'purchase'
  productId?: string
  productSlug: string
  productName: string
}

interface ArticleEvent { articleId?: string, articleSlug: string, articleName: string }

export function trackMarketingEvent(event: ProductEvent) {
  if (!import.meta.client) return
  const { public: config } = useRuntimeConfig()
  const sessionKey = localStorage.getItem('zenko-marketing-session') || crypto.randomUUID()
  localStorage.setItem('zenko-marketing-session', sessionKey)
  const payload = { ...event, path: window.location.pathname, referrer: document.referrer, sessionKey, source: localStorage.getItem('zenko-utm_source') || '', medium: localStorage.getItem('zenko-utm_medium') || '', campaign: localStorage.getItem('zenko-utm_campaign') || '' }
  useApiFetch('/marketing-events', { baseURL: config.apiBase, method: 'POST', body: payload }).catch(() => {})

  if (typeof window.gtag === 'function') {
    window.gtag('event', event.name, {
      item_id: event.productId || event.productSlug,
      item_name: event.productName,
      items: [{ item_id: event.productId || event.productSlug, item_name: event.productName }],
    })
  }
}

export function trackArticleView(article: ArticleEvent) {
  if (!import.meta.client) return
  const { public: config } = useRuntimeConfig()
  const sessionKey = localStorage.getItem('zenko-marketing-session') || crypto.randomUUID()
  localStorage.setItem('zenko-marketing-session', sessionKey)
  useApiFetch('/marketing-events', { baseURL: config.apiBase, method: 'POST', body: { name: 'article_view', ...article, path: window.location.pathname, referrer: document.referrer, sessionKey, source: localStorage.getItem('zenko-utm_source') || '', medium: localStorage.getItem('zenko-utm_medium') || '', campaign: localStorage.getItem('zenko-utm_campaign') || '' } }).catch(() => {})
}
