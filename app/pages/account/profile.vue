<script setup lang="ts">
import { OtpInput } from '#components'
import type { Role } from '#shared/types/user'

// The settings side of the account: identity + sign-in security. The account
// landing (/akun) is now the Ringkasan; this is where the details live.
definePageMeta({
  path: '/akun/profil',
  layout: 'account',
  middleware: 'auth',
  // No `roles`: every signed-in account has an account page, whatever else
  // it may be. Tutors and admins buy packages too.
})

useHead({
  title: 'Profil & Pengaturan Akun | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { user, signOutAllDevices, deleteAccount } = useAuth()
const { confirm } = useConfirm()

const ROLE_LABEL: Record<Role, string> = {
  student: 'Siswa',
  tutor: 'Tutor',
  admin: 'Admin',
}

/** Same badge vocabulary as the navbar account menu, so a role reads alike. */
const ROLE_TONE: Record<Role, 'neutral' | 'brand'> = {
  student: 'neutral',
  tutor: 'brand',
  admin: 'neutral',
}

/* --------------------------------------------------------------------------
 * Tab — dua bagian yang tadinya ditumpuk (Profil, Kata sandi) sekarang
 * dipisah tab supaya halamannya tidak sepanjang gulungan.
 * ------------------------------------------------------------------------ */

const toast = useToast()

// "Hapus akun" tab sendiri, bukan panel di bawah kata sandi: ia tindakan
// sekali seumur akun dan berlaku untuk setiap peran, jadi tempatnya jelas
// dan terpisah dari pengaturan yang dibuka rutin.
const TABS = [
  { id: 'profil', label: 'Profil' },
  { id: 'kata-sandi', label: 'Keamanan' },
  { id: 'hapus-akun', label: 'Hapus akun' },
]
const activeTab = ref('profil')

/* --------------------------------------------------------------------------
 * Profil — baca-saja sampai "Edit profil" ditekan. Nama, foto, dan email
 * cuma bisa diubah dalam mode edit; email butuh kode konfirmasi ke alamat
 * barunya sebelum benar-benar berpindah (lihat requestEmailChange di bawah).
 * ------------------------------------------------------------------------ */

const editing = ref(false)
const draftName = ref('')
const draftEmail = ref('')

const profileSaving = ref(false)

/**
 * Field-level errors only. The outcome of a save — succeeded, or failed and
 * why — goes to a toast instead: this form sits far down a scrolled page, and
 * a line under the buttons is the one place the person who just pressed Simpan
 * is not looking.
 */
const nameError = ref('')
const emailError = ref('')

function clearFieldErrors() {
  nameError.value = ''
  emailError.value = ''
}

function startEditing() {
  draftName.value = user.value?.name ?? ''
  draftEmail.value = user.value?.email ?? ''
  clearFieldErrors()
  editing.value = true
}

function cancelEditing() {
  editing.value = false
  clearFieldErrors()
  cancelEmailStep()
}

async function saveProfile() {
  clearFieldErrors()

  const trimmedName = draftName.value.trim()
  if (!trimmedName) {
    nameError.value = 'Nama tidak boleh kosong.'
    focusField('account-name')
    toast.error('Nama belum diisi.')
    return
  }
  const trimmedEmail = draftEmail.value.trim().toLowerCase()
  if (!trimmedEmail) {
    emailError.value = 'Email tidak boleh kosong.'
    focusField('account-email')
    toast.error('Email belum diisi.')
    return
  }
  const emailChanged = trimmedEmail !== user.value?.email

  profileSaving.value = true
  try {
    if (trimmedName !== user.value?.name) {
      await updateAccountName(trimmedName)
    }

    if (emailChanged) {
      // Not applied yet — requestEmailChange only sends the code. The
      // address takes effect once confirmEmailCode succeeds below.
      await requestEmailChange(trimmedEmail)
      pendingEmail.value = trimmedEmail
      emailStep.value = 'awaiting-code'
      startResendCooldown()
      await nextTick()
      otpInputRef.value?.focusFirst()
    }
    else {
      editing.value = false
      toast.success('Profil tersimpan.')
    }
  }
  catch (cause) {
    toast.error('Profil belum berhasil disimpan.', accountApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    profileSaving.value = false
  }
}

/* --------------------------------------------------------------------------
 * Foto profil — pilih file langsung mengunggah dan menerapkannya, tanpa
 * tombol simpan terpisah: hanya tersedia dalam mode edit (tombol kameranya
 * disembunyikan di mode baca), tapi begitu file dipilih, langsung berlaku.
 * ------------------------------------------------------------------------ */

const avatarInputRef = useTemplateRef('avatarInputRef')
const avatarUploading = ref(false)

function pickAvatar() {
  avatarInputRef.value?.click()
}

async function onAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  avatarUploading.value = true
  try {
    await uploadAccountAvatar(file)
    toast.success('Foto profil diperbarui.')
  }
  catch (cause) {
    toast.error('Foto belum berhasil diunggah.', accountApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    avatarUploading.value = false
    // Supaya memilih file yang sama dua kali berturut-turut tetap memicu @change.
    input.value = ''
  }
}

/* --------------------------------------------------------------------------
 * Ganti email — dua langkah: kirim kode ke alamat baru (bagian dari
 * saveProfile di atas), lalu konfirmasi kode di sini. Alamat lama tetap
 * berlaku sampai kodenya benar.
 * ------------------------------------------------------------------------ */

const emailStep = ref<'idle' | 'awaiting-code'>('idle')
const pendingEmail = ref('')
const emailCode = ref('')
const otpInputRef = ref<InstanceType<typeof OtpInput> | null>(null)
const emailConfirmBusy = ref(false)
const emailConfirmError = ref('')

const resendSecondsLeft = ref(0)
let resendTimer: ReturnType<typeof setInterval> | null = null

function startResendCooldown() {
  resendSecondsLeft.value = 60
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendSecondsLeft.value -= 1
    if (resendSecondsLeft.value <= 0 && resendTimer) {
      clearInterval(resendTimer)
      resendTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (resendTimer) clearInterval(resendTimer)
})

async function confirmEmailCode() {
  emailConfirmError.value = ''
  const code = emailCode.value.trim()
  if (!/^\d{6}$/.test(code)) {
    emailConfirmError.value = 'Kode harus 6 digit angka.'
    return
  }

  emailConfirmBusy.value = true
  try {
    await confirmEmailChange(pendingEmail.value, code)
    emailStep.value = 'idle'
    emailCode.value = ''
    editing.value = false
    toast.success('Email baru aktif.', 'Mulai sekarang pakai alamat itu untuk masuk.')
  }
  catch (cause) {
    emailConfirmError.value = accountApiMessage(cause, 'Kode salah atau sudah kedaluwarsa.')
    emailCode.value = ''
    await nextTick()
    otpInputRef.value?.focusFirst()
  }
  finally {
    emailConfirmBusy.value = false
  }
}

// Auto-submit once 6 digits are in, so pasting or typing the last digit is
// enough — no separate tap on "Konfirmasi email" needed (verify-email.vue's
// same convenience).
watch(emailCode, (value) => {
  if (value.length === 6 && !emailConfirmBusy.value) confirmEmailCode()
})

async function resendEmailCode() {
  if (resendSecondsLeft.value > 0) return
  emailConfirmError.value = ''
  try {
    await requestEmailChange(pendingEmail.value)
    startResendCooldown()
  }
  catch (cause) {
    emailConfirmError.value = accountApiMessage(cause, 'Kode belum berhasil dikirim ulang.')
  }
}

/** Batalkan langkah kode saja — nama yang sudah tersimpan tetap, email kembali ke yang lama. */
function cancelEmailStep() {
  emailStep.value = 'idle'
  emailCode.value = ''
  emailConfirmError.value = ''
  draftEmail.value = user.value?.email ?? ''
  if (resendTimer) {
    clearInterval(resendTimer)
    resendTimer = null
  }
  resendSecondsLeft.value = 0
}

/* --------------------------------------------------------------------------
 * Kata sandi — tidak berubah dari sebelumnya, cuma pindah ke tabnya sendiri.
 * ------------------------------------------------------------------------ */

const { state, error, change, reset } = useAccountPassword()

const form = reactive({
  current: '',
  next: '',
  confirm: '',
})

const errors = reactive<{ current?: string, next?: string, confirm?: string }>({})

// Same strength grading as /daftar and /password-baru: one password must
// never be graded differently on different screens.
const strength = usePasswordStrength(toRef(form, 'next'))

const isSubmitting = computed(() => state.value === 'submitting')

function validate() {
  for (const key of Object.keys(errors) as (keyof typeof errors)[]) delete errors[key]

  if (!form.current) errors.current = 'Kata sandi saat ini wajib diisi.'

  if (!form.next) errors.next = 'Kata sandi baru wajib diisi.'
  else if (form.next.length < MIN_PASSWORD_LENGTH) {
    errors.next = `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`
  }
  else if (form.next === form.current) {
    errors.next = 'Kata sandi baru harus berbeda dari yang sekarang.'
  }

  if (!form.confirm) errors.confirm = 'Ulangi kata sandi baru.'
  else if (form.confirm !== form.next) errors.confirm = 'Kedua kata sandi belum sama.'

  return Object.keys(errors).length === 0
}

/** Field ids in the order they appear, so the first invalid one gets the caret. */
const PASSWORD_FIELD_IDS: Record<keyof typeof errors, string> = {
  current: 'current-password',
  next: 'new-password',
  confirm: 'confirm-password',
}

async function onSubmit() {
  reset()
  if (!validate()) {
    const firstInvalid = (Object.keys(PASSWORD_FIELD_IDS) as (keyof typeof errors)[])
      .find(key => errors[key])
    if (firstInvalid) {
      focusField(PASSWORD_FIELD_IDS[firstInvalid])
      toast.error('Ada kolom yang belum benar.', errors[firstInvalid])
    }
    return
  }

  await change(form.current, form.next)

  if (state.value === 'success') {
    form.current = ''
    form.next = ''
    form.confirm = ''
    toast.success('Kata sandi berhasil diganti.', 'Pakai yang baru saat masuk berikutnya.')
  }
  // "Belum tersambung" is the password-change endpoint being switched off, not
  // a failure the person did anything to cause — an amber toast, not a red one.
  else if (state.value === 'not-connected') {
    toast.warning('Ganti kata sandi belum tersambung.', error.value)
  }
  else if (state.value === 'error') {
    toast.error('Kata sandi belum berhasil diganti.', error.value)
  }
}

/* --------------------------------------------------------------------------
 * Keluar dari semua perangkat — server mem-bump session_version, jadi semua
 * sesi (termasuk perangkat ini) langsung tidak berlaku. Perlakukan sama
 * seperti logout biasa: bersihkan state auth lalu tinggalkan halaman terkunci
 * ini menuju beranda, apa pun hasil panggilannya (kita sudah dianggap keluar).
 * ------------------------------------------------------------------------ */

/* --------------------------------------------------------------------------
 * Hapus akun — hanya siswa; tutor/admin diarahkan ke tim Zenko (server yang
 * menolak, UI cuma tidak menawarkan). Dua rem: frasa "HAPUS AKUN" yang harus
 * diketik persis, dan kata sandi bila akunnya punya. Akun Google-only tidak
 * punya kata sandi, jadi kolomnya tetap ada tapi boleh kosong — server yang
 * tahu mana yang berlaku.
 * ------------------------------------------------------------------------ */

const DELETE_PHRASE = 'HAPUS AKUN'
const deleteOpen = ref(false)
const deleteForm = reactive({ confirmation: '', password: '' })
const deleting = ref(false)
const deleteError = ref('')
const deletePhraseOk = computed(() => deleteForm.confirmation.trim() === DELETE_PHRASE)

/**
 * Apa yang ikut pergi bersama akun ini, dibaca dari peran dan keanggotaan —
 * supaya tutor tahu soal saldonya dan owner tahu bimbelnya ditutup SEBELUM
 * menekan tombol, bukan dari pesan tolakan sesudahnya. Server tetap yang
 * memutuskan; ini hanya pratinjau akibatnya.
 */
const isTutor = computed(() => user.value?.role === 'tutor')
const isAdmin = computed(() => user.value?.role === 'admin')
const { data: memberships, ensure: ensureMemberships } = useBimbelMemberships()
const ownedBimbels = computed(() => memberships.value.filter(m => m.role === 'owner' && m.status !== 'left'))
const managedBimbels = computed(() => memberships.value.filter(m => (m.role === 'admin' || m.role === 'teacher') && m.status !== 'left'))
const balance = useTutorBalance()
const owesBalance = computed(() => balance.data.value.available + balance.data.value.held > 0)
const owedAmount = computed(() => balance.data.value.available + balance.data.value.held)

onMounted(() => {
  void ensureMemberships()
  // Saldo hanya ada untuk tutor dan owner bimbel; siswa biasa tidak punya
  // rute ini, jadi jangan memanggilnya untuk mereka.
  watch([isTutor, ownedBimbels], ([tutor, owned]) => {
    if (tutor || owned.length) void balance.refresh()
  }, { immediate: true })
})

function openDelete() {
  deleteForm.confirmation = ''
  deleteForm.password = ''
  deleteError.value = ''
  deleteOpen.value = true
}

async function onDeleteAccount() {
  if (!deletePhraseOk.value || deleting.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteAccount({ confirmation: deleteForm.confirmation.trim(), password: deleteForm.password })
    deleteOpen.value = false
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

const signingOutAll = ref(false)

async function onSignOutAllDevices() {
  const ok = await confirm({
    title: 'Keluar dari semua perangkat?',
    description:
      'Semua sesi Zenko akan diakhiri, termasuk perangkat yang sedang kamu pakai sekarang. Kamu perlu masuk lagi di tiap perangkat setelah ini.',
    confirmLabel: 'Keluar dari semua',
    cancelLabel: 'Batal',
  })
  if (!ok) return

  signingOutAll.value = true
  try {
    await signOutAllDevices()
  }
  finally {
    // signOutAllDevices() sudah membersihkan state auth di blok finally-nya,
    // jadi kita selalu dianggap keluar dari perangkat ini juga — pergi ke
    // beranda sama seperti alur logout biasa.
    await navigateTo('/')
  }
}
</script>

<template>
  <div class="grid gap-6">
    <header>
      <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">Akun saya</h1>
      <p class="mt-1.5 text-muted">Data akun dan keamanan masuk ke Zenko.</p>
    </header>

    <AppTabs v-model="activeTab" :tabs="TABS" aria-label="Bagian akun" />

    <div v-show="activeTab === 'profil'" id="panel-profil" role="tabpanel" aria-labelledby="tab-profil">
      <DashboardPanel title="Profil" description="Foto, nama, email, dan status verifikasi akunmu.">
        <!-- "Edit profil" adalah aksi tingkat bagian, jadi tempatnya di
             header panel bersebelahan dengan judulnya — bukan sebagai baris
             tersendiri di dalam badan panel, yang menyisakan pita kosong
             selebar kartu di atas blok identitas. -->
        <template #action>
          <AppButton v-if="user && !editing" variant="outline" size="sm" @click="startEditing">
            Edit profil
          </AppButton>
        </template>

        <div v-if="user" class="grid gap-5">
          <!-- Identitas berjalan horizontal: foto di kiri, kolom teks rata kiri
               di kanannya (nama, peran, email, status verifikasi) — tanpa kartu
               berbingkai, yang dulu membuat blok ini terbaca sebagai widget
               tersendiri alih-alih bagian isi panel. -->
          <div class="flex items-start gap-4">
            <span class="relative inline-flex shrink-0 rounded-full bg-linear-to-br from-primary-light to-primary p-0.5 shadow-lift">
              <img
                v-if="user.avatarUrl"
                :src="user.avatarUrl"
                alt=""
                referrerpolicy="no-referrer"
                class="h-16 w-16 rounded-full border-2 border-white object-cover"
              >
              <span
                v-else
                aria-hidden="true"
                class="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-surface-alt text-[1.3rem] font-bold text-muted"
              >{{ user.name.trim().charAt(0).toUpperCase() || '?' }}</span>

              <span
                v-if="user.verified"
                role="img"
                aria-label="Email terverifikasi"
                class="absolute -right-1 -bottom-1 inline-flex rounded-full bg-white p-0.5 shadow-xs"
              >
                <IconSeal class="h-4.5 w-4.5" />
              </span>

              <button
                v-if="editing"
                type="button"
                class="absolute -bottom-1 -left-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface shadow-xs transition-colors hover:bg-surface-alt disabled:pointer-events-none disabled:opacity-60"
                aria-label="Ganti foto profil"
                :disabled="avatarUploading"
                @click="pickAvatar"
              >
                <IconSpinner v-if="avatarUploading" class="h-3.5 w-3.5 animate-spin text-muted" />
                <AppIcon v-else name="camera" :size="14" />
              </button>
              <input
                ref="avatarInputRef"
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                class="hidden"
                @change="onAvatarSelected"
              >
            </span>

            <div class="min-w-0 flex-1">
              <p class="text-[1.2rem] font-bold tracking-[-0.03em]">{{ user.name }}</p>

              <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <DashboardBadge :tone="ROLE_TONE[user.role]">{{ ROLE_LABEL[user.role] }}</DashboardBadge>
                <p class="text-[0.9rem] break-all text-muted">{{ user.email }}</p>
              </div>

              <div class="mt-2 flex flex-wrap items-center gap-3">
                <DashboardBadge :tone="user.verified ? 'success' : 'warning'">
                  {{ user.verified ? 'Email terverifikasi' : 'Email belum terverifikasi' }}
                </DashboardBadge>
                <AppButton v-if="!user.verified" to="/verifikasi-email" variant="light" size="sm">
                  Verifikasi email
                </AppButton>
              </div>
            </div>
          </div>

          <!-- Mode edit: nama dan email jadi bisa diubah, dikunci di balik
               tombol Edit di atas sampai ditekan. -->
          <form
            v-if="editing && emailStep === 'idle'"
            class="grid max-w-100 gap-4 border-t border-hairline pt-5"
            @submit.prevent="saveProfile"
          >
            <FormField
              id="account-name"
              v-model="draftName"
              label="Nama lengkap"
              placeholder="Nama kamu"
              autocomplete="name"
              :error="nameError"
              class="scroll-mt-24"
            />

            <FormField
              id="account-email"
              v-model="draftEmail"
              label="Email"
              type="email"
              placeholder="email@contoh.com"
              autocomplete="email"
              hint="Kalau diubah, kami kirim kode konfirmasi ke alamat barunya dulu."
              :error="emailError"
              class="scroll-mt-24"
            />

            <div class="flex items-center gap-3">
              <AppButton type="submit" size="sm" :disabled="profileSaving" :loading="profileSaving">
                Simpan
              </AppButton>
              <AppButton type="button" variant="outline" size="sm" :disabled="profileSaving" @click="cancelEditing">
                Batal
              </AppButton>
            </div>
          </form>

          <!-- Menunggu kode: alamat lama masih berlaku sampai kode ini benar. -->
          <form
            v-else-if="editing && emailStep === 'awaiting-code'"
            class="grid max-w-100 gap-4 border-t border-hairline pt-5"
            @submit.prevent="confirmEmailCode"
          >
            <AppInlineMessage type="info">
              Kode verifikasi telah dikirim ke <strong>{{ pendingEmail }}</strong>. Masukkan kode di bawah untuk mengaktifkan email baru. Sebelum kode diverifikasi, email lamamu masih tetap aktif.
            </AppInlineMessage>

            <div>
              <label for="account-email-code-0" class="mb-2 block text-[0.9rem] font-semibold">
                Kode konfirmasi
              </label>
              <OtpInput
                id="account-email-code-0"
                ref="otpInputRef"
                v-model="emailCode"
                :disabled="emailConfirmBusy"
                :error="Boolean(emailConfirmError)"
                :described-by="emailConfirmError ? 'account-email-code-error' : undefined"
              />
              <p v-if="emailConfirmError" id="account-email-code-error" role="alert" class="mt-2 text-[0.82rem] text-red-600">
                {{ emailConfirmError }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <AppButton type="submit" size="sm" :disabled="emailConfirmBusy" :loading="emailConfirmBusy">
                Konfirmasi email
              </AppButton>
              <button
                type="button"
                class="text-[0.86rem] font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                :disabled="resendSecondsLeft > 0"
                @click="resendEmailCode"
              >
                {{ resendSecondsLeft > 0 ? `Kirim ulang (${resendSecondsLeft}s)` : 'Kirim ulang kode' }}
              </button>
            </div>

            <button
              type="button"
              class="justify-self-start text-[0.82rem] font-semibold text-muted hover:text-ink hover:underline"
              @click="cancelEmailStep"
            >
              Batalkan ganti email
            </button>
          </form>
        </div>

        <!-- Skeleton mirrors the profile's shape, so the panel does not jump from
             a line of text to a full block when the session loads. -->
        <div v-else class="grid gap-5">
          <p class="sr-only" role="status">Memuat data akun…</p>
          <div class="flex items-center gap-4" aria-hidden="true">
            <span class="h-14 w-14 shrink-0 animate-pulse rounded-full bg-skeleton" />
            <div class="grid gap-2">
              <span class="block h-4 w-40 animate-pulse rounded-pill bg-skeleton" />
              <span class="block h-3 w-56 animate-pulse rounded-pill bg-skeleton" />
            </div>
          </div>
          <div class="grid gap-3" aria-hidden="true">
            <span v-for="n in 4" :key="n" class="block h-3 w-full animate-pulse rounded-pill bg-skeleton" />
          </div>
        </div>
      </DashboardPanel>
    </div>

    <div v-show="activeTab === 'kata-sandi'" id="panel-kata-sandi" class="grid gap-6" role="tabpanel" aria-labelledby="tab-kata-sandi">
      <DashboardPanel
        title="Kata sandi"
        description="Ganti kata sandi yang kamu pakai untuk masuk dengan email."
      >
        <form class="grid max-w-100 gap-5" novalidate @submit.prevent="onSubmit">
          <FormField
            id="current-password"
            v-model="form.current"
            label="Kata sandi saat ini"
            type="password"
            autocomplete="current-password"
            placeholder="Kata sandi yang sekarang"
            :error="errors.current"
          >
            <template #action>
              <NuxtLink
                to="/lupa-password"
                class="text-[0.82rem] font-semibold text-primary transition-colors hover:text-primary-light"
              >
                Lupa kata sandi?
              </NuxtLink>
            </template>
          </FormField>

          <FormField
            id="new-password"
            v-model="form.next"
            label="Kata sandi baru"
            type="password"
            autocomplete="new-password"
            placeholder="Minimal 8 karakter"
            :error="errors.next"
          >
            <template #below>
              <div v-if="form.next" class="mt-2.5 flex items-center gap-3">
                <div class="flex flex-1 gap-1.5" aria-hidden="true">
                  <span
                    v-for="level in 3"
                    :key="level"
                    class="h-1 flex-1 rounded-pill transition-colors duration-200"
                    :class="level <= strength.score ? strength.tone : 'bg-line'"
                  />
                </div>
                <span class="text-[0.78rem] font-semibold text-muted">{{ strength.label }}</span>
              </div>
            </template>
          </FormField>

          <FormField
            id="confirm-password"
            v-model="form.confirm"
            label="Ulangi kata sandi baru"
            type="password"
            autocomplete="new-password"
            placeholder="Ketik ulang kata sandi baru"
            :error="errors.confirm"
          />

          <div>
            <AppButton type="submit" size="sm" :disabled="isSubmitting">
              {{ isSubmitting ? 'Menyimpan…' : 'Simpan kata sandi' }}
            </AppButton>
          </div>

          <p class="text-[0.82rem] text-muted">
            Jika kamu mendaftar atau selalu masuk menggunakan akun Google, kamu bisa mengatur kata sandi baru melalui <NuxtLink to="/lupa-password" class="font-semibold text-primary hover:text-primary-light">tautan pemulihan kata sandi</NuxtLink>.
          </p>
        </form>
      </DashboardPanel>

      <!-- Keamanan lintas perangkat: akhiri semua sesi sekaligus, termasuk
           perangkat ini. Ditaruh di tab yang sama dengan kata sandi karena
           keduanya soal mengamankan akses masuk. -->
      <DashboardPanel
        title="Perangkat lain"
        description="Akhiri semua sesi yang masih masuk ke akun Zenko-mu sekaligus."
      >
        <div class="grid max-w-125 gap-4">
          <div class="flex items-start gap-3">
            <span
              aria-hidden="true"
              class="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt text-muted"
            >
              <AppIcon name="devices" :size="20" />
            </span>
            <p class="text-[0.9rem] text-muted">
              Kalau kamu pernah masuk di perangkat umum atau merasa akunmu dipakai orang lain, keluarkan akun dari semua tempat sekaligus. Tindakan ini <strong class="font-semibold text-ink">mengeluarkan akun dari semua perangkat, termasuk yang sedang kamu pakai sekarang</strong> — kamu perlu masuk lagi setelahnya.
            </p>
          </div>

          <div>
            <AppButton
              variant="danger"
              size="sm"
              :disabled="signingOutAll"
              @click="onSignOutAllDevices"
            >
              <AppIcon name="sign-out" :size="16" />
              {{ signingOutAll ? 'Mengeluarkan…' : 'Keluar dari semua perangkat' }}
            </AppButton>
          </div>
        </div>
      </DashboardPanel>

    </div>

    <div v-show="activeTab === 'hapus-akun'" id="panel-hapus-akun" class="grid gap-6" role="tabpanel" aria-labelledby="tab-hapus-akun">
      <DashboardPanel title="Hapus akun" description="Menghapus akun Zenko-mu secara permanen.">
        <div class="grid max-w-150 gap-5">
          <div class="flex items-start gap-3">
            <span aria-hidden="true" class="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
              <AppIcon name="trash" :size="20" />
            </span>
            <div class="grid gap-3 text-[0.9rem] text-muted">
              <p>
                Nama, foto, dan email dilepas dari akun ini dan kamu keluar dari semua perangkat.
                <strong class="font-semibold text-ink">Tidak bisa dipulihkan.</strong>
                Email yang sama boleh dipakai untuk mendaftar lagi nanti.
              </p>
              <p>
                Paket yang sudah dibeli dan riwayat tryout-nya tidak bisa diakses lagi. Keanggotaan bimbel ikut dilepas.
              </p>
            </div>
          </div>

          <!-- Akibat per peran, dibaca sebelum tombol — bukan ditemukan dari
               pesan tolakan sesudah menekan. -->
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
          </template>

          <div>
            <AppButton variant="danger" size="sm" :disabled="isAdmin || owesBalance" @click="openDelete">
              Hapus akun saya…
            </AppButton>
          </div>
        </div>
      </DashboardPanel>
    </div>

    <AppModal
      v-model="deleteOpen"
      title="Hapus akun secara permanen?"
      description="Tindakan ini tidak bisa dibatalkan. Untuk melanjutkan, ketik frasa di bawah dan masukkan kata sandimu."
    >
      <form id="delete-account-form" class="grid gap-4" @submit.prevent="onDeleteAccount">
        <FormField
          id="delete-confirmation"
          v-model="deleteForm.confirmation"
          :label="`Ketik ${DELETE_PHRASE}`"
          :placeholder="DELETE_PHRASE"
          autocomplete="off"
          autocapitalize="characters"
        />
        <FormField
          id="delete-password"
          v-model="deleteForm.password"
          type="password"
          label="Kata sandi"
          placeholder="Kosongkan jika kamu selalu masuk lewat Google"
          autocomplete="current-password"
        />
        <AppInlineMessage v-if="deleteError" type="error">{{ deleteError }}</AppInlineMessage>
      </form>
      <template #footer>
        <AppButton variant="outline" size="sm" :disabled="deleting" @click="deleteOpen = false">Batal</AppButton>
        <AppButton
          variant="danger"
          size="sm"
          type="submit"
          form="delete-account-form"
          :disabled="!deletePhraseOk || deleting"
          :loading="deleting"
        >
          Hapus akun permanen
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
