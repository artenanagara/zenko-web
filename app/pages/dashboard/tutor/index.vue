<script setup lang="ts">
import type { LinePoint } from '~/components/dashboard/DashboardLineChart.vue'
import type { TutorProductSummary } from '#shared/types/tutor-product'

definePageMeta({
  path: '/dashboard/tutor',
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Dashboard Tutor | Zenko',
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
  { label: 'Total pendapatan', value: formatRupiah(totalShare.value) },
  { label: 'Total produk', value: String(products.value.length) },
  { label: 'Produk terjual', value: String(summary.value.count) },
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

// DashboardTable's cell slots hand back `item`/`value` as Record<string, any>/any
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
 * Pendapatan harian — 30 hari terakhir (hari ini inklusif), satu garis untuk
 * seluruh produk.
 *
 * Tanpa pecahan per produk: chart lamanya menumpuk satu warna (dan satu baris
 * legenda) per produk, jadi tutor dengan belasan paket mendapat legenda yang
 * lebih tinggi dari chart-nya dan tidak ada garis tren yang bisa dibaca.
 * Pertanyaan "produk mana yang laku" dijawab tabel Penjualan, yang memang
 * punya nama produk per transaksi.
 */
const dailyRevenue = computed<LinePoint[]>(() => {
  const byDay = new Map<string, number>()
  for (const sale of sales.value) {
    const day = dayKey(sale.paidAt)
    byDay.set(day, (byDay.get(day) ?? 0) + sale.share)
  }

  const now = Date.now()
  const points: LinePoint[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now - i * DAY_MS)
    const key = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    points.push({
      key,
      label: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }),
      value: byDay.get(key) ?? 0,
    })
  }

  return points
})

/**
 * Rupiah ringkas untuk label sumbu — "Rp1,2jt" alih-alih "Rp1.200.000", yang
 * pada lebar sumbu chart akan bertabrakan dengan garis bantunya.
 */
function formatRupiahShort(value: number): string {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}jt`
  if (value >= 1_000) return `Rp${(value / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })}rb`
  return `Rp${value.toLocaleString('id-ID')}`
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Ringkasan"
      description="Pantau performa paket try out dan perkembangan penghasilanmu."
    />

    <!-- Perlu perhatian: rejected is loud (needs action), review is quiet
         (just a status). Both link nowhere new — the detail lives in Produk
         saya, this only makes sure it gets seen. -->
    <div v-if="rejectedCount > 0 || reviewCount > 0" class="grid gap-3">
      <AppAlert v-if="rejectedCount > 0" variant="warning" :title="`${rejectedCount} produk memerlukan revisi`">
        Silakan periksa catatan revisi agar paketmu bisa segera diajukan kembali.
        <NuxtLink to="/dashboard/tutor/products" class="font-semibold underline underline-offset-2">
          Lihat produk
        </NuxtLink>
      </AppAlert>

      <AppInlineMessage v-if="reviewCount > 0" type="info">
        {{ reviewCount }} produk sedang ditinjau oleh tim kurasi. Kami akan mengabari begitu proses selesai.
      </AppInlineMessage>
    </div>

    <DashboardStats :items="stats" :columns="3" />

    <!-- Saldo pencairan sudah punya halaman sendiri; ini cuma info sekunder
         supaya tautannya tetap kelihatan dari ringkasan. -->
    <p class="-mt-2 text-[0.86rem] text-muted">
      Saldo siap dicairkan: <strong class="font-semibold text-ink">{{ formatRupiah(balance.available) }}</strong>
      <NuxtLink to="/dashboard/tutor/payouts" class="ml-1.5 font-semibold text-primary hover:underline">
        Kelola pencairan dana
      </NuxtLink>
    </p>

    <DashboardPanel
      id="pendapatan"
      title="Pendapatan harian"
      description="Tren penjualan 30 hari terakhir. Rincian per paket ada di menu Penjualan."
    >
      <DashboardSkeleton v-if="salesPending" :count="3" label="Memuat data pendapatan..." />

      <AppInlineMessage v-else-if="salesError" type="error">{{ salesError }}</AppInlineMessage>

      <p v-else-if="sales.length === 0" class="py-6 text-center text-muted">
        Belum ada aktivitas penjualan pada periode ini.
      </p>

      <DashboardLineChart
        v-else
        :points="dailyRevenue"
        :value-formatter="formatRupiah"
        :axis-formatter="formatRupiahShort"
        ariaLabel="Pendapatan harian, 30 hari terakhir"
      />
    </DashboardPanel>

    <DashboardPanel
      id="paket"
      title="Paket saya"
      description="Daftar paket yang paling baru diperbarui. Kelola seluruh paket melalui menu Produk Saya."
    >
      <template #action>
        <AppButton to="/dashboard/tutor/products" variant="outline" size="sm">Kelola semua produk</AppButton>
      </template>

      <DashboardSkeleton v-if="productsPending" :count="3" label="Memuat produk..." />

      <AppInlineMessage v-else-if="productsError" type="error">{{ productsError }}</AppInlineMessage>

      <AppEmptyState
        v-else-if="products.length === 0"
        title="Belum ada paket soal"
        description="Yuk buat paket try out pertamamu dan bantu siswa mempersiapkan ujian impian mereka."
        action-label="Buat paket baru"
        @action="() => navigateTo('/dashboard/tutor/products/new')"
      />

      <template v-else>
        <DashboardTable :columns="productColumns" :data="previewProducts" primary-key="title">
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
        </DashboardTable>

        <!-- Says out loud that the table is cut off, so the panel is never
             mistaken for the whole list. -->
        <p v-if="hiddenProductCount > 0" class="mt-3 text-[0.82rem] text-muted">
          <span class="tabular-nums">+{{ hiddenProductCount }}</span> produk lainnya di menu Produk Saya.
        </p>
      </template>
    </DashboardPanel>

    <DashboardPanel
      id="penjualan"
      title="Penjualan terbaru"
      description="Transaksi pembelian paket terbarumu. Nominal tercatat adalah pendapatan bersih yang siap masuk ke saldomu."
    >
      <template #action>
        <AppButton to="/dashboard/tutor/sales" variant="outline" size="sm">Lihat semua transaksi</AppButton>
      </template>

      <DashboardSkeleton v-if="salesPending" :count="3" label="Memuat penjualan..." />

      <AppInlineMessage v-else-if="salesError" type="error">{{ salesError }}</AppInlineMessage>

      <p v-else-if="recentSales.length === 0" class="py-6 text-center text-muted">
        Belum ada transaksi. Pembelian pertama paketmu akan langsung tampil di sini.
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
