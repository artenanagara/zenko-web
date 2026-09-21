<script setup lang="ts">
import type { TableControlOption } from '~/composables/useTableControls'

definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Pengguna Marketing | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

interface MarketingUser {
  id: string
  email: string
  name: string
  role: 'marketing' | 'editor'
  verified: boolean
  createdAt: number
}

const { public: config } = useRuntimeConfig()
const users = ref<MarketingUser[]>([])
const pending = ref(true)
const error = ref('')
const loaded = ref(false)
const modalOpen = ref(false)
const email = ref('')
const role = ref<'marketing' | 'editor'>('marketing')
const saving = ref(false)
const toast = useToast()

async function load() {
  pending.value = true
  error.value = ''
  try {
    users.value = await useApiFetch<MarketingUser[]>('/admin/marketing-users', {
      baseURL: config.apiBase,
      credentials: 'include',
    })
    loaded.value = true
  }
  catch (cause) {
    error.value = tutorApiMessage(cause, 'Daftar pengguna marketing belum berhasil dimuat.')
  }
  finally {
    pending.value = false
  }
}

const FILTER_OPTIONS: TableControlOption[] = [
  { value: 'all', label: 'Semua pengguna' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'editor', label: 'Editor' },
  { value: 'verified', label: 'Terverifikasi' },
  { value: 'unverified', label: 'Belum verifikasi' },
]

const SORT_OPTIONS: TableControlOption[] = [
  { value: 'newest', label: 'Terbaru bergabung' },
  { value: 'oldest', label: 'Terlama bergabung' },
  { value: 'name', label: 'Nama A–Z' },
  { value: 'name-desc', label: 'Nama Z–A' },
]

const {
  search,
  filter,
  sort,
  rows,
  total,
  isActive,
  reset,
} = useTableControls<MarketingUser>(() => users.value, {
  searchFields: user => [user.name, user.email, user.role],
  filters: {
    all: () => true,
    marketing: user => user.role === 'marketing',
    editor: user => user.role === 'editor',
    verified: user => user.verified,
    unverified: user => !user.verified,
  },
  sorts: {
    newest: (a, b) => b.createdAt - a.createdAt,
    oldest: (a, b) => a.createdAt - b.createdAt,
    name: (a, b) => a.name.localeCompare(b.name, 'id'),
    'name-desc': (a, b) => b.name.localeCompare(a.name, 'id'),
  },
  defaultFilter: 'all',
  defaultSort: 'newest',
})

function openCreate() {
  email.value = ''
  role.value = 'marketing'
  modalOpen.value = true
}

async function save() {
  const address = email.value.trim()
  if (!address || saving.value) return
  saving.value = true
  try {
    await useApiFetch('/admin/marketing-users', {
      baseURL: config.apiBase,
      credentials: 'include',
      method: 'POST',
      body: { email: address, role: role.value },
    })
    modalOpen.value = false
    toast.success('Akses tersimpan.', 'Akun sekarang dapat masuk ke Marketing Hub.')
    await load()
  }
  catch (cause) {
    toast.error('Akses belum berhasil disimpan.', tutorApiMessage(cause, 'Periksa email lalu coba lagi.'))
  }
  finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Pengguna marketing"
      description="Atur akun yang boleh masuk ke Marketing Hub sebagai marketing atau editor."
    >
      <template #actions>
        <AppButton size="sm" @click="openCreate">Tambah pengguna</AppButton>
      </template>
    </AppPageHeader>

    <DashboardPanel>
      <DashboardSkeleton v-if="pending && !loaded" :count="4" label="Memuat pengguna..." />

      <div v-else-if="error" class="py-8 text-center">
        <AppInlineMessage type="error">{{ error }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">Coba lagi</button>
      </div>

      <div v-else class="grid gap-4">
        <DashboardTableToolbar
          v-model:search="search"
          v-model:filter="filter"
          v-model:sort="sort"
          search-id="admin-marketing-users-search"
          search-label="Cari pengguna"
          search-placeholder="Cari nama, email, atau role..."
          :filter-options="FILTER_OPTIONS"
          :sort-options="SORT_OPTIONS"
          filter-label="Tampilkan"
          :result-count="rows.length"
          :total-count="total"
          item-noun="pengguna"
          :active="isActive"
          @reset="reset"
        />

        <AppEmptyState
          v-if="rows.length === 0 && !isActive"
          title="Belum ada pengguna marketing"
          description="Tambahkan akun pertama dengan tombol Tambah pengguna."
          action-label="Tambah pengguna"
          @action="openCreate"
        />
        <AppEmptyState
          v-else-if="rows.length === 0"
          title="Hasil tidak ditemukan"
          description="Tidak ada pengguna yang cocok dengan pencarian atau filter."
          action-label="Reset pencarian"
          @action="reset"
        />

        <DashboardTable v-else :columns="[
          { key: 'user', label: 'Pengguna' },
          { key: 'role', label: 'Role' },
          { key: 'verified', label: 'Verifikasi' },
          { key: 'createdAt', label: 'Bergabung' },
        ]" :data="rows" primary-key="email">
          <template #cell(user)="{ item }">
            <p class="font-semibold text-ink">{{ item.name || 'Tanpa nama' }}</p>
            <p class="text-xs text-muted">{{ item.email }}</p>
          </template>
          <template #cell(role)="{ value }">
            <AppBadge>{{ value }}</AppBadge>
          </template>
          <template #cell(verified)="{ value }">
            <DashboardBadge :tone="value ? 'success' : 'neutral'">
              {{ value ? 'Terverifikasi' : 'Belum verifikasi' }}
            </DashboardBadge>
          </template>
          <template #cell(createdAt)="{ value }">
            <span class="whitespace-nowrap text-muted">{{ value ? new Date(value * 1000).toLocaleDateString('id-ID') : '—' }}</span>
          </template>
        </DashboardTable>
      </div>
    </DashboardPanel>

    <AppModal v-model="modalOpen" title="Tambah pengguna marketing" description="Berikan akses Marketing Hub ke akun yang sudah terdaftar di Zenko.">
      <form class="grid gap-5" @submit.prevent="save">
        <AppInput id="marketing-user-email" v-model="email" label="Email akun" type="email" placeholder="nama@zenkoedu.id" required />
        <AppSelect
          id="marketing-user-role"
          v-model="role"
          label="Role"
          :options="[
            { value: 'marketing', label: 'Marketing' },
            { value: 'editor', label: 'Editor' },
          ]"
        />
        <div class="flex justify-end gap-2">
          <AppButton type="button" variant="outline" size="sm" @click="modalOpen = false">Batal</AppButton>
          <AppButton type="submit" size="sm" :loading="saving" :disabled="!email.trim() || saving">Simpan akses</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>
