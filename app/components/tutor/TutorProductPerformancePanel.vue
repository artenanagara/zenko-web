<script setup lang="ts">
import type { TutorProductSummary } from '#shared/types/tutor-product'
import type { TutorProductPerformancePeriod } from '~/composables/useTutorProducts'

const props = defineProps<{ products: TutorProductSummary[] }>()
const period = ref<TutorProductPerformancePeriod>('28d')
const { data, pending, error, unavailable, refresh } = useTutorProductPerformance(period)

onMounted(refresh)

const options = [
  { value: '7d', label: '7 hari terakhir' },
  { value: '28d', label: '28 hari terakhir' },
  { value: '90d', label: '90 hari terakhir' },
]
const periodLabel = computed(() => options.find(option => option.value === period.value)?.label || '28 hari terakhir')
const byId = computed(() => new Map(props.products.map(product => [product.id, product])))
const rows = computed(() => data.value.filter(row => byId.value.has(row.productId)))
const hasAnyActivity = computed(() => data.value.some(row => row.views || row.clicks || row.checkouts || row.sales))
const allUnpublished = computed(() => props.products.every(product => product.status !== 'live'))
const showLongerPeriod = computed(() => period.value !== '90d' && !hasAnyActivity.value)
const number = (value: number) => value.toLocaleString('id-ID')
</script>

<template>
  <DashboardPanel title="Performa paket" :aria-busy="pending">
    <template #action>
      <AppSelect v-model="period" :options="options" size="sm" aria-label="Periode laporan" />
    </template>

    <p class="mb-4 text-[0.86rem] text-muted">
      Checkout berarti orang membuka halaman pembayaran — belum tentu membeli. Hanya transaksi yang pembayarannya terverifikasi yang dihitung sebagai penjualan. Dilihat dan Klik berasal dari laporan browser, jadi arahnya bisa dipercaya tapi angkanya bukan angka audit.
    </p>

    <DashboardSkeleton v-if="pending && !data.length" :count="4" label="Memuat performa paket..." />
    <div v-else-if="error" class="py-3">
      <AppInlineMessage type="error">Performa paket belum berhasil dimuat.</AppInlineMessage>
      <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="refresh">Coba lagi</button>
    </div>
    <p v-else-if="unavailable" class="text-sm text-muted">Ringkasan performa belum tersedia.</p>
    <p v-else-if="allUnpublished" class="text-sm text-muted">Paketmu belum tayang, jadi belum ada kunjungan yang tercatat.</p>
    <div v-else-if="!rows.length" class="text-sm text-muted">
      <span>Tidak ada aktivitas pada periode ini.</span>
      <button v-if="showLongerPeriod" type="button" class="ml-2 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" @click="period = '90d'">Lihat 90 hari</button>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[560px] text-left text-sm">
        <caption class="sr-only">Performa per paket, {{ periodLabel }}</caption>
        <thead class="text-xs uppercase tracking-wide text-muted">
          <tr class="border-b border-line">
            <th scope="col" class="pb-3 pr-4">Produk</th>
            <th scope="col" class="px-3 pb-3">Dilihat</th>
            <th scope="col" class="px-3 pb-3">Klik</th>
            <th scope="col" class="px-3 pb-3">Checkout</th>
            <th scope="col" class="pl-3 pb-3">Penjualan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.productId" class="border-b border-line last:border-0">
            <th scope="row" class="max-w-[16rem] py-3 pr-4 font-semibold text-ink">{{ byId.get(row.productId)?.title || row.title || row.slug }}</th>
            <template v-if="row.status === 'live'">
              <td class="px-3 py-3 tabular-nums">{{ number(row.views) }}</td>
              <td class="px-3 py-3 tabular-nums">{{ number(row.clicks) }}</td>
              <td class="px-3 py-3 tabular-nums">{{ number(row.checkouts) }}</td>
              <td class="pl-3 py-3 tabular-nums">{{ number(row.sales) }}</td>
            </template>
            <td v-else colspan="4" class="py-3 text-muted">Belum tayang</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-xs leading-relaxed text-muted">Penjualan bundel tercatat pada bundelnya, bukan pada paket anggotanya. Kunjungan mengikuti alamat paket: kalau paket diserahkan atau slug-nya berubah, angka lama tidak ikut pindah — sedangkan penjualan tetap tercatat pada penjual saat itu. Rincian rupiah ada di menu <NuxtLink class="font-semibold text-primary hover:underline" to="/dashboard/tutor/sales">Penjualan</NuxtLink>.</p>
    </div>
  </DashboardPanel>
</template>
