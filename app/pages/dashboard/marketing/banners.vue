<script setup lang="ts">
import { uploadTutorImage } from '~/composables/useTutorProducts'
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Banner & Promosi | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })

type Banner = { id: string, slot: string, title: string, description: string, buttonLabel: string, targetUrl: string, desktopImageUrl: string, mobileImageUrl: string, startsAt?: string, endsAt?: string, enabled: boolean, updatedAt: string }
const slots = [{ value: 'hero', label: 'Hero' }, { value: 'top_bar', label: 'Top bar' }, { value: 'sidebar', label: 'Sidebar' }]
const { public: config } = useRuntimeConfig()
const banners = ref<Banner[]>([]); const pending = ref(true); const saving = ref(false); const error = ref('')
const uploading = ref<'desktop' | 'mobile' | null>(null)
const form = reactive({ slot: 'hero', title: '', description: '', buttonLabel: '', targetUrl: '', desktopImageUrl: '', mobileImageUrl: '', startsAt: '', endsAt: '', enabled: true })

async function load() { pending.value = true; try { banners.value = await useApiFetch<Banner[]>('/marketing/banners', { baseURL: config.apiBase, credentials: 'include' }) } catch { error.value = 'Banner belum berhasil dimuat.' } finally { pending.value = false } }
function iso(value: string) { return value ? new Date(value).toISOString() : '' }
async function create() { if (!form.title.trim()) return; saving.value = true; error.value = ''; try { await useApiFetch('/marketing/banners', { baseURL: config.apiBase, method: 'POST', credentials: 'include', body: { ...form, startsAt: iso(form.startsAt), endsAt: iso(form.endsAt) } }); Object.assign(form, { slot: 'hero', title: '', description: '', buttonLabel: '', targetUrl: '', desktopImageUrl: '', mobileImageUrl: '', startsAt: '', endsAt: '', enabled: true }); await load() } catch { error.value = 'Banner belum berhasil disimpan.' } finally { saving.value = false } }
async function uploadVisual(event: Event, target: 'desktop' | 'mobile') { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; uploading.value = target; try { const url = await uploadTutorImage(file); form[target === 'desktop' ? 'desktopImageUrl' : 'mobileImageUrl'] = url } catch { error.value = 'Visual banner belum berhasil diunggah.' } finally { uploading.value = null } }
async function remove(id: string) { if (!confirm('Hapus banner ini?')) return; try { await useApiFetch(`/marketing/banners/${id}`, { baseURL: config.apiBase, method: 'DELETE', credentials: 'include' }); await load() } catch { error.value = 'Banner belum berhasil dihapus.' } }
function slotLabel(slot: string) { return slots.find(item => item.value === slot)?.label || slot }
function schedule(item: Banner) { if (!item.enabled) return 'Nonaktif'; const now = Date.now(); if (item.startsAt && new Date(item.startsAt).getTime() > now) return 'Terjadwal'; if (item.endsAt && new Date(item.endsAt).getTime() < now) return 'Selesai'; return 'Aktif' }
function formatDate(value?: string) { return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Tanpa batas waktu' }
onMounted(load)
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Banner & Promosi" description="Kelola pesan promosi yang tampil di area utama Zenko." />
    <AppInlineMessage v-if="error" type="error">{{ error }}</AppInlineMessage>
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <AppPanel header="Daftar banner" :collapsible="false">
        <DashboardSkeleton v-if="pending" variant="rows" :count="4" />
        <AppEmptyState v-else-if="!banners.length" title="Belum ada banner" description="Buat banner pertama untuk mulai mengatur promosi." />
        <ul v-else class="divide-y divide-hairline">
          <li v-for="banner in banners" :key="banner.id" class="grid gap-3 py-4 first:pt-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <div><div class="flex flex-wrap items-center gap-2"><p class="font-semibold text-ink">{{ banner.title }}</p><span class="rounded-full bg-surface-alt px-2 py-1 text-[0.68rem] font-semibold text-muted">{{ slotLabel(banner.slot) }}</span><span class="rounded-full bg-primary-soft/40 px-2 py-1 text-[0.68rem] font-semibold text-primary">{{ schedule(banner) }}</span></div><p v-if="banner.description" class="mt-1 text-sm text-muted">{{ banner.description }}</p><p class="mt-2 text-xs text-faint">{{ formatDate(banner.startsAt) }} · {{ banner.endsAt ? formatDate(banner.endsAt) : 'berulang sampai dimatikan' }}</p></div>
            <div class="flex items-center gap-3"><a v-if="banner.targetUrl" :href="banner.targetUrl" target="_blank" rel="noreferrer" class="text-xs font-semibold text-primary hover:underline">Buka tujuan</a><button type="button" class="text-xs font-semibold text-danger hover:underline" @click="remove(banner.id)">Hapus</button></div>
          </li>
        </ul>
      </AppPanel>
      <AppPanel header="Banner baru" :collapsible="false">
        <form class="grid gap-4" @submit.prevent="create">
          <AppSelect v-model="form.slot" label="Slot tampilan" :options="slots" />
          <AppTextField id="banner-title" v-model="form.title" label="Judul" placeholder="Promo tryout terbaru" />
          <AppTextField id="banner-description" v-model="form.description" label="Deskripsi" />
          <AppTextField id="banner-button" v-model="form.buttonLabel" label="Label tombol" placeholder="Lihat sekarang" />
          <AppTextField id="banner-target" v-model="form.targetUrl" label="URL tujuan" placeholder="/paket" />
          <AppTextField id="banner-desktop" v-model="form.desktopImageUrl" label="URL visual desktop" placeholder="https://..." /><label class="grid gap-1 text-xs font-semibold text-muted" for="banner-desktop-file">Atau unggah desktop<input id="banner-desktop-file" type="file" accept="image/png,image/jpeg,image/webp" :disabled="uploading !== null" class="text-sm font-normal" @change="uploadVisual($event, 'desktop')"></label>
          <AppTextField id="banner-mobile" v-model="form.mobileImageUrl" label="URL visual mobile" placeholder="https://..." /><label class="grid gap-1 text-xs font-semibold text-muted" for="banner-mobile-file">Atau unggah mobile<input id="banner-mobile-file" type="file" accept="image/png,image/jpeg,image/webp" :disabled="uploading !== null" class="text-sm font-normal" @change="uploadVisual($event, 'mobile')"></label>
          <label class="grid gap-1 text-xs font-semibold text-muted" for="banner-start">Mulai tayang<input id="banner-start" v-model="form.startsAt" type="datetime-local" class="rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink"></label>
          <label class="grid gap-1 text-xs font-semibold text-muted" for="banner-end">Selesai tayang<input id="banner-end" v-model="form.endsAt" type="datetime-local" class="rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink"></label>
          <label class="flex items-center gap-2 text-xs text-muted"><input v-model="form.enabled" type="checkbox" class="accent-primary"> Aktifkan banner setelah disimpan</label>
          <AppButton type="submit" :loading="saving">Tambah banner</AppButton>
        </form>
      </AppPanel>
    </div>
  </div>
</template>
