<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Trafik Web | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })
const { public: config } = useRuntimeConfig(); const summary = ref<Record<string, number> | null>(null); const pending = ref(true)
onMounted(async () => { try { summary.value = await useApiFetch('/marketing/analytics/summary', { baseURL: config.apiBase, credentials: 'include' }) } finally { pending.value = false } })
const metrics = computed(() => [{ label: 'Pageview', value: summary.value?.page_view?.toLocaleString('id-ID') || '—' }, { label: 'Sesi unik', value: '—' }, { label: 'Halaman terpopuler', value: '—' }])
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Trafik Web" description="Pahami halaman, sumber rujukan, dan perangkat pengunjung Zenko." />
    <AppSectionMessage title="Beacon first-party belum aktif">Dashboard ini menunggu event pageview yang menjaga privasi pengguna. Data tidak ditampilkan sebelum beacon dan retensi datanya terpasang.</AppSectionMessage>
    <DashboardStats :items="metrics" :columns="3" />
    <div class="grid gap-6 md:grid-cols-2"><AppPanel header="Halaman paling populer" :collapsible="false"><AppEmptyState title="Belum ada data halaman" description="Pageview per URL akan muncul setelah beacon berjalan." /></AppPanel><AppPanel header="Sumber rujukan & perangkat" :collapsible="false"><AppEmptyState title="Belum ada data atribusi" description="Referrer dan distribusi perangkat belum tersedia." /></AppPanel></div>
  </div>
</template>
