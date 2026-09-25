<script setup lang="ts">
// English file name, Indonesian URL; `path` keeps circulating links alive.
definePageMeta({ path: '/checkout/:slug()' })

const route = useRoute()
const slug = route.params.slug as string

// Throws a 404 for an unknown slug, so a mistyped URL lands on the error page
// rather than on a checkout for nothing.
const detail = await usePackageDetail(slug)

onMounted(() => {
  trackMarketingEvent({ name: 'checkout_start', productId: detail.value.id, productSlug: detail.value.slug, productName: detail.value.title })
})

useHead({
  title: `Checkout ${detail.value.title} | Zenko`,
  // An order page has nothing to rank for and should never be crawled.
  meta: [{ name: 'robots', content: 'noindex' }],
})

// Not behind `middleware: 'auth'` on purpose: bouncing someone to the login
// page before they have seen what they are paying for loses more buyers than
// it saves, and the summary is public information anyway. The session is
// required at the moment it matters — the pay button — and zenko-api rejects an
// order without one regardless of what the browser allows.
const { user, isSignedIn, isLoading } = useAuth()

// Blocks a repeat purchase before the pay button rather than after the 409
// POST /orders answers with — see usePackageOwnershipGuard for why "not
// owned" (the common case, for guests and first-time buyers alike) never
// blocks the ordinary flow below.
const { owned: ownsPackage } = usePackageOwnershipGuard(slug, () => isSignedIn.value)

const { state, error, pay, reset } = useCheckout()

/* --------------------------------------------------------------------------
 * Kode voucher — preview lewat POST /vouchers/validate (tidak pernah
 * memakai kuota), diterapkan sungguhan hanya saat POST /orders dipanggil.
 * ------------------------------------------------------------------------ */

const appliedVoucher = ref<{ code: string, discountAmount: number } | null>(null)
const voucherChecking = ref(false)
const voucherError = ref('')

async function applyVoucher(code: string) {
  voucherChecking.value = true
  voucherError.value = ''
  try {
    const result = await validateVoucherCode(code, slug)
    if (!result.valid) {
      voucherError.value = result.reason || 'Kode voucher tidak bisa dipakai.'
      return
    }
    appliedVoucher.value = { code: result.code ?? code.toUpperCase(), discountAmount: result.discountAmount ?? 0 }
  }
  catch (cause) {
    voucherError.value = apiErrorStatus(cause) === 401
      ? 'Masuk dulu untuk memakai kode voucher.'
      : messageFor(cause)
  }
  finally {
    voucherChecking.value = false
  }
}

function removeVoucher() {
  appliedVoucher.value = null
  voucherError.value = ''
}

/** zenko-api renders every error as { error, requestId }; fall back for the rest. */
function messageFor(cause: unknown): string {
  const message = (cause as { data?: { error?: string } })?.data?.error
  return message || 'Kode voucher belum bisa diperiksa. Coba lagi sebentar lagi.'
}

// Which methods this deployment can actually charge, and which one the buyer
// picked. Loaded on mount rather than during SSR: it needs the session cookie,
// and a checkout page that renders without it is better than one that waits.
const methods = usePaymentMethods()
onMounted(() => {
  // A free package never reaches a payment method at all, so there is nothing
  // to ask about — see the Rp0 branch in the template.
  if (detail.value.price > 0) methods.load()
})

// The order body carries the slug and, at most, the method the buyer picked —
// the server prices the slug, the session says who is buying, and the chosen
// channel is validated against the server's own list before anything is
// charged. A real QR sends the buyer straight to /pembayaran/:invoice (see
// useCheckout); this page only ever sees 'awaiting-payment' for the no-QR
// local-dev fallback.
// finalTotal mirrors OrderSummary's own calc — needed here only to decide
// the `free` hint pay() takes, since a voucher can bring a paid package down
// to Rp0 the same way a package that was already free does.
const finalTotal = computed(() => Math.max(detail.value.price - (appliedVoucher.value?.discountAmount ?? 0), 0))

function onSubmit() {
  pay(
    {
      slug,
      ...(methods.selected.value ? { paymentChannel: methods.selected.value } : {}),
      ...(appliedVoucher.value ? { voucherCode: appliedVoucher.value.code } : {}),
    },
    finalTotal.value === 0,
  )
}

/**
 * Login in place instead of losing someone to /masuk mid-checkout — they
 * already picked this package, so signing in should drop them right back
 * into the buy button they clicked, not the top of the funnel.
 */
const showAuthModal = ref(false)

function onSignedIn() {
  onSubmit()
}
</script>

<template>
  <main class="container-page py-8 md:py-12">
    <AppBreadcrumbs
      class="mb-7"
      :items="[
        { label: 'Paket', to: '/paket' },
        { label: detail.title, to: `/paket/${detail.slug}`, truncate: true },
        { label: 'Checkout' },
      ]"
    />

    <h1 class="text-[clamp(1.7rem,2.6vw,2.2rem)] leading-[1.14] tracking-[-0.04em]">
      Selesaikan pembelian
    </h1>
    <p class="mt-2.5 text-muted">
      Bayar sekali dan nikmati akses paket latihan selamanya, tanpa biaya langganan berulang.
    </p>

    <!-- Sudah dimiliki: tidak ada yang perlu dibayar, jadi form checkout dan
         ringkasan pesanan tidak ditampilkan sama sekali — hanya satu ajakan
         yang jelas ke paket yang sudah ada di akun. -->
    <div
      v-if="ownsPackage"
      key="owned"
      class="mt-9 grid justify-items-center gap-3 rounded-lg border border-hairline bg-surface px-6 py-16 text-center shadow-xs"
    >
      <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <IconCheck class="h-6 w-6" />
      </span>
      <h2 class="text-[1.1rem] font-bold tracking-[-0.03em]">Kamu sudah punya paket ini</h2>
      <p class="max-w-md text-[0.9rem] text-muted">
        "{{ detail.title }}" sudah tercatat di akunmu. Tidak perlu membelinya
        lagi — buka kapan saja dari halaman paketmu.
      </p>
      <AppButton to="/akun/paket" size="lg" class="mt-3">Buka paket saya</AppButton>
    </div>

    <div
      v-else
      key="checkout-form"
      class="mt-9 grid grid-cols-1 items-start gap-8 min-[901px]:grid-cols-[minmax(0,1fr)_380px] min-[901px]:gap-10"
    >
      <div class="grid gap-6">
        <section class="rounded-lg border border-hairline bg-surface p-6 shadow-xs">
          <h2 class="mb-4 font-bold tracking-[-0.02em]">Data pembeli</h2>

          <p v-if="isLoading" class="text-[0.94rem] text-muted">Memeriksa sesi…</p>

          <div v-else-if="isSignedIn" class="flex items-center gap-3.5">
            <img
              v-if="user?.avatarUrl"
              :src="user.avatarUrl"
              alt=""
              referrerpolicy="no-referrer"
              class="h-11 w-11 shrink-0 rounded-full object-cover"
            >
            <span class="min-w-0">
              <span class="block truncate font-semibold">{{ user?.name }}</span>
              <span class="block truncate text-[0.9rem] text-muted">{{ user?.email }}</span>
            </span>
          </div>

          <div v-else class="rounded-sm border border-hairline-strong bg-surface-alt px-4 py-4">
            <p class="text-[0.94rem] text-muted">
              Masuk dulu supaya paket ini tercatat di akunmu dan bisa dibuka
              kapan saja.
            </p>
            <AppButton size="sm" class="mt-4" @click="showAuthModal = true">Masuk ke akun</AppButton>
          </div>
        </section>

        <section class="rounded-lg border border-hairline bg-surface p-6 shadow-xs">
          <h2 class="mb-4 font-bold tracking-[-0.02em]">Metode pembayaran</h2>
          <!-- Rp0 never reaches ChargeQRIS (see Orders.Create) — showing QRIS
               as "the" method here would promise a step that never happens.
               finalTotal, not detail.price: a voucher can bring a paid
               package down to Rp0 the same way an already-free one is. -->
          <div
            v-if="finalTotal === 0"
            class="flex items-center gap-3.5 rounded-sm border border-success bg-success-soft/40 px-4 py-3.5"
          >
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-success-ink">
              <IconCheck class="h-4.5 w-4.5" />
            </span>
            <span class="min-w-0">
              <span class="block font-semibold tracking-[-0.01em]">Gratis</span>
              <span class="mt-0.5 block text-[0.86rem] text-muted">
                Tidak ada yang perlu dibayar untuk paket ini
              </span>
            </span>
          </div>
          <!-- Satu pilihan bukanlah pilihan: kalau deployment ini hanya bisa
               menagih lewat satu jalur, tombol radio hanya menambah langkah
               tanpa menambah keputusan. -->
          <PaymentMethodPicker
            v-else-if="methods.hasChoice.value"
            v-model="methods.selected.value"
            :channels="methods.available.value"
            :upcoming="methods.upcoming.value"
          />
          <div v-else class="flex items-center gap-3.5 rounded-sm border border-primary bg-primary-soft/40 px-4 py-3.5">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-primary">
              <IconGrid class="h-4.5 w-4.5" />
            </span>
            <span class="min-w-0">
              <span class="block font-semibold tracking-[-0.01em]">QRIS</span>
              <span class="mt-0.5 block text-[0.86rem] text-muted">
                Scan dari aplikasi bank atau e-wallet apa pun
              </span>
            </span>
          </div>
        </section>
      </div>

      <aside class="min-[901px]:sticky min-[901px]:top-24">
        <OrderSummary
          :item="detail"
          :voucher-code="appliedVoucher?.code"
          :voucher-discount="appliedVoucher?.discountAmount ?? 0"
        >
          <template v-if="detail.price > 0" #voucher>
            <VoucherCodeInput
              :checking="voucherChecking"
              :applied="appliedVoucher"
              :error="voucherError"
              @apply="applyVoucher"
              @remove="removeVoucher"
            />
          </template>

          <template #action>
            <AppButton
              v-if="!isSignedIn"
              size="lg"
              class="w-full"
              @click="showAuthModal = true"
            >
              Masuk untuk melanjutkan
            </AppButton>

            <!-- No :disabled here: once clicked, state leaves 'expired' and
                 this branch stops rendering in favour of the one below,
                 which already shows "Memproses…" while submitting. -->
            <AppButton
              v-else-if="state === 'expired'"
              size="lg"
              class="w-full"
              @click="onSubmit"
            >
              Buat kode QRIS baru
            </AppButton>

            <AppButton
              v-else
              size="lg"
              class="w-full"
              :disabled="state === 'submitting'"
              @click="onSubmit"
            >
              {{ state === 'submitting' ? 'Memproses…' : 'Bayar sekarang' }}
            </AppButton>

            <!-- Kode kedaluwarsa: yang lama sudah tidak bisa dipakai, ajak
                 buat yang baru lewat tombol di atas. -->
            <div
              v-if="state === 'expired'"
              role="status"
              class="mt-4 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3.5 text-[0.86rem] text-amber-900"
            >
              <p class="font-semibold">Kode QRIS kedaluwarsa</p>
              <p class="mt-1">Belum sempat dibayar dalam waktunya. Buat kode baru untuk lanjut.</p>
            </div>

            <!-- Says what did NOT happen. A checkout that looks like it
                 succeeded while nothing was charged is worse than one that
                 plainly cannot charge yet. -->
            <div
              v-if="state === 'not-connected'"
              role="status"
              class="mt-4 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3.5 text-[0.86rem] text-amber-900"
            >
              <p class="font-semibold">Pembayaran belum aktif</p>
              <p class="mt-1">
                Payment gateway belum terhubung, jadi pesanan ini
                <strong>tidak dibuat</strong> dan kamu tidak ditagih apa pun.
              </p>
            </div>

            <!-- Order created, but the backend has no payment gateway key
                 configured (local dev) — pending with no QR to show. A real
                 QR never reaches this state on this page; it leaves for
                 /pembayaran/:invoice instead (see useCheckout). -->
            <div
              v-else-if="state === 'awaiting-payment'"
              role="status"
              class="mt-4 rounded-sm border border-primary/30 bg-primary-soft/50 px-4 py-3.5 text-[0.86rem] text-ink"
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

            <p
              v-else-if="state === 'error'"
              role="alert"
              class="mt-4 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3.5 text-[0.86rem] text-amber-900"
            >
              {{ error }}
              <button type="button" class="ml-1 font-semibold underline" @click="reset">
                Coba lagi
              </button>
            </p>
          </template>
        </OrderSummary>

        <p class="mt-4 text-center text-[0.85rem] text-muted">
          Dengan membayar, kamu menyetujui
          <NuxtLink to="/ketentuan-layanan" class="font-semibold text-primary hover:underline">
            Ketentuan Layanan
          </NuxtLink>.
        </p>
      </aside>
    </div>

    <AuthModal v-model:open="showAuthModal" @signed-in="onSignedIn" />
  </main>
</template>
