<script setup lang="ts">
import type { BimbelOrder, BimbelOrderStatus } from '#shared/types/bimbel'

/**
 * Layar pembayaran satu tagihan langganan bimbel.
 *
 * Dulu ini panel yang menyelip di antara status langganan dan pemilih tingkat
 * di halaman Langganan: layar yang isinya satu tugas tunggal — pindai, bayar,
 * konfirmasi — tetapi dikelilingi harga-harga tingkat lain yang justru menawar
 * ulang keputusan yang sudah diambil. Sebagai route sendiri ia bisa ditinggal
 * dan dibuka lagi dari HP tempat aplikasi banknya berada, bisa di-bookmark, dan
 * punya tombol back yang benar.
 *
 * Tagihannya dibaca dari daftar tagihan, bukan dari state yang dititipkan
 * halaman sebelumnya, supaya membuka URL-nya langsung sama sahnya dengan
 * sampai ke sini lewat tombol.
 */
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Pembayaran Langganan | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const route = useRoute()
const bimbelId = String(route.params.bimbelId)
const orderId = String(route.params.orderId)
const billingPath = `/dashboard/bimbel/${bimbelId}/billing`

const orders = useBimbelOrders(bimbelId)

const order = computed(() => orders.data.value.find(item => item.id === orderId) ?? null)

/**
 * Judul mengikuti status tagihannya. "Selesaikan pembayaran" di atas tagihan
 * yang sudah lunas menyuruh orang mengerjakan sesuatu yang sudah selesai;
 * status di daftar tagihan cukup untuk judul, sementara kebenaran yang dipakai
 * badan halaman tetap datang dari instruksi milik server.
 */
const HEADING: Record<BimbelOrderStatus, string> = {
  pending: 'Selesaikan pembayaran',
  verifying: 'Pembayaran sedang diperiksa',
  paid: 'Tagihan lunas',
  expired: 'Tagihan kedaluwarsa',
  cancelled: 'Tagihan dibatalkan',
}
const heading = computed(() => order.value ? HEADING[order.value.status] : 'Selesaikan pembayaran')

const breadcrumbs = computed(() => [
  { label: 'Langganan', to: billingPath },
  { label: order.value?.invoice ?? 'Pembayaran', truncate: true },
])

function orderDescription(item: BimbelOrder): string {
  return item.kind === 'seat_addon'
    ? `${item.additionalSeats} kursi tambahan`
    : `${bimbelPlanLabel(item.plan)} · ${item.months} bulan`
}

const load = () => orders.refresh()
onMounted(load)

/**
 * Bukti terkirim: tagihan yang dipegang halaman ini diganti dengan yang dijawab
 * server, bukan ditulis sendiri dari payload yang dikirim — status setelah
 * konfirmasi (`verifying`, atau `expired` kalau tenggatnya lewat) ditentukan di
 * sana.
 */
function onPaymentUpdated(updated: BimbelOrder) {
  orders.data.value = orders.data.value.map(item => item.id === updated.id ? updated : item)
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      :title="heading"
      :description="order ? `Invoice ${order.invoice} · ${orderDescription(order)}` : 'Instruksi pembayaran tagihan langganan.'"
    >
      <template #breadcrumbs>
        <AppBreadcrumbs :items="breadcrumbs" />
      </template>
    </AppPageHeader>

    <DashboardPanel>
      <DashboardSkeleton v-if="orders.pending.value" :count="3" label="Memuat tagihan…" />

      <div v-else-if="orders.error.value" class="py-8 text-center">
        <AppInlineMessage type="error">{{ orders.error.value }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">Coba lagi</button>
      </div>

      <AppEmptyState
        v-else-if="!order"
        title="Tagihan tidak ditemukan"
        description="Tagihan ini tidak ada pada bimbel ini, atau sudah dihapus. Buka halaman langganan untuk membuat tagihan baru."
        action-label="Kembali ke Langganan"
        @action="navigateTo(billingPath)"
      />

      <!-- Termasuk tagihan yang sudah lunas: statusnya dibacakan oleh komponen
           pembayaran dari instruksi milik server, bukan dari daftar tagihan yang
           dimuat halaman ini — daftar itu bisa saja ditulis sebelum admin
           menyetujui bukti transfernya semenit yang lalu. -->
      <BimbelOrderPayment v-else :bimbel-id="bimbelId" :order="order" @updated="onPaymentUpdated" />
    </DashboardPanel>
  </div>
</template>
