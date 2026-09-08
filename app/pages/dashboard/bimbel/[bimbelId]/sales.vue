<script setup lang="ts">
import type { BankAccountInput, TutorPayout } from '#shared/types/tutor-earnings'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Penjualan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const workspace = { bimbelId }

const sales = useTutorSales(workspace)
const balance = useTutorBalance(workspace)
const bank = useTutorBankAccount(workspace)
const payouts = useTutorPayouts(workspace)
const toast = useToast()

const savingBank = ref(false)
const payingOut = ref(false)
const amount = ref(PAYOUT_MINIMUM)
const account = reactive<BankAccountInput>({ bankCode: 'bca', bankLabel: 'BCA', accountNumber: '', holderName: '' })

function load() {
  return Promise.all([sales.refresh(), balance.refresh(), bank.refresh(), payouts.refresh()])
}
onMounted(load)

watch(() => account.bankCode, (code) => {
  account.bankLabel = BANK_OPTIONS.find(item => item.code === code)?.label ?? code
})

const stats = computed(() => [
  { label: 'Produk terjual', value: String(sales.summary.value.count) },
  { label: 'Saldo tersedia', value: formatRupiah(balance.data.value.available) },
  { label: 'Saldo tertahan', value: formatRupiah(balance.data.value.held) },
])

const salesColumns = [
  { key: 'paidAt', label: 'Tanggal', hideOnMobile: true },
  { key: 'productTitle', label: 'Produk' },
  { key: 'buyerName', label: 'Pembeli' },
  { key: 'price', label: 'Harga', align: 'right' as const },
  { key: 'share', label: 'Bagi hasil', align: 'right' as const },
]

const lastPayout = computed<TutorPayout | undefined>(() => payouts.data.value[0])

async function saveBank() {
  savingBank.value = true
  try {
    await saveTutorBankAccount(account, workspace)
    await bank.refresh()
    toast.success('Rekening disimpan.', 'Admin Zenko akan memverifikasi rekening sebelum pencairan.')
  }
  catch (cause) {
    toast.error('Rekening belum bisa disimpan.', tutorApiMessage(cause, 'Coba lagi.'))
  }
  finally {
    savingBank.value = false
  }
}

async function payout() {
  payingOut.value = true
  try {
    await requestTutorPayout(amount.value, workspace)
    await Promise.all([balance.refresh(), payouts.refresh()])
    toast.success('Pencairan diajukan.')
  }
  catch (cause) {
    toast.error('Pencairan belum bisa diajukan.', tutorApiMessage(cause, 'Pastikan saldo dan rekening sudah memenuhi syarat.'))
  }
  finally {
    payingOut.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Penjualan marketplace"
      description="Pantau penjualan paket publik, saldo bagi hasil, rekening, dan pencairan milik owner bimbel."
    />

    <DashboardSkeleton
      v-if="sales.pending.value || balance.pending.value"
      variant="stats"
      :count="3"
      :columns="3"
      label="Memuat ringkasan penjualan…"
    />

    <div
      v-else-if="sales.error.value || balance.error.value"
      class="rounded-md border border-line bg-surface px-5 py-6 text-center shadow-xs"
    >
      <AppInlineMessage type="error">{{ sales.error.value || balance.error.value }}</AppInlineMessage>
      <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">
        Coba lagi
      </button>
    </div>

    <DashboardStats v-else :items="stats" :columns="3" />

    <DashboardPanel title="Riwayat penjualan">
      <DashboardSkeleton v-if="sales.pending.value" :count="4" label="Memuat penjualan…" />

      <div v-else-if="sales.error.value" class="py-8 text-center">
        <AppInlineMessage type="error">{{ sales.error.value }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="sales.refresh()">
          Coba lagi
        </button>
      </div>

      <DashboardTable
        v-else-if="sales.sales.value.length"
        :columns="salesColumns"
        :data="sales.sales.value"
        primary-key="productTitle"
      >
        <template #cell(paidAt)="{ value }">
          <span class="whitespace-nowrap">{{ formatDate(value) }}</span>
        </template>
        <template #cell(productTitle)="{ item }">
          <span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.productTitle }}</span>
          <span class="block text-[0.82rem] text-muted">{{ formatDate(item.paidAt) }} · {{ item.invoice }}</span>
        </template>
        <template #cell(price)="{ value }">
          <span class="tabular-nums">{{ formatRupiah(value) }}</span>
        </template>
        <template #cell(share)="{ value }">
          <span class="font-semibold tabular-nums">{{ formatRupiah(value) }}</span>
        </template>
      </DashboardTable>

      <AppEmptyState
        v-else
        title="Belum ada penjualan"
        description="Paket bimbel yang lolos moderasi dan dibeli siswa akan tercatat di sini."
        action-label="Buka bank soal"
        @action="navigateTo(`/dashboard/bimbel/${bimbelId}/products`)"
      />
    </DashboardPanel>

    <div class="grid gap-6 lg:grid-cols-2">
      <DashboardPanel title="Rekening pencairan">
        <DashboardSkeleton v-if="bank.pending.value" :count="3" label="Memuat rekening…" />

        <div v-else-if="bank.data.value" class="rounded-md bg-surface-alt p-4">
          <strong>{{ bank.data.value.bankLabel }}</strong>
          <p class="mt-1 text-sm">{{ bank.data.value.accountNumber }} · {{ bank.data.value.holderName }}</p>
          <DashboardBadge class="mt-3" :tone="bank.data.value.verifiedAt ? 'success' : 'warning'">
            {{ bank.data.value.verifiedAt ? 'Terverifikasi' : 'Menunggu verifikasi' }}
          </DashboardBadge>
        </div>

        <form v-else class="grid gap-3" @submit.prevent="saveBank">
          <AppSelect
            v-model="account.bankCode"
            label="Bank"
            :options="BANK_OPTIONS.map(item => ({ value: item.code, label: item.label }))"
          />
          <AppInput v-model="account.accountNumber" label="Nomor rekening" required />
          <AppInput v-model="account.holderName" label="Nama pemilik rekening" required />
          <AppButton type="submit" :disabled="savingBank">
            {{ savingBank ? 'Menyimpan…' : 'Simpan rekening' }}
          </AppButton>
        </form>
      </DashboardPanel>

      <DashboardPanel title="Ajukan pencairan" description="Minimum pencairan Rp100.000 dan hanya menggunakan saldo tersedia.">
        <form class="grid gap-3" @submit.prevent="payout">
          <AppInput v-model.number="amount" type="number" :min="PAYOUT_MINIMUM" label="Jumlah pencairan" />
          <AppButton
            type="submit"
            :disabled="payingOut || !bank.data.value || balance.data.value.available < amount"
          >
            {{ payingOut ? 'Mengajukan…' : 'Ajukan pencairan' }}
          </AppButton>
        </form>

        <AppInlineMessage v-if="payouts.error.value" class="mt-5" type="error">
          {{ payouts.error.value }}
        </AppInlineMessage>

        <div v-else-if="lastPayout" class="mt-5 border-t border-hairline pt-4">
          <p class="text-xs font-bold text-muted uppercase">Pengajuan terakhir</p>
          <p class="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span class="font-semibold tabular-nums">{{ formatRupiah(lastPayout.amount) }}</span>
            <DashboardBadge :tone="PAYOUT_STATUS_TONE[lastPayout.status]">
              {{ PAYOUT_STATUS_LABEL[lastPayout.status] }}
            </DashboardBadge>
          </p>
        </div>
      </DashboardPanel>
    </div>
  </div>
</template>
