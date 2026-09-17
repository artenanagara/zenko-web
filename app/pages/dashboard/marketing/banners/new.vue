<script setup lang="ts">
import { uploadTutorImage } from '~/composables/useTutorProducts'

definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Tambah Banner | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })

const slots = [{ value: 'hero', label: 'Hero' }, { value: 'top_bar', label: 'Top bar' }, { value: 'sidebar', label: 'Sidebar' }]
const { public: config } = useRuntimeConfig()
const saving = ref(false)
const uploading = ref<'desktop' | 'mobile' | null>(null)
const error = ref('')
const form = reactive({ slot: 'hero', title: '', description: '', buttonLabel: '', targetUrl: '', desktopImageUrl: '', mobileImageUrl: '', startsAt: '', endsAt: '', enabled: true })

function iso(value: string) { return value ? new Date(value).toISOString() : '' }
async function uploadVisual(event: Event, target: 'desktop' | 'mobile') {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = target
  error.value = ''
  try { form[target === 'desktop' ? 'desktopImageUrl' : 'mobileImageUrl'] = await uploadTutorImage(file) }
  catch { error.value = 'Visual banner belum berhasil diunggah.' }
  finally { uploading.value = null }
}
async function save() {
  if (!form.title.trim()) { error.value = 'Judul banner wajib diisi.'; return }
  saving.value = true
  error.value = ''
  try {
    await useApiFetch('/marketing/banners', { baseURL: config.apiBase, method: 'POST', credentials: 'include', body: { ...form, startsAt: iso(form.startsAt), endsAt: iso(form.endsAt) } })
    await navigateTo('/dashboard/marketing/banners')
  } catch { error.value = 'Banner belum berhasil disimpan.' }
  finally { saving.value = false }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Tambah banner" description="Atur pesan, visual, tujuan, dan jadwal tayang promosi.">
      <template #actions><AppButton to="/dashboard/marketing/banners" variant="outline" size="sm">Kembali</AppButton></template>
    </AppPageHeader>
    <AppInlineMessage v-if="error" type="error">{{ error }}</AppInlineMessage>
    <form class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" @submit.prevent="save">
      <AppPanel header="Konten banner" :collapsible="false">
        <div class="grid gap-4">
          <AppSelect v-model="form.slot" label="Slot tampilan" :options="slots" />
          <AppTextField id="banner-title" v-model="form.title" label="Judul" placeholder="Promo tryout terbaru" />
          <AppTextField id="banner-description" v-model="form.description" label="Deskripsi" />
          <AppTextField id="banner-button" v-model="form.buttonLabel" label="Label tombol" placeholder="Lihat sekarang" />
          <AppTextField id="banner-target" v-model="form.targetUrl" label="URL tujuan" placeholder="/paket" />
        </div>
      </AppPanel>
      <div class="grid content-start gap-6">
        <AppPanel header="Visual" :collapsible="false">
          <div class="grid gap-4">
            <AppTextField id="banner-desktop" v-model="form.desktopImageUrl" label="URL visual desktop" placeholder="https://..." />
            <label class="grid gap-1 text-xs font-semibold text-muted" for="banner-desktop-file">Atau unggah desktop<input id="banner-desktop-file" type="file" accept="image/png,image/jpeg,image/webp" :disabled="uploading !== null" class="text-sm font-normal" @change="uploadVisual($event, 'desktop')"></label>
            <AppTextField id="banner-mobile" v-model="form.mobileImageUrl" label="URL visual mobile" placeholder="https://..." />
            <label class="grid gap-1 text-xs font-semibold text-muted" for="banner-mobile-file">Atau unggah mobile<input id="banner-mobile-file" type="file" accept="image/png,image/jpeg,image/webp" :disabled="uploading !== null" class="text-sm font-normal" @change="uploadVisual($event, 'mobile')"></label>
          </div>
        </AppPanel>
        <AppPanel header="Penayangan" :collapsible="false">
          <div class="grid gap-4">
            <label class="grid gap-1 text-xs font-semibold text-muted" for="banner-start">Mulai tayang<input id="banner-start" v-model="form.startsAt" type="datetime-local" class="rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink"></label>
            <label class="grid gap-1 text-xs font-semibold text-muted" for="banner-end">Selesai tayang<input id="banner-end" v-model="form.endsAt" type="datetime-local" class="rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink"></label>
            <label class="flex items-center gap-2 text-xs text-muted"><input v-model="form.enabled" type="checkbox" class="accent-primary"> Aktifkan banner setelah disimpan</label>
            <AppButton type="submit" :loading="saving">Simpan banner</AppButton>
          </div>
        </AppPanel>
      </div>
    </form>
  </div>
</template>
