<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Performa Pencarian | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })

const { public: config } = useRuntimeConfig()
const summary = ref<{ ready: boolean, message: string, search: { clicks: number, impressions: number, ctr: number, position: number } } | null>(null)
const pending = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    summary.value = await useApiFetch('/marketing/google/summary?period=28d', { baseURL: config.apiBase, credentials: 'include' })
  } catch { error.value = true }
  finally { pending.value = false }
})

const metrics = computed(() => [
  { label: 'Klik pencarian', value: summary.value?.search.clicks.toLocaleString('id-ID') || '—' },
  { label: 'Impresi pencarian', value: summary.value?.search.impressions.toLocaleString('id-ID') || '—' },
  { label: 'CTR rata-rata', value: summary.value ? `${(summary.value.search.ctr * 100).toFixed(2)}%` : '—' },
  { label: 'Posisi rata-rata', value: summary.value?.search.position.toFixed(1) || '—' },
])
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Performa Pencarian" description="Pantau visibilitas Zenko di Google Search Console." />
    <AppSectionMessage v-if="error" title="Data Search Console belum dapat diambil">Koneksi backend ke Google gagal sementara. Coba muat ulang halaman beberapa saat lagi.</AppSectionMessage>
    <AppSectionMessage v-else-if="!pending && !summary?.ready" title="Integrasi Search Console belum aktif">{{ summary?.message || 'Data Search Console belum tersedia.' }}</AppSectionMessage>
    <DashboardStats :items="metrics" :columns="4" />
    <AppPanel header="Kueri pencarian" :collapsible="false">
      <AppEmptyState title="Ringkasan kueri belum tersedia" description="Endpoint berikutnya akan menampilkan kueri dan halaman pemenang setelah sinkronisasi detail diaktifkan." />
    </AppPanel>
  </div>
</template>
