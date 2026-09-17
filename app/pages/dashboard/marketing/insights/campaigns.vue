<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Kampanye UTM | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })
const { public: config } = useRuntimeConfig()
const form = reactive({ destination: '/', source: 'threads', campaign: '', medium: 'social' })
const copied = ref(false)
const sources = [{ value: 'threads', label: 'Threads' }, { value: 'instagram_bio', label: 'Instagram bio' }, { value: 'tiktok_ads', label: 'TikTok Ads' }, { value: 'whatsapp_group', label: 'WhatsApp group' }, { value: 'email_newsletter', label: 'Email newsletter' }]
const campaignURL = computed(() => { const base = `${config.appUrl || 'https://zenkoedu.id'}${form.destination || '/'}`; if (!form.campaign.trim()) return base; const params = new URLSearchParams({ utm_source: form.source, utm_medium: form.medium, utm_campaign: form.campaign.trim().toLowerCase().replace(/\s+/g, '_') }); return `${base}${base.includes('?') ? '&' : '?'}${params.toString()}` })
async function copyURL() { await navigator.clipboard?.writeText(campaignURL.value); copied.value = true; window.setTimeout(() => copied.value = false, 1800) }
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Kampanye UTM" description="Buat tautan promosi yang siap dibagikan dan diukur." />
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <AppPanel header="Generator tautan" :collapsible="false"><form class="grid gap-4" @submit.prevent="copyURL"><AppTextField id="utm-destination" v-model="form.destination" label="Halaman tujuan" placeholder="/paket" /><AppSelect v-model="form.source" label="Sumber kanal" :options="sources" /><AppTextField id="utm-medium" v-model="form.medium" label="Medium" placeholder="social" /><AppTextField id="utm-campaign" v-model="form.campaign" label="Nama kampanye" placeholder="tryout_september" /><AppButton type="submit">{{ copied ? 'Tersalin' : 'Salin tautan' }}</AppButton></form></AppPanel>
      <AppPanel header="Tautan siap pakai" :collapsible="false"><div class="rounded-md bg-surface-alt p-4"><p class="break-all text-sm leading-6 text-ink">{{ campaignURL }}</p><p class="mt-3 text-xs leading-5 text-muted">Generator ini hanya membentuk parameter UTM. Performa kampanye akan muncul setelah tracking klik dan konversi tersedia.</p></div></AppPanel>
    </div>
    <AppPanel header="Evaluasi kampanye" :collapsible="false"><AppEmptyState title="Belum ada kampanye terukur" description="Klik, pendaftaran, pembelian, dan return on effort akan muncul setelah event atribusi aktif." /></AppPanel>
  </div>
</template>
