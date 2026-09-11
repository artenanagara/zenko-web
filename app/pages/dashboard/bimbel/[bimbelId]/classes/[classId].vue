<script setup lang="ts">
import type { BimbelClass } from '#shared/types/bimbel'

/**
 * Editor anggota satu kelas.
 *
 * Dulu ini panel `v-if` di dasar halaman Kelas: mengklik "Atur anggota" dari
 * HP terlihat seperti tidak terjadi apa-apa, karena panelnya muncul jauh di
 * bawah lipatan tanpa scroll. Sebagai route sendiri ia bisa di-bookmark,
 * dibagikan, dan punya tombol back yang benar.
 */
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const bimbelId = String(route.params.bimbelId)
const classId = String(route.params.classId)
const classesPath = `/dashboard/bimbel/${bimbelId}/classes`

const members = useBimbelMembers(bimbelId)
const memberships = useBimbelMemberships()
const toast = useToast()

const detail = ref<BimbelClass | null>(null)
// Mulai true supaya render pertama menampilkan skeleton — fetch-nya sendiri
// baru berjalan setelah mount (session cookie milik origin API).
const detailPending = ref(true)
const detailError = ref('')

const selected = ref<string[]>([])
const saving = ref(false)
const search = ref('')

const membership = computed(() => memberships.data.value.find(item => item.bimbelId === bimbelId))
const canManage = computed(() => membership.value?.role === 'owner' || membership.value?.role === 'admin')

useHead({
  title: () => detail.value ? `Anggota ${detail.value.name} | Zenko` : 'Anggota Kelas | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const breadcrumbs = computed(() => [
  { label: 'Kelas', to: classesPath },
  { label: detail.value?.name ?? 'Anggota kelas', truncate: true },
])

const students = computed(() =>
  members.data.value.filter(item => item.role === 'student' && item.status === 'active'),
)

const visibleStudents = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return students.value
  return students.value.filter(item =>
    item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term),
  )
})

async function loadDetail() {
  detailPending.value = true
  detailError.value = ''
  try {
    const item = await getBimbelClass(bimbelId, classId)
    detail.value = item
    selected.value = [...(item.memberIds ?? [])]
  }
  catch (cause) {
    detailError.value = tutorApiMessage(cause, 'Kelas tidak ditemukan atau belum berhasil dimuat.')
  }
  finally {
    detailPending.value = false
  }
}

async function load() {
  await memberships.refresh()
  await Promise.all([loadDetail(), canManage.value ? members.refresh() : Promise.resolve()])
}
onMounted(load)

function toggle(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(item => item !== id)
    : [...selected.value, id]
}

async function save() {
  if (!detail.value) return
  saving.value = true
  try {
    await updateBimbelClassMembers(bimbelId, detail.value.id, selected.value)
    toast.success('Anggota kelas disimpan.')
    await navigateTo(classesPath)
  }
  catch (cause) {
    toast.error('Kelas belum berhasil disimpan.', tutorApiMessage(cause, 'Coba lagi.'))
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <template v-if="detailPending">
      <DashboardSkeleton variant="stats" :count="2" :columns="2" label="Memuat kelas…" />
      <div class="rounded-md border border-line bg-surface px-5 py-4 shadow-xs md:px-6 md:py-5">
        <DashboardSkeleton :count="5" />
      </div>
    </template>

    <template v-else-if="detailError || !detail">
      <AppPageHeader title="Anggota kelas">
        <template #breadcrumbs>
          <AppBreadcrumbs :items="breadcrumbs" />
        </template>
      </AppPageHeader>
      <div class="flex flex-wrap items-center gap-3">
        <AppInlineMessage type="error">{{ detailError || 'Kelas tidak ditemukan.' }}</AppInlineMessage>
        <button type="button" class="font-semibold text-primary hover:underline" @click="load">Coba lagi</button>
        <NuxtLink :to="classesPath" class="text-[0.86rem] font-semibold text-primary hover:underline">
          Kembali ke Kelas
        </NuxtLink>
      </div>
    </template>

    <template v-else>
      <AppPageHeader
        :title="`Anggota ${detail.name}`"
        description="Pilih siswa aktif yang masuk ke kelas ini. Perubahan baru berlaku setelah disimpan."
      >
        <template #breadcrumbs>
          <AppBreadcrumbs :items="breadcrumbs" />
        </template>
        <template #actions>
          <AppButton :to="classesPath" size="sm" variant="outline">Kembali</AppButton>
        </template>
      </AppPageHeader>

      <AppSectionMessage v-if="!canManage" appearance="warning" title="Hanya admin bimbel yang dapat mengubah anggota kelas">
        Kamu masih dapat melihat kelas ini, tetapi daftar siswanya diatur oleh owner atau admin bimbel.
      </AppSectionMessage>

      <DashboardPanel v-else :title="`${selected.length} siswa terpilih`" description="Centang siswa yang ikut kelas ini.">
        <DashboardSkeleton v-if="members.pending.value" :count="5" label="Memuat siswa…" />

        <div v-else-if="members.error.value" class="py-8 text-center">
          <AppInlineMessage type="error">{{ members.error.value }}</AppInlineMessage>
          <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="members.refresh">
            Coba lagi
          </button>
        </div>

        <AppEmptyState
          v-else-if="students.length === 0"
          title="Belum ada siswa aktif"
          description="Kelas hanya dapat diisi siswa yang sudah aktif. Tambahkan siswa lebih dulu, lalu kembali ke sini."
          action-label="Kelola siswa"
          @action="navigateTo(`/dashboard/bimbel/${bimbelId}/members`)"
        />

        <template v-else>
          <div class="max-w-md">
            <AppTextField
              id="bimbel-class-student-search"
              v-model="search"
              label="Cari siswa"
              placeholder="Cari nama atau email…"
              size="sm"
              clearable
            >
              <template #leading-icon>
                <AppIcon name="magnifying-glass" :size="16" />
              </template>
            </AppTextField>
          </div>

          <p class="mt-3 text-[0.82rem] text-muted" aria-live="polite">
            Menampilkan <span class="font-semibold tabular-nums text-ink">{{ visibleStudents.length }}</span>
            dari <span class="tabular-nums">{{ students.length }}</span> siswa aktif.
          </p>

          <div v-if="visibleStudents.length" class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label
              v-for="student in visibleStudents"
              :key="student.accountId"
              class="flex cursor-pointer items-center gap-3 rounded-sm border border-hairline p-3 transition-colors hover:bg-surface-alt focus-within:border-primary/40"
            >
              <input
                type="checkbox"
                class="size-4 shrink-0 accent-primary"
                :checked="selected.includes(student.accountId)"
                @change="toggle(student.accountId)"
              >
              <span class="min-w-0">
                <strong class="block truncate text-sm">{{ student.name }}</strong>
                <span class="block truncate text-xs text-muted">{{ student.email }}</span>
              </span>
            </label>
          </div>

          <AppEmptyState
            v-else
            class="mt-4"
            title="Hasil tidak ditemukan"
            description="Tidak ada siswa aktif yang cocok dengan kata kunci pencarian."
            action-label="Reset pencarian"
            @action="search = ''"
          />

          <div class="mt-5 flex flex-wrap gap-2 border-t border-hairline pt-5">
            <AppButton :disabled="saving" @click="save">{{ saving ? 'Menyimpan…' : 'Simpan anggota' }}</AppButton>
            <AppButton :to="classesPath" variant="outline">Batal</AppButton>
          </div>
        </template>
      </DashboardPanel>
    </template>
  </div>
</template>
