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

const { user } = useAuth()

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

const TABS = [
  { id: 'profil', label: 'Profil' },
  { id: 'kata-sandi', label: 'Kata sandi' },
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
const profileError = ref('')
const profileSaved = ref(false)

function startEditing() {
  draftName.value = user.value?.name ?? ''
  draftEmail.value = user.value?.email ?? ''
  profileError.value = ''
  profileSaved.value = false
  editing.value = true
}

function cancelEditing() {
  editing.value = false
  profileError.value = ''
  cancelEmailStep()
}

async function saveProfile() {
  profileError.value = ''
  profileSaved.value = false

  const trimmedName = draftName.value.trim()
  if (!trimmedName) {
    profileError.value = 'Nama tidak boleh kosong.'
    return
  }
  const trimmedEmail = draftEmail.value.trim().toLowerCase()
  if (!trimmedEmail) {
    profileError.value = 'Email tidak boleh kosong.'
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
      profileSaved.value = true
    }
  }
  catch (cause) {
    profileError.value = accountApiMessage(cause, 'Gagal menyimpan profil. Coba lagi sebentar lagi.')
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
const avatarError = ref('')

function pickAvatar() {
  avatarInputRef.value?.click()
}

async function onAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  avatarError.value = ''
  avatarUploading.value = true
  try {
    await uploadAccountAvatar(file)
  }
  catch (cause) {
    avatarError.value = accountApiMessage(cause, 'Gagal mengunggah foto. Coba lagi sebentar lagi.')
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
    profileSaved.value = true
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
    emailConfirmError.value = accountApiMessage(cause, 'Gagal mengirim ulang kode.')
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

async function onSubmit() {
  reset()
  if (!validate()) return

  await change(form.current, form.next)

  if (state.value === 'success') {
    form.current = ''
    form.next = ''
    form.confirm = ''
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
        <div v-if="user" class="grid gap-5">
          <!-- "Edit profil" bukan baris identitas keempat — ini aksi tingkat
               bagian, jadi tempatnya di atas blok identitas dan rata kanan. -->
          <div v-if="!editing" class="flex justify-end">
            <AppButton variant="outline" size="sm" @click="startEditing">
              Edit profil
            </AppButton>
          </div>

          <!-- Identitas berjalan horizontal: foto di kiri, kolom teks rata kiri
               di kanannya (nama, peran, email, status verifikasi) — tanpa kartu
               berbingkai, yang dulu membuat blok ini terbaca sebagai widget
               tersendiri alih-alih bagian isi panel. -->
          <div class="flex items-center gap-4">
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

          <AppInlineMessage v-if="avatarError" type="error">{{ avatarError }}</AppInlineMessage>
          <AppInlineMessage v-if="!editing && profileSaved" type="confirmation">Profil tersimpan.</AppInlineMessage>

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
            />

            <FormField
              id="account-email"
              v-model="draftEmail"
              label="Email"
              type="email"
              placeholder="email@contoh.com"
              autocomplete="email"
              hint="Kalau diubah, kami kirim kode konfirmasi ke alamat barunya dulu."
            />

            <AppInlineMessage v-if="profileError" type="error">{{ profileError }}</AppInlineMessage>

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

    <div v-show="activeTab === 'kata-sandi'" id="panel-kata-sandi" role="tabpanel" aria-labelledby="tab-kata-sandi">
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

          <p
            v-if="state === 'success'"
            class="rounded-sm border border-success/30 bg-success-soft px-4 py-3 text-[0.86rem] text-success-ink"
            role="status"
          >
            Kata sandi berhasil diganti. Pakai yang baru saat masuk berikutnya.
          </p>

          <!-- "Belum tersambung" is an amber notice, not a failure. -->
          <p
            v-else-if="state === 'not-connected'"
            class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
            role="status"
          >
            {{ error }}
          </p>

          <!-- A real failure (wrong password, server down) is red, like the
               field errors — never amber, which reads as a mere warning. -->
          <p
            v-else-if="state === 'error'"
            class="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[0.86rem] text-red-700"
            role="alert"
          >
            <IconAlert class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ error }}</span>
          </p>

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
    </div>
  </div>
</template>
