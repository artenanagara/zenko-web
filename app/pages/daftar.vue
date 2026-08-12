<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useHead({
  title: 'Daftar — Zenko',
  meta: [
    { name: 'description', content: 'Buat akun Zenko untuk mulai membeli dan mengerjakan paket try out.' },
    { name: 'robots', content: 'noindex' },
  ],
})

const { signInWithGoogle } = useAuth()

const form = reactive({
  name: '',
  email: '',
  password: '',
  acceptTerms: false,
})

const errors = reactive<{ name?: string, email?: string, password?: string, acceptTerms?: string }>({})
const isSubmitting = ref(false)
const submitError = ref('')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

/**
 * Rough strength signal, scored on length and character variety.
 * It guides the user; the server stays the authority on what it accepts.
 */
const passwordStrength = computed(() => {
  const value = form.password
  if (!value) return { score: 0, label: '', tone: '' }

  let score = 0
  if (value.length >= MIN_PASSWORD_LENGTH) score++
  if (value.length >= 12) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^\w\s]/.test(value)) score++

  if (score <= 2) return { score: 1, label: 'Lemah', tone: 'bg-red-400' }
  if (score <= 3) return { score: 2, label: 'Cukup', tone: 'bg-amber-400' }
  return { score: 3, label: 'Kuat', tone: 'bg-success' }
})

function validate() {
  for (const key of Object.keys(errors) as (keyof typeof errors)[]) delete errors[key]

  if (!form.name.trim()) errors.name = 'Nama wajib diisi.'
  else if (form.name.trim().length < 2) errors.name = 'Nama terlalu pendek.'

  if (!form.email.trim()) errors.email = 'Email wajib diisi.'
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Format email belum benar.'

  if (!form.password) errors.password = 'Kata sandi wajib diisi.'
  else if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`
  }

  if (!form.acceptTerms) errors.acceptTerms = 'Kamu perlu menyetujui ketentuan untuk melanjutkan.'

  return Object.keys(errors).length === 0
}

async function onSubmit() {
  submitError.value = ''
  if (!validate()) return

  isSubmitting.value = true
  try {
    // TODO: POST /auth/register once zenko-api exposes it.
    // Until then, say so plainly rather than pretending an account exists.
    submitError.value =
      'Pendaftaran dengan email belum tersedia. Untuk sekarang, gunakan “Daftar dengan Google” di bawah.'
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
          Buat akun Zenko
        </h1>
        <p class="mt-2.5 text-muted">
          Gratis, dan kamu hanya membayar paket yang kamu beli.
        </p>

        <form class="mt-8 grid gap-5" novalidate @submit.prevent="onSubmit">
          <FormField
            id="name"
            v-model="form.name"
            label="Nama lengkap"
            autocomplete="name"
            placeholder="Nama sesuai kartu identitas"
            :error="errors.name"
          />

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
            autocomplete="new-password"
            placeholder="Minimal 8 karakter"
            :error="errors.password"
          >
            <template #below>
              <div v-if="form.password" class="mt-2.5 flex items-center gap-3">
                <div class="flex flex-1 gap-1.5" aria-hidden="true">
                  <span
                    v-for="level in 3"
                    :key="level"
                    class="h-1 flex-1 rounded-pill transition-colors duration-200"
                    :class="level <= passwordStrength.score ? passwordStrength.tone : 'bg-line'"
                  />
                </div>
                <span class="text-[0.78rem] font-semibold text-muted">
                  {{ passwordStrength.label }}
                </span>
              </div>
            </template>
          </FormField>

          <div>
            <label class="flex cursor-pointer items-start gap-2.5 text-[0.88rem] text-muted">
              <input
                v-model="form.acceptTerms"
                type="checkbox"
                class="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] accent-primary"
                :aria-invalid="Boolean(errors.acceptTerms)"
                :aria-describedby="errors.acceptTerms ? 'terms-error' : undefined"
              >
              <span>
                Saya setuju dengan
                <NuxtLink to="/ketentuan-layanan" class="font-semibold text-primary hover:underline">
                  Ketentuan Layanan
                </NuxtLink>
                dan
                <NuxtLink to="/kebijakan-privasi" class="font-semibold text-primary hover:underline">
                  Kebijakan Privasi
                </NuxtLink>
                Zenko.
              </span>
            </label>
            <p v-if="errors.acceptTerms" id="terms-error" class="mt-2 text-[0.82rem] text-red-600">
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

          <AppButton type="submit" size="lg" pill class="w-full" :disabled="isSubmitting">
            {{ isSubmitting ? 'Memproses…' : 'Buat akun' }}
          </AppButton>
        </form>

        <div class="my-7 flex items-center gap-4 text-[0.82rem] text-muted">
          <span class="h-px flex-1 bg-line" />
          atau
          <span class="h-px flex-1 bg-line" />
        </div>

        <GoogleButton label="Daftar dengan Google" @click="signInWithGoogle" />

        <p class="mt-8 text-center text-[0.9rem] text-muted">
          Sudah punya akun?
          <NuxtLink to="/masuk" class="font-semibold text-primary hover:underline">
            Masuk di sini
          </NuxtLink>
        </p>
      </div>
    </div>

    <AuthAside
      badge="Gratis, tanpa kartu kredit"
      :stats="[
        { label: 'Paket tersedia', value: '120+' },
        { label: 'Tutor terkurasi', value: '48' },
        { label: 'Rata-rata rating', value: '4.8' },
      ]"
    >
      <template #showcase>
        <AuthShowcaseCatalog />
      </template>

      Mulai dari satu paket, lalu naikkan targetmu
      <span class="text-accent">sesuai kemajuanmu sendiri</span>
    </AuthAside>
  </main>
</template>
