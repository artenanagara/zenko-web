<script setup lang="ts">
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

const period = ref<PeriodKey>('month')
const productId = ref('')

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
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter periode">
            <button
              v-for="option in PERIODS"
              :key="option.key"
              type="button"
              class="rounded-pill px-3 py-1.5 text-[0.8rem] font-semibold whitespace-nowrap transition-colors"
              :class="period === option.key
                ? 'bg-primary-soft text-primary'
                : 'text-muted hover:bg-surface-sunken hover:text-ink'"
              :aria-pressed="period === option.key"
              @click="period = option.key"
            >
              {{ option.label }}
            </button>
          </div>

          <label class="flex items-center gap-2 text-[0.82rem] font-semibold text-muted">
            <span class="sr-only">Filter produk</span>
            <select
              v-model="productId"
              class="rounded-xs border border-line bg-surface px-3 py-1.5 text-[0.82rem] font-semibold transition-colors hover:bg-surface-alt focus:border-primary/40 focus:outline-none"
              aria-label="Filter produk"
            >
              <option value="">Semua produk</option>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.title }}
              </option>
            </select>
          </label>
        </div>
      </template>

      <DashboardSkeleton v-if="pending" :count="5" label="Memuat riwayat penjualan..." />

      <div v-else-if="error" class="py-8 text-center">
        <p class="text-muted">{{ error }}</p>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">
          Coba lagi
        </button>
      </div>

      <!-- Empty state: friendly, and distinguishes "no sales yet" from "filter
           came up empty". -->
      <div v-else-if="sales.length === 0" class="py-10 text-center">
        <template v-if="hasFilter">
          <p class="text-muted">Tidak ada penjualan pada filter ini.</p>
          <button
            type="button"
            class="mt-3 font-semibold text-primary hover:underline"
            @click="period = 'all'; productId = ''"
          >
            Tampilkan semua
          </button>
        </template>
        <template v-else>
          <h2 class="text-[1.2rem] font-bold tracking-[-0.03em]">Belum ada penjualan</h2>
          <p class="mx-auto mt-2 max-w-105 leading-[1.7] text-muted">
            Begitu produkmu tayang dan terjual, setiap transaksi tercatat di sini
            beserta porsi 70% yang jadi bagianmu.
          </p>
          <AppButton to="/dashboard/tutor/products" class="mt-6">Lihat produk saya</AppButton>
        </template>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-180 border-collapse text-left">
          <thead>
            <tr class="text-[0.78rem] tracking-widest text-faint uppercase">
              <th class="pb-3 font-bold">Tanggal</th>
              <th class="pb-3 font-bold">Produk</th>
              <th class="pb-3 font-bold">Pembeli</th>
              <th class="pb-3 font-bold">Harga</th>
              <th class="pb-3 font-bold">Porsi kamu</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="sale in sales"
              :key="`${sale.orderId}-${sale.productId}`"
              class="border-t border-hairline"
            >
              <td class="py-3.5 pr-4 text-[0.9rem] whitespace-nowrap text-muted">
                {{ formatDate(sale.paidAt) }}
              </td>
              <td class="max-w-72 py-3.5 pr-4">
                <span class="block font-semibold tracking-[-0.02em]">{{ sale.productTitle }}</span>
                <span class="block text-[0.82rem] text-muted">
                  {{ PRODUCT_TYPE_LABEL[sale.productType] }} · {{ sale.invoice }}
                </span>
              </td>
              <td class="py-3.5 pr-4 text-[0.9rem] text-muted">{{ sale.buyerName }}</td>
              <td class="py-3.5 pr-4 text-[0.9rem] tabular-nums">{{ formatRupiah(sale.price) }}</td>
              <td class="py-3.5">
                <span class="inline-flex items-center gap-2.5">
                  <span class="text-[0.9rem] font-semibold tabular-nums">{{ formatRupiah(sale.share) }}</span>
                  <DashboardBadge :tone="SHARE_STATUS_TONE[sale.shareStatus]">
                    {{ SHARE_STATUS_LABEL[sale.shareStatus] }}
                  </DashboardBadge>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  </div>
</template>
