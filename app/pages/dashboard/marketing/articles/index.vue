<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Artikel & Panduan | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })

type Status = 'all' | 'draft' | 'published' | 'scheduled' | 'archived'
interface Article { id: string, slug: string, title: string, subtitle: string, status: Exclude<Status, 'all'>, categoryName: string, authorName: string, updatedAt: string, publishedAt?: string, wordCount: number, readingMinutes: number }
interface ArticleAnalytics { articleId: string, articleSlug: string, articleName: string, views: number, uniqueVisitors: number }
const tabs = [{ id: 'all', label: 'Semua' }, { id: 'published', label: 'Terbit' }, { id: 'draft', label: 'Draf' }, { id: 'scheduled', label: 'Terjadwal' }, { id: 'archived', label: 'Arsip' }]
const { public: config } = useRuntimeConfig()
const status = ref<Status>('all'); const articles = ref<Article[]>([]); const pending = ref(true); const error = ref(false)
const analytics = ref<ArticleAnalytics[]>([])
async function load() { pending.value = true; error.value = false; try { articles.value = await useApiFetch<Article[]>('/marketing/articles', { baseURL: config.apiBase, credentials: 'include', query: status.value === 'all' ? undefined : { status: status.value } }) } catch { error.value = true } finally { pending.value = false } }
async function loadAnalytics() { try { const summary = await useApiFetch<{ articles?: ArticleAnalytics[] }>('/marketing/analytics/summary', { baseURL: config.apiBase, credentials: 'include', query: { period: '28d' } }); analytics.value = summary.articles || [] } catch { analytics.value = [] } }
watch(status, load); onMounted(() => { load(); loadAnalytics() })
const calendarArticles = computed(() => articles.value.filter(item => item.status === 'scheduled' || item.status === 'published').sort((a,b) => (a.publishedAt || a.updatedAt).localeCompare(b.publishedAt || b.updatedAt)))
function articleMetrics(id: string, slug: string) { return analytics.value.find(item => item.articleId === id || item.articleSlug === slug) }
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
        <table class="w-full min-w-[900px] text-left text-sm"><thead class="border-b border-hairline text-xs text-muted"><tr><th class="px-4 py-3 font-semibold">Artikel</th><th class="px-4 py-3 font-semibold">Kategori</th><th class="px-4 py-3 font-semibold">Status</th><th class="px-4 py-3 font-semibold">Kunjungan / 28 hari</th><th class="px-4 py-3 font-semibold">Sesi unik</th><th class="px-4 py-3 font-semibold">Diperbarui</th><th class="px-4 py-3" /></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="article in articles" :key="article.id"><td class="px-4 py-4"><p class="font-semibold text-ink">{{ article.title }}</p><p class="mt-1 text-xs text-muted">{{ article.authorName || 'Tanpa byline' }} · {{ article.wordCount }} kata · {{ article.readingMinutes }} menit baca</p></td><td class="px-4 py-4 text-muted">{{ article.categoryName || 'Tanpa kategori' }}</td><td class="px-4 py-4"><AppBadge>{{ statusLabel(article.status) }}</AppBadge></td><td class="px-4 py-4 font-semibold">{{ articleMetrics(article.id, article.slug)?.views.toLocaleString('id-ID') || '0' }}</td><td class="px-4 py-4">{{ articleMetrics(article.id, article.slug)?.uniqueVisitors.toLocaleString('id-ID') || '0' }}</td><td class="px-4 py-4 text-xs text-muted">{{ new Date(article.updatedAt).toLocaleDateString('id-ID') }}</td><td class="px-4 py-4 text-right"><AppIconButton :to="`/dashboard/marketing/articles/${article.id}`" variant="ghost" size="sm" aria-label="Edit artikel" ariaLabel="Edit artikel" title="Edit artikel"><AppIcon name="pencil-simple" :size="17" aria-hidden="true" /></AppIconButton></td></tr></tbody></table>
      </div>
    </AppPanel>
    <AppPanel header="Kalender editorial" :collapsible="false">
      <AppEmptyState v-if="!calendarArticles.length" title="Belum ada artikel terbit atau terjadwal" description="Atur tanggal terbit artikel dari editor untuk melihat kalender konten." />
      <div v-else class="grid gap-2"><div v-for="article in calendarArticles" :key="`calendar-${article.id}`" class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline p-3"><div><p class="text-sm font-semibold text-ink">{{ article.title }}</p><p class="text-xs text-muted">{{ article.status === 'scheduled' ? 'Jadwal terbit' : 'Terbit' }} · {{ article.categoryName || 'Tanpa kategori' }}</p></div><time class="text-sm font-semibold text-primary">{{ new Date(article.publishedAt || article.updatedAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) }}</time></div></div>
    </AppPanel>
  </div>
</template>
