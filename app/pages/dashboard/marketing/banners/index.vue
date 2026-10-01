<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Banner & Promosi | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })

type Banner = { id: string, slot: string, title: string, description: string, buttonLabel: string, targetUrl: string, desktopImageUrl: string, mobileImageUrl: string, startsAt?: string, endsAt?: string, enabled: boolean, impressions: number, clicks: number, updatedAt: string }
const slots = [{ value: 'hero', label: 'Hero' }, { value: 'top_bar', label: 'Top bar' }, { value: 'sidebar', label: 'Sidebar' }]
const { public: config } = useRuntimeConfig()
const banners = ref<Banner[]>([]); const pending = ref(true); const error = ref('')

async function load() { pending.value = true; try { banners.value = await useApiFetch<Banner[]>('/marketing/banners', { baseURL: config.apiBase, credentials: 'include' }) } catch { error.value = 'Banner belum berhasil dimuat.' } finally { pending.value = false } }
async function remove(id: string) { if (!confirm('Hapus banner ini?')) return; try { await useApiFetch(`/marketing/banners/${id}`, { baseURL: config.apiBase, method: 'DELETE', credentials: 'include' }); await load() } catch { error.value = 'Banner belum berhasil dihapus.' } }
function slotLabel(slot: string) { return slots.find(item => item.value === slot)?.label || slot }
function schedule(item: Banner) { if (!item.enabled) return 'Nonaktif'; const now = Date.now(); if (item.startsAt && new Date(item.startsAt).getTime() > now) return 'Terjadwal'; if (item.endsAt && new Date(item.endsAt).getTime() < now) return 'Selesai'; return 'Aktif' }
function formatDate(value?: string) { return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Tanpa batas waktu' }
onMounted(load)
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Banner & Promosi" description="Kelola pesan promosi yang tampil di area utama Zenko.">
      <template #actions><AppButton to="/dashboard/marketing/banners/new" size="sm">Tambah banner</AppButton></template>
    </AppPageHeader>
    <AppInlineMessage v-if="error" type="error">{{ error }}</AppInlineMessage>
    <AppPanel header="Daftar banner" :collapsible="false">
      <DashboardSkeleton v-if="pending" variant="rows" :count="4" />
      <AppEmptyState v-else-if="!banners.length" title="Belum ada banner" description="Buat banner pertama untuk mulai mengatur promosi." />
      <div v-else class="overflow-x-auto"><table class="w-full min-w-[920px] text-left text-sm"><thead class="border-b border-hairline text-xs text-muted"><tr><th class="px-4 py-3 font-semibold">Banner</th><th class="px-4 py-3 font-semibold">Slot</th><th class="px-4 py-3 font-semibold">Status</th><th class="px-4 py-3 font-semibold">Tayang</th><th class="px-4 py-3 font-semibold">Klik</th><th class="px-4 py-3 font-semibold">CTR</th><th class="px-4 py-3 font-semibold">Periode</th><th class="px-4 py-3" /></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="banner in banners" :key="banner.id"><td class="px-4 py-4"><p class="font-semibold">{{ banner.title }}</p><p v-if="banner.description" class="mt-1 max-w-sm truncate text-xs text-muted">{{ banner.description }}</p></td><td class="px-4 py-4 text-muted">{{ slotLabel(banner.slot) }}</td><td class="px-4 py-4"><AppBadge>{{ schedule(banner) }}</AppBadge></td><td class="px-4 py-4">{{ banner.impressions.toLocaleString('id-ID') }}</td><td class="px-4 py-4">{{ banner.clicks.toLocaleString('id-ID') }}</td><td class="px-4 py-4 font-semibold">{{ banner.impressions ? `${((banner.clicks / banner.impressions) * 100).toFixed(1)}%` : '—' }}</td><td class="px-4 py-4 text-xs text-muted">{{ formatDate(banner.startsAt) }}<br><span v-if="banner.endsAt">s/d {{ formatDate(banner.endsAt) }}</span></td><td class="px-4 py-4 text-right"><div class="flex justify-end gap-1"><AppIconButton v-if="banner.targetUrl" :href="banner.targetUrl" target="_blank" rel="noreferrer" variant="ghost" size="sm" aria-label="Buka banner" ariaLabel="Buka banner" title="Buka banner"><AppIcon name="arrow-square-out" :size="17" aria-hidden="true" /></AppIconButton><AppIconButton variant="ghost" size="sm" class="text-danger hover:bg-danger-soft" aria-label="Hapus banner" ariaLabel="Hapus banner" title="Hapus banner" @click="remove(banner.id)"><AppIcon name="trash" :size="17" aria-hidden="true" /></AppIconButton></div></td></tr></tbody></table></div>
    </AppPanel>
  </div>
</template>
