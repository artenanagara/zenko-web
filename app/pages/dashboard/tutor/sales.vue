<script setup lang="ts">
import type { TutorSale } from '#shared/types/tutor-earnings'
import type { TableControlOption } from '~/composables/useTableControls'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Penjualan | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { summary, sales, pending, error, refresh } = useTutorSales()

// Produk hanya untuk mengisi dropdown filter; the sales rows carry their own
// titles.
const { data: products, refresh: refreshProducts } = useTutorProducts()

/* --------------------------------------------------------------------------
 * Toolbar — cari, filter periode, filter produk, urutkan. Same shape as the
 * admin tables (DashboardTableToolbar + useTableControls), replacing the old
 * AppTabs (periode) and the loose AppSelect (produk).
 *
 * Two of the four axes belong to the server (?from=&productId=), which is what
 * keeps the summary cards above honest — they are computed server-side over the
 * same filtered set. So the period lives in the toolbar's filter dropdown with
 * pass-through predicates and a watcher that refetches, and the product filter
 * keeps its own select in the toolbar's `filter-extra` slot rather than
 * collapsing into search (search can narrow the rows, but only a real query
 * param can rescope "Penjualan kotor" and "Porsi kamu" to one product).
 * Search and sort are local, over the rows the server just returned.
 * ------------------------------------------------------------------------ */

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'month', label: 'Bulan ini' },
  { value: '30d', label: '30 hari terakhir' },
  { value: 'all', label: 'Semua periode' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'amount-desc', label: 'Nominal terbesar' },
  { value: 'amount-asc', label: 'Nominal terkecil' },
]

const productId = ref('')

const productOptions = computed(() => [
  { value: '', label: 'Semua produk' },
  ...products.value.map(product => ({ value: product.id, label: product.title })),
])

/** Unix seconds the period starts at; undefined means "no lower bound". */
function periodFrom(key: string): number | undefined {
  const now = new Date()
  if (key === 'month') {
    return Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000)
  }
  if (key === '30d') {
    return Math.floor(now.getTime() / 1000) - 30 * 24 * 60 * 60
  }
  return undefined
}

const {
  search,
  filter: period,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<TutorSale>(() => sales.value, {
  searchFields: sale => [sale.productTitle, sale.buyerName, sale.invoice],
  // The server already applied the period, so every row it returned qualifies;
  // the predicates exist to satisfy the option list, and the watcher below is
  // what actually changes the result.
  filters: {
    month: () => true,
    '30d': () => true,
    all: () => true,
  },
  // Sorting by the tutor's share and by the buyer's price give the same order
  // (share is a flat 70% of price), so one pair of "Nominal" options covers
  // both money columns.
  sorts: {
    newest: (a, b) => b.paidAt - a.paidAt,
    oldest: (a, b) => a.paidAt - b.paidAt,
    'amount-desc': (a, b) => b.share - a.share,
    'amount-asc': (a, b) => a.share - b.share,
  },
  defaultFilter: 'month',
  defaultSort: 'newest',
})

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
  { label: 'Pendapatan bersih', value: formatRupiah(summary.value.share) },
])

/** The product select sits outside useTableControls, so Reset has to clear it too. */
const toolbarActive = computed(() => isActive.value || productId.value !== '')

function resetToolbar() {
  reset()
  productId.value = ''
}

/**
 * True whenever *anything* narrows the view — including the default "Bulan
 * ini", which is already a filter. That is what separates "kamu belum pernah
 * jualan" from "tidak ada yang cocok": a tutor whose only sales were last month
 * must not be told they have never sold anything.
 */
const hasFilter = computed(() => toolbarActive.value || period.value !== 'all')

/** The way out of an empty filtered view: widen to everything, not back to "Bulan ini". */
function showEverything() {
  search.value = ''
  period.value = 'all'
  productId.value = ''
}

const salesColumns = [
  { key: 'paidAt', label: 'Tanggal' },
  { key: 'productTitle', label: 'Produk' },
  { key: 'buyerName', label: 'Pembeli' },
  { key: 'price', label: 'Harga', align: 'right' as const },
  { key: 'share', label: 'Pendapatan bersih', align: 'right' as const },
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
      description="Catatan seluruh transaksi paket soalmu. Penghasilan bersih akan siap dicairkan 7 hari setelah pembayaran terverifikasi. Untuk menjaga kenyamanan bersama, nama pembeli disamarkan."
    />

    <DashboardStats :items="stats" :columns="3" />

    <DashboardPanel id="riwayat">
      <!-- The toolbar sits above the loading and error states: changing the
           period or the product fires a refetch, and the control that fired it
           has to stay put (and stay resettable) while that fetch runs or
           fails. -->
      <div class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="period"
          v-model:sort="sortOrder"
          search-id="tutor-sales-search"
          search-label="Cari penjualan"
          search-placeholder="Cari produk, pembeli, atau invoice…"
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          filter-label="Periode"
          :result-count="rows.length"
          :total-count="total"
          item-noun="transaksi"
          :active="toolbarActive"
          @reset="resetToolbar"
        >
          <!-- AppSelect's root is hardcoded w-full, so width is constrained
               via this wrapper rather than a conflicting utility class. -->
          <template #filter-extra>
            <div class="sm:w-56 sm:shrink-0">
              <AppSelect
                :options="productOptions"
                :model-value="productId"
                size="sm"
                label="Produk"
                @update:model-value="productId = String($event)"
              />
            </div>
          </template>
        </DashboardTableToolbar>

        <DashboardSkeleton v-if="pending" :count="5" label="Memuat riwayat penjualan..." />

        <div v-else-if="error" class="py-8 text-center">
          <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
          <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">
            Coba lagi
          </button>
        </div>

        <!-- Two empty states: with nothing narrowing the view (Semua periode,
             semua produk, no search) an empty table means there really are no
             sales yet; anything else means the filters came up empty, and
             widening them is the way out. -->
        <AppEmptyState
          v-else-if="rows.length === 0 && hasFilter"
          title="Tidak ada hasil"
          description="Belum ada transaksi yang cocok dengan pencarian, periode, atau filter produk ini."
          action-label="Tampilkan semua transaksi"
          @action="showEverything"
        />

        <AppEmptyState
          v-else-if="rows.length === 0"
          title="Belum ada penjualan"
          description="Saat paket soalmu mulai dibeli siswa, seluruh catatan transaksi dan pendapatan bersihmu akan langsung muncul di sini."
          action-label="Lihat produk saya"
          @action="() => navigateTo('/dashboard/tutor/products')"
        />

        <AppTable
          v-else
          :columns="salesColumns"
          :data="rows"
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
      </div>
    </DashboardPanel>
  </div>
</template>
