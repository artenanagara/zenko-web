<script setup lang="ts">
import type { BimbelApplication } from '#shared/types/bimbel'
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Pengajuan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const { data, pending, error, refresh } = useAdminBimbelApplications()
const toast = useToast()
const busyId = ref('')
/**
 * Penolakan dulu memunculkan panel di dasar halaman — di luar layar, jauh dari
 * kartu yang baru saja diklik, dan tanpa apa pun yang menandai bahwa halaman
 * kini menunggu jawaban. Sekarang bentuknya dialog, sama dengan antrean admin
 * lain (AdminReasonModal), sehingga alasan ditulis tepat di atas pengajuan yang
 * ditolak dan Escape membatalkannya.
 */
const rejecting = ref<BimbelApplication | null>(null)
const rejectError = ref('')
onMounted(refresh)
async function decide(item: BimbelApplication, status: 'approved' | 'rejected', reason = '') { busyId.value = item.id; rejectError.value = ''; try { await decideBimbelApplication(item.id, status, reason); rejecting.value = null; await refresh(); toast.success(status === 'approved' ? 'Bimbel disetujui.' : 'Pengajuan ditolak.', status === 'approved' ? 'Owner mendapat trial 14 hari untuk 50 siswa.' : '') } catch (cause) { const message = tutorApiMessage(cause, 'Coba lagi.'); if (status === 'rejected') { rejectError.value = message } else { toast.error('Keputusan gagal disimpan.', message) } } finally { busyId.value = '' } }
</script>
<template>
  <div class="grid gap-6"><AppPageHeader title="Pengajuan bimbel" description="Verifikasi identitas pengelola dan gambaran bimbel sebelum membuat ruang organisasi." />
    <DashboardPanel><DashboardSkeleton v-if="pending" :count="5" label="Memuat pengajuan…" /><AppInlineMessage v-else-if="error" type="error">{{ error }}</AppInlineMessage><div v-else-if="data.length" class="grid gap-3"><article v-for="item in data" :key="item.id" class="rounded-md border border-hairline p-4"><div class="flex flex-col gap-4 lg:flex-row lg:items-start"><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><h2 class="font-semibold">{{ item.bimbelName }}</h2><DashboardBadge tone="warning">Menunggu</DashboardBadge></div><p class="mt-1 text-sm text-muted">{{ item.contactName }} · {{ item.email }} · {{ item.whatsapp }}</p><p class="mt-3 text-sm">{{ item.about || 'Tidak ada deskripsi.' }}</p><p class="mt-2 text-xs text-muted">{{ item.city || 'Kota tidak diisi' }} · sekitar {{ item.studentCount }} siswa</p></div><div class="flex gap-2"><AppButton size="sm" :loading="busyId === item.id" @click="decide(item, 'approved')">Setujui</AppButton><AppButton size="sm" variant="secondary" @click="rejecting = item">Tolak</AppButton></div></div></article></div><AppEmptyState v-else title="Tidak ada pengajuan" description="Semua pengajuan bimbel sudah diproses." /></DashboardPanel>
    <AdminReasonModal
      :open="Boolean(rejecting)"
      :title="rejecting ? `Tolak ${rejecting.bimbelName}` : 'Tolak pengajuan'"
      description="Alasannya dikirim ke pengelola dan jadi satu-satunya petunjuk untuk mengajukan ulang, jadi tulis yang bisa ditindaklanjuti."
      placeholder="Contoh: Nomor WhatsApp tidak aktif saat kami hubungi."
      confirm-label="Tolak pengajuan"
      :busy="Boolean(rejecting) && busyId === rejecting?.id"
      :error="rejectError"
      @update:open="value => { if (!value) { rejecting = null; rejectError = '' } }"
      @confirm="reason => rejecting && decide(rejecting, 'rejected', reason)"
    />
  </div>
</template>
