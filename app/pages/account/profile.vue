<script setup lang="ts">
import type { Role } from '#shared/types/user'

// The settings side of the account: identity + sign-in security. The account
// landing (/akun) is now the Ringkasan; this is where the details live.
definePageMeta({
  path: '/akun/profil',
  layout: 'account',
  middleware: 'auth',
  // No `roles`: every signed-in account has an account page, whatever else
  // it may be. Tutors and admins buy packages too.
})

useHead({
  title: 'Akun saya — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { user } = useAuth()

const ROLE_LABEL: Record<Role, string> = {
  student: 'Siswa',
  tutor: 'Tutor',
  admin: 'Admin',
}

/** Same badge vocabulary as the navbar account menu, so a role reads alike. */
const ROLE_TONE: Record<Role, 'neutral' | 'brand'> = {
  student: 'neutral',
  tutor: 'brand',
  admin: 'neutral',
}

const { state, error, mocked, change, reset } = useAccountPassword()

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

async function onSubmit() {
  reset()
  if (!validate()) return

  await change(form.current, form.next)

  if (state.value === 'success') {
    form.current = ''
    form.next = ''
    form.confirm = ''
  }
}
</script>

<template>
  <div class="grid gap-6">
    <header>
      <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">Akun saya</h1>
      <p class="mt-1.5 text-muted">Data akun dan keamanan masuk ke Zenko.</p>
    </header>

    <DashboardPanel title="Profil" description="Diambil dari akun Google yang kamu pakai untuk masuk.">
      <div v-if="user" class="grid gap-5">
        <!-- Identity as one card, not a stack of label/value rows: avatar with
             a brand ring and verified seal, name, role and email together. -->
        <div class="flex flex-col gap-4 rounded-md border border-hairline bg-linear-to-br from-surface-alt to-surface p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
          <span class="relative inline-flex shrink-0 self-start rounded-full bg-linear-to-br from-primary-light to-primary p-0.5 shadow-lift sm:self-center">
            <img
              v-if="user.avatarUrl"
              :src="user.avatarUrl"
              alt=""
              referrerpolicy="no-referrer"
              class="h-16 w-16 rounded-full border-2 border-white object-cover"
            >
            <span
              v-else
              aria-hidden="true"
              class="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-surface-alt text-[1.3rem] font-bold text-muted"
            >{{ user.name.trim().charAt(0).toUpperCase() || '?' }}</span>

            <span
              v-if="user.verified"
              role="img"
              aria-label="Email terverifikasi"
              class="absolute -right-1 -bottom-1 inline-flex rounded-full bg-white p-0.5 shadow-xs"
            >
              <IconSeal class="h-4.5 w-4.5" />
            </span>
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="truncate text-[1.2rem] font-bold tracking-[-0.03em]">{{ user.name }}</p>
              <DashboardBadge :tone="ROLE_TONE[user.role]">{{ ROLE_LABEL[user.role] }}</DashboardBadge>
            </div>
            <p class="mt-0.5 truncate text-[0.9rem] text-muted">{{ user.email }}</p>

            <div class="mt-3 flex flex-wrap items-center gap-3">
              <DashboardBadge :tone="user.verified ? 'success' : 'warning'">
                {{ user.verified ? 'Email terverifikasi' : 'Email belum terverifikasi' }}
              </DashboardBadge>
              <AppButton v-if="!user.verified" to="/verifikasi-email" variant="light" size="sm">
                Verifikasi email
              </AppButton>
            </div>
          </div>
        </div>

        <p class="text-[0.82rem] text-muted">
          Nama dan foto masih mengikuti akun Google. Mengubahnya dari sini
          menunggu endpoint profil di zenko-api.
        </p>
      </div>

      <!-- Skeleton mirrors the profile's shape, so the panel does not jump from
           a line of text to a full block when the session loads. -->
      <div v-else class="grid gap-5">
        <p class="sr-only" role="status">Memuat data akun…</p>
        <div class="flex items-center gap-4" aria-hidden="true">
          <span class="h-14 w-14 shrink-0 animate-pulse rounded-full bg-skeleton" />
          <div class="grid gap-2">
            <span class="block h-4 w-40 animate-pulse rounded-pill bg-skeleton" />
            <span class="block h-3 w-56 animate-pulse rounded-pill bg-skeleton" />
          </div>
        </div>
        <div class="grid gap-3" aria-hidden="true">
          <span v-for="n in 4" :key="n" class="block h-3 w-full animate-pulse rounded-pill bg-skeleton" />
        </div>
      </div>
    </DashboardPanel>

    <DashboardPanel
      id="kata-sandi"
      title="Kata sandi"
      description="Ganti kata sandi yang kamu pakai untuk masuk dengan email."
    >
      <form class="grid max-w-100 gap-5" novalidate @submit.prevent="onSubmit">
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

        <p
          v-if="state === 'success'"
          class="rounded-sm border border-success/30 bg-success-soft px-4 py-3 text-[0.86rem] text-success-ink"
          role="status"
        >
          <template v-if="mocked">
            Kata sandi “diganti” dalam mode contoh — tidak ada yang benar-benar
            berubah karena endpointnya belum ada.
          </template>
          <template v-else>
            Kata sandi berhasil diganti. Pakai yang baru saat masuk berikutnya.
          </template>
        </p>

        <!-- "Belum tersambung" is an amber notice, not a failure. -->
        <p
          v-else-if="state === 'not-connected'"
          class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900"
          role="status"
        >
          {{ error }}
        </p>

        <!-- A real failure (wrong password, server down) is red, like the
             field errors — never amber, which reads as a mere warning. -->
        <p
          v-else-if="state === 'error'"
          class="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[0.86rem] text-red-700"
          role="alert"
        >
          <IconAlert class="mt-0.5 h-4 w-4 shrink-0" />
          <span>{{ error }}</span>
        </p>

        <div>
          <AppButton type="submit" size="sm" :disabled="isSubmitting">
            {{ isSubmitting ? 'Menyimpan…' : 'Simpan kata sandi' }}
          </AppButton>
        </div>

        <p class="text-[0.82rem] text-muted">
          Kalau kamu selalu masuk lewat Google, akunmu belum punya kata sandi —
          buat satu lewat <NuxtLink to="/lupa-password" class="font-semibold text-primary hover:text-primary-light">tautan pemulihan</NuxtLink>
          begitu alur email aktif.
        </p>
      </form>
    </DashboardPanel>
  </div>
</template>
