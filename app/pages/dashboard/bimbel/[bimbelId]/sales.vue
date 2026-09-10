<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Penjualan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const sales = useTutorSales({ bimbelId })
onMounted(sales.refresh)

const stats = computed(() => [
  { label: 'Produk terjual', value: String(sales.summary.value.count) },
  { label: 'Nilai penjualan', value: formatRupiah(sales.summary.value.gross) },
  { label: 'Bagi hasil bimbel', value: formatRupiah(sales.summary.value.share) },
])
const columns = [
  { key: 'paidAt', label: 'Tanggal', hideOnMobile: true }, { key: 'productTitle', label: 'Produk' },
  { key: 'buyerName', label: 'Pembeli' }, { key: 'price', label: 'Harga', align: 'right' as const },
  { key: 'share', label: 'Bagi hasil', align: 'right' as const },
]
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Penjualan marketplace" description="Pantau transaksi dan bagi hasil dari paket publik bimbelmu." />
    <DashboardSkeleton v-if="sales.pending.value" variant="stats" :count="3" :columns="3" label="Memuat ringkasan penjualan…" />
    <div v-else-if="sales.error.value" class="rounded-md border border-line bg-surface px-5 py-6 text-center shadow-xs">
      <AppInlineMessage type="error">{{ sales.error.value }}</AppInlineMessage>
      <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="sales.refresh()">Coba lagi</button>
    </div>
    <DashboardStats v-else :items="stats" :columns="3" />
    <DashboardPanel title="Riwayat penjualan">
      <DashboardSkeleton v-if="sales.pending.value" :count="4" label="Memuat penjualan…" />
      <DashboardTable v-else-if="sales.sales.value.length" :columns="columns" :data="sales.sales.value" primary-key="invoice">
        <template #cell(paidAt)="{ value }"><span class="whitespace-nowrap">{{ formatDate(value) }}</span></template>
        <template #cell(productTitle)="{ item }"><span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.productTitle }}</span><span class="block text-[0.82rem] text-muted">{{ item.invoice }}</span></template>
        <template #cell(price)="{ value }"><span class="tabular-nums">{{ formatRupiah(value) }}</span></template>
        <template #cell(share)="{ value }"><span class="font-semibold tabular-nums">{{ formatRupiah(value) }}</span></template>
      </DashboardTable>
      <AppEmptyState v-else title="Belum ada penjualan" description="Paket bimbel yang lolos moderasi dan dibeli siswa akan tercatat di sini." action-label="Buka paket" @action="navigateTo(`/dashboard/bimbel/${bimbelId}/products`)" />
    </DashboardPanel>
  </div>
</template>
