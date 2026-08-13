<script setup lang="ts">
import type { PaymentMethodId } from '#shared/types/order'

// English file name, Indonesian URL; `path` keeps circulating links alive.
definePageMeta({ path: '/checkout/:slug()' })

const route = useRoute()
const slug = route.params.slug as string

// Throws a 404 for an unknown slug, so a mistyped URL lands on the error page
// rather than on a checkout for nothing.
const detail = await usePackageDetail(slug)

useHead({
  title: `Checkout ${detail.value.title} — Zenko`,
  // An order page has nothing to rank for and should never be crawled.
  meta: [{ name: 'robots', content: 'noindex' }],
})

// Not behind `middleware: 'auth'` on purpose: bouncing someone to the login
// page before they have seen what they are paying for loses more buyers than
// it saves, and the summary is public information anyway. The session is
// required at the moment it matters — the pay button — and zenko-api rejects an
// order without one regardless of what the browser allows.
const { user, isSignedIn, isLoading } = useAuth()

const paymentMethod = ref<PaymentMethodId>('va')
const { state, error, pay, reset } = useCheckout()

const signInPath = computed(() => ({ path: '/masuk', query: { lanjut: route.fullPath } }))

// The order body carries only the slug — the server prices it and the session
// says who is buying. The method picker below stays informational until a
// gateway that needs the choice is wired in.
function onSubmit() {
  pay({ slug })
}
</script>

<template>
  <main class="container-page py-8 md:py-12">
    <nav class="mb-7 flex flex-wrap items-center gap-2 text-[0.85rem] text-muted" aria-label="Breadcrumb">
      <NuxtLink to="/paket" class="transition-colors hover:text-ink">Paket</NuxtLink>
      <span aria-hidden="true">/</span>
      <NuxtLink :to="`/paket/${detail.slug}`" class="max-w-70 truncate transition-colors hover:text-ink">
        {{ detail.title }}
      </NuxtLink>
      <span aria-hidden="true">/</span>
      <span class="text-ink">Checkout</span>
    </nav>

    <h1 class="text-[clamp(1.7rem,2.6vw,2.2rem)] leading-[1.14] tracking-[-0.04em]">
      Selesaikan pembelian
    </h1>
    <p class="mt-2.5 text-muted">
      Bayar sekali, akses paketnya selamanya. Tanpa langganan.
    </p>

    <div class="mt-9 grid grid-cols-1 items-start gap-8 min-[901px]:grid-cols-[minmax(0,1fr)_380px] min-[901px]:gap-10">
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
            <AppButton :to="signInPath.path" size="sm" class="mt-4">Masuk ke akun</AppButton>
          </div>
        </section>

        <section class="rounded-lg border border-hairline bg-surface p-6 shadow-xs">
          <PaymentMethodPicker v-model="paymentMethod" />
        </section>
      </div>

      <aside class="min-[901px]:sticky min-[901px]:top-24">
        <OrderSummary :item="detail">
          <template #action>
            <AppButton
              v-if="isSignedIn"
              size="lg"
              class="w-full"
              :disabled="state === 'submitting'"
              @click="onSubmit"
            >
              {{ state === 'submitting' ? 'Memproses…' : 'Bayar sekarang' }}
            </AppButton>

            <AppButton v-else :to="signInPath.path" size="lg" class="w-full">
              Masuk untuk melanjutkan
            </AppButton>

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

            <!-- Order created, payment gateway not yet wired: the purchase is
                 pending, waiting to be settled. -->
            <div
              v-else-if="state === 'awaiting-payment'"
              role="status"
              class="mt-4 rounded-sm border border-primary/30 bg-primary-soft/50 px-4 py-3.5 text-[0.86rem] text-ink"
            >
              <p class="font-semibold">Pesanan dibuat — menunggu pembayaran</p>
              <p class="mt-1 text-muted">
                Pesananmu tercatat dan menunggu pembayaran. Penyedia pembayaran
                akan segera tersedia; statusnya bisa kamu pantau di
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
  </main>
</template>
