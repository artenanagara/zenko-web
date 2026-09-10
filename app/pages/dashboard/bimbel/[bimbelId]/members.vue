<script setup lang="ts">
import type { BimbelMember, BimbelMemberStatus } from '#shared/types/bimbel'
import type { TableControlOption } from '~/composables/useTableControls'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Siswa Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const bimbel = useBimbelDetail(bimbelId)
const { data: members, pending, error, refresh } = useBimbelMembers(bimbelId)
const toast = useToast()
const students = computed(() => members.value.filter(member => member.role === 'student'))
const inviteOpen = ref(false)
const inviteEmail = ref('')
const inviting = ref(false)
const inviteError = ref('')
const busyId = ref('')

const STATUS_LABEL: Record<BimbelMemberStatus, string> = {
  active: 'Aktif', pending: 'Perlu disetujui', invited: 'Undangan terkirim', suspended: 'Ditangguhkan', left: 'Keluar',
}
const STATUS_TONE: Record<BimbelMemberStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success', pending: 'warning', invited: 'neutral', suspended: 'neutral', left: 'neutral',
}
const STATUS_FILTER_OPTIONS: TableControlOption[] = [
  { value: 'all', label: 'Semua status' }, { value: 'pending', label: 'Menunggu' },
  { value: 'active', label: 'Aktif' }, { value: 'suspended', label: 'Ditangguhkan' }, { value: 'left', label: 'Keluar' },
]
const SORT_OPTIONS: TableControlOption[] = [
  { value: 'name', label: 'Nama A–Z' }, { value: 'newest', label: 'Terbaru bergabung' }, { value: 'oldest', label: 'Terlama bergabung' },
]

const { search, filter: statusFilter, sort: sortOrder, rows, total, isActive, reset } = useTableControls<BimbelMember>(
  () => students.value,
  {
    searchFields: member => [member.name, member.email],
    filters: {
      all: () => true, pending: member => member.status === 'pending', active: member => member.status === 'active',
      suspended: member => member.status === 'suspended', left: member => member.status === 'left',
    },
    sorts: {
      name: (a, b) => a.name.localeCompare(b.name, 'id'), newest: (a, b) => b.joinedAt - a.joinedAt,
      oldest: (a, b) => a.joinedAt - b.joinedAt,
    },
    defaultFilter: 'all', defaultSort: 'name',
  },
)
const pendingCount = computed(() => students.value.filter(member => member.status === 'pending').length)
const columns = [
  { key: 'name', label: 'Nama' }, { key: 'status', label: 'Status' },
  { key: 'joinedAt', label: 'Bergabung', hideOnMobile: true }, { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

function findStudent(accountId: string) { return rows.value.find(member => member.accountId === accountId) }
function load() { return Promise.all([refresh(), bimbel.refresh()]) }
onMounted(load)
function openInvite() { inviteEmail.value = ''; inviteError.value = ''; inviteOpen.value = true }

async function sendInvite() {
  if (!inviteEmail.value.trim() || inviting.value) return
  inviting.value = true
  inviteError.value = ''
  try {
    await inviteBimbelMember(bimbelId, inviteEmail.value, 'student')
    inviteOpen.value = false
    await refresh()
    toast.success('Siswa ditambahkan.', 'Statusnya menunggu sampai diaktifkan.')
  }
  catch (cause) { inviteError.value = tutorApiMessage(cause, 'Pastikan email sudah memiliki akun Zenko.') }
  finally { inviting.value = false }
}

async function patchStatus(member: BimbelMember, status: BimbelMemberStatus) {
  busyId.value = member.accountId
  try {
    await updateBimbelMember(bimbelId, member.accountId, { status })
    await load()
    toast.success('Status siswa diperbarui.')
  }
  catch (cause) { toast.error('Perubahan gagal.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.')) }
  finally { busyId.value = '' }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Siswa" :description="`${bimbel.data.value?.seatsUsed ?? 0} dari ${bimbel.data.value?.seatQuota ?? 0} kursi siswa aktif terpakai.`">
      <template #actions><AppButton size="sm" @click="openInvite">Tambah siswa</AppButton></template>
    </AppPageHeader>
    <DashboardPanel title="Daftar siswa">
      <DashboardSkeleton v-if="pending" :count="5" label="Memuat siswa…" />
      <div v-else-if="error" class="py-8 text-center">
        <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">Coba lagi</button>
      </div>
      <AppEmptyState v-else-if="students.length === 0" title="Belum ada siswa" description="Tambahkan siswa lewat email akun Zenko, atau bagikan kode bergabung bimbelmu." action-label="Tambah siswa" @action="openInvite" />
      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search" v-model:filter="statusFilter" v-model:sort="sortOrder"
          search-id="bimbel-students-search" search-label="Cari siswa" search-placeholder="Cari nama atau email…"
          :filter-options="STATUS_FILTER_OPTIONS" :sort-options="SORT_OPTIONS" :result-count="rows.length"
          :total-count="total" item-noun="siswa" :actionable-count="pendingCount" actionable-label="menunggu diaktifkan"
          :active="isActive" @reset="reset"
        />
        <AppEmptyState v-if="rows.length === 0" title="Tidak ada hasil" description="Tidak ada siswa yang cocok dengan pencarian atau status yang dipilih." action-label="Reset pencarian" @action="reset" />
        <DashboardTable v-else :columns="columns" :data="rows" primary-key="accountId" action-key="aksi">
          <template #cell(name)="{ item }"><span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.name }}</span><span class="block text-[0.82rem] text-muted">{{ item.email }}</span></template>
          <template #cell(status)="{ item }"><DashboardBadge :tone="STATUS_TONE[item.status as BimbelMemberStatus]">{{ STATUS_LABEL[item.status as BimbelMemberStatus] }}</DashboardBadge></template>
          <template #cell(joinedAt)="{ value }"><span class="whitespace-nowrap">{{ formatDate(value) }}</span></template>
          <template #cell(aksi)="{ item }">
            <template v-for="student in [findStudent(item.accountId)]" :key="item.accountId">
              <AppButton v-if="student && student.status !== 'active'" size="sm" :disabled="busyId === student.accountId" @click="patchStatus(student, 'active')">{{ busyId === student.accountId ? 'Memproses…' : 'Aktifkan' }}</AppButton>
              <AppButton v-else-if="student" size="sm" variant="outline" :disabled="busyId === student.accountId" @click="patchStatus(student, 'suspended')">{{ busyId === student.accountId ? 'Memproses…' : 'Tangguhkan' }}</AppButton>
            </template>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>
    <AppModal v-model="inviteOpen" title="Tambah siswa" description="Undang siswa yang sudah memiliki akun Zenko, atau bagikan kode bergabung.">
      <form class="grid gap-3" @submit.prevent="sendInvite">
        <AppInput id="bimbel-invite-email" v-model="inviteEmail" type="email" label="Email akun Zenko" :disabled="inviting" required />
        <AppInlineMessage v-if="inviteError" type="error">{{ inviteError }}</AppInlineMessage>
        <div class="mt-1 border-t border-hairline pt-4"><p class="text-xs font-bold tracking-wide text-muted uppercase">Kode bergabung</p><div class="mt-2 flex flex-wrap items-center gap-3"><code class="rounded-sm bg-surface-alt px-4 py-2 text-lg font-bold tracking-widest">{{ bimbel.data.value?.joinCode || '—' }}</code><span class="text-xs text-muted">Permintaan siswa tetap perlu disetujui.</span></div></div>
      </form>
      <template #footer><AppButton variant="outline" size="sm" :disabled="inviting" @click="inviteOpen = false">Batal</AppButton><AppButton size="sm" :loading="inviting" :disabled="!inviteEmail.trim() || inviting" @click="sendInvite">Tambahkan</AppButton></template>
    </AppModal>
  </div>
</template>
