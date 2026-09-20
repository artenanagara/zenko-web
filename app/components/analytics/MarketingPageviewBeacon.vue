<script setup lang="ts">
const route = useRoute()
const { public: config } = useRuntimeConfig()
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
watch(() => route.fullPath, () => { if (import.meta.client) track() })
function track() {
  if (!sessionKey.value || route.path.startsWith('/dashboard') || route.path.startsWith('/akun')) return
  if (lastPath.value === route.fullPath) return
  lastPath.value = route.fullPath
  const query = route.query
  useApiFetch('/marketing-events', { baseURL: config.apiBase, method: 'POST', body: { name: 'page_view', path: route.path, referrer: document.referrer, source: query.utm_source || localStorage.getItem('zenko-utm_source') || '', medium: query.utm_medium || localStorage.getItem('zenko-utm_medium') || '', campaign: query.utm_campaign || localStorage.getItem('zenko-utm_campaign') || '', sessionKey: sessionKey.value } }).catch(() => {})
}
</script>
<template><span class="hidden" aria-hidden="true" /></template>
