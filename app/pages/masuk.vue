<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useHead({
  title: 'Masuk — Zenko',
  meta: [
    { name: 'description', content: 'Masuk ke akun Zenko untuk mengakses paket try out yang sudah kamu beli.' },
    // Nothing here is worth indexing, and it should never rank above the app.
    { name: 'robots', content: 'noindex' },
  ],
})

const { signInWithGoogle } = useAuth()
const route = useRoute()

/** The OAuth callback bounces back here with ?error=<reason> on failure. */
const CALLBACK_ERRORS: Record<string, string> = {
  dibatalkan: 'Login dibatalkan. Kamu bisa mencoba lagi kapan saja.',
  state_tidak_cocok: 'Sesi login kedaluwarsa. Silakan ulangi dari awal.',
  kode_kosong: 'Google tidak mengirim kode otorisasi. Coba lagi.',
  gagal_masuk: 'Gagal menyelesaikan login dengan Google. Coba lagi sebentar lagi.',
}

const form = reactive({
  email: '',
  password: '',
  remember: true,
})

const errors = reactive<{ email?: string, password?: string }>({})
const showPassword = ref(false)
const isSubmitting = ref(false)
const submitError = ref(
  CALLBACK_ERRORS[String(route.query.error ?? '')] ?? '',
)

/** Deliberately permissive: the server is the real authority on validity. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function validate() {
  delete errors.email
  delete errors.password

  if (!form.email.trim()) errors.email = 'Email wajib diisi.'
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Format email belum benar.'

  if (!form.password) errors.password = 'Kata sandi wajib diisi.'
  else if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`
  }

  return !errors.email && !errors.password
}

async function onSubmit() {
  submitError.value = ''
  if (!validate()) return

  isSubmitting.value = true
  try {
    // TODO: POST /auth/login once zenko-api exposes it, then redirect.
    // Failing loudly beats faking a session the rest of the app cannot use.
    submitError.value =
      'Login belum tersambung — endpoint autentikasi belum tersedia di zenko-api.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="grid min-h-screen lg:grid-cols-2">
    <!-- Form column -->
    <div class="flex items-center justify-center px-5 py-10 sm:px-8 md:py-14">
      <div class="w-full max-w-[400px]">
        <BrandMark />

        <h1 class="mt-9 text-[clamp(1.7rem,2.6vw,2.1rem)] leading-[1.18] tracking-[-0.04em]">
          Masuk ke akunmu
        </h1>
        <p class="mt-2.5 text-muted">
          Lanjutkan latihan dari paket yang sudah kamu beli.
        </p>

        <form class="mt-8 grid gap-5" novalidate @submit.prevent="onSubmit">
          <div>
            <label for="email" class="mb-2 block text-[0.9rem] font-semibold">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder="nama@email.com"
              class="w-full rounded-sm border bg-surface px-4 py-3 transition-[border-color,box-shadow] duration-200 ease-smooth placeholder:text-placeholder focus:outline-none"
              :class="errors.email
                ? 'border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.16)]'
                : 'border-line focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]'"
              :aria-invalid="Boolean(errors.email)"
              :aria-describedby="errors.email ? 'email-error' : undefined"
            >
            <p v-if="errors.email" id="email-error" class="mt-2 text-[0.82rem] text-red-600">
              {{ errors.email }}
            </p>
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between gap-3">
              <label for="password" class="text-[0.9rem] font-semibold">Kata sandi</label>
              <a href="#" class="text-[0.82rem] font-semibold text-primary hover:underline">
                Lupa kata sandi?
              </a>
            </div>

            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Minimal 8 karakter"
                class="w-full rounded-sm border bg-surface py-3 pr-12 pl-4 transition-[border-color,box-shadow] duration-200 ease-smooth placeholder:text-placeholder focus:outline-none"
                :class="errors.password
                  ? 'border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.16)]'
                  : 'border-line focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]'"
                :aria-invalid="Boolean(errors.password)"
                :aria-describedby="errors.password ? 'password-error' : undefined"
              >
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-sm text-muted transition-colors hover:text-ink"
                :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <IconEye :off="showPassword" class="h-5 w-5" />
              </button>
            </div>

            <p v-if="errors.password" id="password-error" class="mt-2 text-[0.82rem] text-red-600">
              {{ errors.password }}
            </p>
          </div>

          <label class="flex cursor-pointer items-center gap-2.5 text-[0.9rem] text-muted">
            <input
              v-model="form.remember"
              type="checkbox"
              class="h-4 w-4 rounded-[4px] accent-primary"
            >
            Ingat saya di perangkat ini
          </label>

          <p
            v-if="submitError"
            role="alert"
            class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
          >
            {{ submitError }}
          </p>

          <AppButton type="submit" size="lg" pill class="w-full" :disabled="isSubmitting">
            {{ isSubmitting ? 'Memproses…' : 'Masuk' }}
          </AppButton>
        </form>

        <div class="my-7 flex items-center gap-4 text-[0.82rem] text-muted">
          <span class="h-px flex-1 bg-line" />
          atau
          <span class="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          class="flex w-full items-center justify-center gap-3 rounded-pill border border-line bg-surface px-6 py-3.5 font-semibold transition-[background,border-color] duration-200 ease-smooth hover:border-hairline-strong hover:bg-surface-alt"
          @click="signInWithGoogle"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.74 2.98-4.3 2.98-7.35Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.58-4.1H3.06v2.58A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.42 13.92a6 6 0 0 1 0-3.84V7.5H3.06a10 10 0 0 0 0 9l3.36-2.58Z" />
            <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.98 14.7 2 12 2A10 10 0 0 0 3.06 7.5l3.36 2.58C7.2 7.73 9.4 5.98 12 5.98Z" />
          </svg>
          Masuk dengan Google
        </button>

        <p class="mt-8 text-center text-[0.9rem] text-muted">
          Belum punya akun?
          <a href="#" class="font-semibold text-primary hover:underline">Daftar sekarang</a>
        </p>
      </div>
    </div>

    <!-- Brand column. Decorative, so it drops away entirely on small screens. -->
    <aside class="hidden p-5 lg:block">
      <div class="hero-aurora flex h-full flex-col justify-between rounded-[32px] p-12">
        <p class="inline-flex w-fit items-center gap-2 rounded-pill border border-primary/20 bg-white/80 py-[7px] pr-4 pl-3 text-[0.82rem] font-semibold shadow-[0_2px_8px_rgba(47,111,235,0.06)] backdrop-blur-[6px]">
          <span class="h-[7px] w-[7px] rounded-full bg-success shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" aria-hidden="true" />
          12.400+ siswa latihan bulan ini
        </p>

        <div>
          <p class="text-[clamp(1.6rem,2.2vw,2.1rem)] leading-[1.25] tracking-[-0.03em]">
            Setiap soal yang kamu kerjakan hari ini
            <span class="text-accent">mengurangi kejutan di hari ujian</span>
          </p>

          <dl class="mt-10 grid grid-cols-3 gap-6 border-t border-white/60 pt-8">
            <div>
              <dt class="text-[0.82rem] text-ink/70">Paket tersedia</dt>
              <dd class="mt-1 text-[1.5rem] font-extrabold tracking-[-0.03em]">120+</dd>
            </div>
            <div>
              <dt class="text-[0.82rem] text-ink/70">Tutor terkurasi</dt>
              <dd class="mt-1 text-[1.5rem] font-extrabold tracking-[-0.03em]">48</dd>
            </div>
            <div>
              <dt class="text-[0.82rem] text-ink/70">Rata-rata rating</dt>
              <dd class="mt-1 text-[1.5rem] font-extrabold tracking-[-0.03em]">4.8</dd>
            </div>
          </dl>
        </div>
      </div>
    </aside>
  </main>
</template>
