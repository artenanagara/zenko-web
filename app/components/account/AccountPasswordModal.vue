<script setup lang="ts">
/**
 * Ganti kata sandi dalam modal — dibuka dari baris "Kata sandi" di tab
 * Keamanan /akun/profil. Logika validasi dan pesan hasilnya sama persis
 * dengan form yang dulu duduk di halaman; hanya tempatnya yang pindah.
 * Sukses menutup modal dan mengosongkan form; gagal menahan modal supaya
 * orangnya bisa memperbaiki tanpa membuka ulang.
 */
const open = defineModel<boolean>('open', { required: true })

const toast = useToast()
const { state, error, change, reset } = useAccountPassword()

const form = reactive({
  current: '',
  next: '',
  confirm: '',
})

const errors = reactive<{ current?: string, next?: string, confirm?: string }>({})

// Same strength grading as /daftar and /password-baru: one password must
// never be graded differently on different screens.
const strength = usePasswordStrength(toRef(form, 'next'))

const isSubmitting = computed(() => state.value === 'submitting')

function clearForm() {
  form.current = ''
  form.next = ''
  form.confirm = ''
  for (const key of Object.keys(errors) as (keyof typeof errors)[]) delete errors[key]
  reset()
}

// Form selalu mulai bersih: kata sandi yang setengah diketik tidak boleh
// tertinggal untuk pembukaan berikutnya.
watch(open, (isOpen) => {
  if (isOpen) clearForm()
})

function validate() {
  for (const key of Object.keys(errors) as (keyof typeof errors)[]) delete errors[key]

  if (!form.current) errors.current = 'Kata sandi saat ini wajib diisi.'

  if (!form.next) errors.next = 'Kata sandi baru wajib diisi.'
  else if (form.next.length < MIN_PASSWORD_LENGTH) {
    errors.next = `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`
  }
  else if (form.next === form.current) {
    errors.next = 'Kata sandi baru harus berbeda dari yang sekarang.'
  }

  if (!form.confirm) errors.confirm = 'Ulangi kata sandi baru.'
  else if (form.confirm !== form.next) errors.confirm = 'Kedua kata sandi belum sama.'

  return Object.keys(errors).length === 0
}

/** Field ids in the order they appear, so the first invalid one gets the caret. */
const PASSWORD_FIELD_IDS: Record<keyof typeof errors, string> = {
  current: 'current-password',
  next: 'new-password',
  confirm: 'confirm-password',
}

async function onSubmit() {
  reset()
  if (!validate()) {
    const firstInvalid = (Object.keys(PASSWORD_FIELD_IDS) as (keyof typeof errors)[])
      .find(key => errors[key])
    if (firstInvalid) focusField(PASSWORD_FIELD_IDS[firstInvalid])
    return
  }

  await change(form.current, form.next)

  if (state.value === 'success') {
    toast.success('Kata sandi berhasil diganti.', 'Pakai yang baru saat masuk berikutnya.')
    open.value = false
  }
  // "Belum tersambung" is the password-change endpoint being switched off, not
  // a failure the person did anything to cause — an amber toast, not a red one.
  else if (state.value === 'not-connected') {
    toast.warning('Ganti kata sandi belum tersambung.', error.value)
  }
  else if (state.value === 'error') {
    toast.error('Kata sandi belum berhasil diganti.', error.value)
  }
}
</script>

<template>
  <AppModal
    v-model="open"
    title="Ganti kata sandi"
    description="Kata sandi yang kamu pakai untuk masuk dengan email."
  >
    <form id="account-password-form" class="grid gap-5" novalidate @submit.prevent="onSubmit">
      <FormField
        id="current-password"
        v-model="form.current"
        label="Kata sandi saat ini"
        type="password"
        autocomplete="current-password"
        placeholder="Kata sandi yang sekarang"
        :error="errors.current"
      >
        <template #action>
          <NuxtLink
            to="/lupa-password"
            class="text-[0.82rem] font-semibold text-primary transition-colors hover:text-primary-light"
          >
            Lupa kata sandi?
          </NuxtLink>
        </template>
      </FormField>

      <FormField
        id="new-password"
        v-model="form.next"
        label="Kata sandi baru"
        type="password"
        autocomplete="new-password"
        placeholder="Minimal 8 karakter"
        :error="errors.next"
      >
        <template #below>
          <div v-if="form.next" class="mt-2.5 flex items-center gap-3">
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
        id="confirm-password"
        v-model="form.confirm"
        label="Ulangi kata sandi baru"
        type="password"
        autocomplete="new-password"
        placeholder="Ketik ulang kata sandi baru"
        :error="errors.confirm"
      />

      <p class="text-[0.82rem] text-muted">
        Selalu masuk lewat Google dan belum punya kata sandi? Buat dulu lewat
        <NuxtLink to="/lupa-password" class="font-semibold text-primary hover:text-primary-light">tautan pemulihan kata sandi</NuxtLink>.
      </p>
    </form>

    <template #footer>
      <AppButton type="button" variant="outline" size="sm" :disabled="isSubmitting" @click="open = false">
        Batal
      </AppButton>
      <AppButton type="submit" form="account-password-form" size="sm" :disabled="isSubmitting" :loading="isSubmitting">
        {{ isSubmitting ? 'Menyimpan…' : 'Simpan kata sandi' }}
      </AppButton>
    </template>
  </AppModal>
</template>
