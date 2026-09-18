<script setup lang="ts">
import type { AdminBimbelDetail } from '#shared/types/bimbel'

definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })

const route = useRoute()
const bimbelId = computed(() => String(route.params.id ?? ''))
const toast = useToast()
const { confirm } = useConfirm()
const detail = ref<AdminBimbelDetail | null>(null)
const pending = ref(true)
const error = ref('')
const deleting = ref(false)

useHead({ title: () => detail.value ? `${detail.value.name} | Zenko` : 'Detail Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const breadcrumbs = computed(() => [
  { label: 'Daftar bimbel', to: '/dashboard/admin/bimbels' },
  { label: detail.value?.name ?? 'Detail bimbel', truncate: true },
])
const students = computed(() => detail.value?.members.filter(member => member.role === 'student') ?? [])
const studentColumns = [
  { key: 'name', label: 'Siswa' }, { key: 'status', label: 'Status' }, { key: 'joinedAt', label: 'Bergabung' },
]
const productColumns = [
  { key: 'title', label: 'Paket' }, { key: 'questions', label: 'Soal' }, { key: 'status', label: 'Status' }, { key: 'updatedAt', label: 'Diperbarui' },
]
const STATUS_LABEL: Record<string, string> = { pending: 'Menunggu', invited: 'Diundang', active: 'Aktif', suspended: 'Ditangguhkan', left: 'Keluar', draft: 'Draf', review: 'Ditinjau', live: 'Tayang', rejected: 'Ditolak', archived: 'Diarsipkan' }
const STATUS_TONE = (status: string): 'success' | 'warning' | 'neutral' | 'danger' => status === 'active' || status === 'live' ? 'success' : status === 'review' || status === 'pending' ? 'warning' : status === 'rejected' ? 'danger' : 'neutral'
const productRows = computed(() => (detail.value?.products ?? []).map(product => ({ ...product, questions: `${product.questionCount}/${product.questionTarget} soal` })))

async function load() {
  pending.value = true
  error.value = ''
  try { detail.value = await getAdminBimbel(bimbelId.value) }
  catch (cause) { error.value = tutorApiMessage(cause, 'Bimbel tidak ditemukan atau belum berhasil dimuat.') }
  finally { pending.value = false }
}
onMounted(load)

async function removeBimbel() {
  const bimbel = detail.value
  if (!bimbel || deleting.value) return
  const approved = await confirm({
    title: `Hapus ${bimbel.name}?`,
    description: 'Bimbel, roster siswa, dan seluruh paketnya akan dihapus permanen.',
    confirmLabel: 'Hapus bimbel',
  })
  if (!approved) return
  deleting.value = true
  try {
    await deleteAdminBimbel(bimbel.id)
    toast.success('Bimbel dihapus.')
    await navigateTo('/dashboard/admin/bimbels')
  }
  catch (cause) { toast.error('Bimbel belum dapat dihapus.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.')) }
  finally { deleting.value = false }
}
</script>

<template>
  <div class="grid gap-6">
    <template v-if="pending">
      <DashboardSkeleton variant="stats" :count="2" :columns="2" label="Memuat detail bimbel..." />
      <DashboardSkeleton :count="4" />
    </template>
    <template v-else-if="error || !detail">
      <AppPageHeader title="Detail bimbel"><template #breadcrumbs><AppBreadcrumbs :items="breadcrumbs" /></template></AppPageHeader>
      <div class="grid justify-items-start gap-3"><AppInlineMessage type="error">{{ error || 'Bimbel tidak ditemukan.' }}</AppInlineMessage><AppButton variant="outline" size="sm" @click="load">Coba lagi</AppButton></div>
    </template>
    <template v-else>
      <AppPageHeader :title="detail.name" :description="[detail.city, `/${detail.slug}`].filter(Boolean).join(' · ')">
        <template #breadcrumbs><AppBreadcrumbs :items="breadcrumbs" /></template>
        <template #actions><AppButton variant="danger" size="sm" :loading="deleting" @click="removeBimbel">Hapus bimbel</AppButton></template>
      </AppPageHeader>

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-md border border-hairline bg-surface p-4"><p class="text-xs font-semibold text-muted">Siswa</p><p class="mt-1 text-2xl font-bold tabular-nums">{{ students.length }}</p></div>
        <div class="rounded-md border border-hairline bg-surface p-4"><p class="text-xs font-semibold text-muted">Paket</p><p class="mt-1 text-2xl font-bold tabular-nums">{{ detail.products.length }}</p></div>
        <div class="rounded-md border border-hairline bg-surface p-4"><p class="text-xs font-semibold text-muted">Kursi aktif</p><p class="mt-1 text-2xl font-bold tabular-nums">{{ detail.seatsUsed }} / {{ detail.seatQuota }}</p></div>
      </div>

      <DashboardPanel title="Daftar siswa" :description="`${students.length} siswa tercatat di bimbel ini.`">
        <DashboardTable v-if="students.length" :columns="studentColumns" :data="students" primary-key="accountId">
          <template #cell(name)="{ item }"><span class="block font-semibold text-ink">{{ item.name }}</span><span class="text-[0.82rem] text-muted">{{ item.email }}</span></template>
          <template #cell(status)="{ value }"><DashboardBadge :tone="STATUS_TONE(value)">{{ STATUS_LABEL[value] ?? value }}</DashboardBadge></template>
          <template #cell(joinedAt)="{ value }"><span class="text-muted">{{ formatDate(value) }}</span></template>
        </DashboardTable>
        <p v-else class="py-4 text-sm text-muted">Belum ada siswa di bimbel ini.</p>
      </DashboardPanel>

      <DashboardPanel title="Paket bimbel" :description="`${detail.products.length} paket di bank soal bimbel.`">
        <DashboardTable v-if="productRows.length" :columns="productColumns" :data="productRows" primary-key="id">
          <template #cell(title)="{ item }"><span class="block font-semibold text-ink">{{ item.title }}</span><span class="text-[0.82rem] text-muted">{{ item.category }}</span></template>
          <template #cell(status)="{ value }"><DashboardBadge :tone="STATUS_TONE(value)">{{ STATUS_LABEL[value] ?? value }}</DashboardBadge></template>
          <template #cell(updatedAt)="{ value }"><span class="text-muted">{{ formatDate(value) }}</span></template>
        </DashboardTable>
        <p v-else class="py-4 text-sm text-muted">Belum ada paket di bimbel ini.</p>
      </DashboardPanel>
    </template>
  </div>
</template>
