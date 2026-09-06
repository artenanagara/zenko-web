<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Pembayaran Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const { data, pending, error, refresh } = useAdminBimbelOrders()
const toast = useToast()
const { confirm } = useConfirm()
const busyId = ref('')
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
onMounted(refresh)
async function activate(item: typeof data.value[number]) { if (!await confirm({ title: `Aktifkan tagihan ${item.invoice}?`, description: 'Pastikan pembayaran sudah benar-benar diterima. Masa langganan akan langsung ditambahkan.', confirmLabel: 'Aktifkan langganan' })) return; busyId.value = item.id; try { await activateBimbelOrder(item.id); await refresh(); toast.success('Langganan bimbel diaktifkan.') } catch (cause) { toast.error('Aktivasi gagal.', tutorApiMessage(cause, 'Coba lagi.')) } finally { busyId.value = '' } }
</script>
<template><div class="grid gap-6"><AppPageHeader title="Pembayaran bimbel" description="Verifikasi transfer langganan organisasi secara manual." /><DashboardPanel><DashboardSkeleton v-if="pending" :count="5" label="Memuat pembayaran…" /><AppInlineMessage v-else-if="error" type="error">{{ error }}</AppInlineMessage><div v-else-if="data.length" class="grid gap-3"><article v-for="item in data" :key="item.id" class="flex flex-col gap-4 rounded-md border border-hairline p-4 sm:flex-row sm:items-center"><div class="flex-1"><h2 class="font-semibold">{{ item.bimbelName || item.bimbelId }}</h2><p class="mt-1 text-sm text-muted">{{ item.invoice }} · {{ item.seatQuota }} kursi · {{ item.months }} bulan</p></div><div class="flex items-center gap-4"><strong>{{ rupiah(item.amount) }}</strong><AppButton size="sm" :loading="busyId === item.id" @click="activate(item)">Verifikasi</AppButton></div></article></div><AppEmptyState v-else title="Tidak ada pembayaran menunggu" description="Tagihan baru akan muncul di sini." /></DashboardPanel></div></template>
