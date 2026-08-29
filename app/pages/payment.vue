<script setup lang="ts">
import QRCode from 'qrcode'

// English file name, Indonesian URL; `path` keeps a bookmarked/shared QR link
// alive after the buyer navigates away and comes back.
definePageMeta({
  path: '/pembayaran/:invoice()',
  layout: 'payment',
  middleware: 'auth',
})

const route = useRoute()
const invoice = route.params.invoice as string

// Same fetch pattern as account/invoice.vue: client-only (the session cookie
// belongs to zenko-api's origin, not Nuxt's), 404 hands off to the error page.
const { data: purchase, pending, error, refresh } = usePurchase(invoice)

const { state: pollState, purchase: livePurchase, resumeWaiting } = useCheckout()

useHead({
  title: `Pembayaran ${invoice} | Zenko`,
  meta: [{ name: 'robots', content: 'noindex' }],
})

// Settlement is noticed by useCheckout's own background poll, which runs
// against its own fetch rather than this page's `purchase` — so it cannot
// just flip `purchase.value.status` itself. This flag is what lets the poll
// hand the "paid" moment back to the page instead of leaving immediately
// (see `startPolling`'s `onPaid`).
const livePaid = ref(false)

// Whichever way this page was reached — redirected straight from checkout, or
// opened again later from a bookmark or "Riwayat pembelian" — a still-pending
// order picks polling back up from here instead of only right after the
// order was created.
watch(purchase, async (value) => {
  if (!value) return

  // Lunas berhenti di sini, tidak dilempar ke invoice.
  //
  // Sebelumnya setiap status non-`pending` diarahkan ke /akun/pembelian/:invoice,
  // termasuk yang baru saja berhasil dibayar — jadi pembeli paket gratis (Rp0,
  // yang langsung berstatus `paid` begitu pesanan dibuat) tidak pernah melihat
  // layar "Pembayaran berhasil" sama sekali; ia mendarat di dokumen invoice dan
  // harus mencari sendiri jalan ke paketnya. Layar sukses di bawah sudah punya
  // tombol "Lihat paket saya" dan hitung mundur otomatis ke /akun/paket, yang
  // memang tujuan orang sesudah membeli. Invoice tetap ada di Riwayat pembelian.
  //
  // Yang masih diarahkan hanya status yang QR-nya sudah tidak bisa dipakai dan
  // tidak berujung kepemilikan — expired, batal, gagal.
  // `verifying` ikut tinggal di sini: bukti transfernya sedang diperiksa, dan
  // halaman inilah yang menampilkan hasilnya — termasuk alasan kalau ditolak.
  if (value.status !== 'pending' && value.status !== 'paid' && value.status !== 'verifying') {
    await navigateTo(`/akun/pembelian/${value.invoice}`, { replace: true })
    return
  }

  resumeWaiting(value, () => { livePaid.value = true })
}, { immediate: true })

/**
 * Jalur QRIS manual: tidak ada gateway, tidak ada kode per pesanan, dan yang
 * ditunggu adalah orang. `pollState` yang jadi sumber kebenaran status di layar
 * setelah pembeli mengunggah, karena `purchase` di sini hanya dimuat sekali.
 */
const isManual = computed(() => purchase.value?.paymentChannel === 'manual_qris')
const isVerifying = computed(() =>
  pollState.value === 'awaiting-verification' || purchase.value?.status === 'verifying',
)

/**
 * Setelah unggah berhasil, useCheckout sudah memegang salinan pesanan yang
 * paling baru — termasuk hasil verifikasi begitu admin memutuskan. Salinan itu
 * yang dipakai kartu manual supaya alasan penolakan muncul tanpa memuat ulang.
 */
const manualPurchase = computed(() => livePurchase.value ?? purchase.value)

// `pollState` only turns 'expired' via the client-side timer; the invoice can
// just as well already be expired straight from the initial fetch.
const isExpired = computed(() => pollState.value === 'expired' || purchase.value?.status === 'expired')
// True both when the poll just noticed settlement and when the page is
// opened fresh on an invoice that was already paid (e.g. a bookmarked link
// revisited later) — either way the same success screen applies.
const isPaid = computed(() => livePaid.value || purchase.value?.status === 'paid')
const displayStatus = computed(() => {
  if (isPaid.value) return 'paid'
  if (isVerifying.value) return 'verifying'
  return purchase.value?.status ?? 'pending'
})
const showQR = computed(() => !isExpired.value && !isPaid.value && Boolean(purchase.value?.qrUrl))
/** Kartu QRIS manual muncul selama pesanannya masih giliran pembeli. */
const showManual = computed(() =>
  isManual.value && !isExpired.value && !isPaid.value && !isVerifying.value,
)

// `qrUrl` now carries Duitku's raw QRIS payload string, not a hosted image —
// rendered into an image locally (no third-party image API ever sees a
// payment code). Regenerates whenever the payload changes; starts over
// (cleared, not stale) the moment it does, so a slow generation never shows
// the previous invoice's code under a new one's data.
const qrDataUrl = ref<string | null>(null)
const qrGenerationFailed = ref(false)

watchEffect(() => {
  const payload = purchase.value?.qrUrl
  qrDataUrl.value = null
  qrGenerationFailed.value = false
  if (!payload || !import.meta.client) return

  QRCode.toDataURL(payload, { width: 512, margin: 1 })
    .then((url) => { qrDataUrl.value = url })
    .catch(() => { qrGenerationFailed.value = true })
})

/** Best-effort link back to buy again — a purchase carries one package in practice. */
const retrySlug = computed(() => purchase.value?.items[0]?.slug ?? null)
/** Purchases carry one package in practice, but the shape allows for more. */
const packageTitle = computed(() => purchase.value?.items[0]?.title ?? 'paket ini')

// Countdown to the QR's own deadline, ticking once a second purely for
// display — the flip to 'expired' is driven by useCheckout's own timer.
const now = ref(Date.now())
let tickHandle: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  tickHandle = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => {
  if (tickHandle !== null) clearInterval(tickHandle)
})

const secondsLeft = computed(() => {
  const expiresAt = purchase.value?.expiresAt
  if (!expiresAt) return 0
  return Math.max(0, Math.floor(expiresAt - now.value / 1000))
})

const countdown = computed(() => {
  if (!purchase.value?.expiresAt) return null
  const m = Math.floor(secondsLeft.value / 60)
  const s = secondsLeft.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

/** Fraction of the QR's own window still left, for the depleting ring — 1 at
 * issue, 0 at the deadline. Falls back to "full" rather than dividing by
 * zero if either timestamp is missing. */
const countdownFraction = computed(() => {
  const expiresAt = purchase.value?.expiresAt
  const issuedAt = purchase.value?.date
  if (!expiresAt || !issuedAt) return 1
  const totalSeconds = Math.max(1, expiresAt - issuedAt)
  return Math.min(1, Math.max(0, secondsLeft.value / totalSeconds))
})

const RING_RADIUS = 42
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const ringOffset = computed(() => RING_CIRCUMFERENCE * (1 - countdownFraction.value))
/** Under a minute left, the ring turns amber — same urgency colour as the
 * expired state, so the shift itself is a cue before the code even runs out. */
const ringUrgent = computed(() => secondsLeft.value > 0 && secondsLeft.value <= 60)

const paySteps = [
  'Buka aplikasi bank atau e-wallet yang mendukung QRIS.',
  'Pilih menu "Scan QR" atau "Bayar", lalu arahkan kamera ke kode di sebelah.',
  'Periksa nominalnya, lalu konfirmasi pembayaran di aplikasimu.',
]

// Courtesy auto-continue after the success screen shows, not a hard cutoff —
// "Lihat paketku" below always wins if clicked first. useCooldown already
// clears its own timer on unmount, so navigating away early (or the redirect
// itself unmounting this page) never leaks it.
const { remaining: redirectRemaining, isCoolingDown: isRedirecting, start: startRedirect } = useCooldown(5)

watch(isPaid, (paid) => {
  if (paid) startRedirect()
}, { immediate: true })

watch(isRedirecting, (active, wasActive) => {
  if (!active && wasActive) navigateTo('/akun/paket', { replace: true })
})
</script>

<template>
  <main class="container-page py-8 md:py-12">
    <!-- Memuat: kerangka dua kolom, meniru bentuk akhirnya supaya tidak ada
         lompatan tata letak begitu datanya masuk. -->
    <div v-if="pending" aria-busy="true">
      <p class="sr-only" role="status">Memuat status pembayaran…</p>
      <div class="grid grid-cols-1 gap-6 min-[901px]:grid-cols-[minmax(0,1fr)_360px] min-[901px]:gap-8" aria-hidden="true">
        <div class="h-96 animate-pulse rounded-lg bg-surface-sunken" />
        <div class="h-72 animate-pulse rounded-lg bg-surface-sunken" />
      </div>
    </div>

    <AccountError v-else-if="error" class="mx-auto max-w-md" @retry="refresh">
      Status pembayaran ini belum berhasil dimuat. Periksa koneksimu, lalu coba lagi.
    </AccountError>

    <template v-else-if="purchase">
      <h1 class="text-[clamp(1.7rem,2.6vw,2.2rem)] leading-[1.14] tracking-[-0.04em]">
        Pembayaran {{ purchase.invoice }}
      </h1>
      <p v-if="showQR || showManual" class="mt-2.5 text-muted">
        Selesaikan pembayaran QRIS untuk mengaktifkan paketnya.
      </p>
      <p v-else-if="isVerifying" class="mt-2.5 text-muted">
        Bukti transfermu sudah masuk dan sedang diperiksa tim Zenko.
      </p>

      <div class="mt-8 grid grid-cols-1 items-start gap-6 min-[901px]:grid-cols-[minmax(0,1fr)_360px] min-[901px]:gap-8">
        <div>
          <!-- Sudah dibayar. -->
          <div
            v-if="isPaid"
            class="grid justify-items-center gap-4 rounded-lg border border-hairline bg-surface px-6 py-12 text-center shadow-xs"
          >
            <span class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success-ink">
              <IconCheckCircle class="h-9 w-9" />
            </span>
            <div>
              <p class="text-[1.3rem] font-bold tracking-[-0.03em]">Pembayaran berhasil</p>
              <p class="mt-2 max-w-sm text-[0.92rem] text-muted">
                Paket <span class="font-semibold text-ink">{{ packageTitle }}</span> sudah masuk ke
                akunmu dan siap dikerjakan.
              </p>
            </div>
            <DashboardBadge tone="success">{{ purchaseStatusLabel(displayStatus) }}</DashboardBadge>

            <div class="mt-2 grid w-full max-w-70 gap-3">
              <AppButton
                size="lg"
                class="w-full"
                @click="navigateTo('/akun/paket', { replace: true })"
              >
                Lihat paket saya
              </AppButton>
              <p class="text-[0.82rem] text-muted tabular-nums" role="status">
                Otomatis diarahkan dalam {{ redirectRemaining }} detik…
              </p>
            </div>
          </div>

          <!-- Kode kedaluwarsa: yang lama sudah tidak bisa dipakai, ajak beli lagi. -->
          <div
            v-else-if="isExpired"
            role="status"
            class="grid justify-items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-6 py-10 text-center"
          >
            <span class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <IconAlert class="h-5 w-5" />
            </span>
            <p class="font-bold tracking-[-0.02em] text-amber-900">Kode QRIS kedaluwarsa</p>
            <p class="max-w-sm text-[0.9rem] text-amber-800">
              Belum sempat dibayar dalam waktunya. Buat kode baru untuk lanjut.
            </p>
            <AppButton v-if="retrySlug" :to="`/checkout/${retrySlug}`" size="lg" class="mt-2 w-full max-w-70">
              Buat kode QRIS baru
            </AppButton>
          </div>

          <!-- Menunggu admin. Tidak ada hitung mundur di sini: tenggat berhenti
               berlaku begitu bukti diunggah, dan yang ditunggu adalah orang. -->
          <div
            v-else-if="isVerifying"
            role="status"
            class="grid justify-items-center gap-4 rounded-lg border border-hairline bg-surface px-6 py-12 text-center shadow-xs"
          >
            <span class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AppIcon name="hourglass-medium" :size="34" aria-hidden="true" />
            </span>
            <div>
              <p class="text-[1.3rem] font-bold tracking-[-0.03em]">Menunggu verifikasi</p>
              <p class="mt-2 max-w-md text-[0.92rem] leading-[1.6] text-muted">
                Bukti transfermu untuk <span class="font-semibold text-ink">{{ packageTitle }}</span>
                sudah kami terima. Tim Zenko memeriksanya manual, maksimal 1×24 jam.
                Kamu akan dapat email begitu selesai — halaman ini juga otomatis
                lanjut kalau kamu membiarkannya terbuka.
              </p>
            </div>
            <DashboardBadge tone="warning">{{ purchaseStatusLabel(displayStatus) }}</DashboardBadge>

            <div class="mt-2 grid w-full max-w-70 gap-3">
              <!-- outline, bukan secondary: tidak ada tindakan utama di layar
                   ini — pembeli sedang menunggu — jadi tombolnya tidak boleh
                   berat seperti ajakan. -->
              <AppButton variant="outline" size="lg" class="w-full" to="/akun/pembelian">
                Lihat riwayat pembelian
              </AppButton>
            </div>
          </div>

          <!-- QRIS statis Zenko: bayar sendiri, lalu unggah buktinya. -->
          <ManualQrisCard
            v-else-if="showManual && manualPurchase"
            :purchase="manualPurchase"
            @uploaded="refresh()"
          />

          <!-- Kode QRIS masih berlaku — halaman ini polling di latar dan lanjut
               sendiri begitu pembayaran diterima (lihat useCheckout). -->
          <div
            v-else-if="showQR"
            class="rounded-lg border border-hairline-strong bg-surface-alt p-6 shadow-xs sm:p-8"
          >
            <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <img
                v-if="qrDataUrl"
                :src="qrDataUrl"
                alt="Kode QRIS untuk membayar"
                class="h-56 w-56 shrink-0 rounded-sm bg-white p-2 object-contain shadow-xs sm:h-64 sm:w-64"
              >
              <div
                v-else
                class="grid h-56 w-56 shrink-0 place-items-center rounded-sm bg-white p-2 shadow-xs sm:h-64 sm:w-64"
                role="img"
                aria-label="Kode QRIS untuk membayar"
              >
                <IconSpinner v-if="!qrGenerationFailed" class="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                <p v-else class="px-2 text-center text-[0.82rem] text-amber-700">
                  Kode QRIS gagal dibuat. Muat ulang halaman.
                </p>
              </div>

              <div class="grid w-full gap-5 text-center sm:text-left">
                <p class="text-[0.9rem] font-semibold">Scan dari aplikasi bank atau e-wallet apa pun</p>

                <!-- Cincin countdown: lebih terlihat daripada teks polos, dan
                     berubah amber begitu waktunya tinggal sedikit. -->
                <div v-if="countdown" class="flex items-center justify-center gap-3.5 sm:justify-start">
                  <div class="relative h-19 w-19 shrink-0" role="img" :aria-label="`Kode berlaku sampai pukul ${countdown}`">
                    <svg viewBox="0 0 96 96" class="h-full w-full -rotate-90" aria-hidden="true">
                      <circle cx="48" cy="48" r="42" fill="none" stroke-width="7" class="stroke-hairline-strong" />
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        fill="none"
                        stroke-width="7"
                        stroke-linecap="round"
                        class="transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"
                        :class="ringUrgent ? 'stroke-amber-500' : 'stroke-primary'"
                        :stroke-dasharray="RING_CIRCUMFERENCE"
                        :stroke-dashoffset="ringOffset"
                      />
                    </svg>
                    <span class="absolute inset-0 grid place-items-center text-[0.86rem] font-extrabold tabular-nums tracking-[-0.02em]">
                      {{ countdown }}
                    </span>
                  </div>
                  <p class="text-[0.86rem] text-muted">
                    Kode berlaku sampai<br>
                    <span class="font-semibold tabular-nums" :class="ringUrgent ? 'text-amber-700' : 'text-ink'">{{ countdown }}</span>
                  </p>
                </div>
              </div>
            </div>

            <ol class="mt-7 grid gap-4 border-t border-hairline pt-6">
              <li v-for="(step, index) in paySteps" :key="step" class="flex items-start gap-3.5">
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[0.8rem] font-bold text-primary"
                  aria-hidden="true"
                >{{ index + 1 }}</span>
                <span class="pt-0.5 text-[0.9rem] leading-[1.55] text-muted">{{ step }}</span>
              </li>
            </ol>

            <p class="mt-6 flex items-center gap-2.5 rounded-sm border border-primary/20 bg-primary-soft/40 px-4 py-3.5 text-[0.84rem] text-ink">
              <IconSpinner class="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
              Halaman ini otomatis lanjut begitu pembayaran diterima.
            </p>

            <!-- Atribusi penyedia pembayaran ditampilkan di layar tempat uang
                 benar-benar berpindah, bukan hanya di halaman legal. -->
            <p class="mt-4 text-center text-[0.8rem] leading-[1.6] text-muted">
              Pembayaran diproses oleh <strong class="font-semibold text-ink">Duitku</strong>.
              Zenko tidak pernah meminta PIN, OTP, atau kata sandimu.
              <NuxtLink to="/kebijakan-refund" class="font-semibold text-primary hover:underline">
                Kebijakan Refund
              </NuxtLink>
            </p>
          </div>

          <!-- Pesanan pending tanpa QR (payment gateway belum dikonfigurasi di dev). -->
          <div
            v-else
            role="status"
            class="rounded-sm border border-primary/30 bg-primary-soft/50 px-4 py-3.5 text-[0.86rem] text-ink"
          >
            <p class="font-semibold">Pesanan berhasil dibuat. Menunggu pembayaran...</p>
            <p class="mt-1 text-muted">
              Pesananmu tercatat dan menunggu pembayaran. Statusnya bisa kamu
              pantau di
              <NuxtLink to="/akun/pembelian" class="font-semibold text-primary hover:underline">
                Riwayat pembelian
              </NuxtLink>.
            </p>
          </div>
        </div>

        <!-- Konteks pesanan — sebelumnya halaman ini tidak menunjukkan apa
             yang sedang dibayar sama sekali. Versi ramping dari
             checkout/OrderSummary: Purchase tidak membawa thumbnail/author
             seperti PackageDetail, jadi hanya baris yang datanya tersedia. -->
        <aside class="min-[901px]:sticky min-[901px]:top-24">
          <div class="rounded-lg border border-hairline bg-surface p-6 shadow-xs">
            <div class="flex flex-nowrap items-center justify-between gap-3">
              <h2 class="shrink-0 font-bold whitespace-nowrap tracking-[-0.02em]">Ringkasan pesanan</h2>
              <DashboardBadge
                class="shrink-0 whitespace-nowrap"
                :tone="purchaseStatusTone(displayStatus)"
              >
                {{ purchaseStatusLabel(displayStatus) }}
              </DashboardBadge>
            </div>

            <ul class="mt-5 grid gap-4 border-t border-line pt-5">
              <li v-for="item in purchase.items" :key="item.slug">
                <p class="font-semibold tracking-[-0.02em]">{{ item.title }}</p>
                <p class="mt-1 text-[0.78rem] font-bold tracking-widest text-faint uppercase">
                  {{ item.category }}
                </p>
              </li>
            </ul>

            <dl class="mt-5 grid gap-2.5 border-t border-line pt-5 text-[0.9rem]">
              <div class="flex justify-between gap-4">
                <dt class="text-muted">Subtotal</dt>
                <dd class="tabular-nums">{{ formatRupiah(invoiceTotals(purchase).subtotal) }}</dd>
              </div>
              <div v-if="invoiceTotals(purchase).discount > 0" class="flex justify-between gap-4">
                <dt class="text-muted">Diskon</dt>
                <dd class="font-semibold text-success-ink tabular-nums">
                  −{{ formatRupiah(invoiceTotals(purchase).discount) }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-muted">Biaya layanan</dt>
                <dd class="tabular-nums">{{ formatRupiah(invoiceTotals(purchase).serviceFee) }}</dd>
              </div>
              <!-- Tanpa baris ini rinciannya tidak menjumlah ke Total, dan
                   angka ganjil di bawah terbaca seperti salah hitung. -->
              <div v-if="invoiceTotals(purchase).uniqueCode > 0" class="flex justify-between gap-4">
                <dt class="text-muted">Kode unik</dt>
                <dd class="tabular-nums">{{ formatRupiah(invoiceTotals(purchase).uniqueCode) }}</dd>
              </div>
            </dl>

            <div class="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-5">
              <span class="font-semibold">Total</span>
              <span
                v-if="invoiceTotals(purchase).total > 0"
                class="text-[1.5rem] font-extrabold tracking-[-0.04em] tabular-nums"
              >
                {{ formatRupiah(invoiceTotals(purchase).total) }}
              </span>
              <DashboardBadge v-else tone="success">Gratis</DashboardBadge>
            </div>

            <p class="mt-5 flex items-start gap-2.5 border-t border-line pt-5 text-[0.82rem] text-muted">
              <IconSeal class="mt-px h-4.5 w-4.5 shrink-0" />
              Pembayaran diproses lewat penyedia pembayaran berlisensi. Zenko
              tidak menyimpan data kartu kamu.
            </p>
          </div>

          <p class="mt-4 text-center text-[0.82rem] text-muted">
            Invoice <span class="font-semibold text-ink">{{ purchase.invoice }}</span>
            · Dibuat {{ formatDateLong(purchase.date) }}
          </p>
        </aside>
      </div>
    </template>
  </main>
</template>
