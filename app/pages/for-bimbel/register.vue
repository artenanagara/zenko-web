<script setup lang="ts">
// English file name, Indonesian URL. Nested di bawah /untuk-bimbel supaya
// formulir terbaca sebagai kelanjutan halaman marketingnya, bukan halaman lain.
definePageMeta({ path: '/untuk-bimbel/daftar' })

/**
 * Formulir pengajuan bimbel sebagai halaman utuh.
 *
 * Sebelumnya ini panel `v-if` di dasar /bimbel: mengkliknya tidak menggulung ke
 * mana pun, jadi di layar HP tombolnya tampak tidak melakukan apa-apa. Sebagai
 * route sendiri ia bisa ditautkan, di-bookmark, dan punya tombol back.
 *
 * Tidak memakai `middleware: 'auth'` — polanya mengikuti /jadi-tutor: halaman
 * tetap terbuka dan menjelaskan kenapa akun dibutuhkan, lalu mengantar ke
 * /masuk dengan `lanjut` supaya orang kembali ke sini setelah masuk. Middleware
 * akan melempar keluar tanpa penjelasan, dan halaman ini adalah dasar funnel.
 */
useSeoMeta({
  title: 'Daftarkan Bimbel di Zenko',
  description:
    'Mulai uji coba bimbel di Zenko: kelas, bank soal privat, dan rekap hasil siswa dalam satu ruang kerja.',
  ogUrl: 'https://zenkoedu.id/untuk-bimbel/daftar',
})

// Halaman formulir bukan halaman yang perlu ditemukan lewat pencarian; yang
// diindeks adalah /untuk-bimbel, dan canonical-nya menunjuk ke sana.
useHead({
  meta: [{ name: 'robots', content: 'noindex' }],
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/untuk-bimbel' }],
})

const SIGN_IN_PATH = '/masuk?lanjut=/untuk-bimbel/daftar'

const { user, isSignedIn, isLoading: isCheckingSession } = useAuth()
const application = useMyBimbelApplication()
const recommendedPlan = useState<'dasar' | 'pro' | 'institusi' | null>('bimbel-recommended-plan', () => null)

/**
 * `GET /bimbel-applications/me` menjawab 404 saat seseorang belum pernah
 * mengajukan, dan `useMyBimbelApplication` menerjemahkan itu jadi `error`.
 * Jadi `error` di sini bukan tanda gagal muat dan sengaja tidak dirender —
 * yang menentukan tampilan hanyalah ada atau tidaknya `data`.
 */
const myApplication = application.data

// Sesi diselesaikan di klien (plugins/auth.client.ts), jadi pengajuan diambil
// begitu state berubah jadi signed-in.
watch(isSignedIn, (signedIn) => {
  if (signedIn) application.refresh()
}, { immediate: true })

const form = reactive({
  bimbelName: '',
  city: '',
  studentCountBand: '',
  termsAccepted: false,
})

type FieldKey = keyof typeof form
const errors = reactive<Partial<Record<FieldKey, string>>>({})

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const submitError = ref('')

const MIN_NAME_LENGTH = 3
const MAX_NAME_LENGTH = 80
const STUDENT_COUNT_OPTIONS = [
  { value: '<25', label: 'Kurang dari 25 siswa' },
  { value: '25-50', label: '25–50 siswa' },
  { value: '51-150', label: '51–150 siswa' },
  { value: '>150', label: 'Lebih dari 150 siswa' },
]

function validate() {
  for (const key of Object.keys(errors) as FieldKey[]) delete errors[key]

  const name = form.bimbelName.trim()
  if (!name) errors.bimbelName = 'Nama bimbel wajib diisi.'
  else if (name.length < MIN_NAME_LENGTH) errors.bimbelName = `Nama bimbel minimal ${MIN_NAME_LENGTH} karakter.`
  else if (name.length > MAX_NAME_LENGTH) errors.bimbelName = `Nama bimbel maksimal ${MAX_NAME_LENGTH} karakter.`

  if (!form.studentCountBand) errors.studentCountBand = 'Pilih rentang jumlah siswa.'
  if (!form.termsAccepted) errors.termsAccepted = 'Kamu perlu menyetujui syarat dan ketentuan bimbel.'

  return Object.keys(errors).length === 0
}

async function onSubmit() {
  submitError.value = ''
  if (!validate()) return

  isSubmitting.value = true
  try {
    await applyBimbel({
      bimbelName: form.bimbelName.trim(),
      studentCountBand: form.studentCountBand as '<25' | '25-50' | '51-150' | '>150',
      ...(form.city.trim() ? { city: form.city.trim() } : {}),
      termsAccepted: true,
    })
    recommendedPlan.value = form.studentCountBand === '<25'
      ? 'dasar'
      : form.studentCountBand === '25-50'
        ? 'pro'
        : 'institusi'
    isSubmitted.value = true
    // Status terbaru dipakai halaman /akun/bimbel juga, jadi diambil ulang
    // supaya keduanya tidak berbeda cerita. Sekaligus yang membawa `bimbelId`
    // ruang yang baru saja dibuat, dan itu tujuan tombol di layar konfirmasi.
    await application.refresh()
  }
  catch (cause) {
    // 409 punya alasan yang bisa ditindaklanjuti sendiri oleh pendaftar
    // (sudah mengelola bimbel), jadi pesan server diteruskan.
    const conflict = (cause as { statusCode?: number })?.statusCode === 409
    submitError.value = conflict
      ? tutorApiMessage(cause, 'Pendaftaranmu tidak bisa diproses.')
      : 'Pendaftaranmu belum terkirim. Periksa koneksimu, lalu coba lagi.'
  }
  finally {
    isSubmitting.value = false
  }
}

type FormState = 'checking' | 'signed-out' | 'submitted' | 'in-review' | 'approved' | 'form'

const formState = computed<FormState>(() => {
  if (isCheckingSession.value || application.pending.value) return 'checking'
  if (!isSignedIn.value) return 'signed-out'
  if (isSubmitted.value) return 'submitted'

  const status = myApplication.value?.status
  if (status === 'pending') return 'in-review'
  if (status === 'approved') return 'approved'

  // Termasuk 'rejected': satu penolakan bukan larangan seumur hidup, dan
  // server hanya menutup pengajuan yang masih terbuka.
  return 'form'
})
</script>

<template>
  <main class="container-page py-10 md:py-14">
    <div class="mx-auto max-w-150">
      <nav aria-label="Remah roti" class="mb-6">
        <NuxtLink
          to="/untuk-bimbel"
          class="inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-muted transition-colors hover:text-primary"
        >
          <AppIcon name="arrow-left" :size="16" aria-hidden="true" />
          Kembali ke Untuk Bimbel
        </NuxtLink>
      </nav>

      <div class="mb-9 text-center">
        <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
          Bimbel di Zenko
        </p>
        <!-- Netral terhadap apa pun yang dirender kartu di bawahnya: judul
             "isi datamu" akan bertabrakan dengan panel belum-masuk dan panel
             sedang-ditinjau. -->
        <h1 class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
          Daftarkan <span class="text-accent">bimbelmu</span>
        </h1>
        <p class="mx-auto mt-3.5 max-w-120 leading-[1.7] text-muted">
          Tanpa menunggu persetujuan. Begitu formulir ini terkirim, ruang
          bimbelmu langsung aktif selama 7 hari untuk 25 siswa tanpa biaya.
        </p>
      </div>

      <div class="rounded-[22px] border border-hairline bg-surface p-6 shadow-xs md:p-9">
        <p v-if="formState === 'checking'" class="py-6 text-center text-muted">
          Memeriksa akun...
        </p>

        <!-- Mendaftar memberi sebuah akun kuasa atas satu bimbel, jadi
             akunnya harus ada lebih dulu. -->
        <div v-else-if="formState === 'signed-out'" class="py-4 text-center">
          <h2 class="text-[1.25rem] font-bold tracking-[-0.03em]">Masuk untuk mendaftarkan bimbel</h2>
          <p class="mx-auto mt-3 max-w-105 leading-[1.7] text-muted">
            Ruang bimbel melekat pada akun Zenko yang mendaftarkannya, dan akun
            itulah yang jadi pemiliknya.
          </p>
          <AppButton :to="SIGN_IN_PATH" size="lg" class="mt-6">Masuk ke akun</AppButton>
          <p class="mt-4 text-[0.86rem] text-muted">
            Belum punya akun? Masuk dengan Google untuk membuat akun baru secara gratis.
          </p>
        </div>

        <!-- Konfirmasi menggantikan formulir: tidak ada alasan mengirim dua kali. -->
        <div v-else-if="formState === 'submitted'" role="status" class="py-6 text-center">
          <span
            class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success-ink"
            aria-hidden="true"
          >
            <AppIcon name="check" :size="28" weight="bold" />
          </span>
          <h2 class="mt-5 text-[1.35rem] font-bold tracking-[-0.03em]">Ruang bimbelmu sudah aktif</h2>
          <p class="mx-auto mt-3 max-w-100 leading-[1.7] text-muted">
            Uji coba 7 hari untuk 25 siswa berjalan mulai sekarang. Langkah
            berikutnya: bagikan kode bergabung ke siswamu, lalu susun bank soal
            pertama.
          </p>
          <AppButton
            :to="myApplication?.bimbelId ? `/dashboard/bimbel/${myApplication.bimbelId}` : '/akun/bimbel'"
            class="mt-6"
          >
            Buka dashboard bimbel
          </AppButton>
        </div>

        <div
          v-else-if="(formState === 'in-review' || formState === 'approved') && myApplication"
          class="grid gap-5"
        >
          <BimbelApplicationStatus :application="myApplication" />

          <!-- Hanya bisa muncul untuk pengajuan yang dikirim sebelum
               pendaftaran jadi instan: sejak itu tidak ada lagi yang berhenti
               di `pending`. Tombolnya memanggil endpoint yang sama, yang
               menyelesaikan pengajuan tertunda alih-alih menolaknya, jadi orang
               yang sudah menunggu keputusan tidak perlu mengisi formulir lagi. -->
          <div v-if="formState === 'in-review'" class="text-center">
            <AppButton :loading="isSubmitting" @click="onSubmit()">
              Aktifkan ruang bimbel sekarang
            </AppButton>
            <p class="mt-3 text-[0.88rem] text-muted">
              Persetujuan admin sudah tidak diperlukan lagi — pengajuanmu tinggal
              diselesaikan.
            </p>
            <AppInlineMessage v-if="submitError" type="error" class="mt-3">{{ submitError }}</AppInlineMessage>
          </div>
          <p class="text-center text-[0.88rem] text-muted">
            Semua bimbel yang kamu ikuti terkumpul di
            <NuxtLink to="/akun/bimbel" class="font-semibold text-primary hover:underline">
              Bimbel saya
            </NuxtLink>.
          </p>
        </div>

        <form v-else class="grid gap-5" novalidate @submit.prevent="onSubmit">
          <!-- Identitas ditampilkan, bukan ditanyakan: server membacanya dari
               sesi, jadi kolom yang bisa diketik hanya bisa berbohong. -->
          <div class="flex items-center gap-3.5 rounded-sm border border-hairline-strong bg-surface-alt px-4 py-3.5">
            <img
              v-if="user?.avatarUrl"
              :src="user.avatarUrl"
              alt=""
              referrerpolicy="no-referrer"
              class="h-10 w-10 shrink-0 rounded-full object-cover"
            >
            <span class="min-w-0">
              <span class="block truncate font-semibold">{{ user?.name }}</span>
              <span class="block truncate text-[0.88rem] text-muted">{{ user?.email }}</span>
            </span>
          </div>

          <AppInput
            id="bimbel-name"
            v-model="form.bimbelName"
            label="Nama bimbel"
            placeholder="Contoh: Bimbel Cendekia"
            :error="errors.bimbelName"
            required
          />

          <AppInput
            id="bimbel-city"
            v-model="form.city"
            label="Kota"
            placeholder="Contoh: Surabaya"
            hint="Opsional."
          />

          <div>
            <AppSelect
              :model-value="form.studentCountBand"
              :options="STUDENT_COUNT_OPTIONS"
              label="Perkiraan jumlah siswa"
              placeholder="Pilih rentang siswa"
              @update:model-value="form.studentCountBand = String($event)"
            />
            <p class="mt-1.5 text-xs text-muted">Dipakai untuk merekomendasikan tingkat setelah uji coba dimulai.</p>
            <p v-if="errors.studentCountBand" id="bimbel-student-count-error" class="mt-1.5 text-xs text-danger" role="alert">{{ errors.studentCountBand }}</p>
          </div>

          <div>
            <label class="flex cursor-pointer items-start gap-2.5 text-[0.88rem] text-muted">
              <input
                v-model="form.termsAccepted"
                type="checkbox"
                class="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] accent-primary"
                :aria-invalid="Boolean(errors.termsAccepted)"
                :aria-describedby="errors.termsAccepted ? 'bimbel-terms-error' : undefined"
                required
              >
              <span>
                Saya menyetujui
                <NuxtLink to="/ketentuan-layanan" class="font-semibold text-primary hover:underline">Syarat dan Ketentuan Zenko</NuxtLink>,
                termasuk porsi hasil marketplace sesuai tingkat langganan.
              </span>
            </label>
            <p v-if="errors.termsAccepted" id="bimbel-terms-error" class="mt-2 text-xs text-danger" role="alert">{{ errors.termsAccepted }}</p>
          </div>

          <AppInlineMessage v-if="submitError" type="error">{{ submitError }}</AppInlineMessage>

          <AppButton type="submit" size="lg" class="w-full" :disabled="isSubmitting">
            {{ isSubmitting ? 'Menyiapkan ruang…' : 'Mulai uji coba 7 hari' }}
          </AppButton>
        </form>
      </div>
    </div>
  </main>
</template>
