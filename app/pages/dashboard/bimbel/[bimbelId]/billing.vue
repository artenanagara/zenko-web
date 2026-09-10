<script setup lang="ts">
import type { BimbelOrder, BimbelOrderStatus, BimbelPlan, BimbelPlanOption, BimbelSubscriptionQuote } from '#shared/types/bimbel'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Langganan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const route = useRoute()
const bimbelId = String(route.params.bimbelId)
const bimbel = useBimbelDetail(bimbelId)
const orders = useBimbelOrders(bimbelId)
const plans = useBimbelPlans(bimbelId)
const toast = useToast()
const recommendedPlan = useState<BimbelPlan | null>('bimbel-recommended-plan', () => null)

const period = ref<1 | 12>(12)
const selectedPlan = ref<BimbelPlan | null>(null)
const planPickerOpen = ref(true)
const seatModalOpen = ref(false)
const summaryOpen = ref(false)
const ordering = ref(false)
const monthlyQuote = ref<BimbelSubscriptionQuote | null>(null)
const yearlyQuote = ref<BimbelSubscriptionQuote | null>(null)
const quotePending = ref(true)
const quoteError = ref('')
let quoteToken = 0

const quote = computed(() => period.value === 1 ? monthlyQuote.value : yearlyQuote.value)
const isPaidCustomer = computed(() => bimbel.data.value?.status === 'active')
const pendingSeats = computed(() => bimbel.data.value?.pendingSeatAddonSeats ?? 0)
const usedPercent = computed(() => {
  const detail = bimbel.data.value
  return detail?.seatQuota ? Math.min(100, Math.round(detail.seatsUsed / detail.seatQuota * 100)) : 0
})
const daysLeft = computed(() => {
  const until = bimbel.data.value?.activeUntil
  return until ? Math.max(0, Math.ceil((until - Math.floor(Date.now() / 1000)) / 86400)) : 0
})
const expiryWarning = computed(() => {
  const status = bimbel.data.value?.status
  if (status === 'trial' && daysLeft.value <= 3) return `Uji coba berakhir ${daysLeft.value} hari lagi.`
  if (status === 'active' && daysLeft.value <= 14) return `Masa aktif berakhir ${daysLeft.value} hari lagi.`
  return ''
})
const freeMonths = computed(() => yearlyQuote.value ? Math.max(0, yearlyQuote.value.months - yearlyQuote.value.billedMonths) : 0)
const periodFootnote = computed(() => period.value === 12 && yearlyQuote.value && freeMonths.value > 0
  ? `Ditagih ${yearlyQuote.value.billedMonths} bulan untuk ${yearlyQuote.value.months} bulan`
  : '')
const openOrder = computed(() => orders.data.value.find(item => item.status === 'verifying')
  ?? orders.data.value.find(item => item.status === 'pending')
  ?? null)
const latestOrders = computed(() => orders.data.value.slice(0, 3))
const paymentPath = (orderId: string) => `/dashboard/bimbel/${bimbelId}/payment/${orderId}`

const STATUS_LABEL = { trial: 'Uji coba', active: 'Aktif', grace: 'Masa tenggang', suspended: 'Terkunci' } as const
const STATUS_DESCRIPTION = {
  trial: 'Semua fitur Pro tersedia selama masa uji coba.',
  active: 'Langganan berjalan dan semua fitur dapat digunakan.',
  grace: 'Pembuatan baru dihentikan. Perpanjang agar aktivitas bimbel kembali normal.',
  suspended: 'Data lama tetap dapat dibaca, tetapi aktivitas baru terkunci sampai langganan diperpanjang.',
} as const
const ORDER_STATUS_LABEL: Record<BimbelOrderStatus, string> = {
  paid: 'Lunas', pending: 'Menunggu pembayaran', verifying: 'Menunggu verifikasi', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan',
}
const ORDER_STATUS_TONE: Record<BimbelOrderStatus, 'success' | 'warning' | 'neutral'> = {
  paid: 'success', pending: 'warning', verifying: 'warning', expired: 'neutral', cancelled: 'neutral',
}

function planFeatures(plan: BimbelPlanOption): string[] {
  return [
    `${plan.includedSeats} kursi siswa termasuk`,
    bimbelLimitLabel(plan.teacherLimit, 'pengajar'),
    bimbelLimitLabel(plan.productLimit, 'paket bank soal privat'),
  ]
}

function planBadge(plan: BimbelPlan): string {
  if (bimbel.data.value?.plan === plan) return 'Tingkat saat ini'
  if (recommendedPlan.value === plan && bimbel.data.value?.status === 'trial') return 'Direkomendasikan'
  return ''
}

function orderDescription(order: BimbelOrder): string {
  return order.kind === 'seat_addon'
    ? `${order.additionalSeats} kursi tambahan`
    : `${bimbelPlanLabel(order.plan)} · ${order.months} bulan`
}

async function refreshQuote() {
  const token = ++quoteToken
  quotePending.value = true
  quoteError.value = ''
  try {
    const plan = selectedPlan.value ?? undefined
    const [monthly, yearly] = await Promise.all([
      getBimbelQuote(bimbelId, { kind: 'subscription', plan, months: 1 }),
      getBimbelQuote(bimbelId, { kind: 'subscription', plan, months: 12 }),
    ])
    if (token !== quoteToken) return
    if (monthly.kind !== 'subscription' || yearly.kind !== 'subscription') throw new Error('Jenis harga tidak sesuai.')
    monthlyQuote.value = monthly
    yearlyQuote.value = yearly
    selectedPlan.value = monthly.plan
  }
  catch (cause) {
    if (token !== quoteToken) return
    monthlyQuote.value = null
    yearlyQuote.value = null
    quoteError.value = tutorApiMessage(cause, 'Harga belum bisa dimuat.')
  }
  finally { if (token === quoteToken) quotePending.value = false }
}

async function load() {
  await Promise.all([bimbel.refresh(), orders.refresh(), plans.refresh()])
  selectedPlan.value = bimbel.data.value?.status === 'trial' && recommendedPlan.value
    ? recommendedPlan.value
    : bimbel.data.value?.plan ?? plans.data.value[0]?.plan ?? null
  planPickerOpen.value = !isPaidCustomer.value
  await refreshQuote()
  if (route.query['tambah-kursi'] === '1' && isPaidCustomer.value) seatModalOpen.value = true
}
onMounted(load)

/**
 * "Perpanjang" berarti tingkat yang sedang berjalan, jadi ia membuka ringkasan
 * tingkat itu langsung. Tanpa ini, satu-satunya jalan memperpanjang adalah
 * membuka pemilih tingkat dan memilih ulang tingkat yang sudah dipakai — dan
 * pada langganan yang aktif pemilihnya terlipat, sehingga panel yang berjudul
 * "Perpanjang Kelas Pro" tidak punya satu pun tombol yang memperpanjangnya.
 *
 * Tanpa tingkat terpilih (daftar tingkat gagal dimuat) yang bisa dibuka hanya
 * pemilihnya, bersama pesan galatnya.
 */
function openSummary() {
  if (!selectedPlan.value) {
    planPickerOpen.value = true
    return
  }
  summaryOpen.value = true
}

/**
 * Memilih tingkat membuka ringkasannya, bukan menyalakan panel yang sudah
 * berdiri sejak halaman dibuka: ringkasan atas tingkat yang belum dipilih tidak
 * meringkas apa pun. Modalnya juga dibuka ulang untuk tingkat yang memang sudah
 * terpilih — tombol yang sama harus melakukan hal yang sama.
 */
async function choosePlan(plan: BimbelPlan) {
  summaryOpen.value = true
  if (selectedPlan.value === plan) return
  selectedPlan.value = plan
  await refreshQuote()
}

/**
 * Tagihan yang baru dibuat langsung dibuka layar bayarnya. Sebelumnya halaman
 * ini hanya menggulir sendiri ke panel pembayaran di tengah daftar tingkat —
 * gerakan yang di layar kecil sulit dibedakan dari tidak terjadi apa-apa.
 */
async function orderSubscription() {
  if (!selectedPlan.value || ordering.value) return
  ordering.value = true
  try {
    const order = await createBimbelOrder(bimbelId, { kind: 'subscription', plan: selectedPlan.value, months: period.value })
    summaryOpen.value = false
    toast.success('Tagihan dibuat.', 'Selesaikan pembayaran sesuai instruksi.')
    await navigateTo(paymentPath(order.id))
  }
  catch (cause) { toast.error('Gagal membuat tagihan.', tutorApiMessage(cause, 'Coba lagi.')) }
  finally { ordering.value = false }
}

async function onSeatOrderCreated(order: BimbelOrder) {
  toast.success('Tagihan kursi dibuat.', 'Kuota bertambah setelah pembayaran diverifikasi.')
  await navigateTo(paymentPath(order.id))
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Langganan" description="Lihat masa aktif dan kapasitas, perpanjang tingkat, atau tambah kursi saat dibutuhkan." />

    <AppSectionMessage v-if="expiryWarning" appearance="warning" title="Perpanjang sebelum masa aktif berakhir">
      {{ expiryWarning }} Periode baru dimulai setelah periode saat ini, jadi memperpanjang lebih awal tidak menghilangkan hari yang sudah dibayar.
    </AppSectionMessage>

    <DashboardPanel>
      <DashboardSkeleton v-if="bimbel.pending.value" :count="3" label="Memuat status langganan…" />
      <div v-else-if="bimbel.error.value" class="py-8 text-center">
        <AppInlineMessage type="error">{{ bimbel.error.value }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="bimbel.refresh">Coba lagi</button>
      </div>
      <div v-else-if="bimbel.data.value" class="grid gap-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-bold tracking-tight">{{ bimbel.data.value.plan ? bimbelPlanLabel(bimbel.data.value.plan) : 'Langganan bimbel' }}</h2>
              <DashboardBadge :tone="bimbel.data.value.status === 'active' ? 'success' : 'warning'">{{ STATUS_LABEL[bimbel.data.value.status] }}</DashboardBadge>
            </div>
            <p class="mt-1 text-sm text-muted">{{ STATUS_DESCRIPTION[bimbel.data.value.status] }}</p>
            <p class="mt-2 font-semibold">
              Aktif sampai {{ formatDate(bimbel.data.value.activeUntil) }}
              <span class="font-normal text-muted">· sisa {{ daysLeft }} hari</span>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton v-if="isPaidCustomer" size="sm" variant="outline" @click="seatModalOpen = true">Tambah kursi</AppButton>
            <AppButton size="sm" @click="openSummary">Perpanjang</AppButton>
          </div>
        </div>
        <div>
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span class="font-semibold tabular-nums">{{ bimbel.data.value.seatsUsed }} / {{ bimbel.data.value.seatQuota }} kursi terpakai</span>
            <DashboardBadge v-if="pendingSeats" tone="warning">+{{ pendingSeats }} menunggu pembayaran</DashboardBadge>
          </div>
          <div class="h-2 overflow-hidden rounded-pill bg-surface-alt" role="progressbar" aria-label="Pemakaian kursi" :aria-valuenow="usedPercent" aria-valuemin="0" aria-valuemax="100">
            <div class="h-full rounded-pill bg-primary transition-[width]" :style="{ width: `${usedPercent}%` }" />
          </div>
        </div>
      </div>
    </DashboardPanel>

    <!-- Layar bayarnya berdiri sebagai halaman sendiri; di sini cukup
         penunjuknya, supaya tagihan yang belum lunas tidak hilang dari pandangan
         tanpa ikut menghalangi daftar tingkat. -->
    <AppSectionMessage
      v-if="openOrder"
      :appearance="openOrder.status === 'verifying' ? 'information' : 'warning'"
      :title="openOrder.status === 'verifying' ? 'Pembayaranmu sedang diperiksa' : 'Ada tagihan yang menunggu pembayaran'"
    >
      Invoice {{ openOrder.invoice }} · {{ orderDescription(openOrder) }} · {{ formatRupiah(openOrder.amount) }}
      <template #actions>
        <AppButton size="sm" @click="navigateTo(paymentPath(openOrder.id))">
          {{ openOrder.status === 'verifying' ? 'Lihat status' : 'Selesaikan pembayaran' }}
        </AppButton>
      </template>
    </AppSectionMessage>

    <DashboardPanel title="Perpanjang atau ubah tingkat" description="Kursi bawaan tingkat ditetapkan otomatis. Kursi tambahan dibeli terpisah setelah langganan aktif.">
      <div v-if="isPaidCustomer && !planPickerOpen" class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="font-semibold">Perpanjang {{ bimbel.data.value?.plan ? bimbelPlanLabel(bimbel.data.value.plan) : 'tingkat saat ini' }}</p>
          <p class="mt-1 text-sm text-muted">Kuota saat ini diteruskan oleh server ke periode berikutnya.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppButton size="sm" @click="openSummary">Perpanjang sekarang</AppButton>
          <AppButton variant="outline" size="sm" @click="planPickerOpen = true">Ubah tingkat</AppButton>
        </div>
      </div>
      <template v-else>
        <DashboardSkeleton v-if="plans.pending.value" :count="3" label="Memuat tingkat langganan…" />
        <div v-else-if="plans.error.value" class="py-8 text-center">
          <AppInlineMessage type="error">{{ plans.error.value }}</AppInlineMessage>
          <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="plans.refresh">Coba lagi</button>
        </div>
        <template v-else-if="plans.data.value.length">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <BimbelBillingToggle v-model="period">
              <template v-if="freeMonths > 0" #note>
                <AppLozenge v-if="period === 12" appearance="success">Gratis {{ freeMonths }} bulan</AppLozenge>
                <span v-else class="text-[0.82rem] text-muted">Tahunan gratis {{ freeMonths }} bulan</span>
              </template>
            </BimbelBillingToggle>
            <AppButton v-if="isPaidCustomer" variant="light" size="sm" @click="planPickerOpen = false">Tutup pilihan</AppButton>
          </div>
          <div class="mt-6 grid gap-5 xl:grid-cols-3" role="radiogroup" aria-label="Tingkat langganan">
            <BimbelPlanCard
              v-for="plan in plans.data.value" :key="plan.plan" :name="bimbelPlanLabel(plan.plan, plan.name)"
              price-lead="Mulai dari" :price="formatRupiah(plan.pricePerMonth)" price-note="per bulan"
              :price-footnote="periodFootnote" :features="planFeatures(plan)" :badge="planBadge(plan.plan)" badge-tone="brand"
              :marketplace-share-percent="plan.marketplaceSharePercent"
              :selected="selectedPlan === plan.plan" :action-label="selectedPlan === plan.plan ? 'Lihat ringkasan' : 'Pilih tingkat ini'"
              :action-variant="selectedPlan === plan.plan ? 'primary' : 'light'" @action="choosePlan(plan.plan)"
            />
          </div>
          <p class="mt-5 text-sm text-muted">Berlaku untuk semua tingkat: kelas, roster siswa, rekap hasil per paket, dan kursi tambahan melalui tagihan terpisah.</p>
        </template>
        <AppEmptyState v-else title="Tingkat langganan belum tersedia" description="Daftar tingkat tidak dikirim server. Muat ulang halaman atau hubungi tim Zenko." action-label="Muat ulang" @action="plans.refresh" />
      </template>
    </DashboardPanel>

    <DashboardPanel title="Riwayat tagihan" description="Tiga tagihan terbaru.">
      <DashboardSkeleton v-if="orders.pending.value" :count="3" label="Memuat tagihan…" />
      <div v-else-if="orders.error.value" class="py-8 text-center"><AppInlineMessage type="error">{{ orders.error.value }}</AppInlineMessage><button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="orders.refresh">Coba lagi</button></div>
      <div v-else-if="latestOrders.length" class="grid gap-2">
        <div v-for="item in latestOrders" :key="item.id" class="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-hairline p-3">
          <div class="min-w-0"><strong>{{ item.invoice }}</strong><p class="text-sm text-muted">{{ orderDescription(item) }}</p></div>
          <div class="flex items-center gap-3 text-right">
            <div>
              <p class="font-semibold tabular-nums">{{ formatRupiah(item.amount) }}</p>
              <DashboardBadge :tone="ORDER_STATUS_TONE[item.status]">{{ ORDER_STATUS_LABEL[item.status] }}</DashboardBadge>
            </div>
            <NuxtLink v-if="item.status === 'pending' || item.status === 'verifying'" :to="paymentPath(item.id)" class="text-sm font-semibold text-primary hover:underline">
              Buka
            </NuxtLink>
          </div>
        </div>
      </div>
      <AppEmptyState v-else title="Belum ada tagihan" description="Tagihan yang kamu buat akan muncul di sini. Pilih tingkat dan periksa ringkasan sebelum membuat tagihan pertama." />
    </DashboardPanel>

    <BimbelSubscriptionSummaryModal
      v-model="summaryOpen" v-model:period="period" :quote="quote" :pending="quotePending" :error="quoteError"
      :free-months="freeMonths" :active-until="bimbel.data.value?.activeUntil" :ordering="ordering"
      @confirm="orderSubscription" @retry="refreshQuote"
    />

    <BimbelSeatAddonModal v-model="seatModalOpen" :bimbel-id="bimbelId" :seats-used="bimbel.data.value?.seatsUsed ?? 0" :pending-seats="pendingSeats" @created="onSeatOrderCreated" @renew="planPickerOpen = true" />
  </div>
</template>
