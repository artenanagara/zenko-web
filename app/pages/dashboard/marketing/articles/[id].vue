<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
const route = useRoute(); const { public: config } = useRuntimeConfig()
const article = ref<any>(null); const categories = ref<{ id: string, name: string }[]>([]); const pending = ref(true); const saving = ref(false); const error = ref(''); const preview = ref(false)
const form = reactive({ title: '', subtitle: '', slug: '', coverUrl: '', coverAlt: '', content: '', categoryId: '', metaTitle: '', metaDescription: '', noIndex: false, status: 'draft' })
async function load() {
  pending.value = true
  try {
    const [loaded, categoryList] = await Promise.all([
      useApiFetch<any>(`/marketing/articles/${route.params.id}`, { baseURL: config.apiBase, credentials: 'include' }),
      useApiFetch<{ id: string, name: string }[]>('/marketing/categories', { baseURL: config.apiBase, credentials: 'include' }),
    ])
    article.value = loaded; categories.value = categoryList
    Object.assign(form, { title: loaded.title, subtitle: loaded.subtitle, slug: loaded.slug, coverUrl: loaded.coverUrl, coverAlt: loaded.coverAlt, content: loaded.content, categoryId: loaded.categoryId, metaTitle: loaded.metaTitle, metaDescription: loaded.metaDescription, noIndex: loaded.noIndex, status: loaded.status })
  } catch { error.value = 'Artikel belum berhasil dimuat.' } finally { pending.value = false }
}
onMounted(load)
async function save() {
  if (!form.title.trim()) { error.value = 'Judul artikel wajib diisi.'; return }
  saving.value = true; error.value = ''
  try { await useApiFetch(`/marketing/articles/${route.params.id}`, { baseURL: config.apiBase, method: 'PATCH', credentials: 'include', body: form }); await load() }
  catch { error.value = 'Perubahan artikel belum berhasil disimpan.' } finally { saving.value = false }
}
useHead(() => ({ title: article.value ? `${article.value.title} | Marketing Hub` : 'Edit artikel | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] }))
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Edit artikel" description="Perubahan draf tersimpan di sini dan bisa ditinjau seperti tampilan pembaca."><template #actions><AppButton variant="outline" size="sm" @click="preview = !preview">{{ preview ? 'Kembali ke editor' : 'Lihat preview' }}</AppButton></template></AppPageHeader>
    <AppInlineMessage v-if="error" type="error">{{ error }}</AppInlineMessage>
    <DashboardSkeleton v-if="pending" variant="rows" :count="5" label="Memuat artikel…" />
    <article v-else-if="preview" class="mx-auto w-full max-w-3xl rounded-lg border border-hairline bg-surface px-6 py-8 shadow-xs md:px-12 md:py-12">
      <MarketingArticleCover :article="{ ...article, title: form.title, coverUrl: form.coverUrl, coverAlt: form.coverAlt }" />
      <p class="mt-8 text-xs font-bold tracking-widest text-primary uppercase">{{ article?.categoryName || 'Artikel Zenko' }}</p><h1 class="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{{ form.title || 'Judul artikel' }}</h1><p v-if="form.subtitle" class="mt-4 text-lg leading-8 text-muted">{{ form.subtitle }}</p><div class="article-content mt-8 text-[1.02rem] leading-8" v-html="form.content" />
    </article>
    <form v-else-if="article" class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" @submit.prevent="save">
      <AppPanel header="Kanvas menulis" :collapsible="false"><div class="grid gap-5"><AppTextField id="article-title" v-model="form.title" label="Judul utama" /><AppTextField id="article-subtitle" v-model="form.subtitle" label="Subjudul" /><MarketingImageUpload v-model="form.coverUrl" label="Gambar sampul" :alt="form.coverAlt || form.title || 'Pratinjau gambar sampul'" /><AppTextField id="article-cover-alt" v-model="form.coverAlt" label="Alt text gambar" /><RichTextEditor v-model="form.content" aria-label="Isi artikel" placeholder="Mulai menulis artikel…" /></div></AppPanel>
      <div class="grid content-start gap-6"><AppPanel header="Publikasi" :collapsible="false"><div class="grid gap-4"><AppTextField id="article-slug" v-model="form.slug" label="Slug URL" /><AppSelect v-model="form.status" label="Status" :options="[{ value: 'draft', label: 'Simpan sebagai draf' }, { value: 'published', label: 'Terbitkan sekarang' }, { value: 'scheduled', label: 'Terjadwal' }]" /><AppSelect v-model="form.categoryId" label="Kategori" :options="[{ value: '', label: 'Tanpa kategori' }, ...categories.map(item => ({ value: item.id, label: item.name }))]" /><AppButton type="submit" :loading="saving">{{ form.status === 'published' ? 'Terbitkan artikel' : 'Simpan perubahan' }}</AppButton></div></AppPanel><AppPanel header="SEO dasar" :collapsible="false"><div class="grid gap-4"><AppTextField id="article-meta-title" v-model="form.metaTitle" label="Meta title" /><AppTextField id="article-meta-description" v-model="form.metaDescription" label="Meta description" /><label class="flex items-center gap-2 text-xs text-muted"><input v-model="form.noIndex" type="checkbox" class="accent-primary"> Jangan indeks artikel ini</label></div></AppPanel></div>
    </form>
  </div>
</template>
