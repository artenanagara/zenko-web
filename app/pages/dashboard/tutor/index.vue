<script setup lang="ts">
import type { StackedBarPoint, StackedBarSeries } from '~/components/dashboard/DashboardStackedBarChart.vue'
import type { TutorProductSummary } from '#shared/types/tutor-product'

definePageMeta({
  path: '/dashboard/tutor',
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Dashboard tutor — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

// Satu fetch tanpa filter: kartu metrik & kedua chart di bawah semuanya
// dihitung dari respons yang sama, tidak ada fetch tambahan per widget.
const { summary, sales, pending: salesPending, error: salesError, refresh: refreshSales } = useTutorSales()
const { data: balance, refresh: refreshBalance } = useTutorBalance()
const { data: products, pending: productsPending, error: productsError, refresh: refreshProducts } = useTutorProducts()

// Client-only fetches: the session cookie never reaches the Nuxt server, so
// everything resolves after hydration (see useTutorEarnings).
onMounted(() => {
  refreshSales()
  refreshBalance()
  refreshProducts()
})

// Total pendapatan: semua waktu, bukan cuma bulan berjalan — beda dari
// halaman Penjualan yang menyaring per periode.
const totalShare = computed(() => sales.value.reduce((sum, sale) => sum + sale.share, 0))

// "Perlu perhatian": moderation outcomes surface on the overview, so a
// rejection is visible without having to open Produk Saya first.
const rejectedCount = computed(() => products.value.filter(product => product.status === 'rejected').length)
const reviewCount = computed(() => products.value.filter(product => product.status === 'review').length)

const stats = computed(() => [
  { label: 'Total pendapatan', value: formatRupiah(totalShare.value), hint: 'Porsi 70% dari seluruh penjualan.' },
  { label: 'Total produk', value: String(products.value.length) },
  { label: 'Produk terjual', value: String(summary.value.count), hint: 'Sepanjang waktu' },
])

/**
 * How many rows a preview panel shows. Both panels here are previews of a page
 * that owns the full, filterable table (Penjualan and Produk saya) — the
 * overview's job is to say "here's the latest, go there for the rest", not to
 * reprint either table.
 */
const PREVIEW_ROWS = 5

const recentSales = computed(() => sales.value.slice(0, PREVIEW_ROWS))

/**
 * Produk terbaru diperbarui, dipotong ke PREVIEW_ROWS. Sorted here rather than
 * trusting the list order, so "terbaru diperbarui" in the panel description is
 * actually true — and it matches the default sort of Produk saya.
 */
const previewProducts = computed(() =>
  [...products.value].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, PREVIEW_ROWS),
)

/** How many products the preview is not showing — stated under the table. */
const hiddenProductCount = computed(() => Math.max(products.value.length - PREVIEW_ROWS, 0))

// Preview columns, deliberately narrower than Produk saya's: no Kategori (a
// catalogue taxonomy detail that never decides whether to open the full page)
// and no Soal/Aksi (the full table owns every action). Title, type, price and
// status are what "how are my products doing" actually asks.
const productColumns = [
  { key: 'title', label: 'Produk' },
  { key: 'type', label: 'Tipe' },
  { key: 'price', label: 'Harga', align: 'right' as const },
  { key: 'status', label: 'Status', align: 'right' as const },
]

// AppTable's cell slots hand back `item`/`value` as Record<string, any>/any
// (it isn't a generic component), so lookups against the strictly-typed
// label/tone records go through these typed accessors instead of indexing
// the `any` value directly.
function productTypeLabel(type: TutorProductSummary['type']): string {
  return PRODUCT_TYPE_LABEL[type]
}
function productStatusTone(status: TutorProductSummary['status']) {
  return PRODUCT_STATUS_TONE[status]
}
function productStatusLabel(status: TutorProductSummary['status']): string {
  return PRODUCT_STATUS_LABEL[status]
}

/* --------------------------------------------------------------------------
 * Chart data — computed client-side from `sales`, already fetched above.
 * No extra requests.
 * ------------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000

/** YYYY-MM-DD in the Jakarta calendar day, matching how formatDate anchors dates. */
function dayKey(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

/**
 * Pendapatan harian, ditumpuk per produk — 30 hari terakhir (hari ini
 * inklusif). Produk diurutkan dari total pendapatan terbanyak; top 8 jadi
 * series sendiri, sisanya digabung ke satu series "Lainnya", sama seperti
 * batas lama di chart per-produk yang terpisah.
 */
const dailyProductRevenue = computed<{ points: StackedBarPoint[], series: StackedBarSeries[] }>(() => {
  const byProduct = new Map<string, { title: string, total: number }>()
  for (const sale of sales.value) {
    const existing = byProduct.get(sale.productId)
    if (existing) existing.total += sale.share
    else byProduct.set(sale.productId, { title: sale.productTitle, total: sale.share })
  }

  const sortedIds = [...byProduct.entries()].sort((a, b) => b[1].total - a[1].total).map(([id]) => id)
  const topIds = sortedIds.slice(0, 8)
  const hasOthers = sortedIds.length > topIds.length

  const series: StackedBarSeries[] = topIds.map((id, index) => ({
    key: id,
    label: byProduct.get(id)!.title,
    color: `var(--color-chart-${index + 1})`,
  }))
  if (hasOthers) {
    series.push({ key: 'lainnya', label: 'Lainnya', color: 'var(--color-faint)' })
  }
  const topIdSet = new Set(topIds)

  const byDayThenProduct = new Map<string, Map<string, number>>()
  for (const sale of sales.value) {
    const day = dayKey(sale.paidAt)
    const seriesKey = topIdSet.has(sale.productId) ? sale.productId : 'lainnya'
    const dayMap = byDayThenProduct.get(day) ?? new Map<string, number>()
    dayMap.set(seriesKey, (dayMap.get(seriesKey) ?? 0) + sale.share)
    byDayThenProduct.set(day, dayMap)
  }

  const now = Date.now()
  const points: StackedBarPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now - i * DAY_MS)
    const key = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const dayMap = byDayThenProduct.get(key)
    points.push({
      key,
      label: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }),
      segments: series.map(item => ({ key: item.key, value: dayMap?.get(item.key) ?? 0 })),
    })
  }

  return { points, series }
})
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Ringkasan"
      description="Performa produkmu dan penghasilan yang menunggu dicairkan."
    />

    <!-- Perlu perhatian: rejected is loud (needs action), review is quiet
         (just a status). Both link nowhere new — the detail lives in Produk
         saya, this only makes sure it gets seen. -->
    <div v-if="rejectedCount > 0 || reviewCount > 0" class="grid gap-3">
      <AppAlert v-if="rejectedCount > 0" variant="warning" :title="`${rejectedCount} produk ditolak`">
        Perlu revisi sebelum bisa diajukan ulang.
        <NuxtLink to="/dashboard/tutor/products" class="font-semibold underline underline-offset-2">
          Lihat produk
        </NuxtLink>
      </AppAlert>

      <AppInlineMessage v-if="reviewCount > 0" type="info">
        {{ reviewCount }} produk sedang ditinjau moderator — kami mengabarimu begitu selesai.
      </AppInlineMessage>
    </div>

    <DashboardStats :items="stats" :columns="3" />

    <!-- Saldo pencairan sudah punya halaman sendiri; ini cuma info sekunder
         supaya tautannya tetap kelihatan dari ringkasan. -->
    <p class="-mt-2 text-[0.86rem] text-muted">
      Saldo tersedia untuk dicairkan: <strong class="font-semibold text-ink">{{ formatRupiah(balance.available) }}</strong>
      <NuxtLink to="/dashboard/tutor/payouts" class="ml-1.5 font-semibold text-primary hover:underline">
        Kelola pencairan
      </NuxtLink>
    </p>

    <DashboardPanel
      id="pendapatan"
      title="Pendapatan harian per produk"
      description="30 hari terakhir, ditumpuk per produk (maksimal 8 + Lainnya)."
    >
      <DashboardSkeleton v-if="salesPending" :count="3" label="Memuat pendapatan..." />

      <AppInlineMessage v-else-if="salesError" type="error">{{ salesError }}</AppInlineMessage>

      <p v-else-if="sales.length === 0" class="py-6 text-center text-muted">
        Belum ada penjualan untuk ditampilkan.
      </p>

      <DashboardStackedBarChart
        v-else
        :points="dailyProductRevenue.points"
        :series="dailyProductRevenue.series"
        :value-formatter="formatRupiah"
        ariaLabel="Pendapatan harian per produk, 30 hari terakhir"
      />
    </DashboardPanel>

    <DashboardPanel
      id="paket"
      title="Paket saya"
      description="Maksimal lima produk yang paling baru kamu perbarui. Daftar lengkapnya ada di Produk saya."
    >
      <template #action>
        <AppButton to="/dashboard/tutor/products" variant="outline" size="sm">Kelola produk</AppButton>
      </template>

      <DashboardSkeleton v-if="productsPending" :count="3" label="Memuat produk..." />

      <AppInlineMessage v-else-if="productsError" type="error">{{ productsError }}</AppInlineMessage>

      <AppEmptyState
        v-else-if="products.length === 0"
        title="Belum ada produk"
        description="Mulai dari satu try-out tunggal dan ajukan untuk tayang di katalog Zenko."
        action-label="Buat produk"
        @action="() => navigateTo('/dashboard/tutor/products/new')"
      />

      <template v-else>
        <AppTable :columns="productColumns" :data="previewProducts">
          <template #cell(title)="{ item }">
            <NuxtLink
              to="/dashboard/tutor/products"
              class="font-semibold tracking-[-0.02em] hover:text-primary hover:underline"
            >
              {{ item.title }}
            </NuxtLink>
          </template>
          <template #cell(type)="{ value }">{{ productTypeLabel(value) }}</template>
          <template #cell(price)="{ value }">
            <span v-if="value > 0" class="tabular-nums">{{ formatRupiah(value) }}</span>
            <span v-else class="font-semibold text-success-ink">Gratis</span>
          </template>
          <template #cell(status)="{ item }">
            <DashboardBadge :tone="productStatusTone(item.status)">
              {{ productStatusLabel(item.status) }}
            </DashboardBadge>
          </template>
        </AppTable>

        <!-- Says out loud that the table is cut off, so the panel is never
             mistaken for the whole list. -->
        <p v-if="hiddenProductCount > 0" class="mt-3 text-[0.82rem] text-muted">
          <span class="tabular-nums">+{{ hiddenProductCount }}</span> produk lainnya di Produk saya.
        </p>
      </template>
    </DashboardPanel>

    <DashboardPanel
      id="penjualan"
      title="Penjualan terbaru"
      description="Bagi hasil 70:30 — porsi yang tercatat di sini sudah bagianmu."
    >
      <template #action>
        <AppButton to="/dashboard/tutor/sales" variant="outline" size="sm">Lihat semua</AppButton>
      </template>

      <DashboardSkeleton v-if="salesPending" :count="3" label="Memuat penjualan..." />

      <AppInlineMessage v-else-if="salesError" type="error">{{ salesError }}</AppInlineMessage>

      <p v-else-if="recentSales.length === 0" class="py-6 text-center text-muted">
        Belum ada penjualan. Transaksi pertama produkmu akan tampil di sini.
      </p>

      <ul v-else class="grid gap-3">
        <li
          v-for="sale in recentSales"
          :key="`${sale.orderId}-${sale.productId}`"
          class="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3 last:border-0 last:pb-0"
        >
          <span class="min-w-0">
            <span class="block truncate font-semibold tracking-[-0.02em]">{{ sale.productTitle }}</span>
            <span class="block text-[0.82rem] text-muted">
              {{ formatDate(sale.paidAt) }} · {{ sale.buyerName }}
            </span>
          </span>
          <span class="flex items-center gap-3">
            <span class="font-semibold tabular-nums">{{ formatRupiah(sale.share) }}</span>
            <DashboardBadge :tone="SHARE_STATUS_TONE[sale.shareStatus]">
              {{ SHARE_STATUS_LABEL[sale.shareStatus] }}
            </DashboardBadge>
          </span>
        </li>
      </ul>
    </DashboardPanel>
  </div>
</template>
