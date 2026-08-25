<script setup lang="ts">
import type { NuxtError } from '#app'

/**
 * Nuxt's single catch-all error page — every unhandled error (404 from
 * useSessionItem's createError, a thrown 403, an actual 500, or anything
 * else showError/createError produces) renders through this one file,
 * branching on `error.statusCode`. There is no per-status-code file
 * convention in Nuxt; this is the idiomatic way to give each code its own
 * copy.
 *
 * Wrapped in the `default` layout (AppHeader/AppFooter) so it still looks
 * like part of the site rather than a bare page. AppHeader's session check
 * (useAuth) is already resilient — a failed /auth/me is treated as
 * signed-out, never thrown — so rendering it here cannot itself produce a
 * second error on top of the first.
 */
const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error?.statusCode ?? 500)

type ErrorCopy = {
  icon: string
  heading: string
  description: string
}

const COPY: Record<number, ErrorCopy> = {
  404: {
    icon: 'magnifying-glass',
    heading: 'Halaman tidak ditemukan',
    description:
      'Halaman yang kamu cari tidak ada, sudah dipindahkan, atau tautannya salah ketik. Coba periksa lagi alamatnya.',
  },
  403: {
    icon: 'lock-simple',
    heading: 'Akses ditolak',
    description:
      'Kamu tidak memiliki izin untuk membuka halaman ini. Jika menurutmu ini keliru, masuk dengan akun yang sesuai atau hubungi tim Zenko.',
  },
  500: {
    icon: 'warning-circle',
    heading: 'Terjadi kesalahan server',
    description:
      'Ada yang tidak beres di sisi kami. Tim Zenko sudah diberi tahu — coba muat ulang halaman ini sebentar lagi.',
  },
}

const FALLBACK: ErrorCopy = {
  icon: 'warning',
  heading: 'Terjadi kesalahan',
  description: 'Halaman ini tidak bisa ditampilkan sekarang. Coba kembali ke beranda atau muat ulang.',
}

const copy = computed(() => COPY[statusCode.value] ?? FALLBACK)

useHead({
  title: `${copy.value.heading} | Zenko`,
  meta: [{ name: 'robots', content: 'noindex' }],
})

/** clearError navigates away from the error boundary; redirect home rather
 * than retrying in place, since the page that threw may throw again. */
function retry() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <NuxtLayout name="default">
    <main class="container-page grid min-h-[60vh] place-items-center py-14 md:py-20">
      <div class="grid max-w-110 justify-items-center gap-4 text-center">
        <span
          class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700"
          aria-hidden="true"
        >
          <AppIcon :name="copy.icon" :size="32" weight="bold" />
        </span>

        <p class="text-[0.78rem] font-bold tracking-widest text-faint uppercase">
          Kesalahan {{ statusCode }}
        </p>
        <h1 class="text-[clamp(1.6rem,2.6vw,2.1rem)] leading-[1.14] tracking-[-0.03em]">
          {{ copy.heading }}
        </h1>
        <p class="max-w-95 leading-[1.7] text-muted">
          {{ copy.description }}
        </p>

        <div class="mt-3 flex flex-wrap items-center justify-center gap-3">
          <AppButton size="lg" @click="retry">
            {{ statusCode === 500 ? 'Coba lagi' : 'Kembali ke beranda' }}
          </AppButton>
          <AppButton v-if="statusCode === 500" to="/" variant="outline" size="lg">
            Kembali ke beranda
          </AppButton>
        </div>
      </div>
    </main>
  </NuxtLayout>
</template>
