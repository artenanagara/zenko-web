<script setup lang="ts">
import type { User } from '#shared/types/user'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Direktori siswa — daftar setiap akun berperan siswa. Sama seperti direktori
 * tutor: bukan antrean keputusan, tabelnya polos: cari, filter status
 * verifikasi. Berbeda dari tutor, tidak ada halaman detail — tidak ada profil
 * atau produk untuk didalami per siswa, jadi baris tidak bisa diklik.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Daftar Siswa | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { data: students, pending, error, refresh } = useAdminStudents()

// Skeleton is for the first load only (design spec §3.6); a later refetch
// keeps the stale table rendered until fresh data lands.
const loaded = ref(false)
onMounted(async () => {
  await refresh()
  loaded.value = true
})

/* --------------------------------------------------------------------------
 * Toolbar — cari, filter verifikasi, urutkan.
 * ------------------------------------------------------------------------ */

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'all', label: 'Semua siswa' },
  { value: 'verified', label: 'Terverifikasi' },
  { value: 'unverified', label: 'Belum verifikasi' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'name-asc', label: 'Nama A–Z' },
  { value: 'name-desc', label: 'Nama Z–A' },
]

const {
  search,
  filter: verificationFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<User>(() => students.value, {
  searchFields: student => [student.name, student.email],
  filters: {
    all: () => true,
    verified: student => student.verified,
    unverified: student => !student.verified,
  },
  sorts: {
    'name-asc': (a, b) => a.name.localeCompare(b.name, 'id'),
    'name-desc': (a, b) => b.name.localeCompare(a.name, 'id'),
  },
  defaultFilter: 'all',
  defaultSort: 'name-asc',
})

const columns = [
  { key: 'student', label: 'Siswa' },
  { key: 'status', label: 'Verifikasi' },
  { key: 'joined', label: 'Tanggal bergabung' },
]

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Daftar Siswa"
      description="Setiap akun yang berperan siswa di Zenko."
    />

    <DashboardPanel>
      <DashboardSkeleton v-if="pending && !loaded" :count="4" label="Memuat siswa..." />

      <div v-else-if="error" class="py-8 text-center">
        <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
        <button
          type="button"
          class="mt-3 font-semibold text-primary hover:underline"
          @click="refresh"
        >
          Muat ulang
        </button>
      </div>

      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="verificationFilter"
          v-model:sort="sortOrder"
          search-id="admin-students-search"
          search-label="Cari siswa"
          search-placeholder="Cari nama atau email…"
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          :result-count="rows.length"
          :total-count="total"
          item-noun="siswa"
          :active="isActive"
          @reset="reset"
        />

        <AppEmptyState
          v-if="rows.length === 0 && !isActive"
          title="Belum ada siswa"
          description="Akun yang mendaftar sebagai siswa akan muncul di sini."
        />

        <AppEmptyState
          v-else-if="rows.length === 0"
          title="Tidak ada hasil"
          description="Tidak ada siswa yang cocok dengan pencarian atau filter ini."
          action-label="Reset pencarian"
          @action="reset"
        />

        <DashboardTable v-else :columns="columns" :data="rows" primary-key="student">
          <template #cell(student)="{ item }">
            <div class="flex items-center gap-3">
              <img
                v-if="item.avatarUrl"
                :src="item.avatarUrl"
                alt=""
                referrerpolicy="no-referrer"
                class="h-9 w-9 shrink-0 rounded-full object-cover"
              >
              <span
                v-else
                aria-hidden="true"
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-alt text-[0.86rem] font-bold text-muted"
              >{{ initial(item.name) }}</span>

              <span class="min-w-0">
                <span class="block truncate font-semibold tracking-[-0.02em] text-ink">{{ item.name }}</span>
                <span class="block truncate text-[0.82rem] text-muted">{{ item.email }}</span>
              </span>
            </div>
          </template>

          <template #cell(status)="{ item }">
            <DashboardBadge :tone="item.verified ? 'success' : 'warning'">
              {{ item.verified ? 'Terverifikasi' : 'Belum verifikasi' }}
            </DashboardBadge>
          </template>

          <template #cell(joined)="{ item }">
            <span class="text-[0.86rem] text-muted">{{ formatDate(item.createdAt) }}</span>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>
  </div>
</template>
