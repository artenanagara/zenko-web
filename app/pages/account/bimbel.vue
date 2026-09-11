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

const { data: memberships, pending: membershipsPending, error: membershipsError, refresh } = useBimbelMemberships()
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
 * Keanggotaan yang belum membuka apa pun, dan karena itu satu-satunya yang
 * masih perlu disebut di halaman ini.
 *
 * Keanggotaan aktif tidak: paketnya sudah tampil di bawah lengkap dengan nama
 * bimbelnya, dan ruang kerja pengelola dibuka dari menu profil. Yang tersisa
 * adalah keadaan yang tidak menghasilkan apa pun di layar dan tetap butuh
 * penjelasan — permintaan bergabung yang belum dijawab, dan keanggotaan yang
 * ditangguhkan. Tanpa ini keduanya jadi tak terlihat sama sekali, dan siswa
 * yang baru memasukkan kode akan melihat halaman kosong tanpa tahu kenapa.
 *
 * `invited` tidak ikut: undangan punya panelnya sendiri di atas, lengkap dengan
 * tombol jawabannya.
 */
const waiting = computed(() =>
  memberships.value.filter(item => item.status === 'pending' || item.status === 'suspended'),
)

/** Keanggotaan aktif menggantikan ajakan bergabung: sesudah masuk, yang perlu
 * dilihat siswa adalah bimbel mana yang sedang membuka paketnya. */
const activeMemberships = computed(() =>
  memberships.value.filter(item => item.status === 'active'),
)

function waitingNote(item: BimbelMembership): string {
  return item.status === 'suspended'
    ? `Keanggotaanmu di ${item.bimbelName} sedang ditangguhkan, jadi paketnya tidak terbuka. Hubungi pengelola bimbelmu.`
    : `Permintaan bergabung ke ${item.bimbelName} sudah terkirim dan menunggu persetujuan pengelolanya.`
}

/**
 * Pengajuan yang masih punya kabar untuk disampaikan. Yang `approved` sudah
 * jadi keanggotaan, dan pintunya ada di menu profil.
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
    toast.error('Jawaban undangan belum terkirim.', tutorApiMessage(cause, 'Coba lagi sebentar.'))
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
        <div
          v-if="activeMemberships.length"
          class="inline-flex max-w-full items-center gap-2 rounded-md border border-hairline bg-surface px-3 py-2 text-sm"
        >
          <AppIcon name="buildings" :size="17" class="shrink-0 text-primary" aria-hidden="true" />
          <span class="truncate font-semibold">{{ activeMemberships[0]!.bimbelName }}</span>
          <span v-if="activeMemberships.length > 1" class="shrink-0 text-muted">
            +{{ activeMemberships.length - 1 }}
          </span>
        </div>
        <AppButton v-else-if="!membershipsPending" size="sm" @click="openJoin()">Gabung bimbel</AppButton>
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

    <!-- Keanggotaan yang belum membuka apa pun. Satu baris pesan, bukan kartu:
         tidak ada yang bisa dilakukan pengguna di sini selain menunggu. -->
    <AppSectionMessage
      v-for="item in waiting"
      :key="item.bimbelId"
      :appearance="item.status === 'suspended' ? 'warning' : 'information'"
      :title="item.status === 'suspended' ? 'Keanggotaan ditangguhkan' : 'Menunggu persetujuan'"
    >
      {{ waitingNote(item) }}
    </AppSectionMessage>

    <AccountError v-if="membershipsError" @retry="refresh">
      Informasi keanggotaan bimbel belum berhasil dimuat.
    </AccountError>

    <section v-if="activeMemberships.length" aria-labelledby="bimbel-terhubung-title">
      <h2 id="bimbel-terhubung-title" class="text-[1.05rem] font-bold tracking-[-0.025em]">
        Bimbel terhubung
      </h2>
      <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="item in activeMemberships"
          :key="item.bimbelId"
          class="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4 shadow-xs"
        >
          <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-primary">
            <img v-if="item.logoUrl" :src="item.logoUrl" :alt="`Logo ${item.bimbelName}`" class="h-full w-full object-cover">
            <AppIcon v-else name="buildings" :size="21" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <h3 class="truncate font-bold">{{ item.bimbelName }}</h3>
            <p class="mt-0.5 text-[0.82rem] text-muted">
              {{ ROLE_LABEL[item.role] }} · Keanggotaan aktif
            </p>
          </div>
        </article>
      </div>
    </section>

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

      <div
        v-else-if="packages.data.value.length"
        class="@container"
      >
        <div class="grid gap-5 @min-[520px]:grid-cols-2 @min-[900px]:grid-cols-3">
          <BimbelPackageCard
          v-for="item in packages.data.value"
          :key="`${item.bimbelId}-${item.productId}`"
          :item="item"
          />
        </div>
      </div>

      <AppEmptyState
        v-else
        title="Paket bimbelnya masih kosong"
        description="Bank soal bimbel muncul di sini setelah keanggotaanmu aktif. Gabung dengan kode dari pengelola bimbelmu."
        :action-label="activeMemberships.length ? undefined : 'Gabung bimbel'"
        @action="activeMemberships.length ? undefined : openJoin()"
      />
    </DashboardPanel>

    <!-- Pintu ke sisi pengelola, di kaki halaman karena di situlah
         pertanyaannya muncul setelah semua yang di atas dibaca: "kalau bimbelku
         sendiri, bagaimana?" -->
    <p
      v-if="!application.data.value || application.data.value.status === 'rejected'"
      class="text-sm text-muted"
    >
      Punya bimbel sendiri?
      <NuxtLink to="/untuk-bimbel" class="font-semibold text-primary hover:underline">
        {{ application.data.value?.status === 'rejected' ? 'Ajukan ulang bimbelmu' : 'Daftarkan bimbelmu' }}
      </NuxtLink>
      untuk mengelola siswa dan menjual paketmu di Zenko.
    </p>

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
