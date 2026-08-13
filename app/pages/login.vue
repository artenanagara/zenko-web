<script setup lang="ts">
// English file name, Indonesian URL; `path` keeps circulating links alive.
definePageMeta({ layout: 'auth', path: '/masuk' })

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
const isSubmitting = ref(false)
const submitError = ref(CALLBACK_ERRORS[String(route.query.error ?? '')] ?? '')

/** Deliberately permissive: the server is the real authority on validity. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
      'Login dengan email belum tersedia. Untuk sekarang, gunakan “Masuk dengan Google” di bawah.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="grid min-h-screen lg:grid-cols-2">
    <div class="flex items-center justify-center px-5 py-10 sm:px-8 md:py-14">
      <div class="w-full max-w-100">
        <BrandMark />

        <h1 class="mt-9 text-[clamp(1.7rem,2.6vw,2.1rem)] leading-[1.18] tracking-[-0.04em]">
          Masuk ke akunmu
        </h1>
        <p class="mt-2.5 text-muted">
          Lanjutkan latihan dari paket yang sudah kamu beli.
        </p>

        <form class="mt-8 grid gap-5" novalidate @submit.prevent="onSubmit">
          <FormField
            id="email"
            v-model="form.email"
            label="Email"
            type="email"
            autocomplete="email"
            placeholder="nama@email.com"
            :error="errors.email"
          />

          <FormField
            id="password"
            v-model="form.password"
            label="Kata sandi"
            type="password"
            autocomplete="current-password"
            placeholder="Minimal 8 karakter"
            :error="errors.password"
          >
            <template #action>
              <NuxtLink
                to="/lupa-password"
                class="text-[0.82rem] font-semibold text-primary hover:underline"
              >
                Lupa kata sandi?
              </NuxtLink>
            </template>
          </FormField>

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

          <AppButton type="submit" size="lg" class="w-full" :disabled="isSubmitting">
            {{ isSubmitting ? 'Memproses…' : 'Masuk' }}
          </AppButton>
        </form>

        <div class="my-7 flex items-center gap-4 text-[0.82rem] text-muted">
          <span class="h-px flex-1 bg-line" />
          atau
          <span class="h-px flex-1 bg-line" />
        </div>

        <GoogleButton @click="signInWithGoogle" />

        <p class="mt-8 text-center text-[0.9rem] text-muted">
          Belum punya akun?
          <NuxtLink to="/daftar" class="font-semibold text-primary hover:underline">
            Daftar sekarang
          </NuxtLink>
        </p>
      </div>
    </div>

    <AuthAside
      badge="12.400+ siswa latihan bulan ini"
      :stats="[
        { label: 'Paket tersedia', value: '120+' },
        { label: 'Tutor terkurasi', value: '48' },
        { label: 'Rata-rata rating', value: '4.8' },
      ]"
    >
      <template #showcase>
        <AuthShowcaseProgress />
      </template>

      Setiap soal yang kamu kerjakan hari ini
      <span class="text-accent">mengurangi kejutan di hari ujian</span>
    </AuthAside>
  </main>
</template>
