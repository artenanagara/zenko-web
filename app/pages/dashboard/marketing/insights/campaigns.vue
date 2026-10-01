<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Kampanye UTM | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })
interface Campaign { source: string, medium: string, campaign: string, visits: number, uniqueVisitors: number, registrations: number, checkouts: number, purchases: number }
const { public: config } = useRuntimeConfig()
const form = reactive({ destination: '/artikel', source: 'instagram', campaign: 'campaign', medium: 'social' })
const copied = ref(false); const modalOpen = ref(false); const pending = ref(true); const campaigns = ref<Campaign[]>([]); const error = ref(false)
const sources = [{ value: 'instagram', label: 'Instagram' }, { value: 'threads', label: 'Threads' }, { value: 'tiktok', label: 'TikTok' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'email', label: 'Email' }, { value: 'google', label: 'Google' }]
const campaignURL = computed(() => {
  const rawDestination = form.destination.trim() || '/'
  let url: URL
  try { url = new URL(rawDestination, 'https://zenkoedu.id') } catch { url = new URL('/', 'https://zenkoedu.id') }
  if (!['https:', 'http:'].includes(url.protocol)) url = new URL('/', 'https://zenkoedu.id')
  url.searchParams.set('utm_source', form.source.trim().toLowerCase())
  url.searchParams.set('utm_medium', form.medium.trim().toLowerCase())
  url.searchParams.set('utm_campaign', form.campaign.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'campaign')
  return url.toString()
})
async function copyURL() { try { await navigator.clipboard.writeText(campaignURL.value); copied.value = true; window.setTimeout(() => copied.value = false, 1800) } catch { copied.value = false } }
async function load() { pending.value = true; error.value = false; try { const data = await useApiFetch<{ campaigns?: Campaign[] }>('/marketing/analytics/summary', { baseURL: config.apiBase, credentials: 'include', query: { period: '28d' } }); campaigns.value = data.campaigns || [] } catch { error.value = true } finally { pending.value = false } }
onMounted(load)
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Kampanye UTM" description="Buat tautan promosi dan ukur kunjungan hingga pembelian.">
      <template #actions><AppButton size="sm" @click="modalOpen = true">Buat tautan UTM</AppButton></template>
    </AppPageHeader>
    <AppSectionMessage title="Catatan atribusi konversi">Kunjungan UTM direkam saat halaman dibuka. Pendaftaran dan checkout dicatat sebagai event; pembelian dicatat server setelah status pembayaran terkonfirmasi.</AppSectionMessage>
    <AppPanel header="Performa kampanye · 28 hari" :collapsible="false">
      <AppInlineMessage v-if="error" type="error">Data kampanye belum berhasil dimuat.</AppInlineMessage>
      <DashboardSkeleton v-else-if="pending" variant="rows" :count="4" />
      <AppEmptyState v-else-if="!campaigns.length" title="Belum ada kampanye terukur" description="Tautan UTM yang dibagikan akan muncul setelah pengunjung membukanya." />
      <div v-else class="overflow-x-auto"><table class="w-full min-w-[850px] text-left text-sm"><thead class="border-b border-hairline text-xs text-muted"><tr><th class="px-4 py-3">Kampanye</th><th class="px-4 py-3">Kunjungan</th><th class="px-4 py-3">Sesi unik</th><th class="px-4 py-3">Pendaftaran</th><th class="px-4 py-3">Checkout</th><th class="px-4 py-3">Pembelian</th></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="item in campaigns" :key="`${item.source}-${item.medium}-${item.campaign}`"><td class="px-4 py-4"><p class="font-semibold">{{ item.campaign || 'Tanpa nama kampanye' }}</p><p class="text-xs text-muted">{{ item.source }} · {{ item.medium }}</p></td><td class="px-4 py-4">{{ item.visits.toLocaleString('id-ID') }}</td><td class="px-4 py-4">{{ item.uniqueVisitors.toLocaleString('id-ID') }}</td><td class="px-4 py-4">{{ item.registrations.toLocaleString('id-ID') }}</td><td class="px-4 py-4">{{ item.checkouts.toLocaleString('id-ID') }}</td><td class="px-4 py-4 font-semibold">{{ item.purchases.toLocaleString('id-ID') }}</td></tr></tbody></table></div>
    </AppPanel>
    <AppModal v-model="modalOpen" title="Buat tautan UTM" description="Tautan ini akan merekam sumber, medium, dan nama kampanye saat pengunjung membuka Zenko.">
      <form class="grid gap-4" @submit.prevent="copyURL"><AppTextField id="utm-destination" v-model="form.destination" label="Halaman tujuan" placeholder="/artikel atau https://zenkoedu.id/paket" /><AppSelect v-model="form.source" label="Sumber kanal" :options="sources" /><AppTextField id="utm-medium" v-model="form.medium" label="Medium" placeholder="social, email, cpc" required /><AppTextField id="utm-campaign" v-model="form.campaign" label="Nama kampanye" placeholder="promo_tryout_september" required /><div class="rounded-md bg-surface-alt p-3"><p class="break-all text-xs leading-5 text-ink">{{ campaignURL }}</p></div><div class="flex justify-end gap-3"><AppButton type="button" variant="outline" @click="modalOpen = false">Tutup</AppButton><AppButton type="submit">{{ copied ? 'Tautan tersalin' : 'Salin tautan' }}</AppButton></div></form>
    </AppModal>
  </div>
</template>
