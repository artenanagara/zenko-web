<script setup lang="ts">
import type { BimbelOrder, BimbelOrderStatus, BimbelPlan, BimbelQuote } from '#shared/types/bimbel'

/**
 * Halaman langganan bimbel.
 *
 * Judul dan seluruh istilahnya memakai "Langganan", tidak pernah "Paket": di
 * Zenko "paket" sudah berarti produk tryout yang dijual, jadi "Paket Pro" akan
 * membuat pengelola bimbel tidak tahu apakah itu soal yang ia jual atau
 * langganan yang ia bayar (docs/konsep-bimbel-agency.md §1.2).
 *
 * Tidak ada satu pun angka uang yang dihitung di sini. Tingkat datang dari
 * `/billing/plans`, harga dari `/billing/quote` — termasuk diskon tahunan, yang
 * dibaca dari selisih `months` dan `billedMonths`, bukan dari pengali yang
 * disalin ke klien.
 */

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Langganan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const bimbel = useBimbelDetail(bimbelId)
const orders = useBimbelOrders(bimbelId)
const plans = useBimbelPlans(bimbelId)
const toast = useToast()

const period = ref<1 | 12>(1)
const selectedPlan = ref<BimbelPlan | null>(null)
const seats = ref(0)
const ordering = ref(false)

/**
 * Dua quote sekaligus, bulanan dan tahunan, untuk tiap (tingkat, kursi).
 *
 * Tahunan perlu diketahui bahkan saat yang aktif Bulanan — kalau tidak, tombol
 * "Tahunan" kembali jadi janji tanpa isi, persis keadaan yang halaman ini
 * dibuat untuk mengakhiri. Dengan keduanya di tangan, hematnya bisa ditulis di
 * tombolnya sendiri sebelum ditekan.
 */
const monthlyQuote = ref<BimbelQuote | null>(null)
const yearlyQuote = ref<BimbelQuote | null>(null)
const quotePending = ref(true)
const quoteError = ref('')

const quote = computed(() => (period.value === 1 ? monthlyQuote.value : yearlyQuote.value))

const activePlan = computed(() => plans.data.value.find(item => item.plan === selectedPlan.value) ?? null)

/**
 * Batas kontrol kursi datang dari quote, tidak satu pun dihardcode. Sebelum
 * quote pertama tiba kontrolnya memang belum bisa dipakai, dan itu jujur —
 * menebak batasnya lalu diam-diam dikoreksi server lebih buruk.
 */
const seatStep = computed(() => quote.value?.seatQuotaStep ?? 1)
const minSeats = computed(() => quote.value?.minSeatQuota ?? 0)
const maxSeats = computed(() => quote.value?.maxSeatQuota ?? 0)
const seatsUsed = computed(() => quote.value?.seatsUsed ?? bimbel.data.value?.seatsUsed ?? 0)

/** Bulan gratis pada langganan tahunan, satu-satunya bentuk diskon yang diakui kontrak. */
const freeMonths = computed(() => {
  const yearly = yearlyQuote.value
  if (!yearly) return 0
  return Math.max(0, yearly.months - yearly.billedMonths)
})

let quoteToken = 0
let quoteDebounce: ReturnType<typeof setTimeout> | null = null

/**
 * Kursi sedang diketik. Selama benar, kuota hasil normalisasi server tidak
 * disalin balik ke kolomnya — kalau tidak, orang yang menuju "60" akan melihat
 * angkanya melompat ke kuota tingkat begitu ia baru mengetik "6".
 */
const seatsFocused = ref(false)

/**
 * `plan` dan `seats` sengaja bisa kosong: pada muat pertama halaman ini belum
 * tahu tingkat maupun kuota apa pun, dan quote tanpa query menjawab dengan
 * tingkat bimbel saat ini beserta seluruh aturan bentuk isian.
 *
 * Kuota tidak pernah dinormalkan di klien. Server menaikkan kuota yang di bawah
 * kursi termasuk tingkatnya, jadi nilai kolomnya dikirim apa adanya dan
 * `seatQuota` pada jawabannya yang jadi kebenaran.
 */
async function refreshQuote() {
  const plan = selectedPlan.value ?? undefined
  const asked = seats.value > 0 ? seats.value : undefined

  quotePending.value = true
  quoteError.value = ''
  const token = ++quoteToken

  try {
    const [monthly, yearly] = await Promise.all([
      getBimbelQuote(bimbelId, plan, asked, 1),
      getBimbelQuote(bimbelId, plan, asked, 12),
    ])
    // Jawaban yang datang terlambat setelah pilihan berubah dibuang, bukan
    // ditampilkan — kalau tidak, harga tingkat lain bisa mendarat di ringkasan.
    if (token !== quoteToken) return
    monthlyQuote.value = monthly
    yearlyQuote.value = yearly

    // Muat pertama juga yang menetapkan tingkat dan kuota awalnya.
    selectedPlan.value = monthly.plan
    if (!seatsFocused.value) seats.value = monthly.seatQuota
  }
  catch (cause) {
    if (token !== quoteToken) return
    monthlyQuote.value = null
    yearlyQuote.value = null
    quoteError.value = tutorApiMessage(cause, 'Harga belum bisa dimuat.')
  }
  finally {
    if (token === quoteToken) quotePending.value = false
  }
}

/** Kursi diketik digit demi digit; tanpa jeda tiap ketukan jadi dua permintaan. */
function scheduleQuote() {
  if (quoteDebounce !== null) clearTimeout(quoteDebounce)
  quoteDebounce = setTimeout(refreshQuote, 300)
}
onUnmounted(() => {
  if (quoteDebounce !== null) clearTimeout(quoteDebounce)
})

/**
 * Berpindah tingkat mengirimkan kuota yang sekarang apa adanya. Kalau kuota itu
 * lebih kecil dari kursi termasuk tingkat barunya, server yang menaikkannya —
 * dan kolomnya mengikuti jawaban itu, bukan tebakan yang dibuat di sini.
 */
function choosePlan(plan: BimbelPlan) {
  if (selectedPlan.value === plan) return
  selectedPlan.value = plan
  refreshQuote()
}

function stepSeats(direction: 1 | -1) {
  const next = seats.value + direction * seatStep.value
  seats.value = Math.min(maxSeats.value, Math.max(minSeats.value, next))
  scheduleQuote()
}

function onSeatsInput(event: Event) {
  const raw = Number((event.target as HTMLInputElement).value)
  if (!Number.isFinite(raw) || raw <= 0) return
  seats.value = raw
  scheduleQuote()
}

/** Fokus lepas: kuota hasil normalisasi server boleh masuk ke kolomnya lagi. */
function onSeatsBlur() {
  seatsFocused.value = false
  const settled = monthlyQuote.value?.seatQuota
  if (settled && settled !== seats.value) seats.value = settled
}

async function load() {
  // Quote tidak menunggu `plans`: jawabannya tanpa query sudah membawa tingkat
  // bimbel saat ini beserta batas kursinya, jadi kontrolnya hidup lebih cepat.
  await Promise.all([bimbel.refresh(), orders.refresh(), plans.refresh(), refreshQuote()])
}
onMounted(load)

// Sengaja tidak ada watch pada `period`: kedua quote sudah dipegang sekaligus,
// jadi mengganti periode hanya berpindah antara dua angka yang sudah ada.

/**
 * Tagihan yang belum selesai. Panelnya diletakkan di atas pemilih tingkat:
 * kalau ada yang belum dibayar, membayarnya adalah pekerjaan halaman ini —
 * bukan sesuatu yang harus dicari di dasar halaman.
 */
const openOrder = computed(() =>
  orders.data.value.find(item => item.status === 'pending' || item.status === 'verifying') ?? null,
)
const paymentPanel = useTemplateRef<HTMLElement>('paymentPanel')

const STATUS_LABEL = {
  trial: 'Masa uji coba',
  active: 'Aktif',
  grace: 'Perlu diperpanjang',
  suspended: 'Perlu diperpanjang',
} as const

const ORDER_STATUS_LABEL: Record<BimbelOrderStatus, string> = {
  paid: 'Lunas',
  pending: 'Menunggu pembayaran',
  // Sengaja bukan "Menunggu pembayaran": pembayarnya sudah membayar, dan yang
  // ditunggu sekarang ada di sisi Zenko.
  verifying: 'Menunggu verifikasi',
  // Dipisah dari "Dibatalkan": yang satu lewat waktunya, yang lain
  // ditinggalkan — dan yang bertanya "kenapa tagihan saya hilang" berhak tahu
  // yang mana.
  expired: 'Kedaluwarsa',
  cancelled: 'Dibatalkan',
}

const ORDER_STATUS_TONE: Record<BimbelOrderStatus, 'success' | 'warning' | 'neutral'> = {
  paid: 'success',
  pending: 'warning',
  verifying: 'warning',
  expired: 'neutral',
  cancelled: 'neutral',
}

async function order() {
  const plan = selectedPlan.value
  if (!plan) return

  ordering.value = true
  try {
    await createBimbelOrder(bimbelId, plan, seats.value, period.value)
    await orders.refresh()
    toast.success('Tagihan dibuat.', 'Selesaikan pembayaran sesuai instruksi di atas.')
    // Panel pembayarannya baru muncul setelah daftar tagihan dimuat ulang, dan
    // letaknya di atas — tanpa ini tombol "Buat tagihan" terasa seperti tidak
    // melakukan apa-apa.
    await nextTick()
    paymentPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  catch (cause) {
    toast.error('Gagal membuat tagihan.', tutorApiMessage(cause, 'Coba lagi.'))
  }
  finally {
    ordering.value = false
  }
}

/** Bukti terkirim: baris tagihannya diganti salinan terbaru dari server. */
function onPaymentUpdated(updated: BimbelOrder) {
  orders.data.value = orders.data.value.map(item => (item.id === updated.id ? updated : item))
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Langganan"
      description="Pilih tingkat langganan dan jumlah kursi siswa. Tingkat menentukan batas pengajar dan bank soal privat bimbelmu; kursi ditagih sesuai jumlah siswa aktif."
    />

    <AppSectionMessage appearance="information" title="Kursi dihitung dari siswa aktif">
      Pengajar dan admin tidak memakai kursi. Siswa yang ditangguhkan juga tidak dihitung sebagai kursi aktif.
    </AppSectionMessage>

    <!-- Tagihan yang belum selesai, kalau ada. Pembungkus <div> ada demi
         scrollIntoView: ref pada komponen memberi instance, bukan elemennya. -->
    <div v-if="openOrder" ref="paymentPanel">
      <DashboardPanel
        title="Selesaikan pembayaran"
        :description="`Invoice ${openOrder.invoice} · ${bimbelPlanLabel(openOrder.plan)}`"
      >
        <BimbelOrderPayment :bimbel-id="bimbelId" :order="openOrder" @updated="onPaymentUpdated" />
      </DashboardPanel>
    </div>

    <!-- ============================================================
         Pilih tingkat langganan
         ============================================================ -->
    <DashboardPanel title="Tingkat langganan" description="Kursi termasuk sudah masuk harga tingkatnya.">
      <DashboardSkeleton v-if="plans.pending.value" :count="3" label="Memuat tingkat langganan…" />

      <div v-else-if="plans.error.value" class="py-8 text-center">
        <AppInlineMessage type="error">{{ plans.error.value }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">
          Coba lagi
        </button>
      </div>

      <template v-else-if="plans.data.value.length">
        <!-- Periode. "Tahunan" menyebut hematnya secara eksplisit, diturunkan
             dari selisih months dan billedMonths pada quote tahunan — bukan
             dari pengali yang disalin ke klien. -->
        <div
          class="inline-flex w-fit rounded-md border border-hairline bg-surface p-1"
          role="group"
          aria-label="Periode langganan"
        >
          <button
            v-for="item in ([1, 12] as const)"
            :key="item"
            type="button"
            class="flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :class="period === item ? 'bg-primary text-white' : 'text-muted hover:bg-surface-alt'"
            :aria-pressed="period === item"
            @click="period = item"
          >
            {{ item === 1 ? 'Bulanan' : 'Tahunan' }}
            <AppLozenge v-if="item === 12 && freeMonths > 0" appearance="success">
              Gratis {{ freeMonths }} bulan
            </AppLozenge>
          </button>
        </div>

        <p v-if="period === 12 && freeMonths > 0 && yearlyQuote" class="mt-3 text-sm text-muted">
          Langganan tahunan ditagih {{ yearlyQuote.billedMonths }} bulan untuk masa aktif
          {{ yearlyQuote.months }} bulan.
        </p>

        <div class="mt-5 grid gap-4 lg:grid-cols-3" role="group" aria-label="Tingkat langganan">
          <button
            v-for="plan in plans.data.value"
            :key="plan.plan"
            type="button"
            class="flex flex-col rounded-lg border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :class="selectedPlan === plan.plan ? 'border-primary bg-primary-soft shadow-lift' : 'border-hairline bg-surface hover:border-primary/30'"
            :aria-pressed="selectedPlan === plan.plan"
            @click="choosePlan(plan.plan)"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="text-xs font-bold tracking-wide text-primary uppercase">
                {{ bimbelPlanLabel(plan.plan, plan.name) }}
              </p>
              <AppLozenge v-if="bimbel.data.value?.plan === plan.plan">Tingkat saat ini</AppLozenge>
            </div>

            <p class="mt-3 text-2xl font-bold tabular-nums">
              {{ formatRupiah(plan.pricePerMonth) }}
              <span class="text-sm font-medium text-muted">/ bulan</span>
            </p>

            <dl class="mt-4 grid gap-2 text-sm">
              <div class="flex items-center gap-2">
                <AppIcon name="users-three" :size="16" class="shrink-0 text-muted" aria-hidden="true" />
                <dt class="sr-only">Kursi termasuk</dt>
                <dd>{{ plan.includedSeats }} kursi siswa termasuk</dd>
              </div>
              <div class="flex items-center gap-2">
                <AppIcon name="chalkboard-teacher" :size="16" class="shrink-0 text-muted" aria-hidden="true" />
                <dt class="sr-only">Batas pengajar</dt>
                <dd>{{ bimbelLimitLabel(plan.teacherLimit, 'pengajar') }}</dd>
              </div>
              <div class="flex items-center gap-2">
                <AppIcon name="folder-lock" :size="16" class="shrink-0 text-muted" aria-hidden="true" />
                <dt class="sr-only">Batas bank soal privat</dt>
                <dd>{{ bimbelLimitLabel(plan.productLimit, 'paket bank soal privat') }}</dd>
              </div>
            </dl>
          </button>
        </div>

        <!-- ============================================================
             Kursi
             ============================================================ -->
        <div class="mt-6 border-t border-hairline pt-5">
          <label for="seat-quota" class="text-sm font-semibold">Jumlah kursi siswa</label>
          <!-- Kuota di bawah kursi termasuk tingkatnya dinaikkan server, bukan
               ditolak, jadi kalimat ini menjelaskan apa yang akan terjadi
               alih-alih melarang angka yang sebetulnya boleh diketik. -->
          <p id="seat-quota-hint" class="mt-1 text-sm text-muted">
            Kelipatan {{ seatStep }}, maksimal {{ maxSeats }} kursi, dan tidak boleh
            di bawah {{ seatsUsed }} siswa yang aktif sekarang. Kuota di bawah
            {{ activePlan?.includedSeats ?? 0 }} kursi yang sudah termasuk tingkat ini
            otomatis dinaikkan; selebihnya ditagih sebagai kursi tambahan.
          </p>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            <AppIconButton
              variant="outline"
              :ariaLabel="`Kurangi ${seatStep} kursi`"
              :disabled="seats <= minSeats"
              @click="stepSeats(-1)"
            >
              <AppIcon name="minus" :size="16" aria-hidden="true" />
            </AppIconButton>

            <input
              id="seat-quota"
              type="number"
              inputmode="numeric"
              aria-describedby="seat-quota-hint"
              :min="minSeats"
              :max="maxSeats"
              :step="seatStep"
              :value="seats"
              class="w-28 rounded-sm border border-hairline-strong bg-surface px-3.5 py-2.5 text-center text-base font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              @focus="seatsFocused = true"
              @input="onSeatsInput"
              @blur="onSeatsBlur"
            >

            <AppIconButton
              variant="outline"
              :ariaLabel="`Tambah ${seatStep} kursi`"
              :disabled="seats >= maxSeats"
              @click="stepSeats(1)"
            >
              <AppIcon name="plus" :size="16" aria-hidden="true" />
            </AppIconButton>

            <span class="ml-1 text-sm text-muted">{{ seatsUsed }} kursi terpakai saat ini</span>
          </div>
        </div>
      </template>

      <AppEmptyState
        v-else
        title="Tingkat langganan belum tersedia"
        description="Daftar tingkat langganan tidak dikirim server. Muat ulang halaman, atau hubungi tim Zenko kalau tetap kosong."
        action-label="Muat ulang"
        @action="load"
      />
    </DashboardPanel>

    <!-- ============================================================
         Ringkasan — seluruh angkanya milik quote, apa adanya
         ============================================================ -->
    <!-- Tidak bergantung pada `plans`: quote sudah membawa tingkat bimbel saat
         ini, jadi daftar tingkat yang gagal dimuat tidak ikut membunuh
         kemampuan memperpanjang langganan yang sedang berjalan. -->
    <DashboardPanel title="Ringkasan sebelum membeli">
      <div v-if="quoteError">
        <AppInlineMessage type="error">{{ quoteError }}</AppInlineMessage>
        <AppButton class="mt-3" variant="outline" @click="refreshQuote">Muat ulang harga</AppButton>
      </div>

      <DashboardSkeleton v-else-if="quotePending" :count="3" label="Menghitung harga…" />

      <div v-else-if="quote" class="grid gap-4">
        <dl class="grid gap-2.5 text-sm">
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-muted">
              {{ bimbelPlanLabel(quote.plan, quote.planName) }}
              <span class="text-faint">· {{ quote.includedSeats }} kursi termasuk</span>
            </dt>
            <dd class="font-semibold tabular-nums">{{ formatRupiah(quote.planPrice) }} / bulan</dd>
          </div>

          <div v-if="quote.extraSeats > 0" class="flex items-baseline justify-between gap-4">
            <dt class="text-muted">
              Kursi tambahan
              <span class="text-faint">
                · {{ quote.extraSeats }} × {{ formatRupiah(quote.extraSeatPrice) }}
              </span>
            </dt>
            <dd class="font-semibold tabular-nums">{{ formatRupiah(quote.extraSeatsAmount) }} / bulan</dd>
          </div>

          <!-- Hanya bermakna kalau ada yang dijumlahkan; tanpa kursi tambahan
               barisnya mengulang harga tingkat persis di atasnya. -->
          <div v-if="quote.extraSeats > 0" class="flex items-baseline justify-between gap-4 border-t border-hairline pt-2.5">
            <dt class="text-muted">Per bulan</dt>
            <dd class="font-semibold tabular-nums">{{ formatRupiah(quote.monthlyAmount) }}</dd>
          </div>

          <div class="flex items-baseline justify-between gap-4 border-t border-hairline pt-2.5">
            <dt class="text-muted">
              Masa aktif
              <span class="text-faint">· {{ quote.seatQuota }} kursi</span>
            </dt>
            <dd class="font-semibold tabular-nums">{{ quote.months }} bulan</dd>
          </div>

          <!-- Diskon tahunan dinyatakan dalam bulan, bukan rupiah: itu bentuk
               yang benar-benar dikirim server, dan menghitung rupiahnya sendiri
               berarti klien ikut menentukan harga. -->
          <div v-if="quote.months > quote.billedMonths" class="flex items-baseline justify-between gap-4">
            <dt class="text-muted">Ditagih</dt>
            <dd class="flex items-center gap-2 font-semibold tabular-nums">
              {{ quote.billedMonths }} bulan
              <AppLozenge appearance="success">
                Bayar {{ quote.billedMonths }} bulan untuk {{ quote.months }}
              </AppLozenge>
            </dd>
          </div>
        </dl>

        <div class="flex flex-col gap-4 border-t border-hairline pt-4 sm:flex-row sm:items-center">
          <div class="flex-1">
            <p class="text-xs text-muted uppercase">Total tagihan</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{{ formatRupiah(quote.amount) }}</p>
          </div>
          <AppButton :disabled="ordering || quote.amount <= 0" @click="order">
            {{ ordering ? 'Membuat…' : 'Buat tagihan' }}
          </AppButton>
        </div>
      </div>
    </DashboardPanel>

    <!-- ============================================================
         Status
         ============================================================ -->
    <DashboardPanel title="Status saat ini">
      <DashboardSkeleton v-if="bimbel.pending.value" :count="3" label="Memuat status langganan…" />

      <div v-else-if="bimbel.error.value" class="py-8 text-center">
        <AppInlineMessage type="error">{{ bimbel.error.value }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="bimbel.refresh">
          Coba lagi
        </button>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p class="text-xs text-muted uppercase">Status</p>
          <p class="mt-1 font-semibold">{{ bimbel.data.value ? STATUS_LABEL[bimbel.data.value.status] : '—' }}</p>
        </div>
        <div>
          <p class="text-xs text-muted uppercase">Tingkat</p>
          <p class="mt-1 font-semibold">
            {{ bimbel.data.value?.plan ? bimbelPlanLabel(bimbel.data.value.plan) : '—' }}
          </p>
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

    <!-- ============================================================
         Riwayat tagihan
         ============================================================ -->
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
          <div class="min-w-0">
            <strong>{{ item.invoice }}</strong>
            <p class="text-sm text-muted">
              {{ bimbelPlanLabel(item.plan) }} · {{ item.seatQuota }} kursi · {{ item.months }} bulan
            </p>
          </div>
          <div class="text-right">
            <p class="font-semibold tabular-nums">{{ formatRupiah(item.amount) }}</p>
            <DashboardBadge :tone="ORDER_STATUS_TONE[item.status]">
              {{ ORDER_STATUS_LABEL[item.status] }}
            </DashboardBadge>
          </div>
        </div>
      </div>

      <AppEmptyState
        v-else
        title="Belum ada tagihan"
        description="Pilih tingkat langganan dan jumlah kursi di atas, lalu buat tagihan pertama untuk mengaktifkan langganan."
        action-label="Buat tagihan"
        @action="order"
      />
    </DashboardPanel>
  </div>
</template>
