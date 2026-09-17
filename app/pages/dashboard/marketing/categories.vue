<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Kategori Konten | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })

const { public: config } = useRuntimeConfig()
const categories = ref<{ id: string, name: string, slug: string, description: string, position: number }[]>([])
const form = reactive({ name: '', slug: '', description: '' })
const pending = ref(true); const saving = ref(false); const error = ref(''); const modalOpen = ref(false)

async function load() { pending.value = true; try { categories.value = await useApiFetch('/marketing/categories', { baseURL: config.apiBase, credentials: 'include' }) } catch { error.value = 'Kategori belum berhasil dimuat.' } finally { pending.value = false } }
async function create() {
  if (!form.name.trim()) { error.value = 'Nama kategori wajib diisi.'; return }
  saving.value = true; error.value = ''
  try { await useApiFetch('/marketing/categories', { baseURL: config.apiBase, method: 'POST', credentials: 'include', body: form }); Object.assign(form, { name: '', slug: '', description: '' }); modalOpen.value = false; await load() }
  catch { error.value = 'Kategori belum berhasil disimpan.' }
  finally { saving.value = false }
}
onMounted(load)
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Kategori Konten" description="Susun taksonomi artikel edukasi Zenko.">
      <template #actions><AppButton size="sm" @click="modalOpen = true">Tambah kategori</AppButton></template>
    </AppPageHeader>
    <AppInlineMessage v-if="error" type="error">{{ error }}</AppInlineMessage>
    <AppPanel header="Daftar kategori" :collapsible="false">
      <DashboardSkeleton v-if="pending" variant="rows" :count="5" />
      <AppEmptyState v-else-if="!categories.length" title="Belum ada kategori" description="Tambahkan kategori pertama untuk mengelompokkan artikel." action-label="Tambah kategori" @action="modalOpen = true" />
      <div v-else class="overflow-x-auto"><table class="w-full min-w-[620px] text-left text-sm"><thead class="border-b border-hairline text-xs text-muted"><tr><th class="px-4 py-3 font-semibold">Nama</th><th class="px-4 py-3 font-semibold">Slug</th><th class="px-4 py-3 font-semibold">Deskripsi</th><th class="px-4 py-3 font-semibold">Urutan</th></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="category in categories" :key="category.id"><td class="px-4 py-4 font-semibold text-ink">{{ category.name }}</td><td class="px-4 py-4 text-muted">/artikel/kategori/{{ category.slug }}</td><td class="px-4 py-4 text-muted">{{ category.description || '—' }}</td><td class="px-4 py-4 text-muted">{{ category.position }}</td></tr></tbody></table></div>
    </AppPanel>
    <AppModal v-model="modalOpen" title="Tambah kategori" description="Buat kategori untuk mengelompokkan artikel marketing.">
      <form class="grid gap-4" @submit.prevent="create">
        <AppTextField id="category-name" v-model="form.name" label="Nama" placeholder="SKD CPNS" />
        <AppTextField id="category-slug" v-model="form.slug" label="Slug opsional" placeholder="skd-cpns" />
        <AppTextField id="category-description" v-model="form.description" label="Deskripsi" />
        <div class="flex justify-end gap-3"><AppButton type="button" variant="outline" @click="modalOpen = false">Batal</AppButton><AppButton type="submit" :loading="saving">Simpan kategori</AppButton></div>
      </form>
    </AppModal>
  </div>
</template>
