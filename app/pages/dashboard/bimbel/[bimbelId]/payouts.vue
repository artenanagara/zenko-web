<script setup lang="ts">
import type { TutorPayout } from '#shared/types/tutor-earnings'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Pencairan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const workspace = { bimbelId }
const { data: balance, pending: balancePending, error: balanceError, refresh: refreshBalance } = useTutorBalance(workspace)
const { data: bankAccount, pending: bankPending, refresh: refreshBank } = useTutorBankAccount(workspace)
const { data: payouts, pending: payoutsPending, error: payoutsError, refresh: refreshPayouts } = useTutorPayouts(workspace)
const bimbel = useBimbelDetail(bimbelId)
const modalOpen = ref(false)
const amount = ref<number | null>(null)
const submitting = ref(false)
const toast = useToast()

onMounted(() => Promise.all([refreshBalance(), refreshBank(), refreshPayouts(), bimbel.refresh()]))
const last4 = computed(() => bankAccount.value?.accountNumber.trim().slice(-4) || null)
const amountError = computed(() => {
  if (amount.value === null) return ''
  if (amount.value < PAYOUT_MINIMUM) return `Minimum pencairan ${formatRupiah(PAYOUT_MINIMUM)}.`
  if (amount.value > balance.value.available) return `Melebihi saldo tersedia (${formatRupiah(balance.value.available)}).`
  return ''
})
const canSubmit = computed(() => Boolean(bankAccount.value && amount.value !== null && !amountError.value && !submitting.value))
const columns = [
  { key: 'requestedAt', label: 'Diajukan' }, { key: 'amount', label: 'Nominal' },
  { key: 'status', label: 'Status' }, { key: 'keterangan', label: 'Keterangan' },
]
function statusTone(status: TutorPayout['status']) { return PAYOUT_STATUS_TONE[status] }
function statusLabel(status: TutorPayout['status']) { return PAYOUT_STATUS_LABEL[status] }

async function submit() {
  if (!canSubmit.value || amount.value === null) return
  submitting.value = true
  try {
    await requestTutorPayout(amount.value, workspace)
    modalOpen.value = false
    amount.value = null
    await Promise.all([refreshBalance(), refreshPayouts()])
    toast.success('Pengajuan pencairan terkirim.', 'Tim kami memprosesnya dalam 1 sampai 3 hari kerja.')
  }
  catch (cause) { toast.error('Pencairan belum berhasil diajukan.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.')) }
  finally { submitting.value = false }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Pencairan" description="Pantau saldo dan riwayat pencairan dana bimbel." />
    <AppInlineMessage v-if="balanceError" type="error">{{ balanceError }}</AppInlineMessage>
    <DashboardSkeleton v-if="balancePending" variant="stats" :count="3" :columns="3" label="Memuat saldo…" />
    <template v-else>
      <DashboardStats :items="[
        { label: 'Saldo tersedia', value: formatRupiah(balance.available) },
        { label: 'Saldo tertahan', value: formatRupiah(balance.held) },
        { label: 'Total dicairkan', value: formatRupiah(balance.totalPaidOut) },
      ]" :columns="3" />
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface p-5 shadow-xs">
        <div><p class="font-semibold text-ink">{{ bimbel.data.value?.name || 'Bimbel' }}</p><p class="mt-1 text-sm text-muted">{{ bankAccount ? `${bankAccount.bankLabel} •••• ${last4}` : 'Belum ada rekening bank' }}</p></div>
        <AppButton @click="modalOpen = true"><IconWallet class="mr-2 h-4 w-4" />Tarik saldo</AppButton>
      </div>
      <p v-if="!bankPending" class="text-sm text-muted">
        Rekening tujuan dikelola di <NuxtLink :to="`/dashboard/bimbel/${bimbelId}/settings#rekening`" class="font-semibold text-primary hover:underline">Pengaturan</NuxtLink>.
      </p>
    </template>
    <PayoutModal
      v-model:open="modalOpen" v-model:amount="amount" :has-bank-account="bankAccount !== null"
      :available-balance="balance.available" :minimum="PAYOUT_MINIMUM" :amount-error="amountError"
      :submitting="submitting" :can-submit="canSubmit" :settings-path="`/dashboard/bimbel/${bimbelId}/settings#rekening`"
      @submit="submit"
    />
    <DashboardPanel title="Riwayat pencairan" description="Daftar seluruh pengajuan pencairan dana bimbel.">
      <DashboardSkeleton v-if="payoutsPending" :count="4" label="Memuat riwayat pencairan…" />
      <div v-else-if="payoutsError" class="py-6 text-center"><AppInlineMessage type="error">{{ payoutsError }}</AppInlineMessage><button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="refreshPayouts">Coba lagi</button></div>
      <AppEmptyState v-else-if="payouts.length === 0" title="Belum ada pencairan" :description="`Pencairan dapat diajukan setelah saldo tersedia mencapai ${formatRupiah(PAYOUT_MINIMUM)}.`" />
      <DashboardTable v-else :columns="columns" :data="payouts" primary-key="requestedAt">
        <template #cell(requestedAt)="{ value }"><span class="whitespace-nowrap">{{ formatDate(value) }}</span></template>
        <template #cell(amount)="{ value }"><span class="font-semibold tabular-nums">{{ formatRupiah(value) }}</span></template>
        <template #cell(status)="{ item }"><DashboardBadge :tone="statusTone(item.status)">{{ statusLabel(item.status) }}</DashboardBadge></template>
        <template #cell(keterangan)="{ item }"><template v-if="item.status === 'rejected' && item.rejectReason">{{ item.rejectReason }}</template><template v-else-if="item.processedAt">Selesai diproses pada {{ formatDate(item.processedAt) }}</template><template v-else>Menunggu proses</template></template>
      </DashboardTable>
    </DashboardPanel>
  </div>
</template>
