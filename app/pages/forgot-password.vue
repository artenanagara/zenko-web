<script setup lang="ts">
// English file name, Indonesian URL.
definePageMeta({ layout: 'auth', path: '/lupa-password' })

useHead({
  title: 'Lupa Kata Sandi | Zenko',
  meta: [
    { name: 'description', content: 'Kirim tautan untuk menyetel ulang kata sandi akun Zenko kamu.' },
    { name: 'robots', content: 'noindex' },
  ],
})

const { requestPasswordReset } = useAccountRecovery()
const { remaining, isCoolingDown, start: startCooldown } = useCooldown()

const email = ref('')
const emailError = ref('')
const notice = ref('')
const noticeTone = ref<'warning' | 'error'>('error')
const isSubmitting = ref(false)

/** The address actually mailed, not the field's possibly-edited contents. */
const sentTo = ref('')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate() {
  emailError.value = ''

  if (!email.value.trim()) emailError.value = 'Email wajib diisi.'
  else if (!EMAIL_PATTERN.test(email.value.trim())) emailError.value = 'Format email belum benar.'

  return !emailError.value
}

async function submit(address: string) {
  notice.value = ''
  isSubmitting.value = true

  try {
    const result = await requestPasswordReset(address)

    if (!result.ok) {
      noticeTone.value = result.reason === 'not-connected' ? 'warning' : 'error'
      notice.value = result.message
      return
    }

    sentTo.value = address
    startCooldown()
  }
  finally {
    isSubmitting.value = false
  }
}

function onSubmit() {
  if (!validate()) return
  return submit(email.value.trim())
}

function onResend() {
  if (isCoolingDown.value || isSubmitting.value) return
  return submit(sentTo.value)
}

/** Back to the form to fix a typo in the address. */
function editAddress() {
  sentTo.value = ''
  notice.value = ''
}
</script>

<template>
  <!-- Two states, not two pages. After sending, a form left on screen only
       invites repeat submissions. -->
  <AuthPanel
    v-if="!sentTo"
    title="Lupa kata sandi?"
  >
    <template #description>
      Kami kirimkan tautan untuk menyetel kata sandi baru.
    </template>

    <form class="grid gap-5" novalidate @submit.prevent="onSubmit">
      <FormField
        id="email"
        v-model="email"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="nama@email.com"
        :error="emailError"
      />

      <AuthNotice v-if="notice" :tone="noticeTone">{{ notice }}</AuthNotice>

      <AppButton type="submit" size="lg" class="w-full" :disabled="isSubmitting">
        {{ isSubmitting ? 'Mengirim…' : 'Kirim tautan reset' }}
      </AppButton>
    </form>

    <template #footer>
      Ingat kata sandimu?
      <NuxtLink to="/masuk" class="font-semibold text-primary hover:underline">
        Kembali ke halaman masuk
      </NuxtLink>
    </template>
  </AuthPanel>

  <AuthPanel v-else title="Cek email kamu" tone="pending">
    <template #description>
      Kalau <span class="font-semibold text-ink">{{ sentTo }}</span> terdaftar,
      tautannya sudah dikirim dan berlaku 1 jam.
    </template>

    <div class="grid gap-5">
      <AuthNotice v-if="notice" :tone="noticeTone">{{ notice }}</AuthNotice>

      <div class="rounded-sm bg-surface-alt px-4 py-4 text-[0.88rem] text-muted">
        <p class="font-semibold text-ink">Belum ada emailnya?</p>
        <ul class="mt-2 grid gap-1.5">
          <li>• Cek folder spam.</li>
          <li>• Pastikan alamatnya benar.</li>
          <!-- Butir yang dulu tidak ada, dan justru jawabannya paling sering:
               alamat yang belum punya akun tidak akan pernah dikirimi apa pun,
               dan responsnya sengaja sama saja supaya tidak membocorkan akun
               mana yang terdaftar. Ditampilkan ke semua orang, jadi tidak
               membocorkan apa-apa. -->
          <li>
            • Belum punya akun?
            <NuxtLink to="/daftar" class="font-semibold text-primary hover:underline">Daftar dulu</NuxtLink>.
          </li>
        </ul>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <AppButton
          class="w-full sm:flex-1"
          :disabled="isCoolingDown || isSubmitting"
          @click="onResend"
        >
          <template v-if="isSubmitting">Mengirim…</template>
          <template v-else-if="isCoolingDown">Kirim ulang ({{ remaining }}s)</template>
          <template v-else>Kirim ulang</template>
        </AppButton>

        <button
          type="button"
          class="w-full rounded-xs border border-line px-4 font-semibold transition-colors duration-200 ease-smooth hover:bg-surface-alt sm:min-h-12 sm:flex-1"
          @click="editAddress"
        >
          Ganti alamat email
        </button>
      </div>
    </div>

    <template #footer>
      <NuxtLink to="/masuk" class="font-semibold text-primary hover:underline">
        Kembali ke halaman masuk
      </NuxtLink>
    </template>
  </AuthPanel>
</template>
