<script setup lang="ts">
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

// Satu fetch tanpa filter: "paket terjual" butuh semua waktu, "pendapatan
// bulan ini" cukup disaring dari paidAt di sisi client.
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

const monthStart = computed(() => {
  const now = new Date()
  return Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000)
})

const monthShare = computed(() =>
  sales.value
    .filter(sale => sale.paidAt >= monthStart.value)
    .reduce((sum, sale) => sum + sale.share, 0),
)

const liveCount = computed(() => products.value.filter(product => product.status === 'live').length)

// "Perlu perhatian": moderation outcomes surface on the overview, so a
// rejection is visible without having to open Produk Saya first.
const rejectedCount = computed(() => products.value.filter(product => product.status === 'rejected').length)
const reviewCount = computed(() => products.value.filter(product => product.status === 'review').length)

const stats = computed(() => [
  { label: 'Pendapatan bulan ini', value: formatRupiah(monthShare.value), hint: 'Porsi 70% dari penjualan bulan berjalan.' },
  { label: 'Paket terjual', value: String(summary.value.count), hint: 'Sepanjang waktu' },
  { label: 'Produk tayang', value: String(liveCount.value) },
  { label: 'Menunggu pencairan', value: formatRupiah(balance.value.available), hint: `Tertahan: ${formatRupiah(balance.value.held)}` },
])

const recentSales = computed(() => sales.value.slice(0, 5))
</script>

<template>
  <div class="grid gap-6">
    <header>
      <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">Ringkasan</h1>
      <p class="mt-1.5 text-muted">Performa produkmu dan penghasilan yang menunggu dicairkan.</p>
    </header>

    <!-- Perlu perhatian: rejected is loud (needs action), review is quiet
         (just a status). Both link nowhere new — the detail lives in Produk
         saya, this only makes sure it gets seen. -->
    <div v-if="rejectedCount > 0 || reviewCount > 0" class="grid gap-3">
      <div
        v-if="rejectedCount > 0"
        role="alert"
        class="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
      >
        <IconAlert class="h-4 w-4 shrink-0" />
        <p class="min-w-0 flex-1">
          <strong class="font-bold">{{ rejectedCount }} produk ditolak</strong>
          — perlu revisi sebelum bisa diajukan ulang.
        </p>
        <NuxtLink
          to="/dashboard/tutor/products"
          class="font-semibold underline underline-offset-2 transition-colors duration-200 hover:text-amber-950"
        >
          Lihat produk
        </NuxtLink>
      </div>

      <p
        v-if="reviewCount > 0"
        role="status"
        class="flex items-center gap-3 rounded-sm border border-hairline-strong bg-surface px-4 py-3 text-[0.86rem] text-muted"
      >
        <IconEye class="h-4 w-4 shrink-0" />
        {{ reviewCount }} produk sedang ditinjau moderator — kami mengabarimu begitu selesai.
      </p>
    </div>

    <DashboardStats :items="stats" />

    <DashboardPanel id="paket" title="Paket saya" description="Produk yang kamu jual di Zenko.">
      <template #action>
        <NuxtLink
          to="/dashboard/tutor/products"
          class="rounded-xs border border-line px-3 py-1.5 text-[0.82rem] font-semibold transition-colors hover:bg-surface-alt"
        >
          Kelola produk
        </NuxtLink>
      </template>

      <DashboardSkeleton v-if="productsPending" :count="3" label="Memuat produk..." />

      <p v-else-if="productsError" role="alert" class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900">
        {{ productsError }}
      </p>

      <div v-else-if="products.length === 0" class="py-8 text-center">
        <p class="mx-auto max-w-105 leading-[1.7] text-muted">
          Belum ada produk. Mulai dari satu try-out tunggal dan ajukan untuk
          tayang di katalog Zenko.
        </p>
        <AppButton to="/dashboard/tutor/products/new" class="mt-5" size="sm">Buat produk</AppButton>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left">
          <thead>
            <tr class="text-[0.78rem] tracking-widest text-faint uppercase">
              <th class="pb-3 font-bold">Produk</th>
              <th class="pb-3 font-bold">Tipe</th>
              <th class="pb-3 font-bold">Kategori</th>
              <th class="pb-3 font-bold">Harga</th>
              <th class="pb-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id" class="border-t border-hairline">
              <td class="max-w-72 py-3.5 pr-4">
                <NuxtLink
                  to="/dashboard/tutor/products"
                  class="font-semibold tracking-[-0.02em] hover:text-primary hover:underline"
                >
                  {{ product.title }}
                </NuxtLink>
              </td>
              <td class="py-3.5 pr-4 text-[0.9rem] text-muted">{{ PRODUCT_TYPE_LABEL[product.type] }}</td>
              <td class="py-3.5 pr-4 text-[0.9rem] text-muted">{{ product.category || '—' }}</td>
              <td class="py-3.5 pr-4 text-[0.9rem] tabular-nums">
                {{ product.price > 0 ? formatRupiah(product.price) : '—' }}
              </td>
              <td class="py-3.5">
                <DashboardBadge :tone="PRODUCT_STATUS_TONE[product.status]">
                  {{ PRODUCT_STATUS_LABEL[product.status] }}
                </DashboardBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardPanel>

    <DashboardPanel
      id="penjualan"
      title="Penjualan terbaru"
      description="Bagi hasil 70:30 — porsi yang tercatat di sini sudah bagianmu."
    >
      <template #action>
        <NuxtLink
          to="/dashboard/tutor/sales"
          class="rounded-xs border border-line px-3 py-1.5 text-[0.82rem] font-semibold transition-colors hover:bg-surface-alt"
        >
          Lihat semua
        </NuxtLink>
      </template>

      <DashboardSkeleton v-if="salesPending" :count="3" label="Memuat penjualan..." />

      <p v-else-if="salesError" role="alert" class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900">
        {{ salesError }}
      </p>

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
