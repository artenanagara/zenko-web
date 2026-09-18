<script setup lang="ts">
import type { Bimbel, BimbelApplication, BimbelStatus } from '#shared/types/bimbel'
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * Direktori bimbel.
 *
 * Halaman ini dulu antrean "Pengajuan bimbel": tiap baris menunggu seorang
 * admin menyetujui atau menolak sebuah pendaftaran. Persetujuannya dihapus —
 * mendaftarkan bimbel sekarang langsung membuat ruangnya — jadi yang tersisa
 * bukan antrean melainkan daftar bacaan: siapa yang mendaftar, di tingkat apa,
 * dan langganannya masih hidup atau tidak.
 *
 * Yang menjaga pintu sekarang bukan halaman ini melainkan apa yang bisa
 * dilakukan bimbel baru. Ia privat, tidak muncul di katalog, dan tidak bisa
 * menjual apa pun ke marketplace tanpa lewat Moderasi produk yang tidak
 * berubah. Uji cobanya sengaja pendek supaya tidak sepadan untuk dikeruk.
 */
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Daftar Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const { data: bimbels, pending, error, refresh } = useAdminBimbels()

/**
 * Pendaftaran yang tertinggal di `pending`.
 *
 * Hanya bisa berasal dari sebelum pendaftaran jadi instan; tidak ada lagi yang
 * berhenti di sana. Ditampilkan supaya orang yang menunggu keputusan yang tidak
 * akan pernah dibuat tidak tertinggal selamanya — dan panelnya berhenti
 * dirender begitu daftarnya habis, jadi ia membersihkan dirinya sendiri.
 */
const legacyApplications = useAdminBimbelApplications()
/**
 * Disaring di klien: `GET /admin/bimbel-applications` mengabaikan parameter
 * status dan selalu mengembalikan seluruh riwayat, termasuk yang sudah
 * disetujui dan ditolak. Yang punya pekerjaan tersisa hanya yang `pending`.
 */
const legacy = computed(() =>
  legacyApplications.data.value.filter(item => item.status === 'pending'),
)
const busyId = ref('')
const toast = useToast()
const deleteTarget = ref<Bimbel | null>(null)
const deleteOpen = ref(false)
const deleteBusy = ref(false)
const deleteError = ref('')
function openDelete(bimbel: Bimbel) { deleteTarget.value = bimbel; deleteError.value = ''; deleteOpen.value = true }
function openBimbelDelete(id: string) { const bimbel = bimbels.value.find(item => item.id === id); if (bimbel) openDelete(bimbel) }
async function removeBimbel() {
  if (!deleteTarget.value || deleteBusy.value) return
  deleteBusy.value = true; deleteError.value = ''
  try { await deleteAdminBimbel(deleteTarget.value.id); deleteOpen.value = false; await load() }
  catch (cause) { deleteError.value = tutorApiMessage(cause, 'Bimbel belum berhasil dihapus.') }
  finally { deleteBusy.value = false }
}

function load() {
  return Promise.all([refresh(), legacyApplications.refresh()])
}
onMounted(load)

async function activate(item: BimbelApplication) {
  busyId.value = item.id
  try {
    await decideBimbelApplication(item.id, 'approved')
    await load()
    toast.success('Ruang bimbel dibuat.', `${item.bimbelName} sekarang bisa dibuka pemiliknya.`)
  }
  catch (cause) {
    toast.error('Belum bisa diaktifkan.', tutorApiMessage(cause, 'Coba lagi sebentar.'))
  }
  finally {
    busyId.value = ''
  }
}

/* --------------------------------------------------------------------------
 * Bahasa status
 * ------------------------------------------------------------------------ */

const STATUS_LABEL: Record<BimbelStatus, string> = {
  trial: 'Uji coba',
  active: 'Aktif',
  grace: 'Lewat masa aktif',
  suspended: 'Berhenti',
}

const STATUS_TONE: Record<BimbelStatus, 'brand' | 'success' | 'warning' | 'danger'> = {
  trial: 'brand',
  active: 'success',
  grace: 'warning',
  suspended: 'danger',
}

const DAY = 24 * 60 * 60
const now = ref(Math.floor(Date.now() / 1000))
onMounted(() => {
  const timer = setInterval(() => { now.value = Math.floor(Date.now() / 1000) }, 60_000)
  onUnmounted(() => clearInterval(timer))
})

/** Sisa masa aktif dalam kalimat, karena tanggal saja tidak menjawab "masih hidup?". */
function periodNote(item: Bimbel): string {
  if (!item.activeUntil) return 'Belum pernah berlangganan'
  const days = Math.ceil((item.activeUntil - now.value) / DAY)
  if (days < 0) return `Berakhir ${formatDate(item.activeUntil)}`
  if (days === 0) return 'Berakhir hari ini'
  return `${days} hari lagi · ${formatDate(item.activeUntil)}`
}

/* --------------------------------------------------------------------------
 * Toolbar
 * ------------------------------------------------------------------------ */

const STATUS_FILTER_OPTIONS: TableControlOption[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'trial', label: 'Uji coba' },
  { value: 'active', label: 'Aktif' },
  { value: 'lapsed', label: 'Lewat masa aktif' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'newest', label: 'Terbaru mendaftar' },
  { value: 'oldest', label: 'Terlama mendaftar' },
  { value: 'name', label: 'Nama A–Z' },
  { value: 'name-desc', label: 'Nama Z–A' },
  { value: 'expiry', label: 'Masa aktif terdekat' },
  { value: 'seats', label: 'Siswa terbanyak' },
]

const {
  search,
  filter: statusFilter,
  sort: sortOrder,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<Bimbel>(bimbels, {
  searchFields: item => [item.name, item.city, item.slug, bimbelPlanLabel(item.plan)],
  filters: {
    all: () => true,
    trial: item => item.status === 'trial',
    active: item => item.status === 'active',
    // Dua status, satu pertanyaan: langganannya sudah lewat. Yang membedakan
    // grace dari suspended adalah seberapa jauh lewatnya, dan itu terbaca di
    // badge masing-masing baris — bukan sesuatu yang perlu dua filter.
    lapsed: item => item.status === 'grace' || item.status === 'suspended',
  },
  sorts: {
    'newest': (a, b) => b.createdAt - a.createdAt,
    'oldest': (a, b) => a.createdAt - b.createdAt,
    'name': (a, b) => a.name.localeCompare(b.name, 'id'),
    'name-desc': (a, b) => b.name.localeCompare(a.name, 'id'),
    expiry: (a, b) => (a.activeUntil || Number.MAX_SAFE_INTEGER) - (b.activeUntil || Number.MAX_SAFE_INTEGER),
    seats: (a, b) => b.seatsUsed - a.seatsUsed,
  },
  defaultFilter: 'all',
  defaultSort: 'newest',
})

/** Bimbel yang masa aktifnya sudah lewat — sinyal yang perlu dibaca, bukan antrean. */
const lapsedCount = computed(() =>
  bimbels.value.filter(item => item.status === 'grace' || item.status === 'suspended').length,
)

const columns = [
  { key: 'bimbel', label: 'Bimbel' },
  { key: 'city', label: 'Kota', hideOnMobile: true },
  { key: 'plan', label: 'Tingkat' },
  { key: 'seats', label: 'Kursi', align: 'right' as const },
  { key: 'joined', label: 'Mendaftar' },
  { key: 'period', label: 'Masa aktif' },
  { key: 'status', label: 'Langganan' },
  { key: 'actions', label: 'Aksi', align: 'right' as const },
]

function findBimbel(id: string): Bimbel | undefined {
  return rows.value.find(item => item.id === id)
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Daftar bimbel"
      description="Seluruh organisasi yang terdaftar di Zenko. Mendaftarkan bimbel tidak lagi menunggu persetujuan — ruangnya langsung dibuat, dan halaman ini yang mencatatnya."
    />

    <!-- Sisa dari zaman antrean. Hilang sendiri begitu tidak ada lagi. -->
    <DashboardPanel
      v-if="legacy.length"
      title="Pendaftaran yang belum selesai"
      description="Dikirim sebelum persetujuan dihapus, jadi berhenti menunggu keputusan yang tidak akan dibuat. Aktifkan supaya pemiliknya bisa mulai."
    >
      <div class="grid gap-3">
        <article
          v-for="item in legacy"
          :key="item.id"
          class="flex flex-col gap-4 rounded-md border border-hairline p-4 sm:flex-row sm:items-center"
        >
          <div class="min-w-0 flex-1">
            <h2 class="truncate font-semibold">{{ item.bimbelName }}</h2>
            <p class="mt-1 text-sm text-muted">
              {{ item.contactName }} · {{ item.email }} · {{ item.whatsapp }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ item.city || 'Kota tidak diisi' }} · sekitar {{ item.studentCount }} siswa ·
              dikirim {{ formatDate(item.submittedAt) }}
            </p>
          </div>
          <AppButton size="sm" :loading="busyId === item.id" @click="activate(item)">
            Aktifkan
          </AppButton>
        </article>
      </div>
    </DashboardPanel>

    <DashboardPanel>
      <DashboardSkeleton v-if="pending" :count="5" label="Memuat daftar bimbel…" />

      <div v-else-if="error" class="py-8 text-center">
        <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">
          Coba lagi
        </button>
      </div>

      <AppEmptyState
        v-else-if="bimbels.length === 0"
        title="Belum ada bimbel"
        description="Organisasi yang mendaftar lewat /untuk-bimbel akan muncul di sini seketika."
      />

      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="statusFilter"
          v-model:sort="sortOrder"
          search-id="admin-bimbels-search"
          search-label="Cari bimbel"
          search-placeholder="Cari nama bimbel atau kota…"
          :filter-options="STATUS_FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          :result-count="rows.length"
          :total-count="total"
          item-noun="bimbel"
          :actionable-count="lapsedCount"
          actionable-label="sudah lewat masa aktif"
          :active="isActive"
          @reset="reset"
        />

        <AppEmptyState
          v-if="rows.length === 0"
          title="Hasil tidak ditemukan"
          description="Tidak ada bimbel yang cocok dengan kata kunci atau status yang dipilih."
          action-label="Reset pencarian"
          @action="reset"
        />

        <DashboardTable v-else :columns="columns" :data="rows" primary-key="bimbel">
          <template #cell(bimbel)="{ item }">
            <NuxtLink :to="`/dashboard/admin/bimbels/${item.id}`" class="block font-semibold tracking-[-0.02em] text-ink hover:text-primary hover:underline">{{ item.name }}</NuxtLink>
            <span class="block text-[0.82rem] text-muted">/{{ item.slug }}</span>
          </template>

          <template #cell(city)="{ value }">
            <span v-if="value" class="text-[0.88rem]">{{ value }}</span>
            <span v-else class="text-muted">—</span>
          </template>

          <template #cell(plan)="{ item }">
            <template v-for="bimbel in [findBimbel(item.id)]" :key="item.id">
              <span class="text-[0.88rem]">
                {{ bimbel?.plan ? bimbelPlanLabel(bimbel.plan) : '—' }}
              </span>
            </template>
          </template>

          <!-- Kursi terpakai dari kuota; tambahan yang masih menunggu
               verifikasi disebut terpisah karena belum menambah kuota. -->
          <template #cell(seats)="{ item }">
            <span class="block whitespace-nowrap tabular-nums">
              {{ item.seatsUsed }} / {{ item.seatQuota }}
            </span>
            <span v-if="item.pendingSeatAddonSeats > 0" class="block whitespace-nowrap text-[0.78rem] text-muted tabular-nums">
              +{{ item.pendingSeatAddonSeats }} menunggu
            </span>
          </template>

          <template #cell(joined)="{ item }">
            <span class="whitespace-nowrap text-[0.86rem] text-muted">{{ formatDate(item.createdAt) }}</span>
          </template>

          <template #cell(period)="{ item }">
            <template v-for="bimbel in [findBimbel(item.id)]" :key="item.id">
              <span v-if="bimbel" class="text-[0.86rem]">{{ periodNote(bimbel) }}</span>
            </template>
          </template>

          <template #cell(status)="{ item }">
            <template v-for="bimbel in [findBimbel(item.id)]" :key="item.id">
              <!-- justify-items-start: di dalam grid, badge-nya melar selebar
                   kolomnya dan berhenti terbaca sebagai pil. -->
              <div v-if="bimbel" class="grid justify-items-start gap-1">
                <DashboardBadge :tone="STATUS_TONE[bimbel.status]">
                  {{ STATUS_LABEL[bimbel.status] }}
                </DashboardBadge>
              </div>
            </template>
          </template>
          <template #cell(actions)="{ item }">
            <button type="button" class="text-[0.86rem] font-semibold text-danger hover:underline" @click="openBimbelDelete(item.id)">Hapus</button>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>
    <AdminDeleteModal v-model:open="deleteOpen" item-label="bimbel" description="Bimbel, anggota, kelas, tagihan, dan paket privat di dalamnya akan dihapus permanen." :busy="deleteBusy" :error="deleteError" @confirm="removeBimbel" />
  </div>
</template>
