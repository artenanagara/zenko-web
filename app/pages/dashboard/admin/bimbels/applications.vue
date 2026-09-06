<script setup lang="ts">
import type { BimbelApplication } from '#shared/types/bimbel'
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Pengajuan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const { data, pending, error, refresh } = useAdminBimbelApplications()
const toast = useToast()
const busyId = ref('')
const rejecting = ref<BimbelApplication | null>(null)
const reason = ref('')
onMounted(refresh)
async function decide(item: BimbelApplication, status: 'approved' | 'rejected') { busyId.value = item.id; try { await decideBimbelApplication(item.id, status, reason.value); rejecting.value = null; reason.value = ''; await refresh(); toast.success(status === 'approved' ? 'Bimbel disetujui.' : 'Pengajuan ditolak.', status === 'approved' ? 'Owner mendapat trial 14 hari untuk 50 siswa.' : '') } catch (cause) { toast.error('Keputusan gagal disimpan.', tutorApiMessage(cause, 'Coba lagi.')) } finally { busyId.value = '' } }
</script>
<template>
  <div class="grid gap-6"><AppPageHeader title="Pengajuan bimbel" description="Verifikasi identitas pengelola dan gambaran bimbel sebelum membuat ruang organisasi." />
    <DashboardPanel><DashboardSkeleton v-if="pending" :count="5" label="Memuat pengajuan…" /><AppInlineMessage v-else-if="error" type="error">{{ error }}</AppInlineMessage><div v-else-if="data.length" class="grid gap-3"><article v-for="item in data" :key="item.id" class="rounded-md border border-hairline p-4"><div class="flex flex-col gap-4 lg:flex-row lg:items-start"><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><h2 class="font-semibold">{{ item.bimbelName }}</h2><DashboardBadge tone="warning">Menunggu</DashboardBadge></div><p class="mt-1 text-sm text-muted">{{ item.contactName }} · {{ item.email }} · {{ item.whatsapp }}</p><p class="mt-3 text-sm">{{ item.about || 'Tidak ada deskripsi.' }}</p><p class="mt-2 text-xs text-muted">{{ item.city || 'Kota tidak diisi' }} · sekitar {{ item.studentCount }} siswa</p></div><div class="flex gap-2"><AppButton size="sm" :loading="busyId === item.id" @click="decide(item, 'approved')">Setujui</AppButton><AppButton size="sm" variant="secondary" @click="rejecting = item">Tolak</AppButton></div></div></article></div><AppEmptyState v-else title="Tidak ada pengajuan" description="Semua pengajuan bimbel sudah diproses." /></DashboardPanel>
    <DashboardPanel v-if="rejecting" :title="`Tolak ${rejecting.bimbelName}`" description="Tuliskan alasan yang dapat ditindaklanjuti pengelola."><AppTextarea v-model="reason" label="Alasan penolakan" required /><div class="mt-4 flex gap-2"><AppButton :disabled="!reason.trim()" :loading="busyId === rejecting.id" @click="decide(rejecting, 'rejected')">Tolak pengajuan</AppButton><AppButton variant="secondary" @click="rejecting = null">Batal</AppButton></div></DashboardPanel>
  </div>
</template>
