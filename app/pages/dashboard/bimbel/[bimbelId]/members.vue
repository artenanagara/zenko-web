<script setup lang="ts">
import type { BimbelMember, BimbelRole } from '#shared/types/bimbel'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Siswa dan Tim Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const bimbelId = String(useRoute().params.bimbelId)
const bimbel = useBimbelDetail(bimbelId)
const { data: members, pending, error, refresh } = useBimbelMembers(bimbelId)
const toast = useToast()
const invite = reactive({ email: '', role: 'student' })
const inviting = ref(false)
const busyId = ref('')
const roleOptions = [{ value: 'student', label: 'Siswa' }, { value: 'teacher', label: 'Pengajar' }, { value: 'admin', label: 'Admin' }]
onMounted(() => Promise.all([refresh(), bimbel.refresh()]))

async function sendInvite() {
  inviting.value = true
  try { await inviteBimbelMember(bimbelId, invite.email, invite.role); invite.email = ''; await refresh(); toast.success('Anggota ditambahkan.', 'Statusnya menunggu sampai diaktifkan.') }
  catch (cause) { toast.error('Belum bisa menambahkan anggota.', tutorApiMessage(cause, 'Pastikan email sudah memiliki akun Zenko.')) }
  finally { inviting.value = false }
}
async function patch(member: BimbelMember, body: { role?: BimbelRole, status?: string }) {
  busyId.value = member.accountId
  try { await updateBimbelMember(bimbelId, member.accountId, body); await Promise.all([refresh(), bimbel.refresh()]); toast.success('Data anggota diperbarui.') }
  catch (cause) { toast.error('Perubahan gagal.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.')) }
  finally { busyId.value = '' }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Siswa & tim" :description="`${bimbel.data.value?.seatsUsed ?? 0} dari ${bimbel.data.value?.seatQuota ?? 0} kursi siswa aktif terpakai.`" />
    <DashboardPanel title="Tambah anggota" description="Undang akun Zenko yang sudah terdaftar, atau bagikan kode bergabung kepada siswa.">
      <div class="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
        <form class="grid gap-3 sm:grid-cols-[1fr_160px_auto]" @submit.prevent="sendInvite"><AppInput v-model="invite.email" type="email" label="Email akun Zenko" required /><AppSelect v-model="invite.role" label="Peran" :options="roleOptions" /><AppButton type="submit" :loading="inviting">Tambahkan</AppButton></form>
        <div class="hidden h-12 w-px bg-hairline lg:block" />
        <div><p class="text-xs font-bold tracking-wide text-muted uppercase">Kode bergabung</p><div class="mt-2 flex items-center gap-3"><code class="rounded-sm bg-surface-alt px-4 py-2 text-lg font-bold tracking-widest">{{ bimbel.data.value?.joinCode || '—' }}</code><span class="text-xs text-muted">Permintaan siswa tetap perlu disetujui.</span></div></div>
      </div>
    </DashboardPanel>
    <DashboardPanel title="Daftar anggota">
      <DashboardSkeleton v-if="pending" :count="5" label="Memuat anggota…" />
      <AppInlineMessage v-else-if="error" type="error">{{ error }}</AppInlineMessage>
      <div v-else-if="members.length" class="overflow-x-auto">
        <table class="w-full min-w-190 text-left text-sm"><thead class="border-b border-hairline text-xs text-muted uppercase"><tr><th class="px-3 py-3">Nama</th><th class="px-3 py-3">Peran</th><th class="px-3 py-3">Status</th><th class="px-3 py-3 text-right">Aksi</th></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="member in members" :key="member.accountId"><td class="px-3 py-4"><strong class="block">{{ member.name }}</strong><span class="text-muted">{{ member.email }}</span></td><td class="px-3 py-4"><span v-if="member.role === 'owner'">Owner</span><AppSelect v-else :model-value="member.role" :options="roleOptions" size="sm" aria-label="Ubah peran" :disabled="busyId === member.accountId" @update:model-value="value => patch(member, { role: value as BimbelRole })" /></td><td class="px-3 py-4"><DashboardBadge :tone="member.status === 'active' ? 'success' : member.status === 'pending' ? 'warning' : 'neutral'">{{ member.status === 'active' ? 'Aktif' : member.status === 'pending' ? 'Menunggu' : member.status === 'suspended' ? 'Ditangguhkan' : 'Keluar' }}</DashboardBadge></td><td class="px-3 py-4 text-right"><AppButton v-if="member.role !== 'owner' && member.status !== 'active'" size="sm" :loading="busyId === member.accountId" @click="patch(member, { status: 'active' })">Aktifkan</AppButton><AppButton v-else-if="member.role !== 'owner'" size="sm" variant="ghost" :loading="busyId === member.accountId" @click="patch(member, { status: 'suspended' })">Tangguhkan</AppButton></td></tr></tbody></table>
      </div>
      <AppEmptyState v-else title="Belum ada anggota" description="Tambahkan siswa atau pengajar pertama lewat email akun Zenko." />
    </DashboardPanel>
  </div>
</template>
