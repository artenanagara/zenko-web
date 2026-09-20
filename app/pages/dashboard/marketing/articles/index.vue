<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Artikel & Panduan | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })

type Status = 'all' | 'draft' | 'published' | 'scheduled' | 'archived'
interface Article { id: string, slug: string, title: string, subtitle: string, status: Exclude<Status, 'all'>, categoryName: string, authorName: string, updatedAt: string, wordCount: number, readingMinutes: number }
const tabs = [{ id: 'all', label: 'Semua' }, { id: 'published', label: 'Terbit' }, { id: 'draft', label: 'Draf' }, { id: 'scheduled', label: 'Terjadwal' }, { id: 'archived', label: 'Arsip' }]
const { public: config } = useRuntimeConfig()
const status = ref<Status>('all'); const articles = ref<Article[]>([]); const pending = ref(true); const error = ref(false)
async function load() { pending.value = true; error.value = false; try { articles.value = await useApiFetch<Article[]>('/marketing/articles', { baseURL: config.apiBase, credentials: 'include', query: status.value === 'all' ? undefined : { status: status.value } }) } catch { error.value = true } finally { pending.value = false } }
watch(status, load); onMounted(load)
function statusLabel(value: Article['status']) { return ({ published: 'Terbit', draft: 'Draf', scheduled: 'Terjadwal', archived: 'Arsip' } as Record<Article['status'], string>)[value] }
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Artikel & Panduan" description="Kelola tulisan edukasi dan panduan yang diterbitkan Zenko.">
      <template #actions><AppButton to="/dashboard/marketing/articles/new" size="sm">Tulis artikel baru</AppButton></template>
    </AppPageHeader>
    <AppTabs v-model="status" :tabs="tabs" aria-label="Status artikel" />
    <DashboardSkeleton v-if="pending && !articles.length" variant="rows" :count="6" label="Memuat artikel..." />
    <AppInlineMessage v-else-if="error" type="error">Daftar artikel belum berhasil dimuat. <button class="font-semibold underline" @click="load">Muat ulang</button></AppInlineMessage>
    <AppPanel v-else header="Daftar artikel" :collapsible="false">
      <AppEmptyState v-if="!articles.length" title="Belum ada artikel" description="Buat draf pertama untuk mulai membangun pustaka konten Zenko." action-label="Tulis artikel baru" @action="navigateTo('/dashboard/marketing/articles/new')" />
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm"><thead class="border-b border-hairline text-xs text-muted"><tr><th class="px-4 py-3 font-semibold">Artikel</th><th class="px-4 py-3 font-semibold">Kategori</th><th class="px-4 py-3 font-semibold">Status</th><th class="px-4 py-3 font-semibold">Diperbarui</th><th class="px-4 py-3" /></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="article in articles" :key="article.id"><td class="px-4 py-4"><p class="font-semibold text-ink">{{ article.title }}</p><p class="mt-1 text-xs text-muted">{{ article.authorName || 'Tanpa byline' }} · {{ article.wordCount }} kata · {{ article.readingMinutes }} menit baca</p></td><td class="px-4 py-4 text-muted">{{ article.categoryName || 'Tanpa kategori' }}</td><td class="px-4 py-4"><AppBadge>{{ statusLabel(article.status) }}</AppBadge></td><td class="px-4 py-4 text-xs text-muted">{{ new Date(article.updatedAt).toLocaleDateString('id-ID') }}</td><td class="px-4 py-4 text-right"><AppIconButton :to="`/dashboard/marketing/articles/${article.id}`" variant="ghost" size="sm" aria-label="Edit artikel" ariaLabel="Edit artikel" title="Edit artikel"><AppIcon name="pencil-simple" :size="17" aria-hidden="true" /></AppIconButton></td></tr></tbody></table>
      </div>
    </AppPanel>
  </div>
</template>
