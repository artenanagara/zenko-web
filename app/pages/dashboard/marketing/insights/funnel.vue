<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Funnel Konversi | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })
const { public: config } = useRuntimeConfig(); const summary = ref<Record<string, number> | null>(null)
onMounted(async () => { try { summary.value = await useApiFetch('/marketing/analytics/summary', { baseURL: config.apiBase, credentials: 'include' }) } catch { summary.value = null } })
const steps = [{ label: 'Kunjungan web', event: 'page_view' }, { label: 'Coba 5 soal gratis', event: 'sample_start' }, { label: 'Daftar akun baru', event: 'registration_start' }, { label: 'Masuk halaman bayar', event: 'checkout_start' }, { label: 'Pembayaran sukses', event: 'payment_success' }]
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Funnel Konversi" description="Lihat perjalanan calon siswa dari kunjungan sampai pembelian." />
    <AppSectionMessage title="Event funnel belum tersedia">Tahapan funnel sudah didefinisikan, tetapi jumlah pengguna dan drop-off belum dihitung sebelum event first-party dikirim dan diatribusikan.</AppSectionMessage>
    <AppPanel header="Tahapan perjalanan siswa" :collapsible="false">
      <ol class="grid gap-3 md:grid-cols-5"><li v-for="(step, index) in steps" :key="step.event" class="rounded-md border border-hairline bg-surface-alt p-4"><span class="text-xs font-bold text-primary">{{ index + 1 }}</span><p class="mt-2 text-sm font-semibold text-ink">{{ step.label }}</p><p class="mt-2 text-2xl font-bold text-ink">{{ summary?.[step.event]?.toLocaleString('id-ID') || '—' }}</p><p class="text-xs text-muted">{{ summary ? 'Event tercatat' : 'Belum ada data' }}</p></li></ol>
    </AppPanel>
  </div>
</template>
