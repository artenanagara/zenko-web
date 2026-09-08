<script setup lang="ts">
import type { BimbelRole } from '#shared/types/bimbel'

/**
 * Bentuk item `AppDropdownMenu`. Dideklarasikan ulang di sini karena design
 * system mengekspor komponennya lewat export map, bukan tipenya — mengimpor
 * dari file `.vue` tidak terselesaikan oleh TypeScript.
 */
interface MenuItem {
  id: string
  label: string
  icon?: string
  badge?: string
  danger?: boolean
  divider?: boolean
}

/**
 * Pemilih konteks di puncak sidebar dashboard.
 *
 * Sebelum ini, satu-satunya pintu ke `/dashboard/bimbel/*` di seluruh aplikasi
 * adalah tombol pada kartu keanggotaan di halaman "Bimbel saya" — dan pemilik
 * bimbel yang role globalnya masih `student` tidak pernah melihat entri
 * Dashboard di menu profil sama sekali, karena `homePathFor` hanya mengenal
 * student, tutor, dan admin. Keanggotaan bimbel adalah dimensi terpisah dari
 * role global, jadi ia butuh pemilihnya sendiri.
 *
 * Yang muncul di sini hanyalah konteks yang benar-benar punya ruang kerja.
 * Keanggotaan sebagai siswa tidak: tujuannya `/akun/paket-bimbel`, bukan
 * dashboard, dan `useDashboardNav` memang mengembalikan nav kosong untuknya.
 * Menampilkannya di sini akan menjanjikan ruang yang tidak ada.
 */
const props = defineProps<{ collapsed?: boolean }>()

const route = useRoute()
const { user } = useAuth()
const { data: memberships } = useBimbelMemberships()

const ROLE_LABEL: Record<BimbelRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  teacher: 'Pengajar',
  student: 'Siswa',
}

/** Keanggotaan yang punya ruang kerja untuk dibuka. */
const workspaces = computed(() =>
  memberships.value.filter(item => item.status === 'active' && item.role !== 'student'),
)

const activeBimbelId = computed(() =>
  route.path.startsWith('/dashboard/bimbel/') && typeof route.params.bimbelId === 'string'
    ? route.params.bimbelId
    : '',
)

/** Konteks yang sedang dibuka, dibaca dari route dan bukan dari state tersimpan. */
const current = computed(() => {
  const bimbel = workspaces.value.find(item => item.bimbelId === activeBimbelId.value)
  if (bimbel) return { name: bimbel.bimbelName, detail: ROLE_LABEL[bimbel.role], icon: 'buildings' }
  if (route.path.startsWith('/dashboard/admin')) return { name: 'Admin Zenko', detail: 'Operasional', icon: 'seal-check' }
  if (route.path.startsWith('/dashboard/tutor')) return { name: 'Tutor', detail: 'Akun saya', icon: 'briefcase' }
  return { name: user.value?.name || 'Akun saya', detail: 'Siswa', icon: 'graduation-cap' }
})

/**
 * Dua kelompok: konteks yang melekat pada akun, lalu bimbel. Penutupnya adalah
 * pintu ke "Bimbel saya", yang menangani setiap keadaan yang tidak punya ruang
 * kerja — undangan yang menunggu jawaban, permintaan bergabung yang belum
 * disetujui, dan pengajuan bimbel baru.
 */
const items = computed<MenuItem[]>(() => {
  const list: MenuItem[] = [{ id: '/akun', label: 'Siswa', icon: 'graduation-cap' }]

  if (user.value?.role === 'tutor') list.push({ id: '/dashboard/tutor', label: 'Tutor', icon: 'briefcase' })
  if (user.value?.role === 'admin') list.push({ id: '/dashboard/admin', label: 'Admin Zenko', icon: 'seal-check' })

  if (workspaces.value.length) {
    list.push({ id: 'divider-bimbel', label: '', divider: true })
    for (const item of workspaces.value) {
      list.push({
        id: `/dashboard/bimbel/${item.bimbelId}`,
        label: item.bimbelName,
        icon: 'buildings',
        badge: ROLE_LABEL[item.role],
      })
    }
  }

  list.push({ id: 'divider-hub', label: '', divider: true })
  list.push({ id: '/akun/bimbel', label: 'Bimbel saya', icon: 'users-three' })
  return list
})

function select(id: string) {
  if (id.startsWith('divider-')) return
  navigateTo(id)
}
</script>

<template>
  <AppDropdownMenu
    class="w-full"
    :items="items"
    align="left"
    @select="select"
  >
    <template #trigger="{ open, isOpen }">
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-md border border-hairline bg-surface-alt px-2.5 py-2 text-left transition-colors hover:border-line"
        :aria-expanded="isOpen"
        :title="props.collapsed ? current.name : undefined"
        :aria-label="props.collapsed ? `Ganti konteks — ${current.name}` : undefined"
        @click="open()"
      >
        <span class="grid h-7 w-7 shrink-0 place-items-center rounded-xs bg-primary-soft text-primary">
          <AppIcon :name="current.icon" :size="15" />
        </span>
        <span v-if="!props.collapsed" class="min-w-0 flex-1">
          <span class="block truncate text-[0.8rem] leading-tight font-semibold">{{ current.name }}</span>
          <span class="block truncate text-[0.7rem] leading-tight text-muted">{{ current.detail }}</span>
        </span>
        <AppIcon
          v-if="!props.collapsed"
          name="caret-up-down"
          :size="13"
          class="shrink-0 text-faint"
        />
      </button>
    </template>
  </AppDropdownMenu>
</template>
