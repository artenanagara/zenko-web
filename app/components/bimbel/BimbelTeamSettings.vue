<script setup lang="ts">
import type { BimbelMember, BimbelMemberStatus, BimbelRole } from '#shared/types/bimbel'

const props = defineProps<{ bimbelId: string }>()
const { data: members, pending, error, refresh } = useBimbelMembers(props.bimbelId)
const toast = useToast()
const inviteOpen = ref(false)
const inviting = ref(false)
const inviteError = ref('')
const invite = reactive({ email: '', role: 'teacher' as 'teacher' | 'admin' })
const busyId = ref('')

onMounted(refresh)

const team = computed(() => members.value.filter(member => member.role !== 'student'))
const columns = [
  { key: 'name', label: 'Nama' },
  { key: 'role', label: 'Peran' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]
const ROLE_LABEL: Record<BimbelRole, string> = { owner: 'Owner', admin: 'Admin', teacher: 'Pengajar', student: 'Siswa' }
const STATUS_LABEL: Record<BimbelMemberStatus, string> = {
  active: 'Aktif', pending: 'Perlu disetujui', invited: 'Undangan terkirim', suspended: 'Ditangguhkan', left: 'Keluar',
}

function findMember(accountId: string): BimbelMember | undefined {
  return team.value.find(member => member.accountId === accountId)
}

async function sendInvite() {
  if (!invite.email.trim() || inviting.value) return
  inviting.value = true
  inviteError.value = ''
  try {
    await inviteBimbelMember(props.bimbelId, invite.email, invite.role)
    inviteOpen.value = false
    invite.email = ''
    await refresh()
    toast.success('Undangan tim dikirim.')
  }
  catch (cause) {
    inviteError.value = tutorApiMessage(cause, 'Pastikan email sudah memiliki akun Zenko.')
  }
  finally {
    inviting.value = false
  }
}

async function patch(member: BimbelMember, body: { role?: BimbelRole, status?: BimbelMemberStatus }) {
  busyId.value = member.accountId
  try {
    await updateBimbelMember(props.bimbelId, member.accountId, body)
    await refresh()
    toast.success('Data tim diperbarui.')
  }
  catch (cause) {
    toast.error('Perubahan belum tersimpan.', tutorApiMessage(cause, 'Coba lagi.'))
  }
  finally {
    busyId.value = ''
  }
}
</script>

<template>
  <DashboardPanel title="Tim" description="Kelola owner, admin, dan pengajar Bimbel. Siswa dikelola dari menu Siswa.">
    <!-- Sejajar judul panel, bukan baris sendiri di atas daftar: aksi
         tingkat panel tempatnya di header panel, sama seperti "Impor soal"
         di editor soal. -->
    <template #action>
      <AppButton size="sm" @click="inviteOpen = true">Tambah tim</AppButton>
    </template>
    <DashboardSkeleton v-if="pending" :count="4" label="Memuat tim…" />
    <AccountError v-else-if="error" @retry="refresh">{{ error }}</AccountError>
    <DashboardTable v-else-if="team.length" :columns="columns" :data="team" primary-key="name" action-key="aksi">
      <template #cell(name)="{ item }">
        <span class="block font-semibold">{{ item.name }}</span>
        <span class="block text-[0.82rem] text-muted">{{ item.email }}</span>
      </template>
      <template #cell(role)="{ item }">
        <template v-for="member in [findMember(item.accountId)]" :key="item.accountId">
          <span v-if="!member || member.role === 'owner'">{{ ROLE_LABEL[item.role as BimbelRole] }}</span>
          <div v-else class="w-36 max-w-full">
            <AppSelect
              :model-value="member.role"
              :options="[{ value: 'teacher', label: 'Pengajar' }, { value: 'admin', label: 'Admin' }]"
              size="sm"
              aria-label="Ubah peran tim"
              :disabled="busyId === member.accountId"
              @update:model-value="value => patch(member, { role: value as BimbelRole })"
            />
          </div>
        </template>
      </template>
      <template #cell(status)="{ item }">
        <DashboardBadge :tone="item.status === 'active' ? 'success' : 'neutral'">
          {{ STATUS_LABEL[item.status as BimbelMemberStatus] }}
        </DashboardBadge>
      </template>
      <template #cell(aksi)="{ item }">
        <template v-for="member in [findMember(item.accountId)]" :key="item.accountId">
          <AppIconButton
            v-if="member && member.role !== 'owner'"
            variant="ghost"
            size="sm"
            :disabled="busyId === member.accountId"
            @click="patch(member, { status: member.status === 'active' ? 'suspended' : 'active' })"
            aria-label="Ubah status anggota"
            ariaLabel="Ubah status anggota"
            title="Ubah status anggota"
          ><AppIcon :name="member.status === 'active' ? 'x-circle' : 'check-circle'" :size="17" aria-hidden="true" /></AppIconButton>
          <span v-else class="text-muted">—</span>
        </template>
      </template>
    </DashboardTable>
    <AppEmptyState v-else title="Tim bimbelmu masih kosong" description="Ajak pengajar atau admin untuk membantu mengelola bimbel." action-label="Tambah anggota" @action="inviteOpen = true" />
  </DashboardPanel>

  <AppModal :model-value="inviteOpen" title="Tambah tim" description="Undang akun Zenko sebagai pengajar atau admin." @update:model-value="value => inviteOpen = value">
    <form class="grid gap-3" @submit.prevent="sendInvite">
      <AppInput v-model="invite.email" type="email" label="Email akun Zenko" required />
      <AppSelect v-model="invite.role" label="Peran" :options="[{ value: 'teacher', label: 'Pengajar' }, { value: 'admin', label: 'Admin' }]" />
      <AppInlineMessage v-if="inviteError" type="error">{{ inviteError }}</AppInlineMessage>
    </form>
    <template #footer>
      <AppButton variant="outline" size="sm" :disabled="inviting" @click="inviteOpen = false">Batal</AppButton>
      <AppButton size="sm" :loading="inviting" :disabled="!invite.email.trim() || inviting" @click="sendInvite">Kirim undangan</AppButton>
    </template>
  </AppModal>
</template>
