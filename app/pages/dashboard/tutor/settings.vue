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
  title: 'Pengaturan — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { user } = useAuth()

const { data: bankAccount, pending: bankPending, refresh: refreshBankAccount } = useTutorBankAccount()
const {
  data: changeRequest,
  pending: changeRequestPending,
  refresh: refreshChangeRequest,
} = useTutorBankAccountChangeRequest()
const { data: tutorProfile, pending: tutorProfilePending, refresh: refreshTutorProfile } = useTutorProfile()

// Client-only fetch: the session cookie never reaches the Nuxt server, so
// this resolves after hydration (see useTutorEarnings).
onMounted(() => {
  refreshBankAccount()
  refreshChangeRequest()
  refreshTutorProfile()
})

/* --------------------------------------------------------------------------
 * Profil publik tutor — bio, pengalaman, spesialisasi, pendidikan, tautan.
 * Terpisah dari nama/foto (lihat panel "Profil tutor" di template), yang
 * diedit lewat /akun/profil bareng akun student — field di bawah ini
 * khusus tutor.
 * ------------------------------------------------------------------------ */

const profileForm = reactive({
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
const profileError = ref('')
const profileSaved = ref(false)
const specializationInput = ref('')

// Salin ke form lokal begitu profil tersimpan tiba — bukan binding langsung,
// supaya draft yang sedang diketik tidak ketimpa kalau refresh datang lagi.
watch(tutorProfile, (profile) => {
  if (!profile) return
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
}, { immediate: true })

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
  profileError.value = ''
  profileSaved.value = false
  profileSaving.value = true
  try {
    await saveTutorProfile({ ...profileForm })
    await refreshTutorProfile()
    profileSaved.value = true
  }
  catch (cause) {
    profileError.value = tutorApiMessage(cause, 'Gagal menyimpan profil. Coba lagi sebentar lagi.')
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
const bankError = ref('')

const bankFormValid = computed(() =>
  bankForm.bankCode !== ''
  && bankForm.accountNumber.trim() !== ''
  && bankForm.holderName.trim() !== '',
)

async function saveBankAccount() {
  bankError.value = ''

  const bank = BANK_OPTIONS.find(option => option.code === bankForm.bankCode)
  if (!bank) {
    bankError.value = 'Pilih bank terlebih dahulu.'
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
  }
  catch (cause) {
    bankError.value = tutorApiMessage(cause, 'Gagal menyimpan rekening. Coba lagi sebentar lagi.')
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
const changeError = ref('')

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
  changeError.value = ''
  changeFormOpen.value = true
}

function closeChangeForm() {
  changeFormOpen.value = false
  changeError.value = ''
}

const bankSelectOptions = BANK_OPTIONS.map(option => ({ value: option.code, label: option.label }))

async function submitChangeRequest() {
  changeError.value = ''

  const bank = BANK_OPTIONS.find(option => option.code === changeForm.bankCode)
  if (!bank) {
    changeError.value = 'Pilih bank terlebih dahulu.'
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
  }
  catch (cause) {
    changeError.value = tutorApiMessage(cause, 'Gagal mengirim pengajuan perubahan. Coba lagi sebentar lagi.')
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

    <DashboardPanel title="Profil tutor" description="Nama dan foto tampil di seluruh Zenko, termasuk katalog paketmu.">
      <div v-if="user" class="flex items-center gap-4">
        <img
          v-if="user.avatarUrl"
          :src="user.avatarUrl"
          alt=""
          referrerpolicy="no-referrer"
          class="h-14 w-14 shrink-0 rounded-full object-cover"
        >
        <span
          v-else
          aria-hidden="true"
          class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-alt text-[1.2rem] font-bold text-muted"
        >{{ user.name.trim().charAt(0).toUpperCase() || '?' }}</span>

        <div class="min-w-0">
          <p class="truncate font-semibold tracking-[-0.02em]">{{ user.name }}</p>
          <p class="mt-0.5 truncate text-[0.88rem] text-muted">{{ user.email }}</p>
        </div>
      </div>

      <AppSectionMessage appearance="information" class="mt-5">
        Nama dan foto profil diubah lewat
        <NuxtLink to="/akun/profil" class="font-semibold underline">Akun saya</NuxtLink>. Bio,
        pengalaman, dan tautan sosial media ada di bawah ini.
      </AppSectionMessage>
    </DashboardPanel>

    <DashboardPanel
      title="Profil publik tutor"
      description="Ditampilkan di halaman paket dan katalogmu."
    >
      <DashboardSkeleton v-if="tutorProfilePending && !tutorProfile" :count="4" label="Memuat profil..." />

      <form v-else class="grid gap-5" @submit.prevent="saveProfile">
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
            placeholder="Contoh: 3 tahun mengajar SKD di bimbel, lulus SNBT 2022"
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
              :placeholder="profileForm.specializations.length === 0 ? 'Contoh: SKD, SNBT — tekan Enter' : 'Tambah lagi'"
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
          <FormField id="tutor-instagram" v-model="profileForm.instagramUrl" type="url" label="Instagram" placeholder="https://instagram.com/..." />
          <FormField id="tutor-tiktok" v-model="profileForm.tiktokUrl" type="url" label="TikTok" placeholder="https://tiktok.com/@..." />
          <FormField id="tutor-linkedin" v-model="profileForm.linkedinUrl" type="url" label="LinkedIn" placeholder="https://linkedin.com/in/..." />
          <FormField id="tutor-youtube" v-model="profileForm.youtubeUrl" type="url" label="YouTube" placeholder="https://youtube.com/@..." />
        </div>

        <FormField id="tutor-website" v-model="profileForm.websiteUrl" type="url" label="Website" placeholder="https://..." />

        <AppInlineMessage v-if="profileError" type="error">{{ profileError }}</AppInlineMessage>
        <AppInlineMessage v-if="profileSaved" type="confirmation">Profil tersimpan.</AppInlineMessage>

        <div>
          <AppButton type="submit" size="sm" :disabled="profileSaving" :loading="profileSaving">
            Simpan profil
          </AppButton>
        </div>
      </form>
    </DashboardPanel>

    <DashboardPanel
      id="rekening"
      title="Rekening bank"
      description="Tujuan transfer pencairan. Pastikan nama pemilik sesuai buku tabungan."
    >
      <DashboardSkeleton v-if="bankPending || changeRequestPending" :count="3" label="Memuat rekening..." />

      <!-- State 1: belum ada rekening — form biasa, simpan via PUT. -->
      <form v-else-if="!bankAccount" class="grid gap-5" @submit.prevent="saveBankAccount">
        <AppSelect
          :options="bankSelectOptions"
          :model-value="bankForm.bankCode"
          label="Bank"
          placeholder="Pilih bank"
          @update:model-value="bankForm.bankCode = String($event)"
        />

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

        <AppInlineMessage v-if="bankError" type="error">{{ bankError }}</AppInlineMessage>

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
            Pengajuan perubahan rekening dikirim {{ formatDate(changeRequest.requestedAt) }} dan sedang ditinjau admin.
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
            <AppSelect
              :options="bankSelectOptions"
              :model-value="changeForm.bankCode"
              label="Bank"
              placeholder="Pilih bank"
              @update:model-value="changeForm.bankCode = String($event)"
            />

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

            <AppInlineMessage v-if="changeError" type="error">{{ changeError }}</AppInlineMessage>

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
</template>
