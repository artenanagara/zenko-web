<script setup lang="ts">
definePageMeta({
  path: '/akun/paket',
  layout: 'account',
  middleware: 'auth',
})

useHead({
  title: 'Paket saya — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { data: items, pending, error, refresh } = useOwnedPackages()

/**
 * Ordered by what to do next: never-attempted packages first (the ones worth
 * activating), then whichever was worked on most recently.
 */
const orderedItems = computed(() =>
  [...items.value].sort((a, b) => {
    const sa = packageStats(a)
    const sb = packageStats(b)
    if ((sa.attemptCount === 0) !== (sb.attemptCount === 0)) {
      return sa.attemptCount === 0 ? -1 : 1
    }
    return (sb.last?.finishedAt ?? 0) - (sa.last?.finishedAt ?? 0)
  }),
)

const summary = computed(() => {
  const all = items.value.map(packageStats)
  // Accuracy (%) is the only measure comparable across exam types; raw best
  // score is a per-package number and lives on each card, not in this total.
  const accuracies = all.map(s => s.accuracy?.percent).filter((x): x is number => x !== undefined)

  return {
    packages: items.value.length,
    attempts: all.reduce((sum, s) => sum + s.attemptCount, 0),
    bestAccuracy: accuracies.length === 0 ? null : Math.max(...accuracies),
  }
})
</script>

<template>
  <div class="grid gap-6">
    <header>
      <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">Paket saya</h1>
      <p class="mt-1.5 text-muted">Setiap paket adalah satu try out yang bisa kamu kerjakan berulang.</p>
    </header>

    <!-- Memuat: kerangka statistik dan kartu, bukan halaman kosong. -->
    <div v-if="pending" class="grid gap-6" aria-busy="true">
      <p class="sr-only" role="status">Memuat paket…</p>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        <div v-for="n in 3" :key="n" class="h-28 animate-pulse rounded-lg bg-surface-sunken" />
      </div>
      <div class="@container" aria-hidden="true">
        <div class="grid gap-5 @min-[520px]:grid-cols-2 @min-[900px]:grid-cols-3">
          <div v-for="n in 3" :key="n" class="h-85 animate-pulse rounded-lg bg-surface-sunken" />
        </div>
      </div>
    </div>

    <AccountError v-else-if="error" @retry="refresh">
      Paket milikmu belum berhasil dimuat. Periksa koneksimu, lalu coba lagi.
    </AccountError>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AccountStat tone="primary" label="Paket dimiliki" :value="String(summary.packages)">
          <template #icon><IconGrid class="h-[1.15rem] w-[1.15rem]" /></template>
        </AccountStat>
        <AccountStat
          tone="success"
          label="Try out dikerjakan"
          :value="String(summary.attempts)"
          hint="Termasuk pengerjaan ulang"
        >
          <template #icon><IconRepeat class="h-[1.15rem] w-[1.15rem]" /></template>
        </AccountStat>
        <AccountStat
          tone="star"
          label="Akurasi terbaik"
          :value="summary.bestAccuracy === null ? '—' : `${summary.bestAccuracy}%`"
          hint="Persen jawaban benar tertinggi"
        >
          <template #icon><IconTrophy class="h-[1.15rem] w-[1.15rem]" /></template>
        </AccountStat>
      </div>

      <!-- Columns follow the content column's width, not the viewport, so the
           cards never cramp beside the account sidebar. Matches PackageGrid. -->
      <section v-if="orderedItems.length" class="@container">
        <div class="grid gap-5 @min-[520px]:grid-cols-2 @min-[900px]:grid-cols-3">
          <OwnedPackageCard v-for="item in orderedItems" :key="item.slug" :item="item" />
        </div>
      </section>

      <!-- An empty state is not an empty page: there is one way out of it. -->
      <DashboardPanel v-else title="Belum ada paket" description="Kamu belum membeli paket apa pun.">
        <div class="flex items-start gap-3">
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-surface-alt text-muted">
            <IconGrid class="h-5 w-5" />
          </span>
          <p class="text-[0.9rem] text-muted">
            Paket yang kamu beli akan muncul di sini beserta progres latihannya.
          </p>
        </div>
        <div class="mt-4">
          <AppButton to="/paket" size="sm">Jelajahi katalog</AppButton>
        </div>
      </DashboardPanel>

      <p v-if="orderedItems.length" class="text-[0.86rem] text-muted">
        Mencari paket lain?
        <NuxtLink to="/paket" class="font-semibold text-primary transition-colors hover:text-primary-light">
          Lihat katalog
        </NuxtLink>
      </p>
    </template>
  </div>
</template>
