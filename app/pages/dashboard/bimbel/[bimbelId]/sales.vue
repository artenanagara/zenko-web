<script setup lang="ts">
import type { BankAccountInput } from '#shared/types/tutor-earnings'
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
const amount = ref(100_000)
const account = reactive<BankAccountInput>({ bankCode: 'bca', bankLabel: 'BCA', accountNumber: '', holderName: '' })
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
const formatDate = (value: number) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(value * 1000)
onMounted(() => Promise.all([sales.refresh(), balance.refresh(), bank.refresh(), payouts.refresh()]))
watch(() => account.bankCode, (code) => { account.bankLabel = BANK_OPTIONS.find(item => item.code === code)?.label ?? code })
async function saveBank() { savingBank.value = true; try { await saveTutorBankAccount(account, workspace); await bank.refresh(); toast.success('Rekening disimpan.', 'Admin Zenko akan memverifikasi rekening sebelum pencairan.') } catch (cause) { toast.error('Rekening belum bisa disimpan.', tutorApiMessage(cause, 'Coba lagi.')) } finally { savingBank.value = false } }
async function payout() { payingOut.value = true; try { await requestTutorPayout(amount.value, workspace); await Promise.all([balance.refresh(), payouts.refresh()]); toast.success('Pencairan diajukan.') } catch (cause) { toast.error('Pencairan belum bisa diajukan.', tutorApiMessage(cause, 'Pastikan saldo dan rekening sudah memenuhi syarat.')) } finally { payingOut.value = false } }
</script>
<template>
  <div class="grid gap-6"><AppPageHeader title="Penjualan marketplace" description="Pantau penjualan paket publik, saldo bagi hasil, rekening, dan pencairan milik owner bimbel." />
    <div class="grid gap-4 sm:grid-cols-3"><AccountStat tone="primary" label="Produk terjual" :value="String(sales.summary.value.count)" /><AccountStat tone="success" label="Saldo tersedia" :value="rupiah(balance.data.value.available)" /><AccountStat tone="star" label="Saldo tertahan" :value="rupiah(balance.data.value.held)" /></div>
    <DashboardPanel title="Riwayat penjualan"><DashboardSkeleton v-if="sales.pending.value" :count="4" label="Memuat penjualan…" /><div v-else-if="sales.sales.value.length" class="overflow-x-auto"><table class="w-full min-w-180 text-left text-sm"><thead class="border-b border-hairline text-xs text-muted uppercase"><tr><th class="p-3">Tanggal</th><th class="p-3">Produk</th><th class="p-3">Pembeli</th><th class="p-3 text-right">Harga</th><th class="p-3 text-right">Bagi hasil</th></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="item in sales.sales.value" :key="item.orderId"><td class="p-3">{{ formatDate(item.paidAt) }}</td><td class="p-3 font-semibold">{{ item.productTitle }}</td><td class="p-3">{{ item.buyerName }}</td><td class="p-3 text-right">{{ rupiah(item.price) }}</td><td class="p-3 text-right font-semibold">{{ rupiah(item.share) }}</td></tr></tbody></table></div><AppEmptyState v-else title="Belum ada penjualan" description="Paket bimbel yang lolos moderasi dan dibeli siswa akan tercatat di sini." /></DashboardPanel>
    <div class="grid gap-6 lg:grid-cols-2"><DashboardPanel title="Rekening pencairan"><div v-if="bank.data.value" class="rounded-md bg-surface-alt p-4"><strong>{{ bank.data.value.bankLabel }}</strong><p class="mt-1 text-sm">{{ bank.data.value.accountNumber }} · {{ bank.data.value.holderName }}</p><DashboardBadge class="mt-3" :tone="bank.data.value.verifiedAt ? 'success' : 'warning'">{{ bank.data.value.verifiedAt ? 'Terverifikasi' : 'Menunggu verifikasi' }}</DashboardBadge></div><form v-else class="grid gap-3" @submit.prevent="saveBank"><AppSelect v-model="account.bankCode" label="Bank" :options="BANK_OPTIONS.map(item => ({ value: item.code, label: item.label }))" /><AppInput v-model="account.accountNumber" label="Nomor rekening" required /><AppInput v-model="account.holderName" label="Nama pemilik rekening" required /><AppButton type="submit" :loading="savingBank">Simpan rekening</AppButton></form></DashboardPanel>
      <DashboardPanel title="Ajukan pencairan" description="Minimum pencairan Rp100.000 dan hanya menggunakan saldo tersedia."><form class="grid gap-3" @submit.prevent="payout"><AppInput v-model.number="amount" type="number" :min="PAYOUT_MINIMUM" label="Jumlah pencairan" /><AppButton type="submit" :loading="payingOut" :disabled="!bank.data.value || balance.data.value.available < amount">Ajukan pencairan</AppButton></form><div v-if="payouts.data.value.length" class="mt-5 border-t border-hairline pt-4"><p class="text-xs font-bold text-muted uppercase">Pengajuan terakhir</p><p class="mt-2 text-sm">{{ rupiah(payouts.data.value[0]!.amount) }} · {{ payouts.data.value[0]!.status }}</p></div></DashboardPanel></div>
  </div>
</template>
