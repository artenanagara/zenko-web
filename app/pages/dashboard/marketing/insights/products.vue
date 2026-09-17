<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Performa Produk | Marketing Hub', meta: [{ name: 'robots', content: 'noindex' }] })

interface ProductAnalytics { productId: string, productSlug: string, productName: string, views: number, clicks: number, checkouts: number, purchases: number }
interface AnalyticsSummary { products: ProductAnalytics[] }
const { public: config } = useRuntimeConfig()
const period = ref('28d')
const pending = ref(true)
const products = ref<ProductAnalytics[]>([])

async function load() {
  pending.value = true
  try {
    const data = await useApiFetch<AnalyticsSummary>('/marketing/analytics/summary', { baseURL: config.apiBase, credentials: 'include', query: { period: period.value } })
    products.value = data.products || []
  } finally { pending.value = false }
}
watch(period, load)
onMounted(load)
function rate(numerator: number, denominator: number) { return denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : '—' }
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Performa Produk" description="Lihat produk yang paling banyak dilihat dan mendorong checkout.">
      <template #actions><AppSelect v-model="period" aria-label="Periode laporan" :options="[{ value: '7d', label: '7 hari terakhir' }, { value: '28d', label: '28 hari terakhir' }, { value: '90d', label: '90 hari terakhir' }]" size="sm" /></template>
    </AppPageHeader>
    <AppSectionMessage v-if="!pending && !products.length" title="Belum ada data produk">Data akan muncul setelah pengunjung membuka halaman produk atau menekan tombol checkout.</AppSectionMessage>
    <AppPanel v-else header="Produk teratas" :collapsible="false">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead class="border-b border-hairline text-xs text-muted"><tr><th class="px-4 py-3">Produk</th><th class="px-4 py-3">Dilihat</th><th class="px-4 py-3">Klik</th><th class="px-4 py-3">Checkout</th><th class="px-4 py-3">Pembelian</th><th class="px-4 py-3">Klik → checkout</th></tr></thead>
          <tbody class="divide-y divide-hairline"><tr v-for="product in products" :key="product.productSlug"><td class="px-4 py-4 font-semibold">{{ product.productName || product.productSlug }}</td><td class="px-4 py-4">{{ product.views.toLocaleString('id-ID') }}</td><td class="px-4 py-4">{{ product.clicks.toLocaleString('id-ID') }}</td><td class="px-4 py-4">{{ product.checkouts.toLocaleString('id-ID') }}</td><td class="px-4 py-4">{{ product.purchases.toLocaleString('id-ID') }}</td><td class="px-4 py-4">{{ rate(product.checkouts, product.clicks) }}</td></tr></tbody>
        </table>
      </div>
    </AppPanel>
  </div>
</template>
