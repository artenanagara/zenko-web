<script setup lang="ts">
import type { BimbelQuote } from '#shared/types/bimbel'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Langganan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const bimbel = useBimbelDetail(bimbelId)
const orders = useBimbelOrders(bimbelId)
const toast = useToast()

const quote = ref<BimbelQuote | null>(null)
const quotePending = ref(true)
const quoteError = ref('')
const period = ref<1 | 12>(1)
const seats = ref(50)
const ordering = ref(false)

const TIERS = [
  { seats: 25, name: 'Starter', description: 'Untuk kelas kecil atau satu program.' },
  { seats: 50, name: 'Growth', description: 'Untuk bimbel rumahan yang mulai bertumbuh.' },
  { seats: 100, name: 'Pro', description: 'Untuk beberapa kelas dan tim pengajar.' },
]

const STATUS_LABEL = {
  trial: 'Masa uji coba',
  active: 'Aktif',
  grace: 'Perlu diperpanjang',
  suspended: 'Perlu diperpanjang',
} as const

const ORDER_STATUS_LABEL = {
  paid: 'Lunas',
  pending: 'Menunggu pembayaran',
  cancelled: 'Dibatalkan',
} as const

const ORDER_STATUS_TONE = {
  paid: 'success',
  pending: 'warning',
  cancelled: 'neutral',
} as const

/** Harga selalu dihitung server; kartu tier di bawah hanya memakai `seatPricePerMonth`-nya. */
async function refreshQuote() {
  quotePending.value = true
  quoteError.value = ''
  try {
    quote.value = await getBimbelQuote(bimbelId, seats.value, period.value)
  }
  catch (cause) {
    quoteError.value = tutorApiMessage(cause, 'Harga belum bisa dimuat.')
  }
  finally {
    quotePending.value = false
  }
}

function load() {
  return Promise.all([bimbel.refresh(), orders.refresh(), refreshQuote()])
}
onMounted(load)

watch([seats, period], refreshQuote)

const seatPrice = computed(() => quote.value?.seatPricePerMonth ?? 0)

async function order() {
  ordering.value = true
  try {
    await createBimbelOrder(bimbelId, seats.value, period.value)
    await orders.refresh()
    toast.success('Tagihan dibuat.', 'Selesaikan pembayaran sesuai instruksi verifikasi Zenko.')
  }
  catch (cause) {
    toast.error('Gagal membuat tagihan.', tutorApiMessage(cause, 'Coba lagi.'))
  }
  finally {
    ordering.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Langganan"
      description="Pilih kapasitas siswa dan periode. Jumlah bank soal dan kelas tidak dibatasi oleh langganan."
    />

    <AppSectionMessage appearance="information" title="Langganan berdasarkan kursi siswa aktif">
      Pengajar dan admin tidak memakai kursi. Siswa yang ditangguhkan juga tidak dihitung sebagai kursi aktif.
    </AppSectionMessage>

    <div class="inline-flex w-fit rounded-md border border-hairline bg-surface p-1" role="group" aria-label="Periode langganan">
      <button
        v-for="item in ([1, 12] as const)"
        :key="item"
        type="button"
        class="rounded-sm px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="period === item ? 'bg-primary text-white' : 'text-muted hover:bg-surface-alt'"
        :aria-pressed="period === item"
        @click="period = item"
      >
        {{ item === 1 ? 'Bulanan' : 'Tahunan' }}
      </button>
    </div>

    <!-- Harga tier dirender dari `seatPricePerMonth` milik server; selama quote
         belum ada atau gagal, angkanya sengaja tidak ditebak. -->
    <div class="grid gap-4 lg:grid-cols-3">
      <button
        v-for="tier in TIERS"
        :key="tier.seats"
        type="button"
        class="rounded-lg border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="seats === tier.seats ? 'border-primary bg-primary-soft shadow-lift' : 'border-hairline bg-surface hover:border-primary/30'"
        :aria-pressed="seats === tier.seats"
        @click="seats = tier.seats"
      >
        <p class="text-xs font-bold tracking-wide text-primary uppercase">{{ tier.name }}</p>
        <p class="mt-2 text-3xl font-bold">
          {{ tier.seats }} <span class="text-sm font-medium text-muted">siswa</span>
        </p>
        <p class="mt-2 text-sm text-muted">{{ tier.description }}</p>
        <p class="mt-5 font-semibold">
          <template v-if="seatPrice">
            {{ formatRupiah(seatPrice * tier.seats * period) }}
            <span class="text-xs font-normal text-muted"> / {{ period === 1 ? 'bulan' : 'tahun' }}</span>
          </template>
          <span v-else class="text-sm font-normal text-muted">Harga belum tersedia</span>
        </p>
      </button>
    </div>

    <DashboardPanel title="Ringkasan pilihan">
      <AppInlineMessage v-if="quoteError" type="error">{{ quoteError }}</AppInlineMessage>

      <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div class="flex-1">
          <p class="text-sm text-muted">{{ seats }} kursi · {{ period === 1 ? '1 bulan' : '12 bulan' }}</p>
          <p class="mt-1 text-2xl font-bold tabular-nums">
            {{ quotePending ? 'Menghitung…' : quoteError ? '—' : formatRupiah(quote?.amount ?? 0) }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppButton v-if="quoteError" variant="outline" @click="refreshQuote">Muat ulang harga</AppButton>
          <AppButton :disabled="ordering || quotePending || (quote?.amount ?? 0) <= 0" @click="order">
            {{ ordering ? 'Membuat…' : 'Buat tagihan' }}
          </AppButton>
        </div>
      </div>
    </DashboardPanel>

    <DashboardPanel title="Status saat ini">
      <DashboardSkeleton v-if="bimbel.pending.value" :count="3" label="Memuat status langganan…" />

      <div v-else-if="bimbel.error.value" class="py-8 text-center">
        <AppInlineMessage type="error">{{ bimbel.error.value }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="bimbel.refresh">
          Coba lagi
        </button>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-3">
        <div>
          <p class="text-xs text-muted uppercase">Status</p>
          <p class="mt-1 font-semibold">{{ bimbel.data.value ? STATUS_LABEL[bimbel.data.value.status] : '—' }}</p>
        </div>
        <div>
          <p class="text-xs text-muted uppercase">Kapasitas</p>
          <p class="mt-1 font-semibold tabular-nums">
            {{ bimbel.data.value?.seatsUsed ?? 0 }}/{{ bimbel.data.value?.seatQuota ?? 0 }} siswa
          </p>
        </div>
        <div>
          <p class="text-xs text-muted uppercase">Aktif sampai</p>
          <p class="mt-1 font-semibold">
            {{ bimbel.data.value?.activeUntil ? formatDate(bimbel.data.value.activeUntil) : '—' }}
          </p>
        </div>
      </div>
    </DashboardPanel>

    <DashboardPanel title="Riwayat tagihan">
      <DashboardSkeleton v-if="orders.pending.value" :count="3" label="Memuat tagihan…" />

      <div v-else-if="orders.error.value" class="py-8 text-center">
        <AppInlineMessage type="error">{{ orders.error.value }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="orders.refresh">
          Coba lagi
        </button>
      </div>

      <div v-else-if="orders.data.value.length" class="grid gap-2">
        <div
          v-for="item in orders.data.value"
          :key="item.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-hairline p-3"
        >
          <div>
            <strong>{{ item.invoice }}</strong>
            <p class="text-sm text-muted">{{ item.seatQuota }} kursi · {{ item.months }} bulan</p>
          </div>
          <div class="text-right">
            <p class="font-semibold tabular-nums">{{ formatRupiah(item.amount) }}</p>
            <DashboardBadge :tone="ORDER_STATUS_TONE[item.status]">{{ ORDER_STATUS_LABEL[item.status] }}</DashboardBadge>
          </div>
        </div>
      </div>

      <AppEmptyState
        v-else
        title="Belum ada tagihan"
        description="Pilih kapasitas dan periode di atas, lalu buat tagihan pertama untuk mengaktifkan langganan."
        action-label="Buat tagihan"
        @action="order"
      />
    </DashboardPanel>
  </div>
</template>
