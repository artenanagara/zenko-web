<script setup lang="ts">
import type { User } from '#shared/types/user'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Direktori tutor — daftar setiap akun berperan tutor. Bukan antrean
 * keputusan seperti halaman admin lainnya (tidak ada yang perlu disetujui di
 * sini), jadi tabelnya polos: cari, filter status verifikasi, klik nama untuk
 * membuka profil dan daftar produknya di /dashboard/admin/tutors/:id.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Tutor — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { data: tutors, pending, error, refresh } = useAdminTutors()

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
  { value: 'all', label: 'Semua tutor' },
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
} = useTableControls<User>(() => tutors.value, {
  searchFields: tutor => [tutor.name, tutor.email],
  filters: {
    all: () => true,
    verified: tutor => tutor.verified,
    unverified: tutor => !tutor.verified,
  },
  sorts: {
    'name-asc': (a, b) => a.name.localeCompare(b.name, 'id'),
    'name-desc': (a, b) => b.name.localeCompare(a.name, 'id'),
  },
  defaultFilter: 'all',
  defaultSort: 'name-asc',
})

const columns = [
  { key: 'tutor', label: 'Tutor' },
  { key: 'status', label: 'Verifikasi' },
]

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Tutor"
      description="Setiap akun yang berperan tutor di Zenko. Klik namanya untuk membuka profil dan daftar produknya."
    />

    <DashboardPanel>
      <DashboardSkeleton v-if="pending && !loaded" :count="4" label="Memuat tutor..." />

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
          search-id="admin-tutors-search"
          search-label="Cari tutor"
          search-placeholder="Cari nama atau email…"
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          :result-count="rows.length"
          :total-count="total"
          item-noun="tutor"
          :active="isActive"
          @reset="reset"
        />

        <AppEmptyState
          v-if="rows.length === 0 && !isActive"
          title="Belum ada tutor"
          description="Akun yang disetujui lewat Pengajuan tutor akan muncul di sini."
        />

        <AppEmptyState
          v-else-if="rows.length === 0"
          title="Tidak ada hasil"
          description="Tidak ada tutor yang cocok dengan pencarian atau filter ini."
          action-label="Reset pencarian"
          @action="reset"
        />

        <AppTable v-else :columns="columns" :data="rows">
          <template #cell(tutor)="{ item }">
            <NuxtLink
              :to="`/dashboard/admin/tutors/${item.id}`"
              class="flex items-center gap-3"
            >
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
                <span class="block truncate font-semibold tracking-[-0.02em] text-ink hover:underline">{{ item.name }}</span>
                <span class="block truncate text-[0.82rem] text-muted">{{ item.email }}</span>
              </span>
            </NuxtLink>
          </template>

          <template #cell(status)="{ item }">
            <DashboardBadge :tone="item.verified ? 'success' : 'warning'">
              {{ item.verified ? 'Terverifikasi' : 'Belum verifikasi' }}
            </DashboardBadge>
          </template>
        </AppTable>
      </div>
    </DashboardPanel>
  </div>
</template>
