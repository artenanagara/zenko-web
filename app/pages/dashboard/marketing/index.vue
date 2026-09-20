<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['marketing', 'editor'],
})

useHead({
  title: 'Cockpit Marketing | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

type PeriodKey = '7d' | '28d' | '90d'

interface MarketingMetric {
  uniqueVisitors: number | null
  pageviews: number | null
  searchImpressions: number | null
  newStudentRegistrations: number | null
  visitToExamRate: number | null
}

interface MarketingSummary {
  ready: boolean
  message: string
  period: { key: PeriodKey, label: string }
  metrics: MarketingMetric
  actions: { id: string, title: string, description: string, href?: string }[]
  trend: { date: string, visitors: number | null, registrations: number | null }[]
}

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 hari terakhir' },
  { value: '28d', label: '28 hari terakhir' },
  { value: '90d', label: '90 hari terakhir' },
]

const { public: config } = useRuntimeConfig()
const period = ref<PeriodKey>('28d')
const summary = ref<MarketingSummary | null>(null)
const pending = ref(true)
const error = ref(false)

async function loadSummary() {
  pending.value = true
  error.value = false
  try {
    summary.value = await useApiFetch<MarketingSummary>('/marketing/summary', {
      baseURL: config.apiBase,
      credentials: 'include',
      query: { period: period.value },
    })
  }
  catch {
    error.value = true
  }
  finally {
    pending.value = false
  }
}

watch(period, loadSummary)
onMounted(loadSummary)

const metricCards = computed(() => {
  const metrics = summary.value?.metrics
  return [
    { label: 'Pengunjung unik', value: formatMetric(metrics?.uniqueVisitors) },
    { label: 'Tayangan halaman', value: formatMetric(metrics?.pageviews) },
    { label: 'Impresi pencarian Google', value: formatMetric(metrics?.searchImpressions) },
    { label: 'Pendaftaran siswa baru', value: formatMetric(metrics?.newStudentRegistrations) },
    { label: 'Kunjungan ke ujian / pembelian', value: formatRate(metrics?.visitToExamRate) },
  ]
})

function formatMetric(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toLocaleString('id-ID')
}

function formatRate(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${value.toLocaleString('id-ID')}%`
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Cockpit Marketing"
      description="Pantau pertumbuhan Zenko dari satu tempat kerja."
    >
      <template #actions>
        <AppSelect
          v-model="period"
          aria-label="Periode laporan"
          :options="PERIOD_OPTIONS"
          size="sm"
        />
      </template>
    </AppPageHeader>

    <DashboardSkeleton v-if="pending && !summary" variant="stats" :count="5" :columns="3" label="Memuat ringkasan marketing..." />

    <div v-else-if="error" class="flex flex-wrap items-center gap-3">
      <AppInlineMessage type="error">Ringkasan marketing belum berhasil dimuat.</AppInlineMessage>
      <button type="button" class="text-[0.82rem] font-semibold text-primary hover:underline" @click="loadSummary">
        Muat ulang
      </button>
    </div>

    <template v-else-if="summary">
      <DashboardStats :items="metricCards" :columns="3" />

      <AppSectionMessage v-if="!summary.ready" title="Data analytics belum tersedia">
        Struktur cockpit dan filter periode sudah siap. Angka KPI, tindakan prioritas, dan tren akan muncul setelah pipeline analytics first-party, SEO, dan konversi tersedia.
      </AppSectionMessage>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <AppPanel header="Tren pertumbuhan" :collapsible="false">
          <div class="flex min-h-64 items-center justify-center rounded-md border border-dashed border-hairline bg-surface-alt p-6 text-center">
            <div class="max-w-sm">
              <IconChart class="mx-auto h-8 w-8 text-faint" aria-hidden="true" />
              <p class="mt-3 text-sm font-semibold text-ink">Belum ada data tren</p>
              <p class="mt-1 text-xs leading-5 text-muted">Grafik kunjungan dan pendaftaran akan ditampilkan untuk {{ summary.period.label }}.</p>
            </div>
          </div>
        </AppPanel>

        <AppPanel header="Pusat tindakan" :collapsible="false">
          <div v-if="summary.actions.length" class="grid gap-3">
            <NuxtLink
              v-for="action in summary.actions"
              :key="action.id"
              :to="action.href || '/dashboard/marketing'"
              class="rounded-md border border-hairline p-3 transition-colors hover:border-primary/40 hover:bg-primary-soft/30"
            >
              <p class="text-sm font-semibold text-ink">{{ action.title }}</p>
              <p class="mt-1 text-xs leading-5 text-muted">{{ action.description }}</p>
            </NuxtLink>
          </div>
          <div v-else class="flex min-h-64 items-center justify-center text-center">
            <div class="max-w-xs">
              <IconCheck class="mx-auto h-8 w-8 text-faint" aria-hidden="true" />
              <p class="mt-3 text-sm font-semibold text-ink">Belum ada tindakan</p>
              <p class="mt-1 text-xs leading-5 text-muted">Action center akan memberi tahu tim saat ada hal yang perlu ditindaklanjuti.</p>
            </div>
          </div>
        </AppPanel>
      </div>
    </template>
  </div>
</template>
