<script setup lang="ts">
// English file name, Indonesian URL; `path` keeps a bookmarked/shared QR link
// alive after the buyer navigates away and comes back.
definePageMeta({ path: '/pembayaran/:invoice()', middleware: 'auth' })

const route = useRoute()
const invoice = route.params.invoice as string

// Same fetch pattern as account/invoice.vue: client-only (the session cookie
// belongs to zenko-api's origin, not Nuxt's), 404 hands off to the error page.
const { data: purchase, pending, error, refresh } = usePurchase(invoice)

const { state: pollState, resumeWaiting } = useCheckout()

useHead({
  title: `Pembayaran ${invoice} — Zenko`,
  meta: [{ name: 'robots', content: 'noindex' }],
})

// Whichever way this page was reached — redirected straight from checkout, or
// opened again later from a bookmark or "Riwayat pembelian" — a still-pending
// order picks polling back up from here instead of only right after the
// order was created.
watch(purchase, (value) => {
  if (value?.status === 'pending') resumeWaiting(value)
}, { immediate: true })

// `pollState` only turns 'expired' via the client-side timer; the invoice can
// just as well already be expired straight from the initial fetch.
const isExpired = computed(() => pollState.value === 'expired' || purchase.value?.status === 'expired')
const isPaid = computed(() => purchase.value?.status === 'paid')
const showQR = computed(() => !isExpired.value && !isPaid.value && Boolean(purchase.value?.qrUrl))

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

const countdown = computed(() => {
  const expiresAt = purchase.value?.expiresAt
  if (!expiresAt) return null

  const totalSeconds = Math.max(0, Math.floor(expiresAt - now.value / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

/** Best-effort link back to buy again — a purchase carries one package in practice. */
const retrySlug = computed(() => purchase.value?.items[0]?.slug ?? null)
</script>

<template>
  <main class="container-page py-8 md:py-12">
    <nav class="mb-7 flex flex-wrap items-center gap-2 text-[0.85rem] text-muted" aria-label="Breadcrumb">
      <NuxtLink to="/akun/pembelian" class="transition-colors hover:text-ink">Riwayat pembelian</NuxtLink>
      <span aria-hidden="true">/</span>
      <span class="text-ink">Pembayaran</span>
    </nav>

    <!-- Memuat: kerangka satu kartu. -->
    <div v-if="pending" aria-busy="true" class="mx-auto max-w-md">
      <p class="sr-only" role="status">Memuat status pembayaran…</p>
      <div class="h-72 animate-pulse rounded-lg bg-surface-sunken" aria-hidden="true" />
    </div>

    <AccountError v-else-if="error" class="mx-auto max-w-md" @retry="refresh">
      Status pembayaran ini belum berhasil dimuat. Periksa koneksimu, lalu coba lagi.
    </AccountError>

    <template v-else-if="purchase">
      <h1 class="text-[clamp(1.7rem,2.6vw,2.2rem)] leading-[1.14] tracking-[-0.04em]">
        Pembayaran {{ purchase.invoice }}
      </h1>

      <div class="mt-8 max-w-md">
        <!-- Sudah dibayar. -->
        <div
          v-if="isPaid"
          class="grid justify-items-center gap-3 rounded-lg border border-hairline bg-surface px-6 py-10 text-center shadow-xs"
        >
          <span class="inline-flex h-13 w-13 items-center justify-center rounded-full bg-success-soft text-success-ink">
            <IconCheck class="h-6.5 w-6.5" />
          </span>
          <p class="text-[1.1rem] font-bold tracking-[-0.02em]">Pembayaran diterima</p>
          <DashboardBadge tone="success">{{ purchaseStatusLabel(purchase.status) }}</DashboardBadge>
          <p class="max-w-sm text-[0.9rem] text-muted">
            Paketnya sudah masuk ke akunmu dan siap dikerjakan.
          </p>
          <AppButton to="/akun/paket" size="lg" class="mt-2 w-full">Lihat paketku</AppButton>
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
          <AppButton v-if="retrySlug" :to="`/checkout/${retrySlug}`" size="lg" class="mt-2 w-full">
            Buat kode QRIS baru
          </AppButton>
        </div>

        <!-- Kode QRIS masih berlaku — halaman ini polling di latar dan lanjut
             sendiri begitu pembayaran diterima (lihat useCheckout). -->
        <div
          v-else-if="showQR"
          class="flex flex-col items-center gap-3 rounded-lg border border-hairline-strong bg-surface-alt px-5 py-8 text-center shadow-xs"
        >
          <img
            :src="purchase.qrUrl!"
            alt="Kode QRIS untuk membayar"
            class="h-52 w-52 rounded-sm bg-white p-2"
          >
          <p class="text-[0.9rem] font-semibold">Scan dari aplikasi bank atau e-wallet apa pun</p>
          <p v-if="countdown" class="text-[0.86rem] text-muted">
            Kode berlaku sampai <span class="font-semibold tabular-nums text-ink">{{ countdown }}</span>
          </p>
          <p class="mt-1 text-[0.82rem] text-muted">
            Halaman ini otomatis lanjut begitu pembayaran diterima.
          </p>
        </div>

        <!-- Pesanan pending tanpa QR (Midtrans belum dikonfigurasi di dev). -->
        <div
          v-else
          role="status"
          class="rounded-sm border border-primary/30 bg-primary-soft/50 px-4 py-3.5 text-[0.86rem] text-ink"
        >
          <p class="font-semibold">Pesanan dibuat — menunggu pembayaran</p>
          <p class="mt-1 text-muted">
            Pesananmu tercatat dan menunggu pembayaran. Statusnya bisa kamu
            pantau di
            <NuxtLink to="/akun/pembelian" class="font-semibold text-primary hover:underline">
              Riwayat pembelian
            </NuxtLink>.
          </p>
        </div>
      </div>
    </template>
  </main>
</template>
