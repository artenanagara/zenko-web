<script setup lang="ts">
import type { BimbelClass } from '#shared/types/bimbel'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Kelas Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const classes = useBimbelClasses(bimbelId)
const memberships = useBimbelMemberships()
const toast = useToast()
const { confirm } = useConfirm()

/**
 * Membuat kelas hanya butuh satu nama. Sebagai panel ia menempati kepala
 * halaman terus-menerus untuk tindakan yang dilakukan beberapa kali setahun,
 * dan mendorong daftar kelas — isi halaman yang sebenarnya — ke bawah lipatan.
 * Jadi ia modal, dipanggil dari tombol di kepala halaman.
 */
const createOpen = ref(false)
const name = ref('')
const creating = ref(false)
const createError = ref('')
const membership = computed(() => memberships.data.value.find(item => item.bimbelId === bimbelId))
const canManage = computed(() => membership.value?.role === 'owner' || membership.value?.role === 'admin')
const classColumns = [
  { key: 'name', label: 'Kelas' },
  { key: 'memberCount', label: 'Jumlah siswa' },
  { key: 'createdAt', label: 'Dibuat', hideOnMobile: true },
  { key: 'aksi', label: 'Aksi', align: 'right' as const },
]
function findClass(id: string): BimbelClass | undefined {
  return classes.data.value.find(item => item.id === id)
}

onMounted(async () => {
  await memberships.refresh()
  await classes.refresh()
})

function openCreate() {
  name.value = ''
  createError.value = ''
  createOpen.value = true
}

/** Overlay/Escape tidak boleh menutup saat permintaan sedang dikirim. */
function setCreateOpen(value: boolean) {
  if (creating.value) return
  createOpen.value = value
}

async function createClass() {
  if (!name.value.trim() || creating.value) return
  creating.value = true
  createError.value = ''
  try {
    await createBimbelClass(bimbelId, name.value)
    createOpen.value = false
    name.value = ''
    await classes.refresh()
    toast.success('Kelas dibuat.')
  }
  catch (cause) {
    // Pesannya tinggal di dalam modal: nama yang ditolak diperbaiki di kolom
    // yang sama, dan modal yang tertutup akan menghapus ketikannya.
    createError.value = tutorApiMessage(cause, 'Coba lagi.')
  }
  finally {
    creating.value = false
  }
}

async function remove(item: BimbelClass) {
  const accepted = await confirm({
    title: `Hapus kelas "${item.name}"?`,
    description: 'Siswa tidak dihapus dari bimbel dan tetap dapat mengerjakan seluruh bank soal.',
    confirmLabel: 'Hapus kelas',
  })
  if (!accepted) return

  try {
    await deleteBimbelClass(bimbelId, item.id)
    await classes.refresh()
    toast.success('Kelas dihapus.')
  }
  catch (cause) {
    toast.error('Gagal menghapus kelas.', tutorApiMessage(cause, 'Coba lagi.'))
  }
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Kelas mengelompokkan siswa untuk keperluan administrasi. Ia tidak
         mengatur akses: bank soal bimbel terbuka bagi setiap anggota aktif. -->
    <AppPageHeader title="Kelas" description="Kelompokkan siswa ke dalam rombel atau program agar daftarnya tetap terbaca saat jumlahnya bertambah.">
      <template v-if="canManage" #actions>
        <AppButton size="sm" @click="openCreate()">Buat kelas</AppButton>
      </template>
    </AppPageHeader>

    <DashboardPanel title="Daftar kelas">
      <DashboardSkeleton v-if="classes.pending.value" :count="4" label="Memuat kelas…" />

      <div v-else-if="classes.error.value" class="py-8 text-center">
        <AppInlineMessage type="error">{{ classes.error.value }}</AppInlineMessage>
        <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="classes.refresh">
          Coba lagi
        </button>
      </div>

      <DashboardTable
        v-else-if="classes.data.value.length"
        :columns="classColumns"
        :data="classes.data.value"
        primary-key="name"
        action-key="aksi"
      >
        <template #cell(name)="{ item }">
          <span class="font-semibold tracking-[-0.02em] text-ink">{{ item.name }}</span>
        </template>
        <template #cell(memberCount)="{ value }">
          <span class="tabular-nums">{{ value }} siswa</span>
        </template>
        <template #cell(createdAt)="{ value }">
          <span class="whitespace-nowrap">{{ formatDate(value) }}</span>
        </template>
        <template #cell(aksi)="{ item }">
          <template v-for="classItem in [findClass(item.id)]" :key="item.id">
            <span v-if="canManage && classItem" class="inline-flex items-center gap-3 whitespace-nowrap">
              <NuxtLink
                :to="`/dashboard/bimbel/${bimbelId}/classes/${classItem.id}`"
                class="text-[0.86rem] font-semibold text-primary hover:underline"
              >
                Atur siswa
              </NuxtLink>
              <button type="button" class="text-[0.86rem] font-semibold text-danger hover:underline" @click="remove(classItem)">
                Hapus
              </button>
            </span>
            <span v-else class="text-muted">—</span>
          </template>
        </template>
      </DashboardTable>

      <AppEmptyState
        v-else
        title="Belum ada kelas"
        description="Kelas memudahkan membaca dan menyaring daftar siswa per rombel atau program, alih-alih satu daftar panjang."
        :action-label="canManage ? 'Buat kelas' : undefined"
        @action="openCreate()"
      />
    </DashboardPanel>

    <AppModal
      :model-value="createOpen"
      title="Buat kelas"
      description="Kelas hanya mengelompokkan siswa untuk administrasi — bank soal bimbel tetap terbuka bagi setiap anggota aktif."
      @update:model-value="setCreateOpen"
    >
      <form class="grid gap-3" @submit.prevent="createClass">
        <AppInput
          id="bimbel-class-name"
          v-model="name"
          label="Nama kelas"
          placeholder="Contoh: Intensif UTBK A"
          :disabled="creating"
          required
        />
        <AppInlineMessage v-if="createError" type="error">{{ createError }}</AppInlineMessage>
      </form>

      <template #footer>
        <AppButton variant="outline" size="sm" :disabled="creating" @click="setCreateOpen(false)">
          Batal
        </AppButton>
        <AppButton size="sm" :loading="creating" :disabled="!name.trim() || creating" @click="createClass()">
          Buat kelas
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
