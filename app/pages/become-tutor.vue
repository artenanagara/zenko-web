  <script setup lang="ts">
// English file name, Indonesian URL; `path` keeps circulating links alive.
definePageMeta({ path: '/jadi-tutor' })

/**
 * Landing page for manual outreach to prospective tutors: pitch, benefits,
 * three steps, FAQ, then the form. No earnings calculator or testimonials;
 * both wait for real traction so the page promises nothing unproven.
 *
 * Cards carry animated decorative mock panels (.anim-* in main.css). The
 * loops repeat, so only decoration may animate. Real copy would vanish
 * every cycle.
 */
useSeoMeta({
  title: 'Jadi Tutor Zenko | Jual Paket Tryout Online',
  description:
    'Bagikan keahlianmu lewat paket latihan untuk berbagai tujuan ujian. Atur harga sendiri, gunakan sistem CBT Zenko, dan dapatkan 70% dari setiap penjualan.',
  ogTitle: 'Jadi Tutor Zenko | Jual Paket Tryout Online',
  ogDescription:
    'Bagikan keahlianmu lewat paket latihan untuk berbagai tujuan ujian. Atur harga sendiri, gunakan sistem CBT Zenko, dan dapatkan 70% dari setiap penjualan.',
  ...DEFAULT_OG,
  ogUrl: 'https://zenkoedu.id/jadi-tutor',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/jadi-tutor' }],
})

const steps = [
  {
    title: 'Isi pengajuan',
    description: 'Ceritakan bidang keahlian dan pengalamanmu melalui formulir singkat.',
  },
  {
    title: 'Tim Zenko meninjau',
    description: 'Kami menilai pengajuanmu, lalu mengabari hasilnya lewat email atau WhatsApp.',
  },
  {
    title: 'Unggah paket tryout',
    description:
      'Setelah disetujui, unggah paket pertamamu dan dapatkan penghasilan dari setiap penjualan.',
  },
]

/**
 * Answers stick to what the Terms of Service already commit to (70:30 split,
 * auto-grading, categories, review process). Anything undecided points to the
 * ToS instead of naming a number the page might not keep.
 */
const faqs = [
  {
    question: 'Apakah saya harus punya pengalaman mengajar formal?',
    answer:
      'Tidak wajib. Tim kurasi kami mengutamakan kualitas, akurasi kisi-kisi, dan orisinalitas soal yang kamu buat. Ceritakan pengalamanmu di formulir, baik sebagai tutor bimbel, alumni yang berhasil lolos seleksi, maupun pembuat bank soal mandiri.',
  },
  {
    question: 'Berapa bagi hasilnya, dan apakah ada biaya lain?',
    answer:
      'Kamu menerima 70% bersih dari setiap penjualan paketmu, dan Zenko menerima 30%. Bebas biaya pendaftaran dan tanpa biaya langganan bulanan. Porsi Zenko digunakan untuk biaya pemrosesan pembayaran otomatis, server CBT engine, dan operasional platform.',
  },
  {
    question: 'Siapa yang menentukan harga paket soal?',
    answer:
      'Kamu yang menentukan harga setiap paket tryout: gratis (Rp0) atau minimal Rp1.000, dan harganya tetap bisa kamu sesuaikan setelah paket tayang. Selama pembayaran di Zenko masih dalam proses aktivasi, isian harga dikunci dan semua paket tayang gratis.',
  },
  {
    question: 'Kategori paket apa saja yang bisa saya buat?',
    answer:
      'Kamu bisa membuat paket untuk SKD, PPPK, UTBK-SNBT, TKA, rekrutmen BUMN, dan jenis ujian lain yang tersedia di editor. Kalau bidangmu belum ada, bicarakan dengan tim Zenko agar kebutuhannya bisa ditinjau.',
  },
  {
    question: 'Berapa lama proses peninjauan pengajuan tutor?',
    answer:
      'Proses kurasi biasanya memakan waktu 1 sampai 3 hari kerja. Tim Zenko akan menghubungimu secara personal melalui WhatsApp atau email yang terdaftar.',
  },
  {
    question: 'Bagaimana keamanan soal buatan saya dari pembajakan?',
    answer:
      'Seluruh paket tryout dikerjakan langsung di dalam sistem CBT Zenko dengan proteksi anti-salin, bukan berupa file PDF yang bisa diunduh dan disebarluaskan. Hak cipta materi tetap sepenuhnya menjadi milikmu.',
  },
  {
    question: 'Kapan penghasilan saya bisa dicairkan?',
    answer:
      'Penghasilan dari setiap transaksi tercatat otomatis di dashboard tutormu dan siap dicairkan H+3 setelah pembayaran terverifikasi, dengan batas minimum pencairan Rp50.000.',
  },
]

/**
 * Mock panel content uses invented names and figures, not sales data. The panels
 * are aria-hidden, so this text is purely visual.
 */
const mockSales = [
  { title: 'Simulasi SKD Kedinasan', amount: '+Rp298rb' },
  { title: 'Persiapan UTBK-SNBT', amount: '+Rp219rb' },
  { title: 'Latihan PPPK Intensif', amount: '+Rp189rb' },
]

const mockResults = [
  { title: 'Latihan CPNS 2026 Intensif', meta: 'SKD/CPNS · Rp189.000' },
  { title: 'Persiapan UTBK-SNBT', meta: 'UTBK-SNBT · Rp149.000' },
  { title: 'Latihan PPPK Teknis', meta: 'PPPK · Rp219.000' },
  { title: 'Rekrutmen Bersama BUMN', meta: 'BUMN · Rp129.000' },
]

const mockPerformance = [
  { title: 'Simulasi SKD Kedinasan', width: 82 },
  { title: 'Persiapan UTBK-SNBT', width: 58 },
  { title: 'Latihan PPPK Teknis', width: 39 },
  { title: 'Rekrutmen Bersama BUMN', width: 68 },
]

const mockPayouts = [
  { period: 'Juni', amount: 'Rp1.240.000', done: true },
  { period: 'Juli', amount: 'Rp980.000', done: true },
  { period: 'Agustus', amount: 'Rp1.310.000', done: true },
  { period: 'September', amount: 'Diproses', done: false },
]

const mockOptions = [
  { label: 'A. 24 orang', correct: false },
  { label: 'B. 36 orang', correct: true },
  { label: 'C. 42 orang', correct: false },
]

const mockQuestions = [
  'Berapa hasil dari 15% × 240?',
  'Jika x + 2y = 10 dan x − y = 1…',
  'Manakah pernyataan yang tepat?',
  'Nilai rata-rata dari data berikut…',
  'Sinonim kata "elaborasi" adalah…',
  'Urutan peristiwa yang benar adalah…',
]

const mockFormFields = ['Nama lengkap', 'Email', 'Bidang keahlian']

// One observer per section; each card then runs its own --cycle so the loops
// drift apart instead of pulsing in unison.
const { target: benefitRef, ready: benefitReady, isInView: benefitInView } = useInView(0.15)
const { target: advantageRef, ready: advantageReady, isInView: advantageInView } = useInView(0.15)
const { target: flowRef, ready: flowReady, isInView: flowInView } = useInView(0.2)
void benefitRef
void advantageRef
void flowRef

const EXPERTISE_OPTIONS = ['SKD / CPNS', 'Sekolah Kedinasan', 'PPPK', 'UTBK-SNBT', 'TKA', 'Rekrutmen BUMN', 'Lainnya']
const expertiseSelectOptions = EXPERTISE_OPTIONS.map(option => ({ value: option, label: option }))

// No name/email fields: the server reads identity from the session. The form
// only asks what the applicant alone knows.
const form = reactive({
  whatsapp: '',
  expertise: '',
  experience: '',
  portfolio: '',
  acceptTerms: false,
})

type FieldKey = keyof typeof form
const errors = reactive<Partial<Record<FieldKey, string>>>({})

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const submitError = ref('')

// Deliberately loose: 08xx, +62xx, with or without spaces/dashes.
const PHONE_PATTERN = /^\+?[\d\s-]{9,20}$/
const MIN_EXPERIENCE_LENGTH = 20

function validate() {
  for (const key of Object.keys(errors) as FieldKey[]) delete errors[key]

  if (!form.whatsapp.trim()) errors.whatsapp = 'Nomor WhatsApp wajib diisi.'
  else if (!PHONE_PATTERN.test(form.whatsapp.trim())) {
    errors.whatsapp = 'Nomor WhatsApp belum benar. Contoh: 081234567890.'
  }

  if (!form.expertise) errors.expertise = 'Pilih salah satu bidang keahlian.'

  if (!form.experience.trim()) errors.experience = 'Ceritakan sedikit pengalamanmu.'
  else if (form.experience.trim().length < MIN_EXPERIENCE_LENGTH) {
    errors.experience = 'Tambahkan sedikit detail supaya tim kami bisa menilai pengajuanmu.'
  }

  if (!form.acceptTerms) errors.acceptTerms = 'Kamu perlu menyetujui ketentuan untuk melanjutkan.'

  return Object.keys(errors).length === 0
}

async function onSubmit() {
  submitError.value = ''
  if (!validate()) return

  isSubmitting.value = true
  try {
    await submitTutorApplication({
      whatsapp: form.whatsapp.trim(),
      expertise: form.expertise,
      experience: form.experience.trim(),
      portfolioUrl: form.portfolio.trim() || null,
    })
    isSubmitted.value = true
  }
  catch (cause) {
    // A 409 has a reason the applicant can act on themselves (already a
    // tutor, or still in review), so the server message passes through.
    const conflict = (cause as { statusCode?: number })?.statusCode === 409
    const reason = (cause as { data?: { error?: string } })?.data?.error

    submitError.value = conflict && reason
      ? reason
      // This page is shared via DM/chat, so the natural fallback is
      // replying to the conversation that brought them here.
      : 'Pengajuanmu belum terkirim. Coba lagi beberapa saat lagi. Jika masih gagal, balas pesan dari tim Zenko yang mengarahkanmu ke halaman ini.'
  }
  finally {
    isSubmitting.value = false
  }
}

const { user, isSignedIn, isLoading: isCheckingSession } = useAuth()
const { data: myApplication, pending: isLoadingApplication, refresh: refreshApplication } =
  useMyTutorApplication()

// The session resolves client-side (plugins/auth.client.ts), so fetch the
// application as soon as the state flips to signed-in.
watch(isSignedIn, (signedIn) => {
  if (signedIn) refreshApplication()
}, { immediate: true })

/** Where the applicant returns after signing in. */
const signInPath = '/masuk?lanjut=/jadi-tutor%23form-pengajuan'

type FormState = 'checking' | 'signed-out' | 'submitted' | 'in-review' | 'approved' | 'form'

const formState = computed<FormState>(() => {
  if (isCheckingSession.value || isLoadingApplication.value) return 'checking'
  if (!isSignedIn.value) return 'signed-out'
  if (isSubmitted.value) return 'submitted'

  // Check the role before the application history: a tutor granted the role
  // directly has no application record, and without this they would be shown
  // a form the server is guaranteed to reject.
  if (user.value?.role === 'tutor') return 'approved'

  const status = myApplication.value?.status
  if (status === 'pending') return 'in-review'
  if (status === 'approved') return 'approved'

  // Includes 'rejected': one rejection is not a lifetime ban, and the server
  // only blocks applications that are still open.
  return 'form'
})
</script>

<template>
  <main>
    <!-- ==================================================================
         1. Hero, panel melayang seperti homepage
         ================================================================== -->
    <section class="container-page pt-3 md:pt-5">
      <div
        class="dot-grid dot-grid-hero hero-aurora relative overflow-hidden rounded-[26px] px-5 pt-12 pb-16 md:rounded-xl md:px-10 md:pt-16 md:pb-20"
      >
        <div class="relative z-1 mx-auto max-w-190 text-center">
          <span
            class="mb-5 inline-flex items-center gap-2 rounded-pill border border-primary/20 bg-white/80 py-2 pr-4 pl-3 text-[0.82rem] font-semibold shadow-[0_2px_8px_rgba(47,111,235,0.06)] backdrop-blur-[6px]"
          >
            <span class="h-2 w-2 rounded-full bg-success shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" aria-hidden="true" />
            Pendaftaran tutor Zenko sedang dibuka
          </span>

          <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter">
            Punya keahlian mengajar?
            <span class="text-accent mt-1 block">Bantu lebih banyak siswa maju.</span>
          </h1>

          <p class="mx-auto mt-4 max-w-160 text-[1.02rem] text-muted">
            Ubah bank soal dan pengalamanmu menjadi paket latihan untuk berbagai
            tujuan ujian. Kamu fokus pada materi, Zenko membantu urusan platform,
            pembayaran, dan penilaian otomatis.
          </p>

          <AppButton href="#form-pengajuan" size="lg" class="mt-8">
            Ajukan jadi tutor
          </AppButton>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         2. Benefit, bento: satu kartu lebar, satu tinggi, dua kecil
         ================================================================== -->
    <section
      ref="benefitRef"
      class="py-18 md:py-22"
      :class="[benefitReady && 'anim-ready', benefitInView && 'is-inview']"
      aria-labelledby="benefit-heading"
    >
      <div class="container-page">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Manfaat jadi tutor
          </p>
          <h2 id="benefit-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Keahlianmu siap <span class="text-accent">menjangkau lebih banyak siswa</span>
          </h2>
          <p class="mt-3.5 text-[1.02rem] text-muted">
            Susun paket, tayangkan di katalog, dan pantau penjualannya dari satu tempat.
          </p>
        </div>

        <!-- Uniform 2x2 grid. Each card: equal-height mock tray, then
             judul dan deskripsi rata tengah.

             Komposisi mock selalu dipusatkan lewat `absolute inset-0 flex
             items-center` + satu pembungkus `relative w-full` sebagai jangkar,
             supaya posisinya tidak bergeser saat tinggi tray berubah.

             Rotasi diletakkan di elemen pembungkus, terpisah dari elemen
             ber-anim-*. Di Tailwind v4 `rotate-*` memakai properti `rotate`
             sendiri sehingga sebenarnya tidak bentrok dengan animasi, tapi
             memisahkannya menjaga tiap elemen tetap satu tanggung jawab. -->
        <div class="mx-auto grid max-w-300 grid-cols-1 gap-5 rounded-4xl bg-surface-alt p-4 md:p-6 md:grid-cols-2">
          <!-- 1. Penghasilan tambahan -->
          <article
            style="--cycle: 7s"
            class="flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
          >
            <div class="relative mb-7 min-h-80 overflow-hidden rounded-[20px]" aria-hidden="true">
              <div class="absolute inset-0 flex items-center px-6">
                <div class="relative mx-auto w-full max-w-80">
                  <div class="relative z-1 ml-auto w-64 translate-x-3 rotate-2">
                    <div class="rounded-2xl bg-surface p-4 shadow-float">
                      <TutorEarningsMock :cycle-ms="7000" />
                    </div>
                  </div>

                  <div class="absolute -top-11 -left-5 w-44 -rotate-8">
                    <div
                      class="anim-item rounded-lg bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark p-3.5 shadow-brand"
                      style="--delay: 80ms"
                    >
                      <span class="block text-[0.68rem] font-bold tracking-widest text-white/70 uppercase">
                        Paket terjual
                      </span>
                      <ul class="mt-3 grid gap-2">
                        <li
                          v-for="(sale, index) in mockSales"
                          :key="sale.title"
                          class="anim-item"
                          :style="{ '--delay': `${240 + index * 130}ms` }"
                        >
                          <span class="block truncate text-[0.7rem] font-semibold text-white">
                            {{ sale.title }}
                          </span>
                          <span class="block text-[0.66rem] text-white/70">{{ sale.amount }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 class="mb-2.5 text-center text-[1.35rem] font-bold tracking-[-0.03em]">
              Penghasilan tambahan
            </h3>
            <p class="text-center leading-[1.62] text-muted">
              Jadikan soal dan materi yang kamu kuasai sebagai sumber penghasilan
              dari setiap paket yang terjual.
            </p>
          </article>

          <!-- 2. Direct access to searching students -->
          <article
            style="--cycle: 5s"
            class="flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
          >
            <div class="relative mb-7 min-h-80 overflow-hidden rounded-[20px]" aria-hidden="true">
              <div class="absolute inset-0 flex items-center px-8">
                <div class="relative mx-auto w-full max-w-80">
                  <div class="relative z-1 rotate-2">
                    <div class="anim-item rounded-2xl bg-surface p-4 shadow-float" style="--delay: 140ms">
                      <ul class="grid gap-3">
                        <li
                          v-for="(result, index) in mockResults"
                          :key="result.title"
                          class="anim-slide flex items-center gap-3"
                          :style="{ '--delay': `${300 + index * 160}ms` }"
                        >
                          <span class="h-8 w-8 shrink-0 rounded-[9px] bg-linear-160 from-primary-light to-primary-dark" />
                          <span class="flex min-w-0 flex-1 flex-col">
                            <span class="truncate text-[0.76rem] font-bold tracking-[-0.02em]">
                              {{ result.title }}
                            </span>
                            <span class="truncate text-[0.7rem] text-muted">{{ result.meta }}</span>
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div class="absolute -top-12 -left-9 -rotate-5">
                    <div
                      class="anim-item flex items-center gap-2.5 rounded-pill bg-surface py-2.5 pr-5 pl-7 shadow-lift"
                      style="--delay: 60ms"
                    >
                      <IconSearch class="h-4 w-4 shrink-0 text-placeholder" />
                      <span class="text-[0.82rem] font-medium text-muted">SKD 2026</span>
                    </div>
                  </div>

                  <div class="absolute -right-9 -bottom-13 w-32 rotate-6">
                    <div
                      class="anim-item rounded-[13px] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark p-3.5 shadow-brand"
                      style="--delay: 900ms"
                    >
                      <span class="block text-[0.64rem] font-bold tracking-widest text-white/70 uppercase">
                        Minggu ini
                      </span>
                      <div class="mt-3 flex h-9 items-end gap-1.5">
                        <span
                          v-for="(height, index) in [40, 62, 54, 100]"
                          :key="index"
                          class="anim-bar-y flex-1 rounded-t-sm"
                          :class="index === 3 ? 'bg-white' : 'bg-white/30'"
                          :style="{ height: `${height}%`, '--delay': `${1020 + index * 90}ms` }"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 class="mb-2.5 text-center text-[1.35rem] font-bold tracking-[-0.03em]">
              Jangkau siswa yang sedang mencari
            </h3>
            <p class="text-center leading-[1.62] text-muted">
              Paketmu dapat ditemukan oleh siswa yang sedang mencari latihan tryout
              sesuai target ujiannya.
            </p>
          </article>

          <!-- 3. Dashboard performa paket -->
          <article
            style="--cycle: 6s"
            class="flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
          >
            <div class="relative mb-7 min-h-80 overflow-hidden rounded-[20px]" aria-hidden="true">
              <div class="absolute inset-0 flex items-center px-6">
                <div class="relative mx-auto w-full max-w-80">
                  <div class="relative z-1 ml-auto w-64 translate-x-3 rotate-2">
                    <div class="rounded-2xl bg-surface p-4 shadow-float">
                      <!-- Performance row: package name above, fill growing from the left -->
                      <p class="mb-3 text-[0.68rem] font-bold tracking-widest text-faint uppercase">
                        Performa paket
                      </p>
                      <div class="grid gap-3">
                        <span v-for="(item, index) in mockPerformance" :key="item.title" class="grid gap-1.5">
                          <span class="truncate text-[0.72rem] font-semibold tracking-[-0.02em]">
                            {{ item.title }}
                          </span>
                          <span class="block h-2 overflow-hidden rounded-pill bg-skeleton/60">
                            <span
                              class="anim-bar block h-full rounded-pill bg-linear-to-r from-primary-light to-primary"
                              :style="{ width: `${item.width}%`, '--delay': `${260 + index * 150}ms` }"
                            />
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="absolute -top-10 -left-6 w-40 -rotate-7">
                    <div
                      class="anim-item rounded-[13px] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark p-4 shadow-brand"
                      style="--delay: 90ms"
                    >
                      <span class="block text-[0.64rem] font-bold tracking-widest text-white/70 uppercase">
                        Pertumbuhan
                      </span>
                      <p class="mt-2.5 text-[1.35rem] leading-none font-extrabold tracking-[-0.04em] text-white">
                        +18%
                      </p>
                      <span class="mt-2 block text-[0.66rem] text-white/70">dibanding bulan lalu</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 class="mb-2.5 text-center text-[1.35rem] font-bold tracking-[-0.03em]">
              Dashboard performa paket
            </h3>
            <p class="text-center leading-[1.62] text-muted">
              Pantau jumlah pembelian, penilaian, dan pendapatan dari tiap paket dalam
              satu tempat.
            </p>
          </article>

          <!-- 4. Pencairan dana jelas jadwalnya -->
          <article
            style="--cycle: 8s"
            class="flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
          >
            <div class="relative mb-7 min-h-80 overflow-hidden rounded-[20px]" aria-hidden="true">
              <div class="absolute inset-0 flex items-center px-6">
                <div class="relative mx-auto w-full max-w-80">
                  <div class="relative z-1 ml-auto w-64 translate-x-3 rotate-2">
                    <div class="rounded-2xl bg-surface p-4 shadow-float">
                      <!-- Payout schedule: three paid, one pending -->
                      <p class="mb-3 text-[0.68rem] font-bold tracking-widest text-faint uppercase">
                        Riwayat pencairan
                      </p>
                      <ul class="grid gap-2.5 border-t border-line pt-3">
                        <li
                          v-for="(payout, index) in mockPayouts"
                          :key="payout.period"
                          class="anim-item flex items-center gap-2.5"
                          :style="{ '--delay': `${160 + index * 170}ms` }"
                        >
                          <span class="w-20 shrink-0 text-[0.72rem] text-muted">{{ payout.period }}</span>
                          <span
                            class="flex-1 truncate text-right text-[0.74rem] font-semibold tracking-[-0.02em]"
                            :class="payout.done ? 'text-ink' : 'text-muted'"
                          >{{ payout.amount }}</span>
                          <IconCheck
                            v-if="payout.done"
                            class="anim-draw h-4 w-4 shrink-0 text-success-ink"
                            :style="{ '--delay': `${400 + index * 170}ms` }"
                          />
                          <span v-else class="anim-pulse h-2.5 w-2.5 shrink-0 rounded-full bg-skeleton" />
                        </li>
                      </ul>
                    </div>
                  </div>

                  <!-- Mini calendar: a "schedule" marker shaped unlike the other
                       card mocks, so the four boxes don't read the same. -->
                  <div class="absolute -top-11 -left-6 w-36 -rotate-8">
                    <div
                      class="anim-item rounded-lg bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark p-4 shadow-brand"
                      style="--delay: 90ms"
                    >
                      <span class="block h-2 w-12 rounded-pill bg-white/45" />
                      <div class="mt-3.5 grid grid-cols-4 gap-1.5">
                        <span
                          v-for="cell in 12"
                          :key="cell"
                          class="anim-item block h-2.5 rounded-[3px]"
                          :class="cell === 10 ? 'bg-white' : 'bg-white/25'"
                          :style="{ '--delay': `${240 + cell * 34}ms` }"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="absolute -right-6 -bottom-9 rotate-6">
                    <div
                      class="anim-item rounded-pill bg-success-soft py-2.5 pr-7 pl-4 text-[0.8rem] font-bold text-success-ink shadow-lift"
                      style="--delay: 940ms"
                    >Dana cair</div>
                  </div>
                </div>
              </div>
            </div>

            <h3 class="mb-2.5 text-center text-[1.35rem] font-bold tracking-[-0.03em]">
              Pencairan sesuai jadwal
            </h3>
            <p class="text-center leading-[1.62] text-muted">
              Penghasilan dari penjualan tercatat rapi dan dapat dicairkan sesuai
              jadwal yang berlaku.
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         3. Keunggulan, bento lima kartu, lebar penuh
         ================================================================== -->
    <section
      ref="advantageRef"
      class="py-18 md:py-22"
      :class="[advantageReady && 'anim-ready', advantageInView && 'is-inview']"
      aria-labelledby="keunggulan-heading"
    >
      <div class="container-page relative z-1">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Kenapa Zenko
          </p>
          <h2 id="keunggulan-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Fokus pada materi, <span class="text-accent">Zenko bantu teknisnya</span>
          </h2>
          <p class="mt-3.5 text-[1.02rem] text-muted">
            Sistem ujian, pembayaran, penilaian, dan pencatatan penjualan sudah siap
            digunakan saat kamu mulai menerbitkan paket.
          </p>
        </div>

        <!-- Four-card bento, full container-page width. DOM order is what
             membentuk susunannya: kartu lebar di atas (kolom 1-2), kartu
             tinggi di kolom 3 setinggi dua baris, lalu dua kartu di bawah. -->
        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
          <article
            style="--cycle: 4.5s"
            class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-7 md:col-span-2"
          >
            <!-- The widest card, so its mock uses the richest example
                 perhitungan supaya lebarnya terpakai, bukan cuma satu batang.
                 70% dan 30% dari Rp149.000 = Rp104.300 dan Rp44.700. -->
            <div class="mb-6 rounded-xl bg-surface-sunken p-6" aria-hidden="true">
              <p class="text-[0.78rem] font-semibold text-muted">
                Contoh: satu paket seharga <span class="text-ink">Rp149.000</span> terjual
              </p>

              <div class="mt-4 flex h-3 gap-1.5 overflow-hidden">
                <span
                  class="anim-bar block h-full w-[70%] rounded-pill bg-linear-to-r from-primary-light to-primary"
                  style="--delay: 160ms"
                />
                <span class="anim-bar block h-full w-[30%] rounded-pill bg-skeleton" style="--delay: 460ms" />
              </div>

              <div class="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <span class="anim-item" style="--delay: 300ms">
                  <b class="text-[1.05rem] font-extrabold tracking-[-0.03em] text-primary">Rp104.300</b>
                  <span class="ml-2 text-[0.78rem] font-semibold text-muted">masuk ke kamu · 70%</span>
                </span>
                <span class="anim-item" style="--delay: 600ms">
                  <b class="text-[1.05rem] font-extrabold tracking-[-0.03em] text-muted">Rp44.700</b>
                  <span class="ml-2 text-[0.78rem] font-semibold text-muted">Zenko · 30%</span>
                </span>
              </div>
            </div>
            <h3 class="mb-2.5 text-[1.2rem] font-bold tracking-[-0.03em]">Bagi hasil transparan 70:30</h3>
            <p class="leading-[1.62] text-muted">
              Kamu tetap dapat porsi terbesar dari setiap paket yang terjual, tanpa
              biaya tersembunyi.
            </p>
          </article>

          <article
            style="--cycle: 5.5s"
            class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:flex md:flex-col md:p-7 md:row-span-2"
          >
            <div class="relative overflow-hidden rounded-xl bg-surface-sunken p-6 md:flex md:flex-1 md:flex-col md:justify-between" aria-hidden="true">
              <!-- Package content held behind the access panel -->
              <!-- Access panel stays in flow (not absolute) so on a tall card
                   ia turun ke bawah dan daftar soalnya mengisi sisa ruang. -->
              <div class="grid gap-3">
                <p
                  v-for="(question, index) in mockQuestions"
                  :key="question"
                  class="truncate text-[0.8rem] text-muted"
                >
                  {{ index + 1 }}. {{ question }}
                </p>
              </div>
              <span
                class="anim-item mt-7 flex items-center justify-center rounded-[11px] border border-line bg-surface/95 py-2.5 text-[0.78rem] font-bold text-muted shadow-[0_6px_18px_rgba(15,23,42,0.08)] backdrop-blur-[3px]"
                style="--delay: 320ms"
              >Akses terkunci</span>
            </div>
            <h3 class="mt-6 mb-2.5 text-[1.2rem] font-bold tracking-[-0.03em]">Kontenmu terlindungi</h3>
            <p class="leading-[1.62] text-muted">
              Paket soal diakses langsung di Zenko, bukan melalui file unduhan yang
              mudah disebarkan ulang.
            </p>
          </article>

          <article
            style="--cycle: 6.5s"
            class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-7"
          >
            <div class="mb-6 rounded-xl bg-surface-sunken p-6" aria-hidden="true">
              <!-- Three options; the right one ticks itself -->
              <ul class="grid gap-2.5">
                <li
                  v-for="(option, index) in mockOptions"
                  :key="option.label"
                  class="anim-item flex items-center gap-3 rounded-[11px] px-3.5 py-2.5"
                  :class="option.correct ? 'bg-primary-soft' : 'bg-surface'"
                  :style="{ '--delay': `${120 + index * 150}ms` }"
                >
                  <span
                    class="h-3.5 w-3.5 shrink-0 rounded-full border-2"
                    :class="option.correct ? 'border-primary bg-primary' : 'border-line'"
                  />
                  <span
                    class="flex-1 truncate text-[0.78rem] font-semibold tracking-[-0.02em]"
                    :class="option.correct ? 'text-primary' : 'text-muted'"
                  >{{ option.label }}</span>
                  <IconCheck
                    v-if="option.correct"
                    class="anim-draw h-4 w-4 shrink-0 text-primary"
                    style="--delay: 620ms"
                  />
                </li>
              </ul>
            </div>
            <h3 class="mb-2.5 text-[1.2rem] font-bold tracking-[-0.03em]">Penilaian otomatis untuk pilihan ganda</h3>
            <p class="leading-[1.62] text-muted">
              Sistem menilai soal pilihan ganda secara otomatis agar kamu dapat fokus
              membuat soal dan pembahasan yang berkualitas.
            </p>
          </article>

          <article
            style="--cycle: 7.5s"
            class="rounded-3xl border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-7"
          >
            <div class="mb-6 rounded-xl bg-surface-sunken p-6" aria-hidden="true">
              <!-- The parts you don't have to build yourself -->
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(chip, index) in ['Website', 'Pembayaran', 'Penilaian', 'Server', 'Invoice']"
                  :key="chip"
                  class="anim-item rounded-pill bg-surface px-3 py-1.5 text-[0.76rem] font-semibold text-muted shadow-[0_2px_8px_rgba(15,23,42,0.05)]"
                  :style="{ '--delay': `${120 + index * 90}ms` }"
                >{{ chip }}</span>
              </div>
              <p class="mt-4 text-[0.78rem] font-bold text-primary">Semua diurus Zenko</p>
            </div>
            <h3 class="mb-2.5 text-[1.2rem] font-bold tracking-[-0.03em]">Platform siap digunakan</h3>
            <p class="leading-[1.62] text-muted">
              Website, sistem pembayaran, penilaian otomatis, dan server sudah
              disiapkan oleh Zenko.
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         4. Cara kerja, tiga langkah dengan rel penghubung
         ================================================================== -->
    <section
      ref="flowRef"
      class="py-18 md:py-22"
      :class="[flowReady && 'anim-ready', flowInView && 'is-inview']"
      aria-labelledby="cara-kerja-tutor-heading"
    >
      <div class="container-page">
        <div class="mx-auto mb-12 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Cara kerja
          </p>
          <h2 id="cara-kerja-tutor-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Tiga langkah untuk <span class="text-accent">membagikan keahlianmu</span>
          </h2>
        </div>

        <!-- Three cards in a row. On desktop the hovered card widens and
             panel mocknya menggeser masuk; kartu lain menyusut. Nomor langkah
             sengaja TIDAK beranimasi karena itu isi, bukan hiasan, dan loop anim-*
             akan membuat langkah 2 dan 3 kehilangan nomor tiap siklus.

             Panel mock hanya disembunyikan pada perangkat berpenunjuk presisi
             (pointer-fine). Di layar sentuh hover tidak pernah terjadi, jadi
             kalau disembunyikan tanpa syarat isinya tidak akan pernah terlihat
             di sana. -->
        <ol class="mx-auto flex max-w-300 flex-col gap-4 rounded-4xl bg-surface-alt p-4 md:p-6 md:flex-row">
          <li
            v-for="(step, index) in steps"
            :key="step.title"
            style="--cycle: 6s"
            class="group flex flex-1 flex-col overflow-hidden rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[flex-grow,box-shadow] duration-500 ease-smooth md:min-h-72 md:flex-row md:hover:grow-2 md:hover:shadow-lift"
          >
            <div class="flex flex-col md:min-w-36 md:flex-1">
              <span
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-[13px] bg-linear-to-b from-primary-light to-primary font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_rgba(47,111,235,0.22)]"
                aria-hidden="true"
              >{{ index + 1 }}</span>

              <h3 class="mt-8 mb-2 text-[1.2rem] font-bold tracking-[-0.03em] md:mt-auto md:pt-10">
                {{ step.title }}
              </h3>
              <p class="leading-[1.62] text-muted">{{ step.description }}</p>
            </div>

            <div
              class="order-first mb-6 w-full shrink-0 overflow-hidden transition-[width,opacity,margin] duration-500 ease-smooth md:order-0 md:mb-0 md:pointer-fine:w-0 md:pointer-fine:opacity-0 md:pointer-fine:group-hover:ml-5 md:pointer-fine:group-hover:w-64 md:pointer-fine:group-hover:opacity-100"
              aria-hidden="true"
            >
              <div class="flex min-h-40 w-full items-center rounded-[20px] bg-surface-sunken p-5 md:h-full md:w-64">
                <!-- 1. Application form filling in line by line -->
                <div v-if="index === 0" class="grid w-full gap-2.5">
                  <span
                    v-for="(field, row) in mockFormFields"
                    :key="field"
                    class="anim-item flex h-9 items-center rounded-[9px] bg-surface px-3 text-[0.74rem] text-placeholder shadow-[0_2px_8px_rgba(15,23,42,0.05)]"
                    :style="{ '--delay': `${140 + row * 190}ms` }"
                  >{{ field }}</span>
                </div>

                <!-- 2. Application moving to approved -->
                <div v-else-if="index === 1" class="grid w-full gap-3">
                  <span class="flex items-center gap-3 rounded-[11px] bg-surface p-3 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
                    <span class="h-8 w-8 shrink-0 rounded-full bg-skeleton" />
                    <span class="grid min-w-0 flex-1">
                      <span class="anim-item truncate text-[0.76rem] font-bold tracking-[-0.02em]" style="--delay: 160ms">
                        Rina Kartika
                      </span>
                      <span class="anim-item truncate text-[0.7rem] text-muted" style="--delay: 280ms">
                        Pengajuan tutor · SKD
                      </span>
                    </span>
                  </span>
                  <span
                    class="anim-item mx-auto flex items-center gap-2 rounded-pill bg-success-soft px-3.5 py-1.5 text-[0.76rem] font-bold text-success-ink"
                    style="--delay: 520ms"
                  >
                    <IconCheck class="anim-draw h-3.5 w-3.5" style="--delay: 700ms" />
                    Disetujui
                  </span>
                </div>

                <!-- 3. Upload finishing, then going live -->
                <div v-else class="grid w-full gap-3">
                  <span class="block h-2.5 overflow-hidden rounded-pill bg-skeleton/60">
                    <span
                      class="anim-bar block h-full w-full rounded-pill bg-linear-to-r from-primary-light to-primary"
                      style="--delay: 180ms"
                    />
                  </span>
                  <span class="flex items-center gap-3 rounded-[11px] bg-surface p-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
                    <span class="h-8 w-8 shrink-0 rounded-[9px] bg-linear-160 from-primary-light to-primary-dark" />
                    <span
                      class="anim-item min-w-0 flex-1 truncate text-[0.74rem] font-bold tracking-[-0.02em]"
                      style="--delay: 560ms"
                    >TKA Matematika SMA</span>
                    <span
                      class="anim-item shrink-0 rounded-pill bg-primary-soft px-2.5 py-1 text-[0.7rem] font-bold text-primary"
                      style="--delay: 760ms"
                    >Tayang</span>
                  </span>
                </div>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </section>


    <!-- ==================================================================
         5. FAQ memakai <details> asli, jadi tetap bisa dibuka tanpa JavaScript dan
         sudah punya semantik expand/collapse untuk pembaca layar.
         ================================================================== -->
    <section
      class="border-t border-hairline py-18 md:py-22"
      aria-labelledby="faq-heading"
    >
      <div class="container-page relative z-1">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Pertanyaan umum
          </p>
          <h2 id="faq-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Pertanyaan tentang menjadi <span class="text-accent">tutor Zenko</span>
          </h2>
          <p class="mt-3.5 text-[1.02rem] text-muted">
            Temukan jawaban tentang syarat, bagi hasil, jenis paket, dan proses
            pendaftaran tutor di Zenko.
          </p>
        </div>

        <div class="mx-auto grid max-w-300 gap-3 rounded-4xl bg-surface-alt p-4 md:p-6">
          <!-- The shared `name` makes the four one exclusive group:
               membuka satu otomatis menutup yang lain, tanpa JavaScript.
               Di browser yang belum mendukung (Firefox < 130, Safari < 17.2),
               atribut ini diabaikan dan accordionnya sekadar bisa terbuka
               lebih dari satu tanpa ada yang rusak. -->
          <details
            v-for="faq in faqs"
            :key="faq.question"
            name="faq"
            class="group rounded-xl border border-hairline bg-surface px-5 py-4 shadow-xs transition-[box-shadow,border-color] duration-300 ease-smooth hover:shadow-lift open:shadow-lift md:px-6 md:py-5"
          >
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-4 font-bold tracking-[-0.02em] [&::-webkit-details-marker]:hidden"
            >
              {{ faq.question }}

              <!-- Plus that becomes a minus when open -->
              <span class="relative h-4 w-4 shrink-0" aria-hidden="true">
                <span class="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rounded-pill bg-primary" />
                <span
                  class="absolute top-0 left-1/2 h-4 w-0.5 -translate-x-1/2 rounded-pill bg-primary transition-[opacity,rotate] duration-300 ease-smooth group-open:rotate-90 group-open:opacity-0"
                />
              </span>
            </summary>

            <p class="mt-3 leading-[1.7] text-muted">{{ faq.answer }}</p>
          </details>
        </div>
      </div>
    </section>
    <!-- ==================================================================
         6. Form pengajuan, sengaja tanpa animasi loop
         ================================================================== -->
    <section
      id="form-pengajuan"
      class="border-t border-hairline bg-surface-alt py-18 md:py-22"
      aria-labelledby="form-heading"
    >
      <div class="container-page">
        <div class="mx-auto max-w-150">
          <div class="mb-9 text-center">
            <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
              Pengajuan tutor
            </p>
            <!-- Neutral to whatever the card below shows: a "fill in your
                 details" heading would clash with the signed-out, in-review,
                 and already-a-tutor panels. -->
            <h2 id="form-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
              Daftar sebagai <span class="text-accent">tutor Zenko</span>
            </h2>
          </div>

          <div class="rounded-[22px] border border-hairline bg-surface p-5 shadow-xs md:p-9">
            <p v-if="formState === 'checking'" class="py-6 text-center text-muted">
                Memeriksa akun...
            </p>

            <!-- Applications attach to an account, not a typed email:
                 approval grants the tutor role to an account, so one must
                 exist first. -->
            <div v-else-if="formState === 'signed-out'" class="py-4 text-center">
              <h3 class="text-[1.25rem] font-bold tracking-[-0.03em]">Masuk untuk mengirim pengajuan</h3>
              <p class="mx-auto mt-3 max-w-105 leading-[1.7] text-muted">
                Pengajuan akan terhubung ke akun Zenko agar kamu dapat memantau
                statusnya. Jika disetujui, akses tutor akan aktif di akun yang sama.
              </p>
              <AppButton :to="signInPath" size="lg" class="mt-6">Masuk ke akun</AppButton>
              <p class="mt-4 text-[0.86rem] text-muted">
                Belum punya akun? Masuk dengan Google untuk membuat akun baru secara gratis.
              </p>
            </div>

            <!-- Confirmation replaces the form: no reason to submit twice. -->
            <div
              v-else-if="formState === 'submitted' || formState === 'in-review'"
              role="status"
              class="py-6 text-center"
            >
              <span
                class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-soft"
                aria-hidden="true"
              >
                <IconCheck class="h-7 w-7 text-success-ink" />
              </span>
              <h3 class="mt-5 text-[1.35rem] font-bold tracking-[-0.03em]">
                {{ formState === 'submitted' ? 'Pengajuan berhasil dikirim' : 'Pengajuanmu sedang ditinjau' }}
              </h3>
              <p class="mx-auto mt-3 max-w-100 leading-[1.7] text-muted">
                Tim kami akan meninjau pengajuanmu dan menghubungi lewat email atau
                WhatsApp setelah proses peninjauan selesai.
              </p>
            </div>

            <div v-else-if="formState === 'approved'" class="py-6 text-center">
              <span
                class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-soft"
                aria-hidden="true"
              >
                <IconCheck class="h-7 w-7 text-success-ink" />
              </span>
              <!-- Covers both routes here: an approved application, and a
                   role granted directly by an admin. -->
              <h3 class="mt-5 text-[1.35rem] font-bold tracking-[-0.03em]">
                Akunmu sudah memiliki akses tutor
              </h3>
              <p class="mx-auto mt-3 max-w-100 leading-[1.7] text-muted">
                Tidak perlu mengajukan lagi. Unggah paket pertamamu lewat
                dashboard tutor.
              </p>
              <AppButton to="/dashboard/tutor" size="lg" class="mt-6">Buka dashboard tutor</AppButton>
            </div>

            <form v-else class="grid gap-6" novalidate @submit.prevent="onSubmit">
              <div class="flex items-start gap-3 border-b border-hairline pb-5">
                <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary" aria-hidden="true">
                  <AppIcon name="graduation-cap" :size="20" weight="bold" />
                </span>
                <div>
                  <h3 class="font-bold tracking-[-0.02em]">Ceritakan tentang dirimu</h3>
                  <p class="mt-1 text-[0.86rem] leading-[1.55] text-muted">Informasi ini membantu tim kami menilai pengajuanmu dengan lebih cepat.</p>
                </div>
              </div>

              <!-- Identity is shown, not asked: the server reads it from the
                   session, so an editable field could only lie. -->
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

              <p
                v-if="myApplication?.status === 'rejected'"
                class="rounded-sm border border-hairline-strong bg-surface-alt px-4 py-3 text-[0.86rem] text-muted"
              >
                Pengajuan sebelumnya belum bisa kami setujui. Kamu boleh mengajukan
                lagi. Lengkapi bagian pengalaman agar tim kami memiliki informasi
                yang cukup untuk menilainya.
              </p>

              <FormField
                id="tutor-whatsapp"
                v-model="form.whatsapp"
                label="Nomor WhatsApp"
                type="tel"
                autocomplete="tel"
                placeholder="081234567890"
                :error="errors.whatsapp"
              />

              <div>
                <AppSelect
                  v-model="form.expertise"
                  label="Bidang keahlian"
                  :options="expertiseSelectOptions"
                  placeholder="Pilih bidang keahlian"
                  :invalid="Boolean(errors.expertise)"
                />
                <p v-if="errors.expertise" id="tutor-expertise-error" class="mt-2 text-[0.82rem] text-red-600">
                  {{ errors.expertise }}
                </p>
              </div>

              <div>
                <label for="tutor-experience" class="mb-2 block text-[0.9rem] font-semibold">
                  Ceritakan pengalamanmu
                </label>
                <textarea
                  id="tutor-experience"
                  v-model="form.experience"
                  rows="4"
                  placeholder="Contoh: pernah lulus CPNS 2023 atau mengajar di bimbel selama 3 tahun"
                  class="w-full resize-y rounded-sm border bg-surface px-4 py-3 transition-[border-color,box-shadow] duration-200 ease-smooth placeholder:text-placeholder focus:outline-none"
                  :class="
                    errors.experience
                      ? 'border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.16)]'
                      : 'border-line focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]'
                  "
                  :aria-invalid="Boolean(errors.experience)"
                  :aria-describedby="errors.experience ? 'tutor-experience-error' : undefined"
                />
                <p v-if="errors.experience" id="tutor-experience-error" class="mt-2 text-[0.82rem] text-red-600">
                  {{ errors.experience }}
                </p>
              </div>

              <FormField
                id="tutor-portfolio"
                v-model="form.portfolio"
                label="Link portofolio atau media sosial"
                type="url"
                placeholder="https://instagram.com/akunmu"
                hint="Opsional, tapi membantu tim kami menilai lebih cepat."
              />

              <div>
                <label class="flex cursor-pointer items-start gap-2.5 text-[0.88rem] text-muted">
                  <input
                    v-model="form.acceptTerms"
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] accent-primary"
                    :aria-invalid="Boolean(errors.acceptTerms)"
                    :aria-describedby="errors.acceptTerms ? 'tutor-terms-error' : undefined"
                  >
                  <span>
                    Saya menyetujui
                    <NuxtLink
                      to="/ketentuan-layanan#peran-tutor"
                      class="font-semibold text-primary hover:underline"
                    >
                      Ketentuan Tutor Zenko
                    </NuxtLink>
                    termasuk aturan orisinalitas konten.
                  </span>
                </label>
                <p v-if="errors.acceptTerms" id="tutor-terms-error" class="mt-2 text-[0.82rem] text-red-600">
                  {{ errors.acceptTerms }}
                </p>
              </div>

              <p
                v-if="submitError"
                role="alert"
                class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
              >
                {{ submitError }}
              </p>

              <AppButton type="submit" size="lg" class="w-full" :disabled="isSubmitting">
                {{ isSubmitting ? 'Mengirim...' : 'Kirim pengajuan' }}
              </AppButton>
            </form>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
