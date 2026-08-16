<script setup lang="ts">
import type { Purchase } from '#shared/types/account'

definePageMeta({
  path: '/akun/pembelian',
  layout: 'account',
  middleware: 'auth',
})

useHead({
  title: 'Riwayat pembelian — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { data: items, pending, error, refresh } = usePurchases()

/** An invoice can hold several packages; the column stays a single line. */
function itemsLabel(purchase: Purchase) {
  const [first, ...rest] = purchase.items
  if (!first) return '—'
  return rest.length === 0 ? first.title : `${first.title} +${rest.length} paket lain`
}

const totalSpent = computed(() =>
  items.value
    .filter(purchase => purchase.status === 'paid')
    .reduce((sum, purchase) => sum + invoiceTotals(purchase).total, 0),
)
</script>

<template>
  <div class="grid gap-6">
    <header>
      <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">Riwayat pembelian</h1>
      <p class="mt-1.5 text-muted">Semua transaksi paket dari akun ini, lengkap dengan invoicenya.</p>
    </header>

    <AccountNotice>
      Transaksi di bawah masih contoh. Pembayaran belum tersambung, jadi
      zenko-api belum menyimpan riwayat pembelian.
    </AccountNotice>

    <!-- Memuat: kerangka tabel, bukan halaman kosong. -->
    <div v-if="pending" class="grid gap-6" aria-busy="true">
      <p class="sr-only" role="status">Memuat transaksi…</p>
      <div class="grid gap-2" aria-hidden="true">
        <div v-for="n in 4" :key="n" class="h-12 animate-pulse rounded-sm bg-surface-sunken" />
      </div>
    </div>

    <AccountError v-else-if="error" @retry="refresh">
      Riwayat pembelian belum berhasil dimuat. Periksa koneksimu, lalu coba lagi.
    </AccountError>

    <DashboardPanel v-else title="Transaksi" description="Terbaru di atas.">
      <template #action>
        <span class="text-[0.86rem] text-muted">
          Total belanja
          <span class="ml-1.5 font-bold text-ink tabular-nums">{{ formatRupiah(totalSpent) }}</span>
        </span>
      </template>

      <div v-if="items.length" class="overflow-x-auto">
        <table class="w-full min-w-180 border-collapse text-left">
          <thead>
            <tr class="border-b border-hairline text-[0.74rem] tracking-widest text-muted uppercase">
              <th class="pb-3 font-bold">Invoice</th>
              <th class="pb-3 font-bold">Tanggal</th>
              <th class="pb-3 font-bold">Paket</th>
              <th class="pb-3 font-bold">Metode</th>
              <th class="pb-3 font-bold">Total</th>
              <th class="pb-3 font-bold">Status</th>
              <th class="pb-3 font-bold"><span class="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="purchase in items"
              :key="purchase.invoice"
              class="border-t border-hairline transition-colors hover:bg-surface-alt/60"
            >
              <td class="py-3.5 pr-4 text-[0.86rem] font-semibold tabular-nums">{{ purchase.invoice }}</td>
              <td class="py-3.5 pr-4 text-[0.9rem] text-muted">{{ formatDate(purchase.date) }}</td>
              <td class="py-3.5 pr-4 font-semibold tracking-[-0.02em]">{{ itemsLabel(purchase) }}</td>
              <td class="py-3.5 pr-4 text-[0.9rem] text-muted">{{ purchase.method }}</td>
              <td class="py-3.5 pr-4 font-bold tabular-nums">
                {{ formatRupiah(invoiceTotals(purchase).total) }}
              </td>
              <td class="py-3.5 pr-4">
                <DashboardBadge :tone="purchaseStatusTone(purchase.status)">
                  {{ purchaseStatusLabel(purchase.status) }}
                </DashboardBadge>
              </td>
              <td class="py-3.5 text-right">
                <NuxtLink
                  :to="`/akun/pembelian/${purchase.invoice}`"
                  class="text-[0.88rem] font-semibold whitespace-nowrap text-primary transition-colors hover:text-primary-light"
                >
                  Lihat invoice
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="text-[0.9rem] text-muted">
        Belum ada transaksi. Paket yang kamu beli akan tercatat di sini.
      </p>
    </DashboardPanel>
  </div>
</template>
