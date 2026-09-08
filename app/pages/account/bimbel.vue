<script setup lang="ts">
import type { BimbelMembership, BimbelRole } from '#shared/types/bimbel'

/**
 * "Bimbel saya" — satu-satunya pintu bimbel di area akun, dan isinya sisi
 * siswa: paket yang terbuka lewat keanggotaan, ditambah keanggotaan yang
 * membukanya.
 *
 * Dulu ini dua menu bersebelahan, "Paket bimbel" dan "Bimbel saya". Keduanya
 * tentang bimbel yang sama dan tidak ada nama yang bisa menjelaskan bedanya
 * tanpa membuka keduanya — sementara yang dicari siswa selalu hal yang sama:
 * soal yang bisa dikerjakan. Sekarang paketnya duduk di halaman ini, di atas
 * daftar keanggotaan, dan `/akun/paket-bimbel` tinggal pengalihan.
 *
 * Yang tidak ada di sini adalah ruang kerja pengelola. Owner, admin, dan
 * pengajar mengelola bimbelnya di `/dashboard/bimbel/[bimbelId]`; halaman ini
 * hanya menautkan ke sana lewat kartu keanggotaan, tidak menirunya.
 *
 * Formulir pendaftaran bimbel juga tidak di sini: ia halaman utuh di
 * `/untuk-bimbel/daftar`, karena sebelumnya ia panel yang muncul di dasar
 * halaman tanpa scroll dan di HP tampak seperti tombol yang tidak berfungsi.
 */
definePageMeta({ path: '/akun/bimbel', layout: 'account', middleware: 'auth' })
useHead({ title: 'Bimbel Saya | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const { data: memberships, pending, error, refresh } = useBimbelMemberships()
const packages = useMyBimbelPackages()
const invitations = useBimbelInvitations()
const application = useMyBimbelApplication()
const toast = useToast()

/**
 * Gabung bimbel adalah satu kolom isian dan satu tombol. Sebagai panel ia
 * menempati sepertiga halaman terus-menerus untuk tindakan yang dipakai sekali
 * seumur keanggotaan — jadi ia modal, dan yang tetap terlihat hanyalah
 * tombolnya di kepala halaman.
 */
const joinOpen = ref(false)
const joinCode = ref('')
const joining = ref(false)
const joinError = ref('')

/** Bimbel yang sedang diproses, supaya hanya kartunya yang menampilkan loading. */
const answering = ref('')

onMounted(() => Promise.all([refresh(), packages.refresh(), invitations.refresh(), application.refresh()]))

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

/**
 * Hanya pengelola yang punya tujuan: ruang kerja bimbelnya. Siswa tidak lagi
 * dikirim ke mana pun — paketnya sudah ada di halaman yang sama, beberapa baris
 * di atas kartu ini.
 */
function workspacePathFor(item: BimbelMembership): string | null {
  if (item.status !== 'active' || item.role === 'student') return null
  return `/dashboard/bimbel/${item.bimbelId}`
}

/**
 * Pengajuan yang masih punya kabar untuk disampaikan. Yang `approved` sudah
 * berubah jadi keanggotaan, jadi kartunya di "Ruang bimbel" yang bicara.
 */
const pendingApplication = computed(() => {
  const item = application.data.value
  return item && item.status !== 'approved' ? item : null
})

function openJoin() {
  joinCode.value = ''
  joinError.value = ''
  joinOpen.value = true
}

/** Overlay/Escape tidak boleh menutup saat permintaan sedang dikirim. */
function setJoinOpen(value: boolean) {
  if (joining.value) return
  joinOpen.value = value
}

async function join() {
  if (!joinCode.value.trim() || joining.value) return
  joining.value = true
  joinError.value = ''
  try {
    const result = await joinBimbel(joinCode.value)
    joinOpen.value = false
    joinCode.value = ''
    toast.success('Permintaan bergabung dikirim.', `${result.bimbelName} perlu menyetujui permintaanmu.`)
    await refresh()
  }
  catch (cause) {
    // Pesannya tinggal di dalam modal, bukan toast: kode yang salah diperbaiki
    // di kolom yang sama, dan modal yang tertutup akan menghapus ketikannya.
    joinError.value = tutorApiMessage(cause, 'Periksa kembali kode bimbel.')
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
    // Menjawab memindahkan baris antar dua daftar, dan menerima undangan siswa
    // langsung membuka bank soalnya — jadi ketiganya dimuat ulang.
    await Promise.all([invitations.refresh(), refresh(), packages.refresh()])
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
      description="Paket dari bimbel tempatmu tergabung, undangan yang menunggu jawaban, dan cara bergabung dengan yang baru."
    >
      <template #actions>
        <AppButton size="sm" @click="openJoin()">Gabung bimbel</AppButton>
      </template>
    </AppPageHeader>

    <!-- Status pengajuan bimbel milik akun ini: pengumuman, bukan pekerjaan,
         jadi bentuknya satu baris pesan dan bukan panel tersendiri.
         Yang sudah disetujui tidak ikut tampil — ruang bimbelnya sudah ada di
         "Ruang bimbel" di bawah, lengkap dengan tombol ke dashboard-nya, dan
         mengumumkan persetujuan selamanya hanya menaruh dua tombol ke tujuan
         yang sama di satu halaman. -->
    <BimbelApplicationStatus
      v-if="pendingApplication"
      :application="pendingApplication"
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

    <!-- Isi utama halaman: yang benar-benar dicari siswa saat membukanya.
         Satu daftar untuk semua bimbel, karena satu akun bisa tergabung di
         lebih dari satu dan nama bimbel sudah tertulis di tiap barisnya. -->
    <DashboardPanel
      title="Paket bimbel"
      description="Bank soal dari bimbel tempatmu tergabung. Paket ini terbuka selama keanggotaanmu masih aktif."
    >
      <DashboardSkeleton v-if="packages.pending.value" :count="4" label="Memuat paket bimbel…" />

      <AccountError v-else-if="packages.error.value" @retry="packages.refresh">
        {{ packages.error.value }}
      </AccountError>

      <div v-else-if="packages.data.value.length" class="grid gap-3">
        <article
          v-for="item in packages.data.value"
          :key="`${item.bimbelId}-${item.productId}`"
          class="flex flex-col gap-4 rounded-md border border-hairline p-4 sm:flex-row sm:items-center"
        >
          <div class="min-w-0 flex-1">
            <h2 class="font-semibold">{{ item.title }}</h2>
            <p class="mt-1 text-sm text-muted">{{ item.bimbelName }} · {{ item.category }}</p>
            <p class="mt-1 text-xs text-muted">
              {{ item.attemptsUsed }}× dikerjakan
              <template v-if="item.bestScore >= 0"> · Skor terbaik {{ item.bestScore }}</template>
              <template v-else> · Belum pernah dikerjakan</template>
            </p>
          </div>

          <AppButton :to="`/akun/paket/${item.packageSlug}`" size="sm" class="shrink-0">Kerjakan</AppButton>
        </article>
      </div>

      <AppEmptyState
        v-else
        title="Belum ada paket bimbel"
        description="Bank soal bimbel muncul di sini setelah keanggotaanmu aktif. Gabung dengan kode dari pengelola bimbelmu."
        action-label="Gabung bimbel"
        @action="openJoin()"
      />
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
          <!-- Pengelola keluar dari area akun ke ruang kerjanya; siswa tidak
               punya tombol karena tujuannya bukan halaman lain. -->
          <AppButton v-if="workspacePathFor(item)" :to="workspacePathFor(item)!" size="sm">
            Buka dashboard bimbel
          </AppButton>
          <DashboardBadge v-else-if="item.status !== 'active'" tone="warning">Menunggu</DashboardBadge>
        </article>
      </div>
      <AppEmptyState
        v-else
        title="Belum tergabung di bimbel"
        description="Masukkan kode dari pengelola bimbel, atau daftarkan bimbel milikmu sendiri."
        action-label="Gabung bimbel"
        @action="openJoin()"
      />

      <!-- Pintu ke sisi pengelola, ditaruh di kaki panel keanggotaan karena di
           situlah pertanyaannya muncul: "kalau bimbelku sendiri, bagaimana?" -->
      <p
        v-if="!application.data.value || application.data.value.status === 'rejected'"
        class="mt-5 border-t border-hairline pt-4 text-sm text-muted"
      >
        Punya bimbel sendiri?
        <NuxtLink to="/untuk-bimbel" class="font-semibold text-primary hover:underline">
          {{ application.data.value?.status === 'rejected' ? 'Ajukan ulang bimbelmu' : 'Daftarkan bimbelmu' }}
        </NuxtLink>
        untuk mengelola siswa dan menjual paketmu di Zenko.
      </p>
    </DashboardPanel>

    <AppModal
      :model-value="joinOpen"
      title="Gabung bimbel"
      description="Masukkan kode yang diberikan pengelola bimbel. Permintaanmu tetap perlu mereka setujui."
      @update:model-value="setJoinOpen"
    >
      <form class="grid gap-3" @submit.prevent="join">
        <AppInput
          v-model="joinCode"
          label="Kode bimbel"
          placeholder="Contoh: ZENKO123"
          autocomplete="off"
          :disabled="joining"
        />
        <AppInlineMessage v-if="joinError" type="error">{{ joinError }}</AppInlineMessage>
      </form>

      <template #footer>
        <AppButton variant="outline" size="sm" :disabled="joining" @click="setJoinOpen(false)">
          Batal
        </AppButton>
        <AppButton size="sm" :loading="joining" :disabled="!joinCode.trim() || joining" @click="join()">
          Kirim permintaan
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
