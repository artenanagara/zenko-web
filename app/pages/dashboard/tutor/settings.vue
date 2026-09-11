<script setup lang="ts">
/**
 * Profil tutor + rekening bank. Rekening dulu dikelola di
 * /dashboard/tutor/payouts, tapi dipindah ke sini per keputusan terbaru —
 * pencairan cuma perlu akses baca (last-4 + gating tombol Cairkan), jadi
 * editnya lebih pas hidup di Pengaturan bareng data profil tutor lainnya.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Pengaturan | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { user } = useAuth()
const route = useRoute()
const router = useRouter()

/* --------------------------------------------------------------------------
 * Tab — profil tutor dan rekening bank dipisah agar halaman lebih ringkas.
 * Hash dipertahankan supaya tautan lama dari halaman Pencairan tetap langsung
 * membuka Rekening bank, dan pilihan tab bisa dibagikan atau dimuat ulang.
 * ------------------------------------------------------------------------ */

// Nama dan foto akun (login, email) tidak ada di sini: itu urusan
// /akun/profil bersama akun siswa. Dashboard tutor hanya mengurus apa yang
// tampil ke siswa dan ke mana uangnya dicairkan.
const SETTINGS_TABS = [
  { id: 'publik', label: 'Profil publik' },
  { id: 'ulasan', label: 'Ulasan siswa' },
  { id: 'rekening', label: 'Rekening bank' },
]
type SettingsTab = 'publik' | 'ulasan' | 'rekening'

function tabFromHash(hash: string): SettingsTab {
  if (hash === '#rekening') return 'rekening'
  if (hash === '#ulasan') return 'ulasan'
  return 'publik'
}

const activeTab = ref<SettingsTab>(tabFromHash(route.hash))

watch(() => route.hash, (hash) => {
  const nextTab = tabFromHash(hash)
  if (activeTab.value !== nextTab) activeTab.value = nextTab
})

watch(activeTab, (tab) => {
  const nextHash = tab === 'publik' ? '' : `#${tab}`
  if (route.hash !== nextHash) void router.replace({ hash: nextHash })
})

const { data: bankAccount, pending: bankPending, refresh: refreshBankAccount } = useTutorBankAccount()
const {
  data: changeRequest,
  pending: changeRequestPending,
  refresh: refreshChangeRequest,
} = useTutorBankAccountChangeRequest()
const { data: tutorProfile, pending: tutorProfilePending, refresh: refreshTutorProfile } = useTutorProfile()
const tutorReviews = useTutorReviews()
const replyDrafts = reactive<Record<string, string>>({})
const toast = useToast()

// Client-only fetch: the session cookie never reaches the Nuxt server, so
// this resolves after hydration (see useTutorEarnings).
onMounted(() => {
  refreshBankAccount()
  refreshChangeRequest()
  refreshTutorProfile()
  tutorReviews.refresh()
})

watch(() => tutorReviews.data.value, (reviews) => {
  for (const review of reviews) replyDrafts[review.id] = review.tutorReplyText || ''
}, { deep: true })

/**
 * Textarea balasan per ulasan, dipakai untuk memindahkan fokus ke kolom yang
 * bermasalah — bukan reaktif, hanya dibaca saat submit.
 */
const replyFields: Record<string, HTMLTextAreaElement | null> = {}

function setReplyField(reviewId: string, el: unknown) {
  replyFields[reviewId] = (el as HTMLTextAreaElement | null) ?? null
}

async function replyToReview(reviewId: string) {
  const draft = (replyDrafts[reviewId] || '').trim()
  if (!draft) {
    const field = replyFields[reviewId]
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    field?.focus({ preventScroll: true })
    toast.error('Balasan masih kosong.', 'Tulis dulu balasanmu sebelum mengirim.')
    return
  }

  try {
    await tutorReviews.reply(reviewId, draft)
    toast.success('Balasan terkirim.', 'Balasanmu tampil di bawah ulasan siswa itu.')
  }
  catch (cause) {
    toast.error('Balasan belum berhasil dikirim.', tutorApiMessage(cause, 'Coba lagi sebentar.'))
  }
}

/* --------------------------------------------------------------------------
 * Profil publik tutor — nama tampilan, foto, username, bio, pengalaman,
 * spesialisasi, pendidikan, tautan. Terpisah dari nama/foto akun, yang
 * diedit lewat /akun/profil bareng akun siswa.
 *
 * Dibuka sebagai tampilan baca dulu, bukan form: yang paling sering
 * dilakukan tutor di sini adalah memastikan profilnya sudah benar, bukan
 * mengubahnya, dan sebelas kolom input yang selalu terbuka membuat "sudah
 * benar" sulit dibaca sekilas. Tombol Edit membuka form; Batal
 * mengembalikan draft ke data tersimpan.
 * ------------------------------------------------------------------------ */

const profileForm = reactive({
  displayName: '',
  avatarUrl: '',
  username: '',
  bio: '',
  experience: '',
  specializations: [] as string[],
  education: '',
  portfolioUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  linkedinUrl: '',
  youtubeUrl: '',
  websiteUrl: '',
})
const profileSaving = ref(false)
const profileEditing = ref(false)
const specializationInput = ref('')

/**
 * Username diisi server dari nama depan tutor begitu profil pertama kali
 * dibuka, jadi kolom ini tidak pernah kosong dan selalu boleh diubah. Yang
 * dibatasi server hanya frekuensinya: satu kali per 30 hari setelah tutor
 * sendiri menggantinya (default dari server tidak menghitung).
 */
const USERNAME_HINT = '3–30 karakter, huruf kecil, angka, atau tanda hubung. Diambil dari nama depanmu; boleh diganti, sekali per 30 hari.'

/** Nama dan foto yang benar-benar tampil ke siswa, dengan fallback akun. */
const publicName = computed(() => tutorProfile.value?.displayName.trim() || user.value?.name || '')
const publicAvatar = computed(() => tutorProfile.value?.avatarUrl || user.value?.avatarUrl || '')

const PROFILE_LINKS = [
  { key: 'portfolioUrl', label: 'Portofolio' },
  { key: 'instagramUrl', label: 'Instagram' },
  { key: 'tiktokUrl', label: 'TikTok' },
  { key: 'linkedinUrl', label: 'LinkedIn' },
  { key: 'youtubeUrl', label: 'YouTube' },
  { key: 'websiteUrl', label: 'Website' },
] as const

const publicLinks = computed(() => {
  const profile = tutorProfile.value
  if (!profile) return []
  return PROFILE_LINKS
    .map(link => ({ label: link.label, url: profile[link.key] }))
    .filter(link => link.url)
})

/** Salin profil tersimpan ke draft — dipakai saat data tiba dan saat Batal. */
function resetProfileForm() {
  const profile = tutorProfile.value
  if (!profile) return
  profileForm.displayName = profile.displayName
  profileForm.avatarUrl = profile.avatarUrl
  profileForm.username = profile.username
  profileForm.bio = profile.bio
  profileForm.experience = profile.experience
  profileForm.specializations = [...profile.specializations]
  profileForm.education = profile.education
  profileForm.portfolioUrl = profile.portfolioUrl
  profileForm.instagramUrl = profile.instagramUrl
  profileForm.tiktokUrl = profile.tiktokUrl
  profileForm.linkedinUrl = profile.linkedinUrl
  profileForm.youtubeUrl = profile.youtubeUrl
  profileForm.websiteUrl = profile.websiteUrl
}

// Bukan binding langsung, supaya draft yang sedang diketik tidak ketimpa
// kalau refresh datang lagi selagi form terbuka.
watch(tutorProfile, () => {
  if (!profileEditing.value) resetProfileForm()
}, { immediate: true })

function startEditingProfile() {
  resetProfileForm()
  specializationInput.value = ''
  profileEditing.value = true
}

function cancelEditingProfile() {
  resetProfileForm()
  specializationInput.value = ''
  profileEditing.value = false
}

const publicAvatarInputRef = useTemplateRef('publicAvatarInputRef')
const publicAvatarUploading = ref(false)

function pickPublicAvatar() {
  publicAvatarInputRef.value?.click()
}

async function onPublicAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  publicAvatarUploading.value = true
  try {
    profileForm.avatarUrl = await uploadTutorImage(file)
    toast.success('Foto publik terunggah.', 'Tekan Simpan profil supaya perubahannya berlaku.')
  }
  catch (cause) {
    toast.error('Foto publik belum berhasil diunggah.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    publicAvatarUploading.value = false
    input.value = ''
  }
}

function addSpecialization() {
  const tag = specializationInput.value.trim()
  specializationInput.value = ''
  if (!tag) return
  if (profileForm.specializations.some(existing => existing.toLowerCase() === tag.toLowerCase())) return
  if (profileForm.specializations.length >= 10) return
  profileForm.specializations.push(tag)
}

function removeSpecialization(index: number) {
  profileForm.specializations.splice(index, 1)
}

/** Enter atau koma menambah tag; Backspace di input kosong menghapus yang terakhir. */
function onSpecializationKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addSpecialization()
  }
  else if (event.key === 'Backspace' && specializationInput.value === '' && profileForm.specializations.length > 0) {
    removeSpecialization(profileForm.specializations.length - 1)
  }
}

async function saveProfile() {
  addSpecialization()
  profileSaving.value = true
  try {
    await saveTutorProfile({ ...profileForm })
    profileEditing.value = false
    await refreshTutorProfile()
    toast.success('Profil tersimpan.', 'Perubahannya sudah tampil di halaman profil publikmu.')
  }
  catch (cause) {
    // Username tabrakan: server (409) sudah menyiapkan alternatif — nama
    // yang sama plus angka acak. Taruh langsung di kolomnya supaya tutor
    // tinggal menekan Simpan lagi, atau mengetik yang lain.
    const suggestion = (cause as { data?: { suggestion?: string } })?.data?.suggestion
    if (suggestion) {
      profileForm.username = suggestion
      toast.error('Username sudah dipakai.', `Kami sarankan ${suggestion} — sudah diisi di kolom username. Simpan lagi, atau ganti sesukamu.`)
      return
    }
    toast.error('Profil belum berhasil disimpan.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    profileSaving.value = false
  }
}

/* --------------------------------------------------------------------------
 * Rekening bank — tiga state:
 *  1. Belum ada rekening: form biasa, simpan via PUT.
 *  2. Rekening tersimpan, tidak ada pengajuan pending: tampilan baca-saja +
 *     badge verifikasi, dengan tombol untuk mengajukan perubahan.
 *  3. Ada pengajuan pending: banner status, tombol pengajuan disembunyikan —
 *     PUT dikunci setelah simpan pertama dan hanya satu pengajuan pending
 *     diperbolehkan (backend menjawab 409 untuk yang kedua).
 * ------------------------------------------------------------------------ */

const bankForm = reactive({ bankCode: '', accountNumber: '', holderName: '' })
const bankSaving = ref(false)
const bankSelectRef = ref<HTMLElement | null>(null)

const bankFormValid = computed(() =>
  bankForm.bankCode !== ''
  && bankForm.accountNumber.trim() !== ''
  && bankForm.holderName.trim() !== '',
)

async function saveBankAccount() {
  const bank = BANK_OPTIONS.find(option => option.code === bankForm.bankCode)
  if (!bank) {
    focusField(bankSelectRef.value)
    toast.error('Bank belum dipilih.', 'Pilih bank tujuan pencairan dulu.')
    return
  }

  bankSaving.value = true
  try {
    await saveTutorBankAccount({
      bankCode: bank.code,
      bankLabel: bank.label,
      accountNumber: bankForm.accountNumber.trim(),
      holderName: bankForm.holderName.trim(),
    })
    await refreshBankAccount()
    toast.success('Rekening tersimpan.', 'Pencairan berikutnya dikirim ke rekening ini.')
  }
  catch (cause) {
    toast.error('Rekening belum berhasil disimpan.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    bankSaving.value = false
  }
}

/* --------------------------------------------------------------------------
 * Ajukan perubahan rekening — dipakai begitu rekening sudah tersimpan.
 * ------------------------------------------------------------------------ */

const changeForm = reactive({ bankCode: '', accountNumber: '', holderName: '' })
const changeFormOpen = ref(false)
const changeSaving = ref(false)
const changeSelectRef = ref<HTMLElement | null>(null)

const changeFormValid = computed(() =>
  changeForm.bankCode !== ''
  && changeForm.accountNumber.trim() !== ''
  && changeForm.holderName.trim() !== '',
)

function openChangeForm() {
  // Mulai dari data yang sudah tersimpan, bukan form kosong — tutor biasanya
  // cuma mengubah satu-dua field, bukan mengetik ulang semuanya.
  if (bankAccount.value) {
    changeForm.bankCode = bankAccount.value.bankCode
    changeForm.accountNumber = bankAccount.value.accountNumber
    changeForm.holderName = bankAccount.value.holderName
  }
  changeFormOpen.value = true
}

function closeChangeForm() {
  changeFormOpen.value = false
}

const bankSelectOptions = BANK_OPTIONS.map(option => ({ value: option.code, label: option.label }))

async function submitChangeRequest() {
  const bank = BANK_OPTIONS.find(option => option.code === changeForm.bankCode)
  if (!bank) {
    focusField(changeSelectRef.value)
    toast.error('Bank belum dipilih.', 'Pilih bank tujuan pencairan dulu.')
    return
  }

  changeSaving.value = true
  try {
    await requestTutorBankAccountChange({
      bankCode: bank.code,
      bankLabel: bank.label,
      accountNumber: changeForm.accountNumber.trim(),
      holderName: changeForm.holderName.trim(),
    })
    changeFormOpen.value = false
    await refreshChangeRequest()
    toast.success('Pengajuan terkirim.', 'Admin akan meninjau perubahan rekeningmu.')
  }
  catch (cause) {
    toast.error('Pengajuan belum berhasil dikirim.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    changeSaving.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Pengaturan"
      description="Profil tutor dan rekening bank untuk pencairan."
    />

    <AppTabs v-model="activeTab" :tabs="SETTINGS_TABS" aria-label="Bagian pengaturan tutor" />

    <div
      v-show="activeTab === 'publik'"
      id="panel-publik"
      role="tabpanel"
      aria-labelledby="tab-publik"
      class="grid gap-6"
    >
      <DashboardPanel
        title="Profil publik tutor"
        description="Ditampilkan di halaman paket dan katalogmu."
      >
        <DashboardSkeleton v-if="tutorProfilePending && !tutorProfile" :count="4" label="Memuat profil..." />

        <!-- Tampilan baca: apa yang siswa lihat, tanpa kolom input. -->
        <div v-else-if="!profileEditing" class="grid gap-6">
          <div class="flex items-center gap-4">
            <img v-if="publicAvatar" :src="publicAvatar" alt="" referrerpolicy="no-referrer" class="h-20 w-20 shrink-0 rounded-full object-cover">
            <span v-else aria-hidden="true" class="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-soft text-2xl font-bold text-primary">{{ publicName.trim().charAt(0).toUpperCase() || '?' }}</span>
            <div class="min-w-0">
              <p class="truncate text-[1.05rem] font-semibold tracking-[-0.02em]">{{ publicName || 'Belum ada nama tampilan' }}</p>
              <p v-if="tutorProfile?.username" class="mt-0.5 truncate text-[0.88rem] text-muted">
                zenkoedu.id/tutor/<span class="font-semibold text-ink">{{ tutorProfile.username }}</span>
              </p>
            </div>
          </div>

          <dl class="grid gap-5">
            <div>
              <dt :class="FIELD_LABEL_CLASS">Bio singkat</dt>
              <dd class="leading-[1.6] whitespace-pre-line" :class="tutorProfile?.bio ? '' : 'text-muted'">{{ tutorProfile?.bio || 'Belum diisi.' }}</dd>
            </div>
            <div>
              <dt :class="FIELD_LABEL_CLASS">Pengalaman mengajar</dt>
              <dd class="leading-[1.6] whitespace-pre-line" :class="tutorProfile?.experience ? '' : 'text-muted'">{{ tutorProfile?.experience || 'Belum diisi.' }}</dd>
            </div>
            <div>
              <dt :class="FIELD_LABEL_CLASS">Spesialisasi</dt>
              <dd v-if="tutorProfile?.specializations.length" class="flex flex-wrap gap-2">
                <span v-for="tag in tutorProfile.specializations" :key="tag" class="inline-flex items-center rounded-pill bg-primary-soft px-3 py-1 text-[0.82rem] font-semibold text-primary">{{ tag }}</span>
              </dd>
              <dd v-else class="text-muted">Belum diisi.</dd>
            </div>
            <div>
              <dt :class="FIELD_LABEL_CLASS">Pendidikan</dt>
              <dd :class="tutorProfile?.education ? '' : 'text-muted'">{{ tutorProfile?.education || 'Belum diisi.' }}</dd>
            </div>
            <div>
              <dt :class="FIELD_LABEL_CLASS">Tautan</dt>
              <dd v-if="publicLinks.length" class="grid gap-1.5">
                <a v-for="link in publicLinks" :key="link.label" :href="link.url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-[0.9rem] font-semibold text-primary hover:underline">
                  <AppIcon name="arrow-square-out" :size="15" aria-hidden="true" />
                  {{ link.label }}
                </a>
              </dd>
              <dd v-else class="text-muted">Belum ada tautan.</dd>
            </div>
          </dl>

          <div>
            <AppButton size="sm" variant="outline" @click="startEditingProfile">Edit profil</AppButton>
          </div>
        </div>

        <form v-else class="grid gap-5" @submit.prevent="saveProfile">
        <div class="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <div>
            <img v-if="profileForm.avatarUrl" :src="profileForm.avatarUrl" alt="" class="h-20 w-20 rounded-full object-cover">
            <span v-else class="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-2xl font-bold text-primary">{{ (profileForm.displayName || user?.name || '?').trim().charAt(0).toUpperCase() }}</span>
          </div>
          <div>
            <p class="font-semibold">Foto profil publik</p>
            <p class="mt-1 text-[0.82rem] text-muted">Dipakai di katalog dan halaman publik tutor. Jika kosong, foto akun dipakai sebagai fallback.</p>
            <button type="button" class="mt-3 rounded-sm border border-line px-3 py-2 text-[0.84rem] font-semibold text-primary hover:bg-primary-soft" :disabled="publicAvatarUploading" @click="pickPublicAvatar">
              {{ publicAvatarUploading ? 'Mengunggah…' : 'Pilih foto' }}
            </button>
            <input ref="publicAvatarInputRef" type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="hidden" @change="onPublicAvatarSelected">
          </div>
        </div>

        <FormField id="tutor-display-name" v-model="profileForm.displayName" label="Nama tampilan publik" :placeholder="user?.name || 'Nama yang tampil di katalog'" hint="Boleh berbeda dari nama akun, misalnya Kak Budi SKD." />
        <div>
          <FormField
            id="tutor-username"
            v-model="profileForm.username"
            label="Username profil publik"
            placeholder="kakbudiskd"
            :hint="USERNAME_HINT"
          />
          <p v-if="profileForm.username" class="mt-2 text-[0.82rem] text-muted">Link publik: <span class="font-semibold text-ink">zenkoedu.id/tutor/{{ profileForm.username.toLowerCase() }}</span></p>
        </div>
        <div>
          <label for="tutor-bio" class="mb-2 block text-[0.9rem] font-semibold">Bio singkat</label>
          <textarea
            id="tutor-bio"
            v-model="profileForm.bio"
            rows="3"
            maxlength="2000"
            placeholder="Ceritakan singkat siapa kamu dan apa yang kamu ajarkan"
            class="w-full resize-y rounded-sm border border-line bg-surface px-4 py-3 text-[0.9rem] transition-[border-color,box-shadow] duration-200 ease-smooth placeholder:text-placeholder focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)] focus:outline-none"
          />
        </div>

        <div>
          <label for="tutor-experience" class="mb-2 block text-[0.9rem] font-semibold">Pengalaman mengajar</label>
          <textarea
            id="tutor-experience"
            v-model="profileForm.experience"
            rows="3"
            maxlength="4000"
            placeholder="Contoh: 3 tahun mengajar SKD di bimbel, lolos CPNS 2022"
            class="w-full resize-y rounded-sm border border-line bg-surface px-4 py-3 text-[0.9rem] transition-[border-color,box-shadow] duration-200 ease-smooth placeholder:text-placeholder focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)] focus:outline-none"
          />
        </div>

        <div>
          <label for="tutor-specializations" class="mb-2 block text-[0.9rem] font-semibold">Spesialisasi</label>
          <div class="flex flex-wrap items-center gap-2 rounded-sm border border-line bg-surface px-3 py-2 focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]">
            <span
              v-for="(tag, index) in profileForm.specializations"
              :key="tag"
              class="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft px-3 py-1 text-[0.82rem] font-semibold text-primary"
            >
              {{ tag }}
              <button
                type="button"
                class="text-primary/70 transition-colors hover:text-primary"
                :aria-label="`Hapus ${tag}`"
                @click="removeSpecialization(index)"
              >
                <IconClose class="h-3 w-3" />
              </button>
            </span>
            <input
              id="tutor-specializations"
              v-model="specializationInput"
              type="text"
              :placeholder="profileForm.specializations.length === 0 ? 'Contoh: SKD, TKA (tekan Enter)' : 'Tambah keahlian lagi'"
              class="min-w-32 flex-1 border-0 bg-transparent p-1.5 text-[0.9rem] placeholder:text-placeholder focus:outline-none"
              @keydown="onSpecializationKeydown"
              @blur="addSpecialization"
            >
          </div>
          <p class="mt-2 text-[0.82rem] text-muted">Tekan Enter atau koma untuk menambah. Maksimal 10.</p>
        </div>

        <FormField
          id="tutor-education"
          v-model="profileForm.education"
          label="Pendidikan"
          placeholder="Contoh: S1 Pendidikan Matematika, Universitas Indonesia"
        />

        <FormField
          id="tutor-portfolio"
          v-model="profileForm.portfolioUrl"
          type="url"
          label="Portofolio"
          placeholder="https://..."
        />

        <div class="grid gap-5 sm:grid-cols-2">
          <AppPrefixedUrlField id="tutor-instagram" v-model="profileForm.instagramUrl" label="Instagram" prefix="instagram.com/" placeholder="username" />
          <AppPrefixedUrlField id="tutor-tiktok" v-model="profileForm.tiktokUrl" label="TikTok" prefix="tiktok.com/@" placeholder="username" />
          <AppPrefixedUrlField id="tutor-linkedin" v-model="profileForm.linkedinUrl" label="LinkedIn" prefix="linkedin.com/in/" placeholder="username" />
          <AppPrefixedUrlField id="tutor-youtube" v-model="profileForm.youtubeUrl" label="YouTube" prefix="youtube.com/@" placeholder="channel" />
        </div>

        <FormField id="tutor-website" v-model="profileForm.websiteUrl" type="url" label="Website" placeholder="https://..." />


        <div class="flex items-center gap-3">
          <AppButton type="submit" size="sm" :disabled="profileSaving" :loading="profileSaving">
            Simpan profil
          </AppButton>
          <AppButton type="button" variant="outline" size="sm" :disabled="profileSaving" @click="cancelEditingProfile">
            Batal
          </AppButton>
        </div>
        </form>
      </DashboardPanel>
    </div>

    <div
      v-show="activeTab === 'ulasan'"
      id="panel-ulasan"
      role="tabpanel"
      aria-labelledby="tab-ulasan"
      class="grid gap-6"
    >
      <DashboardPanel title="Ulasan siswa" description="Baca masukan siswa yang sudah mengerjakan paketmu dan balas jika perlu.">
        <DashboardSkeleton v-if="tutorReviews.pending.value" :count="3" label="Memuat ulasan..." />
        <AppInlineMessage v-else-if="tutorReviews.error.value" type="error">{{ tutorReviews.error.value }}</AppInlineMessage>
        <div v-else-if="tutorReviews.data.value.length" class="grid gap-4">
          <article v-for="review in tutorReviews.data.value" :key="review.id" class="rounded-md border border-hairline bg-surface-alt p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div><p class="font-semibold">{{ review.isAnonymous ? 'Siswa anonim' : review.authorName }}</p><p class="mt-1 text-[0.8rem] text-muted">{{ review.productTitle }}</p></div>
              <span class="text-star">{{ '★'.repeat(review.rating) }}</span>
            </div>
            <p v-if="review.reviewText" class="mt-3 leading-[1.6] text-muted">{{ review.reviewText }}</p>
            <details class="mt-4">
              <summary class="cursor-pointer text-[0.86rem] font-semibold text-primary">{{ review.tutorReplyText ? 'Edit balasan' : 'Balas ulasan' }}</summary>
              <form class="mt-3 flex gap-2" @submit.prevent="replyToReview(review.id)">
                <textarea :ref="el => setReplyField(review.id, el)" v-model="replyDrafts[review.id]" rows="2" maxlength="1000" class="min-w-0 flex-1 scroll-mt-24 rounded-sm border border-line bg-surface px-3 py-2 text-[0.86rem]" placeholder="Tulis balasan yang membantu siswa..." />
                <AppButton type="submit" size="sm">Kirim</AppButton>
              </form>
            </details>
          </article>
        </div>
        <p v-else class="text-muted">Belum ada ulasan siswa.</p>
      </DashboardPanel>
    </div>

    <div
      v-show="activeTab === 'rekening'"
      id="panel-rekening"
      role="tabpanel"
      aria-labelledby="tab-rekening"
    >
      <DashboardPanel
        title="Rekening bank"
        description="Rekening tujuan untuk transfer pencairan dana. Pastikan nama pemilik sesuai dengan buku rekening tabungan."
      >
        <DashboardSkeleton v-if="bankPending || changeRequestPending" :count="3" label="Memuat rekening..." />

      <!-- State 1: belum ada rekening — form biasa, simpan via PUT. -->
        <form v-else-if="!bankAccount" class="grid gap-5" @submit.prevent="saveBankAccount">
        <!-- Wrapper, not a ref on AppSelect itself: focusField() needs a DOM
             node to scroll and to find the trigger button inside. -->
        <div ref="bankSelectRef" class="scroll-mt-24">
          <AppSelect
            :options="bankSelectOptions"
            :model-value="bankForm.bankCode"
            label="Bank"
            placeholder="Pilih bank"
            @update:model-value="bankForm.bankCode = String($event)"
          />
        </div>

        <FormField
          id="bank-account-number"
          v-model="bankForm.accountNumber"
          label="Nomor rekening"
          type="tel"
          placeholder="1234567890"
          autocomplete="off"
        />

        <FormField
          id="bank-holder-name"
          v-model="bankForm.holderName"
          label="Nama pemilik rekening"
          placeholder="Sesuai buku tabungan"
          autocomplete="name"
        />

        <div>
          <AppButton type="submit" size="sm" :disabled="!bankFormValid || bankSaving">
            {{ bankSaving ? 'Menyimpan...' : 'Simpan rekening' }}
          </AppButton>
        </div>
        </form>

      <!-- State 2/3: rekening sudah tersimpan — baca-saja, dengan alur pengajuan
           perubahan terpisah (PUT dikunci setelah simpan pertama). -->
        <div v-else class="grid gap-5">
        <!-- State 3: ada pengajuan pending — banner status, tombol pengajuan
             disembunyikan (backend cuma izinkan satu pending sekaligus). -->
        <AppSectionMessage v-if="changeRequest" appearance="warning" title="Menunggu persetujuan admin">
          <p>
            Pengajuan perubahan rekening dikirim pada {{ formatDate(changeRequest.requestedAt) }} dan sedang ditinjau oleh tim admin.
          </p>
          <dl class="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt class="text-[0.7rem]">Bank baru</dt>
              <dd class="font-semibold text-ink">{{ changeRequest.newAccount.bankLabel }}</dd>
            </div>
            <div>
              <dt class="text-[0.7rem]">Nomor rekening baru</dt>
              <dd class="font-semibold text-ink">{{ changeRequest.newAccount.accountNumber }}</dd>
            </div>
            <div>
              <dt class="text-[0.7rem]">Nama pemilik baru</dt>
              <dd class="font-semibold text-ink">{{ changeRequest.newAccount.holderName }}</dd>
            </div>
          </dl>
        </AppSectionMessage>

        <!-- State 2: rekening tersimpan, tampilan baca-saja + badge verifikasi. -->
        <div>
          <dl class="grid gap-4 sm:grid-cols-3">
            <div>
              <dt :class="FIELD_LABEL_CLASS">Bank</dt>
              <dd class="font-semibold">{{ bankAccount.bankLabel }}</dd>
            </div>
            <div>
              <dt :class="FIELD_LABEL_CLASS">Nomor rekening</dt>
              <dd class="font-semibold tabular-nums">{{ bankAccount.accountNumber }}</dd>
            </div>
            <div>
              <dt :class="FIELD_LABEL_CLASS">Nama pemilik rekening</dt>
              <dd class="font-semibold">{{ bankAccount.holderName }}</dd>
            </div>
          </dl>

          <div class="mt-4">
            <DashboardBadge :tone="bankAccount.verifiedAt ? 'success' : 'warning'">
              {{ bankAccount.verifiedAt ? 'Terverifikasi' : 'Menunggu verifikasi' }}
            </DashboardBadge>
          </div>
        </div>

        <div v-if="!changeRequest">
          <AppButton v-if="!changeFormOpen" variant="outline" size="sm" @click="openChangeForm">
            Ajukan perubahan rekening
          </AppButton>

          <form v-else class="grid gap-5" @submit.prevent="submitChangeRequest">
            <div ref="changeSelectRef" class="scroll-mt-24">
              <AppSelect
                :options="bankSelectOptions"
                :model-value="changeForm.bankCode"
                label="Bank"
                placeholder="Pilih bank"
                @update:model-value="changeForm.bankCode = String($event)"
              />
            </div>

            <FormField
              id="change-bank-account-number"
              v-model="changeForm.accountNumber"
              label="Nomor rekening"
              type="tel"
              placeholder="1234567890"
              autocomplete="off"
            />

            <FormField
              id="change-bank-holder-name"
              v-model="changeForm.holderName"
              label="Nama pemilik rekening"
              placeholder="Sesuai buku tabungan"
              autocomplete="name"
            />

            <div class="flex items-center gap-3">
              <AppButton type="submit" size="sm" :disabled="!changeFormValid || changeSaving">
                {{ changeSaving ? 'Mengirim...' : 'Kirim pengajuan' }}
              </AppButton>
              <AppButton type="button" variant="outline" size="sm" @click="closeChangeForm">
                Batal
              </AppButton>
            </div>
          </form>
        </div>
        </div>
      </DashboardPanel>
    </div>
  </div>
</template>
