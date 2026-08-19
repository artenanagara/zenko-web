<script setup lang="ts">
import type { TutorSale } from '#shared/types/tutor-earnings'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Penjualan — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { summary, sales, pending, error, refresh } = useTutorSales()

// Produk hanya untuk mengisi dropdown filter; the sales rows carry their own
// titles.
const { data: products, refresh: refreshProducts } = useTutorProducts()

/* --------------------------------------------------------------------------
 * Filter periode + produk. The server does the filtering (?from=&to=&productId=),
 * so every change refetches.
 * ------------------------------------------------------------------------ */

type PeriodKey = 'month' | '30d' | 'all'

const PERIODS: { key: PeriodKey, label: string }[] = [
  { key: 'month', label: 'Bulan ini' },
  { key: '30d', label: '30 hari terakhir' },
  { key: 'all', label: 'Semua' },
]

// AppTabs works in plain strings; narrow its `update:modelValue` back onto
// PeriodKey instead of casting.
const periodTabs = PERIODS.map(option => ({ id: option.key, label: option.label }))
function isPeriodKey(id: string): id is PeriodKey {
  return PERIODS.some(option => option.key === id)
}
function selectPeriod(id: string) {
  if (isPeriodKey(id)) period.value = id
}

const period = ref<PeriodKey>('month')
const productId = ref('')

const productOptions = computed(() => [
  { value: '', label: 'Semua produk' },
  ...products.value.map(product => ({ value: product.id, label: product.title })),
])

function periodFrom(key: PeriodKey): number | undefined {
  const now = new Date()
  if (key === 'month') {
    return Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000)
  }
  if (key === '30d') {
    return Math.floor(now.getTime() / 1000) - 30 * 24 * 60 * 60
  }
  return undefined
}

function load() {
  return refresh({
    from: periodFrom(period.value),
    productId: productId.value || undefined,
  })
}

// Client-only fetch: the session cookie never reaches the Nuxt server, so the
// list resolves after hydration (see useTutorSales).
onMounted(() => {
  load()
  refreshProducts()
})

watch([period, productId], load)

const stats = computed(() => [
  { label: 'Transaksi', value: String(summary.value.count) },
  { label: 'Penjualan kotor', value: formatRupiah(summary.value.gross) },
  { label: 'Porsi kamu (70%)', value: formatRupiah(summary.value.share) },
])

const hasFilter = computed(() => period.value !== 'all' || productId.value !== '')

const salesColumns = [
  { key: 'paidAt', label: 'Tanggal' },
  { key: 'productTitle', label: 'Produk' },
  { key: 'buyerName', label: 'Pembeli' },
  { key: 'price', label: 'Harga', align: 'right' as const },
  { key: 'share', label: 'Porsi kamu', align: 'right' as const },
]

// AppTable's cell slots hand back `item`/`value` as Record<string, any>/any
// (it isn't a generic component), so lookups against the strictly-typed
// label/tone records go through these typed accessors instead of indexing
// the `any` value directly — keeps the label maps honestly typed without an
// `as` cast at every call site.
function productTypeLabel(type: TutorSale['productType']): string {
  return PRODUCT_TYPE_LABEL[type]
}
function shareStatusTone(status: TutorSale['shareStatus']) {
  return SHARE_STATUS_TONE[status]
}
function shareStatusLabel(status: TutorSale['shareStatus']): string {
  return SHARE_STATUS_LABEL[status]
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Penjualan"
      description="Riwayat penjualan produkmu. Porsi 70% tertahan 7 hari setelah pembayaran, lalu bisa dicairkan."
    />

    <DashboardStats :items="stats" :columns="3" />

    <DashboardPanel
      id="riwayat"
      title="Riwayat penjualan"
      description="Terbaru di atas. Nama pembeli disamarkan demi privasi."
    >
      <template #action>
        <div class="flex flex-wrap items-center gap-3">
          <AppTabs
            :tabs="periodTabs"
            :model-value="period"
            aria-label="Filter periode"
            @update:model-value="selectPeriod"
          />

          <!-- AppSelect's root is hardcoded w-full, so width is constrained
               via this wrapper rather than a conflicting utility class. -->
          <div class="w-56">
            <AppSelect
              :options="productOptions"
              :model-value="productId"
              size="sm"
              label="Filter produk"
              @update:model-value="productId = String($event)"
            />
          </div>
        </div>
      </template>

      <DashboardSkeleton v-if="pending" :count="5" label="Memuat riwayat penjualan..." />

      <div v-else-if="error" class="py-8 text-center">
        <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">
          Coba lagi
        </button>
      </div>

      <!-- Empty state: friendly, and distinguishes "no sales yet" from "filter
           came up empty". -->
      <AppEmptyState
        v-else-if="sales.length === 0 && hasFilter"
        title="Tidak ada penjualan pada filter ini"
        description="Coba ubah periode atau produk yang difilter."
        action-label="Tampilkan semua"
        @action="period = 'all'; productId = ''"
      />

      <AppEmptyState
        v-else-if="sales.length === 0"
        title="Belum ada penjualan"
        description="Begitu produkmu tayang dan terjual, setiap transaksi tercatat di sini beserta porsi 70% yang jadi bagianmu."
        action-label="Lihat produk saya"
        @action="() => navigateTo('/dashboard/tutor/products')"
      />

      <AppTable
        v-else
        :columns="salesColumns"
        :data="sales"
      >
        <template #cell(paidAt)="{ value }">
          <span class="whitespace-nowrap">{{ formatDate(value) }}</span>
        </template>
        <template #cell(productTitle)="{ item }">
          <span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.productTitle }}</span>
          <span class="block text-[0.82rem] text-muted">
            {{ productTypeLabel(item.productType) }} · {{ item.invoice }}
          </span>
        </template>
        <template #cell(price)="{ value }">
          <span class="tabular-nums">{{ formatRupiah(value) }}</span>
        </template>
        <template #cell(share)="{ item }">
          <span class="inline-flex items-center gap-2.5">
            <span class="font-semibold tabular-nums">{{ formatRupiah(item.share) }}</span>
            <DashboardBadge :tone="shareStatusTone(item.shareStatus)">
              {{ shareStatusLabel(item.shareStatus) }}
            </DashboardBadge>
          </span>
        </template>
      </AppTable>
    </DashboardPanel>
  </div>
</template>
