<script setup lang="ts">
// English file name, Indonesian URL.
definePageMeta({ layout: 'auth', path: '/verifikasi-email' })

useHead({
  title: 'Verifikasi Email — Zenko',
  meta: [
    { name: 'description', content: 'Konfirmasi alamat email akun Zenko kamu.' },
    { name: 'robots', content: 'noindex' },
  ],
})

const route = useRoute()
const { user } = useAuth()
const { verifyEmail, resendVerification } = useAccountRecovery()
const { remaining, isCoolingDown, start: startCooldown } = useCooldown()

/**
 * With a known address this is the code-entry room after registering (or
 * after "resend" from login/account). Without one there is nothing to check
 * a code against, so the page can't proceed at all.
 */
type Status = 'form' | 'success' | 'no-email'

/**
 * Verify target: the URL right after registering, the session once signed
 * in. With neither, there's no address to check a code against.
 */
const address = computed(() => readQuery(route.query.email) || user.value?.email || '')

const status = ref<Status>(address.value ? 'form' : 'no-email')

const CODE_PATTERN = /^\d{6}$/

const code = ref('')
const codeInputRef = ref<HTMLInputElement | null>(null)
const codeError = ref('')
const isVerifying = ref(false)
const isMocked = ref(false)

/** Set once a code comes back invalidated (410) — only a resend fixes this. */
const codeExpired = ref(false)

const isResending = ref(false)
const notice = ref('')
const noticeTone = ref<'warning' | 'error' | 'info'>('info')

function onCodeInput(event: Event) {
  const digitsOnly = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6)
  code.value = digitsOnly
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
      status.value = 'success'
      isMocked.value = result.mocked
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
      codeInputRef.value?.select()
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
    notice.value = result.mocked
      ? 'Mode contoh: tidak ada email yang benar-benar dikirim.'
      : 'Kode verifikasi baru sudah dikirim.'
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
      Terima kasih. Akunmu sudah aktif sepenuhnya dan siap dipakai membeli serta
      mengerjakan paket try out.
    </template>

    <div class="grid gap-5">
      <AuthNotice v-if="isMocked" tone="info">
        Mode contoh: tidak ada kode yang benar-benar diperiksa di server.
      </AuthNotice>

      <AppButton to="/masuk" size="lg" class="w-full">Lanjut masuk</AppButton>
      <NuxtLink
        to="/paket"
        class="inline-flex min-h-12 w-full items-center justify-center rounded-xs border border-line font-semibold transition-colors duration-200 ease-smooth hover:bg-surface-alt"
      >
        Lihat paket try out
      </NuxtLink>
    </div>
  </AuthPanel>

  <AuthPanel v-else-if="status === 'no-email'" title="Verifikasi belum bisa diproses" tone="danger">
    <template #description>
      Kami tidak tahu email mana yang perlu diverifikasi. Masuk atau daftar
      ulang untuk melanjutkan.
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
      Kami mengirim kode verifikasi 6 digit ke
      <span class="font-semibold text-ink">{{ address }}</span>. Masukkan
      kode itu di bawah ini untuk mengaktifkan akunmu.
    </template>

    <form class="grid gap-5" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="code" class="mb-2 block text-[0.9rem] font-semibold">
          Kode verifikasi
        </label>

        <input
          id="code"
          ref="codeInputRef"
          :value="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern="[0-9]*"
          maxlength="6"
          placeholder="123456"
          :disabled="codeExpired"
          class="w-full rounded-sm border bg-surface px-4 py-3 text-center text-[1.3rem] tracking-[0.5em] transition-[border-color,box-shadow] duration-200 ease-smooth placeholder:tracking-normal placeholder:text-placeholder focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-muted"
          :class="
            codeError
              ? 'border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.16)]'
              : 'border-line focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]'
          "
          :aria-invalid="Boolean(codeError)"
          :aria-describedby="codeError ? 'code-error' : undefined"
          @input="onCodeInput"
        >

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
          <li>• Cek folder spam atau promosi.</li>
          <li>• Kode hanya berlaku sebentar dan otomatis mati kalau salah berkali-kali.</li>
          <li>• Email bisa butuh beberapa menit untuk tiba.</li>
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
