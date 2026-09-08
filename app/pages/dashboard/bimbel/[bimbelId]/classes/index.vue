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

      <div v-else-if="classes.data.value.length" class="grid gap-3 sm:grid-cols-2">
        <article v-for="item in classes.data.value" :key="item.id" class="rounded-md border border-hairline p-4">
          <h2 class="font-semibold">{{ item.name }}</h2>
          <p class="mt-1 text-sm text-muted">{{ item.memberCount }} siswa</p>
          <div v-if="canManage" class="mt-4 flex flex-wrap gap-2">
            <!-- Editor anggota punya route sendiri: bisa di-bookmark, dibagikan
                 ke sesama pengelola, dan tombol back-nya benar. -->
            <AppButton :to="`/dashboard/bimbel/${bimbelId}/classes/${item.id}`" size="sm" variant="secondary">
              Atur anggota
            </AppButton>
            <AppButton size="sm" variant="ghost" @click="remove(item)">Hapus</AppButton>
          </div>
        </article>
      </div>

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
