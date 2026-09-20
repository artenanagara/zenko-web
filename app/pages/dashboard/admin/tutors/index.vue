<script setup lang="ts">
import type { AdminTutorRow } from '#shared/types/admin-directory'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Direktori tutor — daftar setiap akun berperan tutor. Bukan antrean
 * keputusan seperti halaman admin lainnya (tidak ada yang perlu disetujui di
 * sini), jadi tabelnya polos: cari, filter, urutkan, klik nama untuk membuka
 * profil dan daftar produknya di /dashboard/admin/tutors/:id. Barisnya sudah
 * membawa yang biasanya dicari sebelum mengeklik: handle publik, bidang,
 * berapa produk yang tayang dari berapa yang dibuat.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['admin'],
})

useHead({
  title: 'Direktori Tutor | Zenko',
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
 * Toolbar — cari, filter, urutkan.
 * ------------------------------------------------------------------------ */

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'all', label: 'Semua tutor' },
  { value: 'selling', label: 'Punya produk tayang' },
  { value: 'no-products', label: 'Belum punya produk' },
  { value: 'verified', label: 'Terverifikasi' },
  { value: 'unverified', label: 'Belum verifikasi' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'newest', label: 'Terbaru bergabung' },
  { value: 'oldest', label: 'Terlama bergabung' },
  { value: 'name-asc', label: 'Nama A–Z' },
  { value: 'name-desc', label: 'Nama Z–A' },
  { value: 'products', label: 'Produk terbanyak' },
]

const {
  search,
  filter: tutorFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<AdminTutorRow>(() => tutors.value, {
  searchFields: tutor => [tutor.name, tutor.email, tutor.username, tutor.specializations.join(' ')],
  filters: {
    'all': () => true,
    'selling': tutor => tutor.liveProductCount > 0,
    'no-products': tutor => tutor.productCount === 0,
    'verified': tutor => tutor.verified,
    'unverified': tutor => !tutor.verified,
  },
  sorts: {
    'newest': (a, b) => b.createdAt - a.createdAt,
    'oldest': (a, b) => a.createdAt - b.createdAt,
    'name-asc': (a, b) => a.name.localeCompare(b.name, 'id'),
    'name-desc': (a, b) => b.name.localeCompare(a.name, 'id'),
    'products': (a, b) => b.liveProductCount - a.liveProductCount || b.productCount - a.productCount,
  },
  defaultFilter: 'all',
  defaultSort: 'newest',
})

/** Tutor yang sudah disetujui tapi belum menaruh apa pun — sinyal, bukan antrean. */
const idleCount = computed(() => tutors.value.filter(tutor => tutor.productCount === 0).length)

const columns = [
  { key: 'tutor', label: 'Tutor' },
  { key: 'specializations', label: 'Bidang', hideOnMobile: true },
  { key: 'products', label: 'Produk', align: 'right' as const },
  { key: 'loginMethod', label: 'Cara masuk', hideOnMobile: true },
  { key: 'status', label: 'Verifikasi' },
  { key: 'joined', label: 'Bergabung' },
  { key: 'actions', label: 'Aksi', align: 'right' as const },
]

const LOGIN_METHOD_LABEL: Record<string, string> = {
  email: 'Email',
  google: 'Google',
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

const deleteTarget = ref<AdminTutorRow | null>(null)
const deleteOpen = ref(false)
const deleteBusy = ref(false)
const deleteError = ref('')
function openDelete(tutor: AdminTutorRow) { deleteTarget.value = tutor; deleteError.value = ''; deleteOpen.value = true }
function openTutorDelete(id: string) { const tutor = tutors.value.find(item => item.id === id); if (tutor) openDelete(tutor) }
async function removeTutor() {
  if (!deleteTarget.value || deleteBusy.value) return
  deleteBusy.value = true; deleteError.value = ''
  try { await deleteAdminTutor(deleteTarget.value.id); deleteOpen.value = false; await refresh() }
  catch (cause) { deleteError.value = tutorApiMessage(cause, 'Tutor belum berhasil dihapus.') }
  finally { deleteBusy.value = false }
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
          v-model:filter="tutorFilter"
          v-model:sort="sortOrder"
          search-id="admin-tutors-search"
          search-label="Cari tutor"
          search-placeholder="Cari nama, email, username, atau bidang…"
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          filter-label="Tampilkan"
          :result-count="rows.length"
          :total-count="total"
          item-noun="tutor"
          :actionable-count="idleCount"
          actionable-label="belum punya produk"
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
          title="Hasil tidak ditemukan"
          description="Tidak ada tutor yang cocok dengan pencarian atau filter yang dipilih."
          action-label="Reset pencarian"
          @action="reset"
        />

        <DashboardTable v-else :columns="columns" :data="rows" primary-key="tutor">
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
                <span class="block truncate text-[0.82rem] text-muted">
                  {{ item.email }}<template v-if="item.username"> · @{{ item.username }}</template>
                </span>
              </span>
            </NuxtLink>
          </template>

          <template #cell(specializations)="{ value }">
            <span v-if="value.length" class="block max-w-44 truncate text-[0.86rem] text-muted" :title="value.join(', ')">
              {{ value.slice(0, 2).join(' · ') }}<template v-if="value.length > 2"> +{{ value.length - 2 }}</template>
            </span>
            <span v-else class="text-muted">—</span>
          </template>

          <template #cell(products)="{ item }">
            <span class="whitespace-nowrap tabular-nums">
              <span :class="item.liveProductCount > 0 ? 'font-semibold text-ink' : 'text-muted'">{{ item.liveProductCount }}</span>
              <span class="text-muted"> tayang / {{ item.productCount }}</span>
            </span>
          </template>

          <template #cell(loginMethod)="{ value }">
            <span class="text-[0.86rem]">{{ LOGIN_METHOD_LABEL[value] ?? '—' }}</span>
          </template>

          <template #cell(status)="{ item }">
            <DashboardBadge :tone="item.verified ? 'success' : 'warning'">
              {{ item.verified ? 'Terverifikasi' : 'Belum verifikasi' }}
            </DashboardBadge>
          </template>

          <template #cell(joined)="{ item }">
            <span class="whitespace-nowrap text-[0.86rem] text-muted">{{ formatDate(item.createdAt) }}</span>
          </template>
          <template #cell(actions)="{ item }">
            <AppIconButton variant="ghost" size="sm" class="text-danger hover:bg-danger-soft" aria-label="Hapus tutor" ariaLabel="Hapus tutor" title="Hapus tutor" @click="openTutorDelete(item.id)"><AppIcon name="trash" :size="17" aria-hidden="true" /></AppIconButton>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>
    <AdminDeleteModal v-model:open="deleteOpen" item-label="tutor" description="Akun tutor akan dihapus dan seluruh paket yang tayang akan diarsipkan agar pembeli tetap memiliki akses." :busy="deleteBusy" :error="deleteError" @confirm="removeTutor" />
  </div>
</template>
