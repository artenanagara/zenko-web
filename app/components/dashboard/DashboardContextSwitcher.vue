<script setup lang="ts">
import type { BimbelRole } from '#shared/types/bimbel'

/**
 * Kartu konteks di puncak sidebar: ruang kerja mana yang sedang dibuka —
 * akun siswa, dashboard tutor, admin, atau salah satu bimbel — dibaca dari
 * route, bukan dari state tersimpan.
 *
 * Dulu kartu ini juga menu untuk berpindah konteks. Menu itu dilepas:
 * ProfileMenu di header sudah menautkan setiap dashboard yang boleh dibuka
 * pengguna, dan pemilih kedua di sidebar hanya membuat "aku sedang di
 * mana" terbaca seperti "mau ke mana", persis di tempat yang seharusnya
 * cuma menjawab yang pertama. Nama komponen dipertahankan supaya pemanggilnya
 * tidak ikut berubah.
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

const activeBimbelId = computed(() =>
  route.path.startsWith('/dashboard/bimbel/') && typeof route.params.bimbelId === 'string'
    ? route.params.bimbelId
    : '',
)

const isMarketingHub = computed(() =>
  (user.value?.role === 'marketing' || user.value?.role === 'editor')
  && route.path.startsWith('/dashboard/marketing'),
)

const current = computed(() => {
  const bimbel = memberships.value.find(item => item.bimbelId === activeBimbelId.value && item.status === 'active')
  if (bimbel) return { name: bimbel.bimbelName, detail: ROLE_LABEL[bimbel.role], icon: 'buildings' }
  if (route.path.startsWith('/dashboard/admin')) return { name: 'Admin Zenko', detail: 'Operasional', icon: 'seal-check' }
  if (route.path.startsWith('/dashboard/tutor')) return { name: 'Tutor', detail: 'Akun saya', icon: 'briefcase' }
  return { name: user.value?.name || 'Akun saya', detail: 'Siswa', icon: 'graduation-cap' }
})
</script>

<template>
  <div
    v-if="!isMarketingHub"
    class="flex w-full items-center gap-2.5 rounded-md border border-hairline bg-surface-alt px-2.5 py-2"
    :title="props.collapsed ? current.name : undefined"
  >
    <span class="grid h-7 w-7 shrink-0 place-items-center rounded-xs bg-primary-soft text-primary">
      <AppIcon :name="current.icon" :size="15" />
    </span>
    <span v-if="!props.collapsed" class="min-w-0 flex-1">
      <span class="block truncate text-[0.8rem] leading-tight font-semibold">{{ current.name }}</span>
      <span class="block truncate text-[0.7rem] leading-tight text-muted">{{ current.detail }}</span>
    </span>
  </div>
</template>
