<script setup lang="ts">
import type { AdminStudentRow } from '#shared/types/admin-directory'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Direktori siswa — daftar setiap akun berperan siswa. Sama seperti direktori
 * tutor: bukan antrean keputusan, tabelnya polos: cari, filter status
 * verifikasi, urutkan. Berbeda dari tutor, tidak ada halaman detail — tidak
 * ada profil atau produk untuk didalami per siswa — jadi yang perlu diketahui
 * admin harus terbaca dari barisnya sendiri: cara masuk, sudah beli apa,
 * sudah mengerjakan berapa, dan sejak kapan.
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
 * Toolbar — cari, filter, urutkan.
 * ------------------------------------------------------------------------ */

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'all', label: 'Semua siswa' },
  { value: 'verified', label: 'Terverifikasi' },
  { value: 'unverified', label: 'Belum verifikasi' },
  { value: 'buyers', label: 'Pernah membeli' },
  { value: 'email', label: 'Masuk lewat email' },
  { value: 'google', label: 'Masuk lewat Google' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'newest', label: 'Terbaru bergabung' },
  { value: 'oldest', label: 'Terlama bergabung' },
  { value: 'name-asc', label: 'Nama A–Z' },
  { value: 'name-desc', label: 'Nama Z–A' },
  { value: 'purchases', label: 'Paket terbanyak' },
  { value: 'attempts', label: 'Tryout terbanyak' },
]

const {
  search,
  filter: studentFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<AdminStudentRow>(() => students.value, {
  searchFields: student => [student.name, student.email],
  filters: {
    all: () => true,
    verified: student => student.verified,
    unverified: student => !student.verified,
    buyers: student => student.purchaseCount > 0,
    email: student => student.loginMethod === 'email',
    google: student => student.loginMethod === 'google',
  },
  sorts: {
    'newest': (a, b) => b.createdAt - a.createdAt,
    'oldest': (a, b) => a.createdAt - b.createdAt,
    'name-asc': (a, b) => a.name.localeCompare(b.name, 'id'),
    'name-desc': (a, b) => b.name.localeCompare(a.name, 'id'),
    'purchases': (a, b) => b.purchaseCount - a.purchaseCount,
    'attempts': (a, b) => b.attemptCount - a.attemptCount,
  },
  defaultFilter: 'all',
  defaultSort: 'newest',
})

/** Akun email yang belum membuka tautan verifikasinya — sinyal, bukan antrean. */
const unverifiedCount = computed(() => students.value.filter(student => !student.verified).length)

const columns = [
  { key: 'student', label: 'Siswa' },
  { key: 'loginMethod', label: 'Cara masuk', hideOnMobile: true },
  { key: 'status', label: 'Verifikasi' },
  { key: 'purchaseCount', label: 'Paket dibeli', align: 'right' as const },
  { key: 'attemptCount', label: 'Tryout', align: 'right' as const },
  { key: 'joined', label: 'Bergabung' },
]

const LOGIN_METHOD_LABEL: Record<string, string> = {
  email: 'Email',
  google: 'Google',
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Daftar Siswa"
      description="Setiap akun yang berperan siswa di Zenko: cara masuknya, paket yang dibeli, tryout yang dikerjakan, dan sejak kapan bergabung."
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
          v-model:filter="studentFilter"
          v-model:sort="sortOrder"
          search-id="admin-students-search"
          search-label="Cari siswa"
          search-placeholder="Cari nama atau email…"
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          filter-label="Tampilkan"
          :result-count="rows.length"
          :total-count="total"
          item-noun="siswa"
          :actionable-count="unverifiedCount"
          actionable-label="belum verifikasi"
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
          title="Hasil tidak ditemukan"
          description="Tidak ada siswa yang cocok dengan pencarian atau filter yang dipilih."
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

          <template #cell(loginMethod)="{ value }">
            <span class="text-[0.86rem]">{{ LOGIN_METHOD_LABEL[value] ?? '—' }}</span>
          </template>

          <template #cell(status)="{ item }">
            <DashboardBadge :tone="item.verified ? 'success' : 'warning'">
              {{ item.verified ? 'Terverifikasi' : 'Belum verifikasi' }}
            </DashboardBadge>
          </template>

          <template #cell(purchaseCount)="{ value }">
            <span class="tabular-nums" :class="value > 0 ? 'font-semibold text-ink' : 'text-muted'">{{ value }}</span>
          </template>

          <template #cell(attemptCount)="{ value }">
            <span class="tabular-nums" :class="value > 0 ? 'font-semibold text-ink' : 'text-muted'">{{ value }}</span>
          </template>

          <template #cell(joined)="{ item }">
            <span class="whitespace-nowrap text-[0.86rem] text-muted">{{ formatDate(item.createdAt) }}</span>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>
  </div>
</template>
