<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: 'Bimbel Saya | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const { data: memberships, pending, error, refresh } = useBimbelMemberships()
const application = useMyBimbelApplication()
const toast = useToast()
const joinCode = ref('')
const joining = ref(false)
const showApplication = ref(false)
const applying = ref(false)
const form = reactive({ bimbelName: '', whatsapp: '', city: '', studentCount: 25, about: '' })

onMounted(() => Promise.all([refresh(), application.refresh()]))

async function join() {
  if (!joinCode.value.trim()) return
  joining.value = true
  try {
    const result = await joinBimbel(joinCode.value)
    joinCode.value = ''
    toast.success('Permintaan bergabung dikirim.', `${result.bimbelName} perlu menyetujui permintaanmu.`)
    await refresh()
  }
  catch (cause) { toast.error('Belum bisa bergabung.', tutorApiMessage(cause, 'Periksa kembali kode bimbel.')) }
  finally { joining.value = false }
}

async function apply() {
  applying.value = true
  try {
    await applyBimbel(form)
    showApplication.value = false
    toast.success('Pengajuan bimbel dikirim.', 'Tim Zenko akan meninjau data bimbelmu.')
    await application.refresh()
  }
  catch (cause) { toast.error('Pengajuan gagal dikirim.', tutorApiMessage(cause, 'Periksa data lalu coba lagi.')) }
  finally { applying.value = false }
}
</script>

<template>
  <main class="container-page py-10 md:py-14">
    <AppPageHeader title="Bimbel saya" description="Masuk ke ruang bimbel, bergabung sebagai siswa, atau daftarkan bimbelmu di Zenko.">
      <template #actions><AppButton to="/akun" variant="secondary" size="sm">Kembali ke akun</AppButton></template>
    </AppPageHeader>

    <div class="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <DashboardPanel title="Ruang bimbel" description="Setiap akun bisa tergabung di lebih dari satu bimbel dengan peran berbeda.">
        <DashboardSkeleton v-if="pending" :count="3" label="Memuat bimbel…" />
        <AppInlineMessage v-else-if="error" type="error">{{ error }}</AppInlineMessage>
        <div v-else-if="memberships.length" class="grid gap-3">
          <article v-for="item in memberships" :key="item.bimbelId" class="flex flex-wrap items-center gap-4 rounded-md border border-hairline bg-surface-alt p-4">
            <div class="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary-soft font-bold text-primary">{{ item.bimbelName.charAt(0) }}</div>
            <div class="min-w-0 flex-1">
              <h2 class="truncate font-semibold">{{ item.bimbelName }}</h2>
              <p class="mt-0.5 text-sm text-muted">{{ item.role === 'student' ? 'Siswa' : item.role === 'teacher' ? 'Pengajar' : item.role === 'admin' ? 'Admin' : 'Owner' }} · {{ item.status === 'active' ? 'Aktif' : 'Menunggu persetujuan' }}</p>
            </div>
            <AppButton v-if="item.status === 'active' && item.role !== 'student'" :to="`/dashboard/bimbel/${item.bimbelId}`" size="sm">Buka dashboard</AppButton>
            <AppButton v-else-if="item.status === 'active'" to="/akun/tugas-bimbel" size="sm" variant="secondary">Lihat tugas</AppButton>
            <DashboardBadge v-else tone="warning">Menunggu</DashboardBadge>
          </article>
        </div>
        <AppEmptyState v-else title="Belum tergabung di bimbel" description="Masukkan kode dari pengelola bimbel, atau daftarkan bimbel milikmu." />
      </DashboardPanel>

      <div class="grid content-start gap-6">
        <DashboardPanel title="Gabung sebagai siswa" description="Kode diberikan oleh pengelola bimbel.">
          <form class="grid gap-3" @submit.prevent="join">
            <AppInput v-model="joinCode" label="Kode bimbel" placeholder="Contoh: ZENKO123" autocomplete="off" />
            <AppButton type="submit" :loading="joining" :disabled="!joinCode.trim()">Kirim permintaan</AppButton>
          </form>
        </DashboardPanel>

        <DashboardPanel title="Kelola bimbel sendiri" description="Cocok untuk bimbel rumahan dan tim pengajar kecil.">
          <AppSectionMessage v-if="application.data.value" :appearance="application.data.value.status === 'rejected' ? 'error' : 'information'" :title="application.data.value.status === 'pending' ? 'Pengajuan sedang ditinjau' : application.data.value.status === 'approved' ? 'Pengajuan disetujui' : 'Pengajuan perlu diperbaiki'">
            {{ application.data.value.rejectReason || 'Kami akan memberi kabar setelah proses peninjauan selesai.' }}
          </AppSectionMessage>
          <AppButton
            v-if="!application.data.value || application.data.value.status === 'rejected'"
            type="button"
            class="mt-3 w-full first:mt-0"
            variant="secondary"
            @click="showApplication = !showApplication"
          >
            {{ application.data.value?.status === 'rejected' ? 'Ajukan ulang bimbel' : 'Daftarkan bimbel' }}
          </AppButton>
        </DashboardPanel>
      </div>
    </div>

    <DashboardPanel v-if="showApplication" class="mt-6" title="Pengajuan bimbel" description="Isi gambaran singkat. Setelah disetujui, kamu mendapat masa uji coba 14 hari untuk 50 siswa.">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="apply">
        <AppInput v-model="form.bimbelName" label="Nama bimbel" required />
        <AppInput v-model="form.whatsapp" label="WhatsApp pengelola" required />
        <AppInput v-model="form.city" label="Kota" />
        <AppInput v-model.number="form.studentCount" type="number" min="1" label="Perkiraan jumlah siswa" required />
        <AppTextarea v-model="form.about" class="md:col-span-2" label="Tentang bimbel" placeholder="Jenjang, program, dan cara belajar yang dijalankan." />
        <div class="flex gap-2 md:col-span-2"><AppButton type="submit" :loading="applying">Kirim pengajuan</AppButton><AppButton type="button" variant="secondary" @click="showApplication = false">Batal</AppButton></div>
      </form>
    </DashboardPanel>
  </main>
</template>
