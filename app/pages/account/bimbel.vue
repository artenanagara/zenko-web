<script setup lang="ts">
import type { BimbelMembership, BimbelRole } from '#shared/types/bimbel'

/**
 * "Bimbel saya" — sisi hubungan bimbel yang dimiliki akun, bukan ruang kerja
 * pengelolanya.
 *
 * Halaman ini dulu ada di `/bimbel` dengan layout `default`, jadi mengkliknya
 * dari sidebar akun menukar seluruh shell dan sidebar-nya hilang. Sekarang ia
 * tinggal di dalam area akun, dan `/bimbel` diserahkan ke permukaan publik.
 *
 * Formulir pendaftaran bimbel tidak lagi di sini: ia halaman utuh di
 * `/untuk-bimbel/daftar`, karena sebelumnya ia panel yang muncul di dasar
 * halaman tanpa scroll dan di HP tampak seperti tombol yang tidak berfungsi.
 */
definePageMeta({ path: '/akun/bimbel', layout: 'account', middleware: 'auth' })
useHead({ title: 'Bimbel Saya | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const { data: memberships, pending, error, refresh } = useBimbelMemberships()
const invitations = useBimbelInvitations()
const application = useMyBimbelApplication()
const toast = useToast()

const joinCode = ref('')
const joining = ref(false)
/** Bimbel yang sedang diproses, supaya hanya kartunya yang menampilkan loading. */
const answering = ref('')

onMounted(() => Promise.all([refresh(), invitations.refresh(), application.refresh()]))

const ROLE_LABEL: Record<BimbelRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  teacher: 'Pengajar',
  student: 'Siswa',
}

/**
 * `invited` sengaja tidak muncul di sini: undangan punya kartunya sendiri di
 * panel atas, lengkap dengan tombol jawabannya.
 */
function statusLabel(item: BimbelMembership): string {
  if (item.status === 'active') return 'Aktif'
  if (item.status === 'suspended') return 'Ditangguhkan'
  return 'Menunggu persetujuan'
}

/** Hanya anggota aktif yang punya tujuan; sisanya belum punya ruang untuk dibuka. */
function destinationFor(item: BimbelMembership): string | null {
  if (item.status !== 'active') return null
  return item.role === 'student' ? '/akun/paket-bimbel' : `/dashboard/bimbel/${item.bimbelId}`
}

async function join() {
  if (!joinCode.value.trim()) return
  joining.value = true
  try {
    const result = await joinBimbel(joinCode.value)
    joinCode.value = ''
    toast.success('Permintaan bergabung dikirim.', `${result.bimbelName} perlu menyetujui permintaanmu.`)
    await refresh()
  }
  catch (cause) {
    toast.error('Belum bisa bergabung.', tutorApiMessage(cause, 'Periksa kembali kode bimbel.'))
  }
  finally {
    joining.value = false
  }
}

async function answer(item: BimbelMembership, accept: boolean) {
  answering.value = item.bimbelId
  try {
    if (accept) {
      await acceptBimbelInvitation(item.bimbelId)
      toast.success('Undangan diterima.', `Kamu sekarang ${ROLE_LABEL[item.role].toLowerCase()} di ${item.bimbelName}.`)
    }
    else {
      await declineBimbelInvitation(item.bimbelId)
      toast.success('Undangan ditolak.', `${item.bimbelName} tidak lagi menunggu jawabanmu.`)
    }
    // Menjawab memindahkan baris antar dua daftar, jadi keduanya dimuat ulang.
    await Promise.all([invitations.refresh(), refresh()])
  }
  catch (cause) {
    toast.error('Undangan gagal dijawab.', tutorApiMessage(cause, 'Coba lagi sebentar.'))
  }
  finally {
    answering.value = ''
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Bimbel saya"
      description="Bimbel tempatmu tergabung, undangan yang menunggu jawaban, dan cara bergabung dengan yang baru."
    />

    <!--
      Undangan diletakkan paling atas karena ia satu-satunya bagian halaman ini
      yang menunggu tindakan pengguna; sisanya hanya status.
    -->
    <DashboardPanel
      v-if="invitations.pending.value || invitations.data.value.length"
      title="Undangan"
      description="Bimbel mengundangmu bergabung. Menerima undangan tidak menghapus keanggotaanmu di bimbel lain."
    >
      <DashboardSkeleton v-if="invitations.pending.value" :count="1" label="Memuat undangan…" />
      <div v-else class="grid gap-3">
        <article
          v-for="item in invitations.data.value"
          :key="item.bimbelId"
          class="flex flex-col gap-4 rounded-md border border-hairline bg-surface-alt p-4 sm:flex-row sm:items-center"
        >
          <div class="min-w-0 flex-1">
            <h2 class="truncate font-semibold">{{ item.bimbelName }}</h2>
            <p class="mt-0.5 text-sm text-muted">Diundang sebagai {{ ROLE_LABEL[item.role] }}</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <AppButton size="sm" :loading="answering === item.bimbelId" @click="answer(item, true)">
              Terima
            </AppButton>
            <AppButton
              size="sm"
              variant="secondary"
              :disabled="answering === item.bimbelId"
              @click="answer(item, false)"
            >
              Tolak
            </AppButton>
          </div>
        </article>
      </div>
    </DashboardPanel>

    <DashboardPanel
      title="Ruang bimbel"
      description="Setiap akun bisa tergabung di lebih dari satu bimbel dengan peran berbeda."
    >
      <DashboardSkeleton v-if="pending" :count="3" label="Memuat bimbel…" />
      <AccountError v-else-if="error" @retry="refresh">{{ error }}</AccountError>
      <div v-else-if="memberships.length" class="grid gap-3">
        <article
          v-for="item in memberships"
          :key="item.bimbelId"
          class="flex flex-col gap-4 rounded-md border border-hairline p-4 sm:flex-row sm:items-center"
        >
          <div class="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary-soft font-bold text-primary">
            {{ item.bimbelName.charAt(0) }}
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="truncate font-semibold">{{ item.bimbelName }}</h2>
            <p class="mt-0.5 text-sm text-muted">{{ ROLE_LABEL[item.role] }} · {{ statusLabel(item) }}</p>
          </div>
          <AppButton
            v-if="destinationFor(item)"
            :to="destinationFor(item)!"
            size="sm"
            :variant="item.role === 'student' ? 'secondary' : 'primary'"
          >
            {{ item.role === 'student' ? 'Lihat paket' : 'Buka dashboard' }}
          </AppButton>
          <DashboardBadge v-else tone="warning">Menunggu</DashboardBadge>
        </article>
      </div>
      <AppEmptyState
        v-else
        title="Belum tergabung di bimbel"
        description="Masukkan kode dari pengelola bimbel di bawah, atau daftarkan bimbel milikmu."
      />
    </DashboardPanel>

    <div class="grid gap-6 lg:grid-cols-2">
      <DashboardPanel title="Gabung sebagai siswa" description="Kode diberikan oleh pengelola bimbel.">
        <form class="grid gap-3" @submit.prevent="join">
          <AppInput v-model="joinCode" label="Kode bimbel" placeholder="Contoh: ZENKO123" autocomplete="off" />
          <AppButton type="submit" :loading="joining" :disabled="!joinCode.trim()">Kirim permintaan</AppButton>
        </form>
      </DashboardPanel>

      <DashboardPanel title="Punya bimbel sendiri?" description="Kelola siswa, buka bank soal untuk mereka, dan jual paketmu di Zenko.">
        <BimbelApplicationStatus v-if="application.data.value" :application="application.data.value" />
        <AppButton
          v-if="!application.data.value || application.data.value.status === 'rejected'"
          to="/untuk-bimbel"
          variant="secondary"
          class="mt-3 w-full first:mt-0"
        >
          {{ application.data.value?.status === 'rejected' ? 'Ajukan ulang bimbel' : 'Pelajari & daftarkan bimbel' }}
        </AppButton>
      </DashboardPanel>
    </div>
  </div>
</template>
