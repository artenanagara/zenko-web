<script setup lang="ts">
import type { BimbelClass } from '#shared/types/bimbel'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Kelas Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const classes = useBimbelClasses(bimbelId)
const members = useBimbelMembers(bimbelId)
const memberships = useBimbelMemberships()
const toast = useToast()
const { confirm } = useConfirm()
const name = ref('')
const creating = ref(false)
const editing = ref<BimbelClass | null>(null)
const selected = ref<string[]>([])
const saving = ref(false)
const membership = computed(() => memberships.data.value.find(item => item.bimbelId === bimbelId))
const canManage = computed(() => membership.value?.role === 'owner' || membership.value?.role === 'admin')
const students = computed(() => members.data.value.filter(item => item.role === 'student' && item.status === 'active'))

onMounted(async () => {
  await memberships.refresh()
  await Promise.all([classes.refresh(), canManage.value ? members.refresh() : Promise.resolve()])
})

async function createClass() {
  creating.value = true
  try {
    await createBimbelClass(bimbelId, name.value)
    name.value = ''
    await classes.refresh()
    toast.success('Kelas dibuat.')
  }
  catch (cause) {
    toast.error('Gagal membuat kelas.', tutorApiMessage(cause, 'Coba lagi.'))
  }
  finally {
    creating.value = false
  }
}

async function editClass(item: BimbelClass) {
  const detail = await getBimbelClass(bimbelId, item.id)
  editing.value = detail
  selected.value = [...(detail.memberIds ?? [])]
}

function toggle(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(item => item !== id)
    : [...selected.value, id]
}

async function saveMembers() {
  if (!editing.value) return
  saving.value = true
  try {
    await updateBimbelClassMembers(bimbelId, editing.value.id, selected.value)
    editing.value = null
    await classes.refresh()
    toast.success('Anggota kelas disimpan.')
  }
  catch (cause) {
    toast.error('Gagal menyimpan kelas.', tutorApiMessage(cause, 'Coba lagi.'))
  }
  finally {
    saving.value = false
  }
}

async function remove(item: BimbelClass) {
  const accepted = await confirm({
    title: `Hapus kelas "${item.name}"?`,
    description: 'Siswa tidak dihapus dari bimbel. Tugas lama tetap tersimpan.',
    confirmLabel: 'Hapus kelas',
  })
  if (!accepted) return
  await deleteBimbelClass(bimbelId, item.id)
  await classes.refresh()
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Kelas" description="Kelompokkan siswa agar satu penugasan dapat dibagikan ke rombel atau program tertentu." />

    <DashboardPanel v-if="canManage" title="Buat kelas">
      <form class="flex max-w-xl items-end gap-3" @submit.prevent="createClass">
        <AppInput v-model="name" class="flex-1" label="Nama kelas" placeholder="Contoh: Intensif UTBK A" required />
        <AppButton type="submit" :loading="creating">Buat</AppButton>
      </form>
    </DashboardPanel>

    <DashboardPanel title="Daftar kelas">
      <DashboardSkeleton v-if="classes.pending.value" :count="4" label="Memuat kelas…" />
      <div v-else-if="classes.data.value.length" class="grid gap-3 sm:grid-cols-2">
        <article v-for="item in classes.data.value" :key="item.id" class="rounded-md border border-hairline p-4">
          <h2 class="font-semibold">{{ item.name }}</h2>
          <p class="mt-1 text-sm text-muted">{{ item.memberCount }} siswa</p>
          <div v-if="canManage" class="mt-4 flex gap-2">
            <AppButton size="sm" variant="secondary" @click="editClass(item)">Atur anggota</AppButton>
            <AppButton size="sm" variant="ghost" @click="remove(item)">Hapus</AppButton>
          </div>
        </article>
      </div>
      <AppEmptyState v-else title="Belum ada kelas" description="Kelas memudahkan penugasan ke sekelompok siswa." />
    </DashboardPanel>

    <DashboardPanel v-if="editing" :title="`Anggota ${editing.name}`" description="Pilih siswa aktif yang masuk ke kelas ini.">
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label v-for="student in students" :key="student.accountId" class="flex cursor-pointer items-center gap-3 rounded-sm border border-hairline p-3">
          <input type="checkbox" :checked="selected.includes(student.accountId)" @change="toggle(student.accountId)">
          <span>
            <strong class="block text-sm">{{ student.name }}</strong>
            <span class="text-xs text-muted">{{ student.email }}</span>
          </span>
        </label>
      </div>
      <div class="mt-5 flex gap-2">
        <AppButton :loading="saving" @click="saveMembers">Simpan anggota</AppButton>
        <AppButton variant="secondary" @click="editing = null">Batal</AppButton>
      </div>
    </DashboardPanel>
  </div>
</template>
