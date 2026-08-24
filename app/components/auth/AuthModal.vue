<script setup lang="ts">
/**
 * Login-in-place for a flow that would otherwise lose someone to a full page
 * navigation — right now, the checkout "Beli Sekarang" gate. Login only:
 * registration still ends at /verifikasi-email regardless of where it starts,
 * so there is nothing to gain by inlining that form here too. The modal's
 * "Daftar sekarang" link just sends them to /daftar like the login page does.
 *
 * Success closes the modal and emits `signedIn` — the caller decides what
 * happens next (checkout resubmits the order it was about to place).
 */
import type { EmailAuthFailure } from '~/composables/useAuth'

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{ signedIn: [] }>()

const { signInWithGoogle, signInWithEmail } = useAuth()

const form = reactive({
  email: '',
  password: '',
  remember: true,
})

const errors = reactive<{ email?: string, password?: string }>({})
const isSubmitting = ref(false)
const submitError = ref('')
const submitReason = ref<EmailAuthFailure | ''>('')

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

// The form resets when the modal closes, so a stray password never lingers
// in memory for the next time it opens — and the next open always starts
// from a clean slate rather than showing whatever error was last on screen.
watch(open, (isOpen) => {
  if (isOpen) return
  form.email = ''
  form.password = ''
  delete errors.email
  delete errors.password
  submitError.value = ''
  submitReason.value = ''
})

async function onSubmit() {
  submitError.value = ''
  submitReason.value = ''
  if (!validate()) return

  isSubmitting.value = true
  try {
    const result = await signInWithEmail(form.email.trim(), form.password, form.remember)
    if (!result.ok) {
      submitReason.value = result.reason
      submitError.value = result.message
      return
    }
    open.value = false
    emit('signedIn')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppModal v-model="open" title="Masuk ke akunmu" description="Lanjutkan dari tempat kamu berhenti.">
    <form class="grid gap-5" novalidate @submit.prevent="onSubmit">
      <FormField
        id="auth-modal-email"
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="nama@email.com"
        :error="errors.email"
      />

      <FormField
        id="auth-modal-password"
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
      <NuxtLink
        v-if="submitReason === 'unverified'"
        :to="{ path: '/verifikasi-email', query: { email: form.email.trim() } }"
        class="-mt-2 text-sm font-semibold text-primary hover:underline"
      >
        Kirim ulang email verifikasi
      </NuxtLink>

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
  </AppModal>
</template>
