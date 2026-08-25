<script setup lang="ts">
// English file name, Indonesian URL.
definePageMeta({ layout: 'auth', path: '/password-baru' })

useHead({
  title: 'Buat Kata Sandi Baru | Zenko',
  meta: [
    { name: 'description', content: 'Setel kata sandi baru untuk akun Zenko kamu.' },
    { name: 'robots', content: 'noindex' },
  ],
})

const route = useRoute()
const { resetPassword } = useAccountRecovery()

type Status = 'form' | 'success' | 'invalid' | 'blocked'

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

// No token, no form: filling two fields only to be rejected is worse than
// being told upfront the link is the problem.
const status = ref<Status>(token.value ? 'form' : 'invalid')

const message = ref(
  token.value ? '' : 'Tautan reset tidak lengkap. Minta tautan baru lewat halaman lupa kata sandi.',
)

const form = reactive({ password: '', confirm: '' })
const errors = reactive<{ password?: string, confirm?: string }>({})
const notice = ref('')
const noticeTone = ref<'warning' | 'error'>('error')
const isSubmitting = ref(false)

const strength = usePasswordStrength(toRef(form, 'password'))

function validate() {
  delete errors.password
  delete errors.confirm

  if (!form.password) errors.password = 'Kata sandi wajib diisi.'
  else if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`
  }

  if (!form.confirm) errors.confirm = 'Ulangi kata sandi barumu.'
  else if (form.confirm !== form.password) errors.confirm = 'Kedua kata sandi belum sama.'

  return !errors.password && !errors.confirm
}

async function onSubmit() {
  notice.value = ''
  if (!validate()) return

  isSubmitting.value = true
  try {
    const result = await resetPassword(token.value, form.password)

    if (result.ok) {
      status.value = 'success'
      // No reason to keep the password in memory once used.
      form.password = ''
      form.confirm = ''
      return
    }

    if (result.reason === 'invalid-token') {
      message.value = result.message
      status.value = 'invalid'
      return
    }

    noticeTone.value = result.reason === 'not-connected' ? 'warning' : 'error'
    notice.value = result.message
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthPanel v-if="status === 'form'" title="Buat kata sandi baru">
    <template #description>
      Pilih kata sandi yang belum pernah kamu pakai di layanan lain. Sesi di
      perangkat lain akan berakhir setelah ini.
    </template>

    <form class="grid gap-5" novalidate @submit.prevent="onSubmit">
      <FormField
        id="password"
        v-model="form.password"
        label="Kata sandi baru"
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
                :class="level <= strength.score ? strength.tone : 'bg-line'"
              />
            </div>
            <span class="text-[0.78rem] font-semibold text-muted">{{ strength.label }}</span>
          </div>
        </template>
      </FormField>

      <FormField
        id="confirm"
        v-model="form.confirm"
        label="Ulangi kata sandi baru"
        type="password"
        autocomplete="new-password"
        placeholder="Ketik ulang kata sandi"
        :error="errors.confirm"
      />

      <AuthNotice v-if="notice" :tone="noticeTone">{{ notice }}</AuthNotice>

      <AppButton type="submit" size="lg" class="w-full" :disabled="isSubmitting">
        {{ isSubmitting ? 'Menyimpan…' : 'Simpan kata sandi' }}
      </AppButton>
    </form>

    <template #footer>
      <NuxtLink to="/masuk" class="font-semibold text-primary hover:underline">
        Kembali ke halaman masuk
      </NuxtLink>
    </template>
  </AuthPanel>

  <AuthPanel v-else-if="status === 'success'" title="Kata sandi berhasil diubah" tone="success">
    <template #description>
      Mulai sekarang gunakan kata sandi baru itu untuk masuk ke Zenko.
    </template>

    <AppButton to="/masuk" size="lg" class="w-full">Masuk sekarang</AppButton>
  </AuthPanel>

  <AuthPanel v-else-if="status === 'invalid'" title="Tautan ini tidak berlaku lagi" tone="danger">
    <template #description>
      {{ message }}
    </template>

    <div class="grid gap-5">
      <AppButton to="/lupa-password" size="lg" class="w-full">
        Minta tautan baru
      </AppButton>

      <NuxtLink
        to="/masuk"
        class="inline-flex min-h-12 w-full items-center justify-center rounded-xs border border-line font-semibold transition-colors duration-200 ease-smooth hover:bg-surface-alt"
      >
        Kembali ke halaman masuk
      </NuxtLink>
    </div>

    <template #footer>
      Butuh bantuan?
      <a href="mailto:artenanagara22@gmail.com" class="font-semibold text-primary hover:underline">
        artenanagara22@gmail.com
      </a>
    </template>
  </AuthPanel>

  <AuthPanel v-else title="Reset kata sandi belum tersedia" tone="danger">
    <template #description>
      {{ message }}
    </template>

    <AppButton to="/masuk" size="lg" class="w-full">Kembali ke halaman masuk</AppButton>
  </AuthPanel>
</template>
