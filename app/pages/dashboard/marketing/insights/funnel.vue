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
      <div class="overflow-x-auto"><table class="w-full min-w-[680px] text-left text-sm"><thead class="border-b border-hairline text-xs text-muted"><tr><th class="px-4 py-3 font-semibold">Tahap</th><th class="px-4 py-3 font-semibold">Event</th><th class="px-4 py-3 font-semibold">Pengguna</th><th class="px-4 py-3 font-semibold">Status</th></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="(step, index) in steps" :key="step.event"><td class="px-4 py-4"><span class="mr-3 text-xs font-bold text-primary">{{ index + 1 }}</span><span class="font-semibold text-ink">{{ step.label }}</span></td><td class="px-4 py-4 font-mono text-xs text-muted">{{ step.event }}</td><td class="px-4 py-4 font-semibold text-ink">{{ summary?.[step.event]?.toLocaleString('id-ID') || '—' }}</td><td class="px-4 py-4"><AppBadge>{{ summary ? 'Event tercatat' : 'Belum ada data' }}</AppBadge></td></tr></tbody></table></div>
    </AppPanel>
  </div>
</template>
