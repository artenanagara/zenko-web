<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Tulis Artikel | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })
const { public: config } = useRuntimeConfig()
const categories = ref<{ id: string, name: string }[]>([])
const saving = ref(false)
const error = ref('')
const toast = useToast()
const form = reactive({ title: '', subtitle: '', slug: '', coverUrl: '', coverAlt: '', content: '', categoryId: '', metaTitle: '', metaDescription: '', noIndex: false, status: 'draft', publishedAt: '' })

onMounted(async () => { try { categories.value = await useApiFetch('/marketing/categories', { baseURL: config.apiBase, credentials: 'include' }) } catch { /* optional */ } })
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
watch(() => form.title, value => { if (!form.slug) form.slug = slugify(value) })
async function save() {
  if (!form.title.trim()) { error.value = 'Judul artikel wajib diisi.'; return }
  if (form.status === 'scheduled' && (!form.publishedAt || new Date(form.publishedAt).getTime() <= Date.now())) { error.value = 'Pilih waktu terbit di masa mendatang.'; return }
  saving.value = true; error.value = ''
  try {
    await useApiFetch<{ id: string }>('/marketing/articles', { baseURL: config.apiBase, method: 'POST', credentials: 'include', body: { ...form, publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : '' } })
    toast.success(
      form.status === 'published' ? 'Artikel sudah terbit.' : form.status === 'draft' ? 'Artikel disimpan di draft.' : 'Artikel dijadwalkan.',
    )
    await navigateTo('/dashboard/marketing/articles')
  } catch { error.value = 'Artikel belum berhasil disimpan.' }
  finally { saving.value = false }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Tulis artikel baru" description="Tulis, optimalkan, dan siapkan artikel untuk diterbitkan." />
    <AppInlineMessage v-if="error" type="error">{{ error }}</AppInlineMessage>
    <form class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" @submit.prevent="save">
      <AppPanel header="Kanvas menulis" :collapsible="false">
        <div class="grid gap-5">
          <AppTextField id="article-title" v-model="form.title" label="Judul utama" placeholder="Contoh: Cara belajar SKD lebih terarah" />
          <AppTextField id="article-subtitle" v-model="form.subtitle" label="Subjudul" placeholder="Ringkasan singkat untuk pembaca" />
          <div class="grid gap-4">
            <MarketingImageUpload v-model="form.coverUrl" label="Gambar sampul" :alt="form.coverAlt || form.title || 'Pratinjau gambar sampul'" />
            <AppTextField id="article-cover-alt" v-model="form.coverAlt" label="Alt text gambar" />
          </div>
          <RichTextEditor v-model="form.content" auto-grow aria-label="Isi artikel" placeholder="Mulai menulis artikel..." />
        </div>
      </AppPanel>
      <div class="grid content-start gap-6">
        <AppPanel header="Publikasi" :collapsible="false"><div class="grid gap-4"><AppTextField id="article-slug" v-model="form.slug" label="Slug URL" /><AppSelect v-model="form.status" label="Status" :options="[{ value: 'draft', label: 'Simpan sebagai draf' }, { value: 'published', label: 'Terbitkan sekarang' }, { value: 'scheduled', label: 'Terjadwal' }]" /><AppInput v-if="form.status === 'scheduled'" id="article-publish-at" v-model="form.publishedAt" label="Tanggal dan waktu terbit" type="datetime-local" /><AppSelect v-model="form.categoryId" label="Kategori" :options="[{ value: '', label: 'Tanpa kategori' }, ...categories.map(item => ({ value: item.id, label: item.name }))]" /><AppButton type="submit" :loading="saving">{{ form.status === 'published' ? 'Terbitkan artikel' : 'Simpan artikel' }}</AppButton></div></AppPanel>
        <AppPanel header="SEO dasar" :collapsible="false"><div class="grid gap-4"><AppTextField id="article-meta-title" v-model="form.metaTitle" label="Meta title" /><AppTextField id="article-meta-description" v-model="form.metaDescription" label="Meta description" /><p class="text-xs text-muted">{{ form.metaTitle.length }}/60 karakter · {{ form.metaDescription.length }}/160 karakter</p><label class="flex items-center gap-2 text-xs text-muted"><input v-model="form.noIndex" type="checkbox" class="accent-primary"> Jangan indeks artikel ini</label></div></AppPanel>
      </div>
    </form>
  </div>
</template>
