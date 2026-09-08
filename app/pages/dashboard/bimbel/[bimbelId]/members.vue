<script setup lang="ts">
import type { BimbelMember, BimbelMemberStatus, BimbelRole } from '#shared/types/bimbel'
import type { TableControlOption } from '~/composables/useTableControls'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Siswa dan Tim Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const bimbel = useBimbelDetail(bimbelId)
const { data: members, pending, error, refresh } = useBimbelMembers(bimbelId)
const toast = useToast()

/**
 * Menambah anggota adalah satu email dan satu peran. Sebagai panel ia duduk
 * permanen di atas roster — isi halaman yang sebenarnya — untuk tindakan yang
 * dipakai sesekali, dan di HP ia mendorong tabel anggota keluar dari layar
 * pertama. Jadi ia modal, dipanggil dari tombol di kepala halaman; kode
 * bergabung ikut ke dalamnya karena ia jawaban untuk pertanyaan yang sama.
 */
const inviteOpen = ref(false)
const invite = reactive({ email: '', role: 'student' })
const inviting = ref(false)
const inviteError = ref('')
const busyId = ref('')

const ROLE_OPTIONS: TableControlOption[] = [
  { value: 'student', label: 'Siswa' },
  { value: 'teacher', label: 'Pengajar' },
  { value: 'admin', label: 'Admin' },
]

const ROLE_LABEL: Record<BimbelRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  teacher: 'Pengajar',
  student: 'Siswa',
}

/**
 * `pending` dan `invited` sama-sama berarti "belum masuk", tapi menunggu pihak
 * yang berlawanan — jadi labelnya menyebut siapa yang berutang jawaban, bukan
 * sekadar "Menunggu". Yang menunggu pengelola diberi tone warning karena ia
 * pekerjaan yang bisa diselesaikan dari halaman ini; yang menunggu orangnya
 * netral karena tidak ada yang bisa dilakukan pengelola selain menunggu.
 */
const STATUS_LABEL: Record<BimbelMemberStatus, string> = {
  active: 'Aktif',
  pending: 'Perlu disetujui',
  invited: 'Undangan terkirim',
  suspended: 'Ditangguhkan',
  left: 'Keluar',
}

const STATUS_TONE: Record<BimbelMemberStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  pending: 'warning',
  invited: 'neutral',
  suspended: 'neutral',
  left: 'neutral',
}

function load() {
  return Promise.all([refresh(), bimbel.refresh()])
}
onMounted(load)

/* --------------------------------------------------------------------------
 * Toolbar — cari, filter status, filter peran, urutkan. Bentuknya sama dengan
 * tabel tutor dan admin (DashboardTableToolbar + useTableControls).
 *
 * Default-nya "Semua status", bukan antrean "Menunggu": halaman ini roster,
 * bukan queue — pengelola datang untuk melihat siapa saja anggotanya. Sinyal
 * yang perlu ditindak tetap terbaca lewat `actionableCount` di ringkasan
 * toolbar, pola yang sama dengan Produk saya milik tutor.
 * ------------------------------------------------------------------------ */

const STATUS_FILTER_OPTIONS: TableControlOption[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'active', label: 'Aktif' },
  { value: 'suspended', label: 'Ditangguhkan' },
  { value: 'left', label: 'Keluar' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'name', label: 'Nama A–Z' },
  { value: 'newest', label: 'Terbaru bergabung' },
  { value: 'oldest', label: 'Terlama bergabung' },
]

/** Filter peran punya select sendiri — dua sumbu, jadi tidak dilipat ke satu dropdown. */
const roleFilter = ref('')

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'Semua peran' },
  { value: 'owner', label: 'Owner' },
  ...ROLE_OPTIONS,
]

const {
  search,
  filter: statusFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<BimbelMember>(
  () => members.value.filter(member => !roleFilter.value || member.role === roleFilter.value),
  {
    searchFields: member => [member.name, member.email, ROLE_LABEL[member.role]],
    filters: {
      all: () => true,
      pending: member => member.status === 'pending',
      active: member => member.status === 'active',
      suspended: member => member.status === 'suspended',
      left: member => member.status === 'left',
    },
    sorts: {
      name: (a, b) => a.name.localeCompare(b.name, 'id'),
      newest: (a, b) => b.joinedAt - a.joinedAt,
      oldest: (a, b) => a.joinedAt - b.joinedAt,
    },
    defaultFilter: 'all',
    defaultSort: 'name',
  },
)

/** Yang benar-benar menunggu keputusan pengelola: anggota yang belum diaktifkan. */
const pendingCount = computed(() => members.value.filter(member => member.status === 'pending').length)

/** Select peran hidup di luar useTableControls, jadi Reset harus ikut membersihkannya. */
const toolbarActive = computed(() => isActive.value || roleFilter.value !== '')

function resetToolbar() {
  reset()
  roleFilter.value = ''
}

const memberColumns = [
  { key: 'name', label: 'Nama' },
  { key: 'role', label: 'Peran' },
  { key: 'status', label: 'Status' },
  { key: 'joinedAt', label: 'Bergabung', hideOnMobile: true },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]

// Slot cell DashboardTable menyerahkan `item` sebagai Record<string, any>
// (komponennya bukan generic), jadi baris yang sudah bertipe diambil kembali
// dari `rows` lewat id — bukan dengan meneruskan `item` yang tipenya terhapus.
function findMember(accountId: string): BimbelMember | undefined {
  return rows.value.find(member => member.accountId === accountId)
}
function roleLabel(role: BimbelRole): string {
  return ROLE_LABEL[role]
}
function statusLabel(status: BimbelMemberStatus): string {
  return STATUS_LABEL[status]
}
function statusTone(status: BimbelMemberStatus) {
  return STATUS_TONE[status]
}

function openInvite() {
  invite.email = ''
  inviteError.value = ''
  inviteOpen.value = true
}

/** Overlay/Escape tidak boleh menutup saat permintaan sedang dikirim. */
function setInviteOpen(value: boolean) {
  if (inviting.value) return
  inviteOpen.value = value
}

async function sendInvite() {
  if (!invite.email.trim() || inviting.value) return
  inviting.value = true
  inviteError.value = ''
  try {
    await inviteBimbelMember(bimbelId, invite.email, invite.role)
    inviteOpen.value = false
    invite.email = ''
    await refresh()
    toast.success('Anggota ditambahkan.', 'Statusnya menunggu sampai diaktifkan.')
  }
  catch (cause) {
    // Pesannya tinggal di dalam modal: email yang belum punya akun Zenko
    // diperbaiki di kolom yang sama, dan menutup modal menghapus ketikannya.
    inviteError.value = tutorApiMessage(cause, 'Pastikan email sudah memiliki akun Zenko.')
  }
  finally {
    inviting.value = false
  }
}

async function patch(member: BimbelMember, body: { role?: BimbelRole, status?: BimbelMemberStatus }) {
  busyId.value = member.accountId
  try {
    await updateBimbelMember(bimbelId, member.accountId, body)
    await load()
    toast.success('Data anggota diperbarui.')
  }
  catch (cause) {
    toast.error('Perubahan gagal.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    busyId.value = ''
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Siswa & tim"
      :description="`${bimbel.data.value?.seatsUsed ?? 0} dari ${bimbel.data.value?.seatQuota ?? 0} kursi siswa aktif terpakai.`"
    >
      <template #actions>
        <AppButton size="sm" @click="openInvite()">Tambah anggota</AppButton>
      </template>
    </AppPageHeader>

    <DashboardPanel title="Daftar anggota">
      <DashboardSkeleton v-if="pending" :count="5" label="Memuat anggota…" />

      <div v-else-if="error" class="py-8 text-center">
        <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">
          Coba lagi
        </button>
      </div>

      <!-- Belum ada anggota sama sekali: tidak ada yang bisa dicari atau
           disaring, jadi toolbar-nya pun tidak dirender. -->
      <AppEmptyState
        v-else-if="members.length === 0"
        title="Belum ada anggota"
        description="Tambahkan siswa atau pengajar pertama lewat email akun Zenko, atau bagikan kode bergabung bimbelmu."
        action-label="Tambah anggota"
        @action="openInvite()"
      />

      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="statusFilter"
          v-model:sort="sortOrder"
          search-id="bimbel-members-search"
          search-label="Cari anggota"
          search-placeholder="Cari nama, email, atau peran…"
          :filter-options="STATUS_FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          :result-count="rows.length"
          :total-count="total"
          item-noun="anggota"
          :actionable-count="pendingCount"
          actionable-label="menunggu diaktifkan"
          :active="toolbarActive"
          @reset="resetToolbar"
        >
          <!-- AppSelect root-nya w-full, jadi lebarnya dibatasi lewat pembungkus ini. -->
          <template #filter-extra>
            <div class="sm:w-44 sm:shrink-0">
              <AppSelect
                :options="ROLE_FILTER_OPTIONS"
                :model-value="roleFilter"
                size="sm"
                label="Peran"
                @update:model-value="roleFilter = String($event)"
              />
            </div>
          </template>
        </DashboardTableToolbar>

        <!-- Anggotanya ada, jadi tabel kosong di sini hanya bisa berarti
             pencarian atau filternya yang tidak menemukan apa pun. -->
        <AppEmptyState
          v-if="rows.length === 0"
          title="Tidak ada hasil"
          description="Tidak ada anggota yang cocok dengan kata kunci, status, atau peran yang dipilih."
          action-label="Reset pencarian"
          @action="resetToolbar"
        />

        <DashboardTable v-else :columns="memberColumns" :data="rows" primary-key="name" action-key="aksi">
          <template #cell(name)="{ item }">
            <span class="block font-semibold tracking-[-0.02em] text-ink">{{ item.name }}</span>
            <span class="block text-[0.82rem] text-muted">{{ item.email }}</span>
          </template>

          <template #cell(role)="{ item }">
            <template v-for="member in [findMember(item.accountId)]" :key="item.accountId">
              <!-- Owner tidak bisa diturunkan dari sini: perpindahan kepemilikan
                   belum ada endpoint-nya, jadi selectnya pun tidak ditawarkan. -->
              <span v-if="!member || member.role === 'owner'">{{ roleLabel(item.role) }}</span>
              <div v-else class="w-40 max-w-full text-left">
                <AppSelect
                  :model-value="member.role"
                  :options="ROLE_OPTIONS"
                  size="sm"
                  aria-label="Ubah peran anggota"
                  :disabled="busyId === member.accountId"
                  @update:model-value="value => patch(member, { role: value as BimbelRole })"
                />
              </div>
            </template>
          </template>

          <template #cell(status)="{ item }">
            <DashboardBadge :tone="statusTone(item.status)">{{ statusLabel(item.status) }}</DashboardBadge>
          </template>

          <template #cell(joinedAt)="{ value }">
            <span class="whitespace-nowrap">{{ formatDate(value) }}</span>
          </template>

          <template #cell(aksi)="{ item }">
            <template v-for="member in [findMember(item.accountId)]" :key="item.accountId">
              <span v-if="member && member.role !== 'owner'" class="block md:inline-block">
                <AppButton
                  v-if="member.status !== 'active'"
                  size="sm"
                  class="w-full md:w-auto"
                  :disabled="busyId === member.accountId"
                  @click="patch(member, { status: 'active' })"
                >
                  {{ busyId === member.accountId ? 'Memproses…' : 'Aktifkan' }}
                </AppButton>
                <AppButton
                  v-else
                  size="sm"
                  variant="outline"
                  class="w-full md:w-auto"
                  :disabled="busyId === member.accountId"
                  @click="patch(member, { status: 'suspended' })"
                >
                  {{ busyId === member.accountId ? 'Memproses…' : 'Tangguhkan' }}
                </AppButton>
              </span>
              <span v-else class="text-[0.86rem] text-muted">—</span>
            </template>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>

    <AppModal
      :model-value="inviteOpen"
      title="Tambah anggota"
      description="Undang akun Zenko yang sudah terdaftar, atau bagikan kode bergabung kepada siswa."
      @update:model-value="setInviteOpen"
    >
      <form class="grid gap-3" @submit.prevent="sendInvite">
        <AppInput
          id="bimbel-invite-email"
          v-model="invite.email"
          type="email"
          label="Email akun Zenko"
          :disabled="inviting"
          required
        />
        <AppSelect v-model="invite.role" label="Peran" :options="ROLE_OPTIONS" :disabled="inviting" />
        <AppInlineMessage v-if="inviteError" type="error">{{ inviteError }}</AppInlineMessage>

        <!-- Jalan kedua untuk pertanyaan yang sama: siswa yang jumlahnya banyak
             lebih murah diundang lewat kode daripada satu per satu lewat email. -->
        <div class="mt-1 border-t border-hairline pt-4">
          <p class="text-xs font-bold tracking-wide text-muted uppercase">Kode bergabung</p>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <code class="rounded-sm bg-surface-alt px-4 py-2 text-lg font-bold tracking-widest">
              {{ bimbel.data.value?.joinCode || '—' }}
            </code>
            <span class="text-xs text-muted">Permintaan siswa tetap perlu disetujui.</span>
          </div>
        </div>
      </form>

      <template #footer>
        <AppButton variant="outline" size="sm" :disabled="inviting" @click="setInviteOpen(false)">
          Batal
        </AppButton>
        <AppButton size="sm" :loading="inviting" :disabled="!invite.email.trim() || inviting" @click="sendInvite()">
          Tambahkan
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
