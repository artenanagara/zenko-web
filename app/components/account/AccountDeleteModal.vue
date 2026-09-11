<script setup lang="ts">
/**
 * Hapus akun — dibuka dari baris "Hapus akun" di tab Keamanan /akun/profil.
 *
 * Akibatnya per peran dibaca DI DALAM modal sebelum form, bukan ditemukan dari
 * pesan tolakan sesudah menekan: tutor tahu soal saldonya, owner tahu bimbelnya
 * ditutup. Server tetap yang memutuskan; ini hanya pratinjau akibatnya.
 *
 * Dua rem: frasa "HAPUS AKUN" yang harus diketik persis, dan kata sandi bila
 * akunnya punya. Akun Google-only tidak punya kata sandi, jadi kolomnya tetap
 * ada tapi boleh kosong — server yang tahu mana yang berlaku.
 */
const open = defineModel<boolean>('open', { required: true })

const toast = useToast()
const { user, deleteAccount } = useAuth()

const DELETE_PHRASE = 'HAPUS AKUN'
const form = reactive({ confirmation: '', password: '' })
const deleting = ref(false)
const deleteError = ref('')
const phraseOk = computed(() => form.confirmation.trim() === DELETE_PHRASE)

const isTutor = computed(() => user.value?.role === 'tutor')
const isAdmin = computed(() => user.value?.role === 'admin')
const { data: memberships, ensure: ensureMemberships } = useBimbelMemberships()
const ownedBimbels = computed(() => memberships.value.filter(m => m.role === 'owner' && m.status !== 'left'))
const managedBimbels = computed(() => memberships.value.filter(m => (m.role === 'admin' || m.role === 'teacher') && m.status !== 'left'))
const balance = useTutorBalance()
const owedAmount = computed(() => balance.data.value.available + balance.data.value.held)
const owesBalance = computed(() => owedAmount.value > 0)

/** Tidak ada gunanya menampilkan form kalau server pasti menolak. */
const blocked = computed(() => isAdmin.value || owesBalance.value)

watch(open, (isOpen) => {
  if (!isOpen) return
  form.confirmation = ''
  form.password = ''
  deleteError.value = ''
  void ensureMemberships()
})

onMounted(() => {
  // Saldo hanya ada untuk tutor dan owner bimbel; siswa biasa tidak punya
  // rute ini, jadi jangan memanggilnya untuk mereka.
  watch([isTutor, ownedBimbels], ([tutor, owned]) => {
    if (tutor || owned.length) void balance.refresh()
  }, { immediate: true })
})

async function onSubmit() {
  if (!phraseOk.value || deleting.value || blocked.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteAccount({ confirmation: form.confirmation.trim(), password: form.password })
    open.value = false
    toast.success('Akun kamu sudah dihapus.', 'Terima kasih sudah belajar bersama Zenko.')
    await navigateTo('/')
  }
  catch (cause) {
    deleteError.value = tutorApiMessage(cause, 'Akun belum berhasil dihapus. Coba lagi sebentar.')
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="open"
    title="Hapus akun secara permanen?"
    description="Nama, foto, dan email dilepas dari akun ini dan kamu keluar dari semua perangkat. Tidak bisa dipulihkan."
  >
    <!-- Isi bisa panjang untuk owner bimbel; gulir di dalam modal, bukan
         membiarkan modalnya melampaui viewport HP. -->
    <div class="-mx-6 -my-6 grid max-h-[60vh] gap-4 overflow-y-auto px-6 py-6">
      <p class="text-[0.88rem]">
        Paket yang sudah dibeli dan riwayat tryout-nya tidak bisa diakses lagi. Keanggotaan bimbel ikut dilepas.
        Email yang sama boleh dipakai untuk mendaftar lagi nanti.
      </p>

      <AppSectionMessage v-if="isAdmin" appearance="warning" title="Akun admin tidak bisa dihapus sendiri">
        Minta admin lain menurunkan peranmu dulu; setelah itu akun bisa dihapus dari sini.
      </AppSectionMessage>

      <AppSectionMessage v-else-if="owesBalance" appearance="warning" title="Masih ada saldo yang mengendap">
        Saldo {{ formatRupiah(owedAmount) }} belum dicairkan
        (tersedia {{ formatRupiah(balance.data.value.available) }}, sedang diproses {{ formatRupiah(balance.data.value.held) }}).
        Cairkan dulu, atau <strong class="font-semibold">hubungi admin Zenko</strong> — permintaan hapus akan ditolak selama saldo ini ada.
      </AppSectionMessage>

      <template v-else>
        <AppSectionMessage v-if="isTutor" appearance="information" title="Akun tutor">
          Semua paketmu diarsipkan — hilang dari katalog, tetapi siswa yang sudah membeli tetap bisa mengerjakannya.
          Kalau di kemudian hari ada saldo yang mengendap, hubungi admin Zenko.
        </AppSectionMessage>

        <AppSectionMessage v-if="ownedBimbels.length" appearance="warning" title="Kamu owner bimbel">
          <p>
            {{ ownedBimbels.map(b => b.bimbelName).join(', ') }} akan <strong class="font-semibold">ditutup</strong>:
            paket privatnya diarsipkan, semua anggota dilepas, dan setiap siswa aktif
            <strong class="font-semibold">diberi tahu lewat email</strong>. Kalau bimbelnya ingin diteruskan orang lain,
            alihkan kepemilikannya dulu dari Pengaturan bimbel.
          </p>
        </AppSectionMessage>

        <AppSectionMessage v-if="managedBimbels.length" appearance="information" title="Keanggotaan tim bimbel">
          Kamu keluar dari {{ managedBimbels.map(b => b.bimbelName).join(', ') }}; bimbelnya sendiri tidak berubah.
        </AppSectionMessage>

        <form id="delete-account-form" class="grid gap-4 border-t border-hairline pt-4" @submit.prevent="onSubmit">
          <FormField
            id="delete-confirmation"
            v-model="form.confirmation"
            :label="`Ketik ${DELETE_PHRASE} untuk melanjutkan`"
            :placeholder="DELETE_PHRASE"
            autocomplete="off"
            autocapitalize="characters"
          />
          <FormField
            id="delete-password"
            v-model="form.password"
            type="password"
            label="Kata sandi"
            placeholder="Kosongkan jika kamu selalu masuk lewat Google"
            autocomplete="current-password"
          />
          <AppInlineMessage v-if="deleteError" type="error">{{ deleteError }}</AppInlineMessage>
        </form>
      </template>
    </div>

    <template #footer>
      <AppButton variant="outline" size="sm" :disabled="deleting" @click="open = false">
        {{ blocked ? 'Tutup' : 'Batal' }}
      </AppButton>
      <AppButton
        v-if="!blocked"
        variant="danger"
        size="sm"
        type="submit"
        form="delete-account-form"
        :disabled="!phraseOk || deleting"
        :loading="deleting"
      >
        Hapus akun permanen
      </AppButton>
    </template>
  </AppModal>
</template>
