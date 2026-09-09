<script setup lang="ts">
// English file name, Indonesian URL.
import { OtpInput } from '#components'

definePageMeta({ layout: 'auth', path: '/verifikasi-email' })

useHead({
  title: 'Verifikasi Email | Zenko',
  meta: [
    { name: 'description', content: 'Konfirmasi alamat email akun Zenko kamu.' },
    { name: 'robots', content: 'noindex' },
  ],
})

const route = useRoute()
const { user, signInWithGoogle } = useAuth()
const { verifyEmail, resendVerification } = useAccountRecovery()
const { remaining, isCoolingDown, start: startCooldown } = useCooldown()

/**
 * With a known address this is the code-entry room after registering (or
 * after "resend" from login/account). Without one there is nothing to check
 * a code against, so the page can't proceed at all.
 *
 * 'confirming' is a deliberate beat between the API saying yes and the
 * success screen showing up — flipping straight over feels like the code
 * was barely checked.
 */
type Status = 'form' | 'confirming' | 'success' | 'no-email'

/**
 * Verify target: the URL right after registering, the session once signed
 * in. With neither, there's no address to check a code against.
 */
const address = computed(() => readQuery(route.query.email) || user.value?.email || '')
const isGoogleFlow = computed(() => route.query.google === '1')

const status = ref<Status>(address.value ? 'form' : 'no-email')

const CODE_PATTERN = /^\d{6}$/

const code = ref('')
const otpInputRef = ref<InstanceType<typeof OtpInput> | null>(null)
const codeError = ref('')
const isVerifying = ref(false)

/** Set once a code comes back invalidated (410) — only a resend fixes this. */
const codeExpired = ref(false)

const isResending = ref(false)
const notice = ref('')
const noticeTone = ref<'warning' | 'error' | 'info'>('info')

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function onSubmit() {
  if (isVerifying.value || codeExpired.value) return

  codeError.value = ''

  if (!CODE_PATTERN.test(code.value)) {
    codeError.value = 'Kode verifikasi harus 6 digit angka.'
    return
  }

  isVerifying.value = true
  try {
    const result = await verifyEmail(address.value, code.value)

    if (result.ok) {
      // A beat of "checking…" before the success screen, so the confirmation
      // doesn't feel like it skipped the check entirely.
      status.value = 'confirming'
      await delay(1000)
      status.value = 'success'
      return
    }

    if (result.reason === 'expired') {
      codeExpired.value = true
      code.value = ''
      codeError.value = result.message
      return
    }

    if (result.reason === 'invalid-code') {
      // Fixable in place: keep what they typed, point at the mistake, and
      // put the cursor back so retyping doesn't need a manual select-all.
      codeError.value = result.message
      await nextTick()
      otpInputRef.value?.focusFirst()
      return
    }

    noticeTone.value = result.reason === 'not-connected' ? 'warning' : 'error'
    notice.value = result.message
  }
  finally {
    isVerifying.value = false
  }
}

// Auto-submit once 6 digits are in, so pasting or typing the last digit is
// enough — no separate tap on "Verifikasi" needed.
watch(code, (value) => {
  if (value.length === 6 && !isVerifying.value && !codeExpired.value) onSubmit()
})

async function onResend() {
  if (isCoolingDown.value || isResending.value || !address.value) return

  notice.value = ''
  isResending.value = true

  try {
    const result = await resendVerification(address.value)

    if (!result.ok) {
      noticeTone.value = result.reason === 'not-connected' ? 'warning' : 'error'
      notice.value = result.message
      return
    }

    startCooldown()
    // A fresh code makes whatever was typed before meaningless.
    code.value = ''
    codeError.value = ''
    codeExpired.value = false
    noticeTone.value = 'info'
    notice.value = 'Kode verifikasi baru sudah dikirim.'
  }
  finally {
    isResending.value = false
  }
}

function readQuery(raw: unknown): string {
  return typeof raw === 'string' ? raw : ''
}
</script>

<template>
  <AuthPanel v-if="status === 'success'" title="Email kamu terverifikasi" tone="success">
    <template #description>
      Akunmu sudah aktif.
      <template v-if="isGoogleFlow">Lanjutkan masuk dengan Google untuk membuka dashboard Zenko.</template>
      <template v-else>Siap dipakai membeli serta mengerjakan paket try out.</template>
    </template>

    <div class="grid gap-5">
      <AppButton
        v-if="isGoogleFlow"
        size="lg"
        class="w-full"
        @click="signInWithGoogle"
      >
        Lanjut masuk dengan Google
      </AppButton>
      <AppButton v-else to="/masuk" size="lg" class="w-full">Lanjut masuk</AppButton>
      <NuxtLink
        to="/paket"
        class="inline-flex min-h-12 w-full items-center justify-center rounded-xs border border-line font-semibold transition-colors duration-200 ease-smooth hover:bg-surface-alt"
      >
        Lihat paket try out
      </NuxtLink>
    </div>
  </AuthPanel>

  <AuthPanel v-else-if="status === 'confirming'" title="Memverifikasi kode…" tone="loading">
    <template #description>
      Sebentar ya.
    </template>
  </AuthPanel>

  <AuthPanel v-else-if="status === 'no-email'" title="Email belum diketahui" tone="danger">
    <template #description>
      Masuk atau daftar dulu untuk melanjutkan.
    </template>

    <div class="grid gap-5">
      <AppButton to="/masuk" size="lg" class="w-full">Masuk</AppButton>
      <NuxtLink
        to="/daftar"
        class="inline-flex min-h-12 w-full items-center justify-center rounded-xs border border-line font-semibold transition-colors duration-200 ease-smooth hover:bg-surface-alt"
      >
        Daftar ulang
      </NuxtLink>
    </div>
  </AuthPanel>

  <AuthPanel v-else title="Satu langkah lagi" tone="pending">
    <template #description>
      Kode 6 digit sudah dikirim ke
      <span class="font-semibold text-ink">{{ address }}</span>.
    </template>

    <form class="grid gap-5" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="code-0" class="mb-2 block text-[0.9rem] font-semibold">
          Kode verifikasi
        </label>

        <OtpInput
          id="code-0"
          ref="otpInputRef"
          v-model="code"
          :disabled="codeExpired"
          :error="Boolean(codeError)"
          :described-by="codeError ? 'code-error' : undefined"
        />

        <p v-if="codeError" id="code-error" role="alert" class="mt-2 text-[0.82rem] text-red-600">
          {{ codeError }}
        </p>
      </div>

      <AuthNotice v-if="notice" :tone="noticeTone">{{ notice }}</AuthNotice>

      <AppButton
        type="submit"
        size="lg"
        class="w-full"
        :disabled="isVerifying || codeExpired || code.length !== 6"
      >
        {{ isVerifying ? 'Memverifikasi…' : 'Verifikasi' }}
      </AppButton>

      <div class="rounded-sm bg-surface-alt px-4 py-4 text-[0.88rem] text-muted">
        <p class="font-semibold text-ink">Belum dapat kodenya?</p>
        <ul class="mt-2 grid gap-1.5">
          <li>• Cek folder spam.</li>
          <li>• Kode berlaku sebentar dan mati kalau salah berkali-kali.</li>
          <li>• Kirim ulang kalau lewat beberapa menit.</li>
        </ul>
      </div>

      <button
        type="button"
        class="inline-flex min-h-12 w-full items-center justify-center rounded-xs border border-line font-semibold transition-colors duration-200 ease-smooth hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="isCoolingDown || isResending"
        @click="onResend"
      >
        <template v-if="isResending">Mengirim…</template>
        <template v-else-if="isCoolingDown">Kirim ulang ({{ remaining }}s)</template>
        <template v-else>Kirim ulang kode</template>
      </button>
    </form>

    <template #footer>
      Salah alamat email?
      <NuxtLink to="/daftar" class="font-semibold text-primary hover:underline">
        Daftar ulang
      </NuxtLink>
    </template>
  </AuthPanel>
</template>
