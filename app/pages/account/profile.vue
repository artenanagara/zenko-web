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
  title: 'Akun Saya | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { user, signOutAllDevices } = useAuth()
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
 * Tab — tiga ruang: siapa kamu (Profil), cara masuk dan pintu darurat
 * (Keamanan), dan tempat bertanya (Bantuan). Keamanan bukan tumpukan form:
 * tiap tindakannya satu baris menu yang membuka modal atau dialog sendiri.
 * Hapus akun ikut di sana — ia tindakan keamanan/akses, bukan tab sendiri.
 * ------------------------------------------------------------------------ */

const toast = useToast()
const route = useRoute()
const router = useRouter()

type TabId = 'profil' | 'keamanan' | 'bantuan'
const TABS: { id: TabId, label: string }[] = [
  { id: 'profil', label: 'Profil' },
  { id: 'keamanan', label: 'Keamanan' },
  { id: 'bantuan', label: 'Bantuan' },
]
const DEFAULT_TAB: TabId = 'profil'

function normalizeTab(value: unknown): TabId {
  return TABS.some(tab => tab.id === value) ? value as TabId : DEFAULT_TAB
}

// Dibaca saat setup, bukan onMounted, supaya tautan `?tab=bantuan` (mis. dari
// artikel Pusat Bantuan) langsung merender panel yang benar tanpa berkedip
// Profil dulu. `replace` menjaga pindah tab tidak menumpuk riwayat back.
const activeTab = ref<TabId>(normalizeTab(route.query.tab))
watch(() => route.query.tab, value => (activeTab.value = normalizeTab(value)))
watch(activeTab, (tab) => {
  if (normalizeTab(route.query.tab) === tab) return
  void router.replace({ query: { ...route.query, tab: tab === DEFAULT_TAB ? undefined : tab } })
})

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
 * Peran & akses — apa yang bisa dibuka akun ini, dan pintu ke sana. Siswa
 * yang belum jadi tutor melihat status pengajuannya (atau ajakan mengajukan);
 * tutor/admin melihat dashboard-nya; semua melihat bimbel yang diikuti.
 * ------------------------------------------------------------------------ */

const { data: memberships, ensure: ensureMemberships } = useBimbelMemberships()
const activeMemberships = computed(() => memberships.value.filter(m => m.status === 'active'))

const BIMBEL_ROLE_LABEL = { owner: 'Owner', admin: 'Admin', teacher: 'Pengajar', student: 'Siswa' } as const

const tutorApplication = useMyTutorApplication()

onMounted(() => {
  void ensureMemberships()
  // Hanya siswa yang punya pengajuan untuk dipantau; tutor sudah lewat, admin
  // tidak pernah mengajukan.
  watch(() => user.value?.role, (role) => {
    if (role === 'student') void tutorApplication.refresh()
  }, { immediate: true })
})

const roleDescription = computed(() => {
  switch (user.value?.role) {
    case 'admin': return 'Mengelola moderasi, pembayaran tutor, dan operasional Zenko.'
    case 'tutor': return 'Bisa membuat, menjual, dan memantau paket tryout — sekaligus tetap bisa membeli paket seperti siswa.'
    default: return 'Mencari, membeli, dan mengerjakan paket tryout.'
  }
})

/* --------------------------------------------------------------------------
 * Keamanan — kata sandi dan hapus akun masing-masing di modalnya sendiri
 * (AccountPasswordModal, AccountDeleteModal); keluar dari semua perangkat
 * cukup dialog konfirmasi karena tidak ada yang perlu diisi.
 * ------------------------------------------------------------------------ */

const passwordOpen = ref(false)
const deleteOpen = ref(false)

/* --------------------------------------------------------------------------
 * Keluar dari semua perangkat — server mem-bump session_version, jadi semua
 * sesi (termasuk perangkat ini) langsung tidak berlaku. Perlakukan sama
 * seperti logout biasa: bersihkan state auth lalu tinggalkan halaman terkunci
 * ini menuju beranda, apa pun hasil panggilannya (kita sudah dianggap keluar).
 * ------------------------------------------------------------------------ */

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
      <p class="mt-1.5 text-muted">Data akun, keamanan masuk, dan bantuan.</p>
    </header>

    <AppTabs v-model="activeTab" :tabs="TABS" aria-label="Bagian akun" />

    <!-- ============================================================ Profil -->
    <div v-show="activeTab === 'profil'" id="panel-profil" class="grid gap-6" role="tabpanel" aria-labelledby="tab-profil">
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

      <DashboardPanel title="Peran & akses" description="Apa yang bisa dibuka akun ini di Zenko.">
        <div v-if="user" class="divide-y divide-hairline">
          <AccountSettingRow
            :icon="user.role === 'admin' ? 'shield-check' : user.role === 'tutor' ? 'chalkboard-teacher' : 'student'"
            :title="`Peran: ${ROLE_LABEL[user.role]}`"
            :description="roleDescription"
          >
            <template #action>
              <AppButton v-if="user.role === 'admin'" to="/dashboard/admin" variant="outline" size="sm">
                Dashboard admin
              </AppButton>
              <AppButton v-else-if="user.role === 'tutor'" to="/dashboard/tutor" variant="outline" size="sm">
                Dashboard tutor
              </AppButton>
              <DashboardBadge v-else-if="tutorApplication.data.value?.status === 'pending'" tone="warning">
                Pengajuan tutor sedang ditinjau
              </DashboardBadge>
              <AppButton v-else to="/jadi-tutor" variant="outline" size="sm">
                {{ tutorApplication.data.value?.status === 'rejected' ? 'Ajukan tutor lagi' : 'Jadi tutor' }}
              </AppButton>
            </template>
          </AccountSettingRow>

          <AccountSettingRow
            icon="buildings"
            title="Bimbel"
            :description="activeMemberships.length
              ? activeMemberships.map(m => `${m.bimbelName} (${BIMBEL_ROLE_LABEL[m.role]})`).join(', ')
              : 'Belum tergabung di bimbel mana pun.'"
          >
            <template #action>
              <AppButton to="/akun/bimbel" variant="outline" size="sm">
                {{ activeMemberships.length ? 'Bimbel saya' : 'Lihat cara gabung' }}
              </AppButton>
            </template>
          </AccountSettingRow>
        </div>
      </DashboardPanel>
    </div>

    <!-- ========================================================== Keamanan -->
    <div v-show="activeTab === 'keamanan'" id="panel-keamanan" class="grid gap-6" role="tabpanel" aria-labelledby="tab-keamanan">
      <DashboardPanel title="Cara masuk" description="Kata sandi dan sesi yang sedang aktif di akunmu.">
        <div class="divide-y divide-hairline">
          <AccountSettingRow
            icon="key"
            title="Kata sandi"
            description="Ganti kata sandi yang kamu pakai untuk masuk dengan email."
          >
            <template #action>
              <AppButton variant="outline" size="sm" @click="passwordOpen = true">
                Ganti kata sandi
              </AppButton>
            </template>
          </AccountSettingRow>

          <AccountSettingRow
            icon="devices"
            title="Keluar dari semua perangkat"
            description="Akhiri semua sesi sekaligus, termasuk perangkat ini — kamu perlu masuk lagi setelahnya."
          >
            <template #action>
              <AppButton variant="outline" size="sm" :disabled="signingOutAll" @click="onSignOutAllDevices">
                {{ signingOutAll ? 'Mengeluarkan…' : 'Keluar semua' }}
              </AppButton>
            </template>
          </AccountSettingRow>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Zona berbahaya" description="Tindakan yang tidak bisa dibatalkan.">
        <AccountSettingRow
          icon="trash"
          tone="danger"
          title="Hapus akun"
          description="Menghapus akun Zenko-mu secara permanen beserta akses paket dan riwayat tryout."
        >
          <template #action>
            <AppButton variant="danger" size="sm" @click="deleteOpen = true">
              Hapus akun…
            </AppButton>
          </template>
        </AccountSettingRow>
      </DashboardPanel>
    </div>

    <!-- =========================================================== Bantuan -->
    <div v-show="activeTab === 'bantuan'" id="panel-bantuan" role="tabpanel" aria-labelledby="tab-bantuan">
      <AccountHelpPanel />
    </div>

    <AccountPasswordModal v-model:open="passwordOpen" />
    <AccountDeleteModal v-model:open="deleteOpen" />
  </div>
</template>
