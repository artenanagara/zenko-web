<script setup lang="ts">
const route = useRoute()
const { public: config } = useRuntimeConfig()
const router = useRouter()
const sessionKey = ref('')
const lastPath = ref('')
onMounted(() => {
  sessionKey.value = localStorage.getItem('zenko-marketing-session') || crypto.randomUUID()
  localStorage.setItem('zenko-marketing-session', sessionKey.value)
  const params = new URLSearchParams(window.location.search)
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const value = params.get(key)
    if (value) localStorage.setItem(`zenko-${key}`, value)
  }
  track()
})
router.afterEach((to) => { if (import.meta.client) track(to.fullPath, to.path) })
function track(fullPath = route.fullPath, path = route.path) {
  if (!sessionKey.value || path.startsWith('/dashboard') || path.startsWith('/akun')) return
  if (lastPath.value === fullPath) return
  lastPath.value = fullPath
  const query = new URLSearchParams(fullPath.split('?')[1] || '')
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) { const value = query.get(key); if (value) localStorage.setItem(`zenko-${key}`, value) }
  useApiFetch('/marketing-events', { baseURL: config.apiBase, method: 'POST', body: { name: 'page_view', path, referrer: document.referrer, source: query.get('utm_source') || localStorage.getItem('zenko-utm_source') || '', medium: query.get('utm_medium') || localStorage.getItem('zenko-utm_medium') || '', campaign: query.get('utm_campaign') || localStorage.getItem('zenko-utm_campaign') || '', sessionKey: sessionKey.value } }).catch(() => {})
}
</script>
<template><span class="hidden" aria-hidden="true" /></template>
