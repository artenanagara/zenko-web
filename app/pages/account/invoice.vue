<script setup lang="ts">
definePageMeta({
  path: '/akun/pembelian/:invoice()',
  layout: 'account',
  middleware: 'auth',
})

const route = useRoute()
const { data: purchase, pending, error, refresh } = usePurchase(route.params.invoice as string)

const { user } = useAuth()

// Keep the invoice as the durable entry point from purchase history. A pending
// QRIS invoice may resume its existing payment session, but never creates a
// second order. Once the QR deadline passes, the action disappears locally
// even if the expiry webhook has not refreshed the invoice status yet.
const currentTime = ref(Date.now())
const canResumePayment = computed(() => {
  const value = purchase.value
  if (!value || value.status !== 'pending' || !value.qrUrl) return false
  return value.expiresAt === null || value.expiresAt * 1000 > currentTime.value
})

let expiryHandle: ReturnType<typeof setTimeout> | null = null

function scheduleResumeExpiry() {
  if (expiryHandle !== null) {
    clearTimeout(expiryHandle)
    expiryHandle = null
  }

  currentTime.value = Date.now()
  const expiresAt = purchase.value?.expiresAt
  if (!expiresAt || !canResumePayment.value) return

  const msLeft = expiresAt * 1000 - currentTime.value
  expiryHandle = setTimeout(() => {
    currentTime.value = Date.now()
    expiryHandle = null
  }, msLeft)
}

watch(purchase, () => {
  if (import.meta.client) scheduleResumeExpiry()
}, { immediate: true })

onBeforeUnmount(() => {
  if (expiryHandle !== null) clearTimeout(expiryHandle)
})

useHead({
  title: computed(() => (purchase.value ? `Invoice ${purchase.value.invoice} — Zenko` : 'Invoice — Zenko')),
  meta: [{ name: 'robots', content: 'noindex' }],
})

/**
 * Print via the browser, not a hand-rolled PDF: every mainstream print
 * dialog already offers "Save as PDF" using this page's layout. Generating
 * our own would add a heavy library for a one-page document.
 */
function print() {
  window.print()
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Memuat: kerangka satu dokumen. -->
    <div v-if="pending" aria-busy="true">
      <p class="sr-only" role="status">Memuat invoice…</p>
      <div class="h-96 animate-pulse rounded-lg bg-surface-sunken" aria-hidden="true" />
    </div>

    <AccountError v-else-if="error" @retry="refresh">
      Invoice ini belum berhasil dimuat. Periksa koneksimu, lalu coba lagi.
    </AccountError>

    <template v-else-if="purchase">
      <AppBreadcrumbs
        class="print:hidden"
        :items="[
          { label: 'Riwayat pembelian', to: '/akun/pembelian' },
          { label: purchase.invoice },
        ]"
      />

      <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">Invoice {{ purchase.invoice }}</h1>
          <p class="mt-1.5 text-muted">Bukti pembelian yang bisa kamu simpan atau cetak.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2.5">
          <AppButton
            v-if="canResumePayment"
            :to="`/pembayaran/${purchase.invoice}`"
            size="sm"
          >
            Lanjutkan pembayaran
          </AppButton>
          <AppButton variant="outline" size="sm" @click="print">Cetak / simpan PDF</AppButton>
        </div>
      </div>

      <!-- The document itself. On paper, the frame and shadow are just ink. -->
      <article class="rounded-lg border border-hairline bg-surface shadow-xs print:rounded-none print:border-0 print:shadow-none">
        <header class="flex flex-wrap items-start justify-between gap-5 border-b border-hairline px-5 py-6 md:px-8">
          <div>
            <BrandMark to="/" img-class="h-10 w-auto object-contain" aria-label="Zenko" />
            <p class="mt-3 text-[0.82rem] leading-[1.6] text-muted">
              Marketplace try out<br>
              Jakarta, Indonesia<br>
              bantuan@zenko.id
            </p>
          </div>

          <div class="text-left sm:text-right">
            <p class="text-[0.72rem] font-bold tracking-[0.16em] text-faint uppercase">Invoice</p>
            <p class="mt-1 text-[1.15rem] font-extrabold tracking-[-0.03em] tabular-nums">{{ purchase.invoice }}</p>
            <p class="mt-2 text-[0.86rem] text-muted">Diterbitkan {{ formatDateLong(purchase.date) }}</p>
            <p class="mt-2.5">
              <DashboardBadge :tone="purchaseStatusTone(purchase.status)">
                {{ purchaseStatusLabel(purchase.status) }}
              </DashboardBadge>
            </p>
          </div>
        </header>

        <div class="grid gap-6 border-b border-hairline px-5 py-6 sm:grid-cols-2 md:px-8">
          <div>
            <h2 class="text-[0.72rem] font-bold tracking-[0.16em] text-faint uppercase">Ditagihkan kepada</h2>
            <p class="mt-2 font-semibold tracking-[-0.02em]">{{ user?.name ?? '—' }}</p>
            <p class="mt-0.5 text-[0.9rem] text-muted">{{ user?.email ?? '' }}</p>
          </div>

          <div class="sm:text-right">
            <h2 class="text-[0.72rem] font-bold tracking-[0.16em] text-faint uppercase">Pembayaran</h2>
            <dl class="mt-2 grid gap-1 text-[0.9rem]">
              <div class="flex justify-between gap-4 sm:justify-end sm:gap-3">
                <dt class="text-muted">Metode</dt>
                <dd class="font-semibold">{{ purchaseMethodLabel(purchase) }}</dd>
              </div>
              <div v-if="purchase.reference" class="flex justify-between gap-4 sm:justify-end sm:gap-3">
                <dt class="text-muted">Nomor rujukan</dt>
                <dd class="font-semibold tabular-nums">{{ purchase.reference }}</dd>
              </div>
              <div class="flex justify-between gap-4 sm:justify-end sm:gap-3">
                <dt class="text-muted">Dibayar</dt>
                <dd class="font-semibold">
                  {{ purchase.paidAt === null ? 'Belum dibayar' : formatDateTime(purchase.paidAt) }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="px-5 py-6 md:px-8">
          <div class="overflow-x-auto">
            <table class="w-full min-w-140 border-collapse text-left">
              <thead>
                <tr class="text-[0.72rem] tracking-[0.14em] text-faint uppercase">
                  <th class="pb-3 font-bold">Paket</th>
                  <th class="pb-3 font-bold">Kategori</th>
                  <th class="pb-3 text-right font-bold">Harga normal</th>
                  <th class="pb-3 text-right font-bold">Diskon</th>
                  <th class="pb-3 text-right font-bold">Harga</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in purchase.items" :key="line.slug" class="border-t border-hairline">
                  <td class="py-3.5 pr-4 font-semibold tracking-[-0.02em]">
                    <NuxtLink :to="`/paket/${line.slug}`" class="transition-colors hover:text-primary">
                      {{ line.title }}
                    </NuxtLink>
                  </td>
                  <td class="py-3.5 pr-4 text-[0.9rem] text-muted">{{ line.category }}</td>
                  <td class="py-3.5 pr-4 text-right text-[0.9rem] text-muted tabular-nums">
                    {{ formatRupiah(line.priceOriginal) }}
                  </td>
                  <td class="py-3.5 pr-4 text-right text-[0.9rem] tabular-nums">
                    <span v-if="line.priceOriginal > line.price" class="font-semibold text-success-ink">
                      −{{ formatRupiah(line.priceOriginal - line.price) }}
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="py-3.5 text-right font-bold tabular-nums">{{ formatRupiah(line.price) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Totals are computed from the rows above, so they cannot disagree. -->
          <dl class="mt-6 ml-auto grid max-w-80 gap-2.5 text-[0.94rem]">
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Subtotal</dt>
              <dd class="tabular-nums">{{ formatRupiah(invoiceTotals(purchase).subtotal) }}</dd>
            </div>
            <div v-if="invoiceTotals(purchase).discount > 0" class="flex justify-between gap-4">
              <dt class="text-muted">Diskon</dt>
              <dd class="font-semibold text-success-ink tabular-nums">−{{ formatRupiah(invoiceTotals(purchase).discount) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Biaya layanan</dt>
              <dd class="tabular-nums">{{ formatRupiah(invoiceTotals(purchase).serviceFee) }}</dd>
            </div>
            <div class="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <dt class="font-semibold">Total</dt>
              <dd v-if="invoiceTotals(purchase).total > 0" class="text-[1.5rem] font-extrabold tracking-[-0.04em] tabular-nums">
                {{ formatRupiah(invoiceTotals(purchase).total) }}
              </dd>
              <dd v-else>
                <DashboardBadge tone="success">Gratis</DashboardBadge>
              </dd>
            </div>
          </dl>
        </div>

        <footer class="border-t border-hairline px-5 py-5 text-[0.82rem] leading-[1.7] text-muted md:px-8">
          <p v-if="purchase.status === 'expired'" class="mb-3 font-semibold text-ink">
            Invoice ini kedaluwarsa sebelum dibayar, jadi paketnya tidak masuk ke akunmu.
          </p>
          <p>
            Dokumen ini dibuat otomatis dan sah tanpa tanda tangan. Pembayaran
            diproses oleh penyedia pembayaran berlisensi; Zenko tidak menyimpan
            data kartu kamu. Ada yang tidak cocok? Hubungi bantuan@zenko.id dengan
            menyebut nomor invoice di atas.
          </p>
        </footer>
      </article>

      <p class="print:hidden">
        <NuxtLink to="/akun/pembelian" class="text-[0.88rem] font-semibold text-primary transition-colors hover:text-primary-light">
          <IconArrowLeft class="inline-block h-3.5 w-3.5 -mt-0.5" /> Kembali ke riwayat pembelian
        </NuxtLink>
      </p>
    </template>
  </div>
</template>
