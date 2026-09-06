<script setup lang="ts">
import type { BimbelQuote } from '#shared/types/bimbel'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Langganan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const bimbelId = String(useRoute().params.bimbelId)
const bimbel = useBimbelDetail(bimbelId)
const orders = useBimbelOrders(bimbelId)
const quote = ref<BimbelQuote | null>(null)
const period = ref<1 | 12>(1)
const seats = ref(50)
const pending = ref(true)
const ordering = ref(false)
const toast = useToast()
const tiers = [{ seats: 25, name: 'Starter', description: 'Untuk kelas kecil atau satu program.' }, { seats: 50, name: 'Growth', description: 'Untuk bimbel rumahan yang mulai bertumbuh.' }, { seats: 100, name: 'Pro', description: 'Untuk beberapa kelas dan tim pengajar.' }]
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
const formatDate = (value: number) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(value * 1000)
async function refreshQuote() { pending.value = true; try { quote.value = await getBimbelQuote(bimbelId, seats.value, period.value) } catch (cause) { toast.error('Harga belum bisa dimuat.', tutorApiMessage(cause, 'Coba lagi.')) } finally { pending.value = false } }
onMounted(() => Promise.all([bimbel.refresh(), orders.refresh(), refreshQuote()]))
watch([seats, period], refreshQuote)
async function order() { ordering.value = true; try { await createBimbelOrder(bimbelId, seats.value, period.value); await orders.refresh(); toast.success('Tagihan dibuat.', 'Selesaikan pembayaran sesuai instruksi verifikasi Zenko.') } catch (cause) { toast.error('Gagal membuat tagihan.', tutorApiMessage(cause, 'Coba lagi.')) } finally { ordering.value = false } }
</script>
<template>
  <div class="grid gap-6"><AppPageHeader title="Langganan" description="Pilih kapasitas siswa dan periode. Jumlah bank soal dan penugasan tidak dibatasi oleh paket." />
    <AppSectionMessage appearance="information" title="Langganan berdasarkan kursi siswa aktif">Pengajar dan admin tidak memakai kursi. Siswa yang ditangguhkan juga tidak dihitung sebagai kursi aktif.</AppSectionMessage>
    <div class="inline-flex w-fit rounded-md border border-hairline bg-surface p-1"><button v-for="item in ([1, 12] as const)" :key="item" class="rounded-sm px-4 py-2 text-sm font-semibold" :class="period === item ? 'bg-primary text-white' : 'text-muted hover:bg-surface-alt'" @click="period = item">{{ item === 1 ? 'Bulanan' : 'Tahunan' }}</button></div>
    <div class="grid gap-4 lg:grid-cols-3"><button v-for="tier in tiers" :key="tier.seats" type="button" class="rounded-lg border p-5 text-left transition" :class="seats === tier.seats ? 'border-primary bg-primary-soft shadow-lift' : 'border-hairline bg-surface hover:border-primary/30'" @click="seats = tier.seats"><p class="text-xs font-bold tracking-wide text-primary uppercase">{{ tier.name }}</p><p class="mt-2 text-3xl font-bold">{{ tier.seats }} <span class="text-sm font-medium text-muted">siswa</span></p><p class="mt-2 text-sm text-muted">{{ tier.description }}</p><p class="mt-5 font-semibold">{{ rupiah((quote?.seatPricePerMonth ?? 3000) * tier.seats * period) }}<span class="text-xs font-normal text-muted"> / {{ period === 1 ? 'bulan' : 'tahun' }}</span></p></button></div>
    <DashboardPanel title="Ringkasan pilihan"><div class="flex flex-col gap-4 sm:flex-row sm:items-center"><div class="flex-1"><p class="text-sm text-muted">{{ seats }} kursi · {{ period === 1 ? '1 bulan' : '12 bulan' }}</p><p class="mt-1 text-2xl font-bold">{{ pending ? 'Menghitung…' : rupiah(quote?.amount ?? 0) }}</p></div><AppButton :loading="ordering" :disabled="pending || (quote?.amount ?? 0) <= 0" @click="order">Buat tagihan</AppButton></div></DashboardPanel>
    <DashboardPanel title="Status saat ini"><div class="grid gap-4 sm:grid-cols-3"><div><p class="text-xs text-muted uppercase">Status</p><p class="mt-1 font-semibold">{{ bimbel.data.value?.status === 'trial' ? 'Masa uji coba' : bimbel.data.value?.status === 'active' ? 'Aktif' : 'Perlu diperpanjang' }}</p></div><div><p class="text-xs text-muted uppercase">Kapasitas</p><p class="mt-1 font-semibold">{{ bimbel.data.value?.seatsUsed ?? 0 }}/{{ bimbel.data.value?.seatQuota ?? 0 }} siswa</p></div><div><p class="text-xs text-muted uppercase">Aktif sampai</p><p class="mt-1 font-semibold">{{ bimbel.data.value?.activeUntil ? formatDate(bimbel.data.value.activeUntil) : '—' }}</p></div></div></DashboardPanel>
    <DashboardPanel title="Riwayat tagihan"><div v-if="orders.data.value.length" class="grid gap-2"><div v-for="item in orders.data.value" :key="item.id" class="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-hairline p-3"><div><strong>{{ item.invoice }}</strong><p class="text-sm text-muted">{{ item.seatQuota }} kursi · {{ item.months }} bulan</p></div><div class="text-right"><p class="font-semibold">{{ rupiah(item.amount) }}</p><DashboardBadge :tone="item.status === 'paid' ? 'success' : item.status === 'pending' ? 'warning' : 'neutral'">{{ item.status === 'paid' ? 'Lunas' : item.status === 'pending' ? 'Menunggu pembayaran' : 'Dibatalkan' }}</DashboardBadge></div></div></div><AppEmptyState v-else title="Belum ada tagihan" description="Tagihan yang dibuat akan muncul di sini." /></DashboardPanel>
  </div>
</template>
