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
 * One URL, two jobs: with `token` it completes verification, without one it is
 * the waiting room after registering. The only thing distinguishing the two is
 * the token itself, so splitting them into separate URLs buys nothing.
 */
type Status = 'pending' | 'verifying' | 'success' | 'invalid' | 'blocked'

const token = computed(() => readQuery(route.query.token))
const status = ref<Status>(token.value ? 'verifying' : 'pending')

const message = ref('')
const isMocked = ref(false)
const isResending = ref(false)
const resendNotice = ref('')
const resendTone = ref<'warning' | 'error' | 'info'>('info')

/**
 * Resend target: the URL right after registering, the session once signed in.
 * With neither, the resend button has no target and becomes a sign-in link.
 */
const address = computed(() => readQuery(route.query.email) || user.value?.email || '')

async function runVerification() {
  const result = await verifyEmail(token.value)

  if (result.ok) {
    status.value = 'success'
    isMocked.value = result.mocked
    return
  }

  message.value = result.message
  status.value = result.reason === 'invalid-token' ? 'invalid' : 'blocked'
}

async function onResend() {
  if (isCoolingDown.value || isResending.value || !address.value) return

  resendNotice.value = ''
  isResending.value = true

  try {
    const result = await resendVerification(address.value)

    if (!result.ok) {
      resendTone.value = result.reason === 'not-connected' ? 'warning' : 'error'
      resendNotice.value = result.message
      return
    }

    startCooldown()
    resendTone.value = 'info'
    resendNotice.value = result.mocked
      ? 'Mode contoh: tidak ada email yang benar-benar dikirim.'
      : 'Email verifikasi sudah dikirim ulang.'
  }
  finally {
    isResending.value = false
  }
}

// Client-only: consuming the token during SSR would let email link scanners
// burn it before the recipient ever clicks.
onMounted(() => {
  if (token.value) runVerification()
})

function readQuery(raw: unknown): string {
  return typeof raw === 'string' ? raw : ''
}
</script>

<template>
  <AuthPanel v-if="status === 'verifying'" title="Sedang memverifikasi…" tone="pending">
    <template #description>
      Tunggu sebentar, kami sedang memeriksa tautan yang kamu buka.
    </template>

    <div class="grid gap-3" aria-hidden="true">
      <span class="h-3 w-full animate-pulse rounded-pill bg-skeleton" />
      <span class="h-3 w-4/5 animate-pulse rounded-pill bg-skeleton" />
      <span class="h-3 w-2/3 animate-pulse rounded-pill bg-skeleton" />
    </div>
  </AuthPanel>

  <AuthPanel v-else-if="status === 'success'" title="Email kamu terverifikasi" tone="success">
    <template #description>
      Terima kasih. Akunmu sudah aktif sepenuhnya dan siap dipakai membeli serta
      mengerjakan paket try out.
    </template>

    <div class="grid gap-5">
      <AuthNotice v-if="isMocked" tone="info">
        Mode contoh: tidak ada token yang benar-benar diperiksa di server.
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

  <AuthPanel v-else-if="status === 'invalid'" title="Tautan ini tidak berlaku lagi" tone="danger">
    <template #description>
      {{ message }}
    </template>

    <div class="grid gap-5">
      <AuthNotice v-if="resendNotice" :tone="resendTone">{{ resendNotice }}</AuthNotice>

      <AppButton
        v-if="address"
        size="lg"
        class="w-full"
        :disabled="isCoolingDown || isResending"
        @click="onResend"
      >
        <template v-if="isResending">Mengirim…</template>
        <template v-else-if="isCoolingDown">Kirim ulang ({{ remaining }}s)</template>
        <template v-else>Kirim tautan baru</template>
      </AppButton>

      <AppButton v-else to="/masuk" size="lg" class="w-full">
        Masuk untuk kirim ulang
      </AppButton>
    </div>

    <template #footer>
      Butuh bantuan?
      <a href="mailto:halo@zenko.id" class="font-semibold text-primary hover:underline">
        halo@zenko.id
      </a>
    </template>
  </AuthPanel>

  <AuthPanel v-else-if="status === 'blocked'" title="Verifikasi belum bisa diproses" tone="danger">
    <template #description>
      {{ message }}
    </template>

    <AppButton to="/masuk" size="lg" class="w-full">Kembali ke halaman masuk</AppButton>
  </AuthPanel>

  <!-- No token: the waiting room after registering. -->
  <AuthPanel v-else title="Satu langkah lagi" tone="pending">
    <template #description>
      <template v-if="address">
        Kami mengirim tautan verifikasi ke
        <span class="font-semibold text-ink">{{ address }}</span>. Buka tautan itu
        untuk mengaktifkan akunmu.
      </template>
      <template v-else>
        Kami mengirim tautan verifikasi ke alamat email yang kamu daftarkan. Buka
        tautan itu untuk mengaktifkan akunmu.
      </template>
    </template>

    <div class="grid gap-5">
      <AuthNotice v-if="resendNotice" :tone="resendTone">{{ resendNotice }}</AuthNotice>

      <div class="rounded-sm bg-surface-alt px-4 py-4 text-[0.88rem] text-muted">
        <p class="font-semibold text-ink">Belum ada emailnya?</p>
        <ul class="mt-2 grid gap-1.5">
          <li>• Cek folder spam atau promosi.</li>
          <li>• Tautan berlaku 24 jam sejak dikirim.</li>
          <li>• Email bisa butuh beberapa menit untuk tiba.</li>
        </ul>
      </div>

      <AppButton
        v-if="address"
        class="w-full"
        :disabled="isCoolingDown || isResending"
        @click="onResend"
      >
        <template v-if="isResending">Mengirim…</template>
        <template v-else-if="isCoolingDown">Kirim ulang ({{ remaining }}s)</template>
        <template v-else>Kirim ulang email verifikasi</template>
      </AppButton>
    </div>

    <template #footer>
      Salah alamat email?
      <NuxtLink to="/daftar" class="font-semibold text-primary hover:underline">
        Daftar ulang
      </NuxtLink>
    </template>
  </AuthPanel>
</template>
