<script setup lang="ts">
// The account landing: a read-first overview of a learner's own progress, so
// signing in lands on "here is where you are and what to do next" rather than
// on a settings form. Settings moved to /akun/profil.
definePageMeta({
  path: '/akun',
  layout: 'account',
  middleware: 'auth',
})

useHead({
  title: 'Ringkasan Belajar | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { user } = useAuth()
const { data: items, pending, error, refresh } = useOwnedPackages()

/** Just the first name — a greeting, not a full record. */
const firstName = computed(() => user.value?.name.trim().split(/\s+/)[0] ?? '')
const initial = computed(() => user.value?.name.trim().charAt(0).toUpperCase() || '?')

/**
 * What to work on next: never-attempted packages first, then whichever was
 * worked on most recently. Only the top few — the rest live in Paket saya.
 */
const continueItems = computed(() =>
  [...items.value]
    .map(item => ({ item, stats: packageStats(item) }))
    .sort((a, b) => {
      if ((a.stats.attemptCount === 0) !== (b.stats.attemptCount === 0)) {
        return a.stats.attemptCount === 0 ? -1 : 1
      }
      return (b.stats.last?.finishedAt ?? 0) - (a.stats.last?.finishedAt ?? 0)
    })
    .slice(0, 3),
)

const summary = computed(() => {
  const all = items.value.map(packageStats)
  // Raw scores use a different scale per exam type, so they cannot be compared
  // across packages — only accuracy (%) can. Raw best score stays per-package.
  const accuracies = all.map(s => s.accuracy?.percent).filter((x): x is number => x !== undefined)

  return {
    packages: items.value.length,
    attempts: all.reduce((sum, s) => sum + s.attemptCount, 0),
    bestAccuracy: accuracies.length === 0 ? null : Math.max(...accuracies),
    avgAccuracy: accuracies.length === 0
      ? null
      : Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length),
  }
})
</script>

<template>
  <div class="grid gap-6">
    <!-- Hero: a brand-washed welcome band, the page's single focal point. -->
    <section
      class="dot-grid relative overflow-hidden rounded-lg border border-hairline bg-linear-to-br from-primary-soft via-surface to-surface p-5 shadow-xs md:p-7"
      style="--dot-color: rgba(47, 111, 235, 0.08)"
    >
      <div class="relative z-1 flex items-center gap-4">
        <span class="inline-flex shrink-0 rounded-full bg-linear-to-br from-primary-light to-primary p-0.5 shadow-lift">
          <img
            v-if="user?.avatarUrl"
            :src="user.avatarUrl"
            alt=""
            referrerpolicy="no-referrer"
            class="h-16 w-16 rounded-full border-2 border-white object-cover"
          >
          <span
            v-else
            aria-hidden="true"
            class="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-surface-alt text-xl font-bold text-muted"
          >{{ initial }}</span>
        </span>

        <div class="min-w-0">
          <p class="text-[0.76rem] font-bold tracking-[0.14em] text-primary uppercase">Ringkasan</p>
          <h1 class="mt-1 text-[1.5rem] leading-tight font-bold tracking-[-0.04em] md:text-[1.7rem]">
            Halo, {{ firstName || 'kembali' }}
          </h1>
          <p class="mt-1 text-[0.94rem] text-muted">Siap melanjutkan persiapan dan latihan soalmu hari ini?</p>
        </div>
      </div>
    </section>

    <!-- Memuat: kerangka empat metrik dan panel, bukan angka nol yang keliru. -->
    <div v-if="pending" class="grid gap-6" aria-busy="true">
      <p class="sr-only" role="status">Memuat ringkasan…</p>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        <div v-for="n in 4" :key="n" class="h-28 animate-pulse rounded-lg bg-surface-sunken" />
      </div>
      <div class="h-56 animate-pulse rounded-lg bg-surface-sunken" aria-hidden="true" />
    </div>

    <AccountError v-else-if="error" @retry="refresh">
      Ringkasan progresmu belum berhasil dimuat. Periksa koneksimu, lalu coba lagi.
    </AccountError>

    <template v-else>
    <!-- Metrics: icon-led cards with a distinct accent each, so the row reads
         as four different things at a glance rather than four grey boxes.
         Scores here are accuracy (%), the only measure comparable across exam
         types — raw scores stay on each package where the scale is one. -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AccountStat tone="primary" label="Paket dimiliki" :value="String(summary.packages)">
        <template #icon><IconGrid class="h-[1.15rem] w-[1.15rem]" /></template>
      </AccountStat>
      <AccountStat
        tone="success"
        label="Try out dikerjakan"
        :value="String(summary.attempts)"
      >
        <template #icon><IconRepeat class="h-[1.15rem] w-[1.15rem]" /></template>
      </AccountStat>
      <AccountStat
        tone="star"
        label="Akurasi terbaik"
        :value="summary.bestAccuracy === null ? '-' : `${summary.bestAccuracy}%`"
      >
        <template #icon><IconTrophy class="h-[1.15rem] w-[1.15rem]" /></template>
      </AccountStat>
      <AccountStat
        tone="primary"
        label="Rata-rata akurasi"
        :value="summary.avgAccuracy === null ? '-' : `${summary.avgAccuracy}%`"
      >
        <template #icon><IconTarget class="h-[1.15rem] w-[1.15rem]" /></template>
      </AccountStat>
    </div>

    <DashboardPanel
      title="Lanjutkan belajar"
      description="Paket yang belum kamu kerjakan muncul lebih dulu."
    >
      <ul v-if="continueItems.length" class="grid gap-3">
        <li v-for="{ item, stats: s } in continueItems" :key="item.slug">
          <NuxtLink
            :to="`/akun/paket/${item.slug}`"
            class="group flex items-center gap-4 rounded-md border border-hairline bg-surface p-2.5 transition-[border-color,box-shadow] duration-200 ease-smooth hover:border-primary/30 hover:shadow-xs"
          >
            <img
              :src="item.thumbnailUrl"
              alt=""
              loading="lazy"
              class="h-16 w-24 shrink-0 rounded-sm bg-[#edf3ff] object-cover"
            >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate font-semibold tracking-[-0.02em]">{{ item.title }}</p>
                <span
                  v-if="s.attemptCount === 0"
                  class="inline-flex shrink-0 items-center rounded-pill bg-primary-soft px-2 py-0.5 text-[0.68rem] font-bold tracking-wide text-primary uppercase"
                >Baru</span>
              </div>

              <!-- Attempted: a real progress bar carries the accuracy. -->
              <div v-if="s.accuracy" class="mt-2 flex items-center gap-3">
                <span class="block h-1.5 flex-1 overflow-hidden rounded-pill bg-skeleton/70">
                  <span
                    class="block h-full rounded-pill bg-linear-to-r from-primary-light to-primary"
                    :style="{ width: `${s.accuracy.percent}%` }"
                  />
                </span>
                <span class="shrink-0 text-[0.78rem] font-semibold text-muted tabular-nums">
                  {{ s.accuracy.percent }}% · skor {{ s.best?.score }}
                </span>
              </div>
              <p v-else class="mt-1 text-[0.84rem] text-muted">
                Belum pernah dikerjakan. Yuk, mulai sekarang!
              </p>
            </div>

            <span class="flex shrink-0 items-center gap-1.5 pr-1 font-semibold text-primary">
              <span class="hidden sm:inline">{{ s.attemptCount === 0 ? 'Mulai' : 'Buka' }}</span>
              <IconArrowRight aria-hidden="true" class="h-3.5 w-3.5 transition-transform duration-200 ease-smooth group-hover:translate-x-1" />
            </span>
          </NuxtLink>
        </li>
      </ul>

      <!-- No packages yet: one way out, straight to the catalogue. -->
      <div v-else class="flex flex-wrap items-center justify-between gap-4">
        <p class="text-[0.9rem] text-muted">
          Kamu belum punya paket. Mulai dari katalog, progresnya akan muncul di sini.
        </p>
        <AppButton to="/paket" size="sm">Jelajahi katalog</AppButton>
      </div>

      <template v-if="continueItems.length" #action>
        <NuxtLink
          to="/akun/paket"
          class="text-[0.86rem] font-semibold text-primary transition-colors hover:text-primary-light"
        >
          Semua paket <IconArrowRight class="inline-block h-3.5 w-3.5 -mt-0.5" />
        </NuxtLink>
      </template>
    </DashboardPanel>
    </template>

    <NuxtLink
      to="/akun/pembelian"
      class="group flex items-center gap-4 rounded-lg border border-hairline bg-surface px-5 py-4 shadow-xs transition-[border-color,box-shadow] duration-200 ease-smooth hover:border-primary/30 hover:shadow-lift"
    >
      <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-alt text-muted transition-colors group-hover:bg-primary-soft group-hover:text-primary">
        <IconReceipt class="h-5 w-5" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block font-semibold tracking-[-0.02em]">Riwayat pembelian</span>
        <span class="mt-0.5 block text-[0.84rem] text-muted">Invoice dan bukti pembayaranmu.</span>
      </span>
      <IconArrowRight aria-hidden="true" class="h-4 w-4 shrink-0 text-primary transition-transform duration-200 ease-smooth group-hover:translate-x-1" />
    </NuxtLink>
  </div>
</template>
