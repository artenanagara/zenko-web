<script setup lang="ts">
function reloadPage() {
  if (import.meta.client) window.location.reload()
}
</script>

<template>
  <NuxtErrorBoundary>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <template #error>
      <main class="grid min-h-screen place-items-center bg-surface p-6 text-center">
        <section class="max-w-md rounded-lg border border-hairline bg-white p-8 shadow-sm">
          <BrandIcon class="mx-auto h-12 w-12" />
          <h1 class="mt-5 text-xl font-bold text-ink">Halaman belum bisa ditampilkan</h1>
          <p class="mt-2 text-sm text-muted">Sesi atau data halaman mungkin sedang memuat ulang. Coba muat halaman ini kembali.</p>
          <button type="button" class="mt-6 font-semibold text-primary hover:underline" @click="reloadPage">Muat ulang halaman</button>
        </section>
      </main>
    </template>
  </NuxtErrorBoundary>
  <ConfirmDialog />
  <DemoBanner />
  <ToastHost />
  <CookieConsent />
  <MarketingPageviewBeacon />
</template>
