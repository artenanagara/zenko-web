<script setup lang="ts">
import type { Attempt } from '#shared/types/account'
import type { PackageStats } from '~/composables/useOwnedPackages'

definePageMeta({
  path: '/akun/paket/:slug()',
  layout: 'account',
  middleware: 'auth',
})

const route = useRoute()
const slug = route.params.slug as string
const { data: item, pending, error, refresh } = useOwnedPackage(slug)
const reviews = useProductReviews(slug)

useHead({
  title: computed(() => (item.value ? `${item.value.title} | Paket Saya | Zenko` : 'Paket Saya | Zenko')),
  meta: [{ name: 'robots', content: 'noindex' }],
})

// Always a defined shape, so the template can read stats.attemptCount without
// null checks; the attempted-only branches below still guard on their own data.
const EMPTY_STATS: PackageStats = { attemptCount: 0, best: null, last: null, accuracy: null }
const stats = computed<PackageStats>(() => (item.value ? packageStats(item.value) : EMPTY_STATS))

const attempts = computed(() =>
  item.value ? [...item.value.attempts].sort((a, b) => b.finishedAt - a.finishedAt) : [],
)

/** Percobaan terbaru — tujuan tombol "Lihat pembahasan" di header. */
const latestAttempt = computed(() => attempts.value[0] ?? null)

/* ------------------------------------------------------------------ ulasan */

/**
 * Modal ulasan hanya untuk satu momen: siswa baru saja menyelesaikan sesi dan
 * menekan "Lihat progres paket" di layar ringkasan, yang menautkan ke sini
 * dengan `?selesai=1`. Di luar itu halaman ini tidak menodong siapa pun —
 * panel "Ulasanmu" di bawah tetap terbuka kapan saja.
 *
 * Yang sudah pernah mengulas dilewati sepenuhnya, sesuai aturan satu ulasan
 * per paket: memperbarui ulasan adalah keputusan siswa, bukan sesuatu yang
 * perlu ditanyakan ulang setiap kali selesai mengerjakan.
 */
const reviewModalOpen = ref(false)

/** refreshMine() sudah selesai; sebelum itu "belum punya ulasan" belum tentu benar. */
const myReviewLoaded = ref(false)

/** Modal ini sekali seumur kunjungan, bahkan kalau datanya dimuat ulang. */
const reviewPrompted = ref(false)

const hasReviewed = computed(() => !!reviews.mine.value)

onMounted(async () => {
  await reviews.refreshMine()
  myReviewLoaded.value = true
})

// Dua sumber data yang datang terpisah: ulasan sendiri dan detail paket
// (yang menentukan sudah pernah dikerjakan atau belum). Menunggu keduanya di
// satu effect lebih jujur daripada menebak mana yang selesai duluan.
watchEffect(() => {
  if (reviewPrompted.value || !myReviewLoaded.value) return
  if (route.query.selesai !== '1') return
  if (stats.value.attemptCount === 0 || hasReviewed.value) return

  reviewPrompted.value = true
  reviewModalOpen.value = true

  // Buang penandanya supaya muat-ulang halaman tidak menodong ulang.
  const { selesai: _dismissed, ...rest } = route.query
  void navigateTo({ path: route.path, query: rest }, { replace: true })
})

/**
 * Modal yang sama dipakai dua arah: ajakan setelah sesi selesai (di atas) dan
 * tombol "Edit ulasan" pada ulasan yang sudah ada. Judulnya ikut berubah
 * supaya siswa tahu mana yang sedang ia lakukan.
 */
function openReviewEditor() {
  reviewModalOpen.value = true
}

async function onReviewSubmitted() {
  reviewModalOpen.value = false
  await reviews.refreshMine()
}

/** Selisih skor terhadap percobaan sebelumnya; null untuk percobaan pertama. */
function scoreDelta(attempt: Attempt): number | null {
  const prev = item.value?.attempts.find(other => other.number === attempt.number - 1)
  return prev ? attempt.score - prev.score : null
}

/** Tanda minus tipografis, bukan tanda hubung — angka negatif tetap terbaca angka. */
function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`
  if (delta < 0) return `-${Math.abs(delta)}`
  return '±0'
}

const DELTA_TONES = {
  up: 'bg-success-soft text-success-ink',
  down: 'bg-amber-50 text-amber-800',
  flat: 'bg-surface-sunken text-muted',
} as const

function deltaTone(delta: number) {
  return DELTA_TONES[delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat']
}

/** Analisis subtes memakai percobaan terbaik — itu yang jadi acuan skor di atas. */
const sections = computed(() =>
  (stats.value.best?.sections ?? []).map(section => ({
    ...section,
    percent: section.total === 0 ? 0 : Math.round((section.correct / section.total) * 100),
  })),
)

/**
 * Subtes terlemah diberi tanda supaya jelas mana yang perlu dipelajari dulu.
 * Kalau semua subtes setara, tidak ada yang ditandai — menandai semuanya
 * sama dengan tidak menandai apa-apa.
 */
const weakestTitle = computed(() => {
  if (sections.value.length < 2) return null
  const weakest = sections.value.reduce((low, section) =>
    section.percent < low.percent ? section : low,
  )
  const varies = sections.value.some(section => section.percent !== weakest.percent)
  return varies ? weakest.title : null
})

/** Warna batang mengikuti capaian, jadi lemah/kuat terbaca tanpa membaca angka. */
function barTone(percent: number) {
  if (percent >= 80) return 'bg-linear-to-r from-success/80 to-success'
  if (percent >= 60) return 'bg-linear-to-r from-primary-light to-primary'
  return 'bg-linear-to-r from-amber-300 to-star'
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Memuat: kerangka header dan panel. -->
    <div v-if="pending" class="grid gap-6" aria-busy="true">
      <p class="sr-only" role="status">Memuat paket…</p>
      <div class="h-32 animate-pulse rounded-lg bg-surface-sunken" aria-hidden="true" />
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        <div v-for="n in 4" :key="n" class="h-28 animate-pulse rounded-lg bg-surface-sunken" />
      </div>
      <div class="h-56 animate-pulse rounded-lg bg-surface-sunken" aria-hidden="true" />
    </div>

    <AccountError v-else-if="error" @retry="refresh">
      Paket ini belum berhasil dimuat. Periksa koneksimu, lalu coba lagi.
    </AccountError>

    <template v-else-if="item">
      <AppBreadcrumbs
        :items="[
          { label: 'Paket saya', to: '/akun/paket' },
          { label: item.title },
        ]"
      />

      <!-- Identitas paket dan aksinya dalam satu baris: teks di kiri, CTA di
           kanan. Tanpa thumbnail — di halaman milik sendiri gambar katalog
           cuma makan tempat. -->
      <header class="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-lg border border-hairline bg-surface p-5 shadow-xs md:p-6">
        <div class="min-w-0">
          <DashboardBadge tone="brand">{{ item.category }}</DashboardBadge>
          <h1 class="mt-2.5 text-[1.4rem] leading-[1.2] font-bold tracking-[-0.04em]">{{ item.title }}</h1>
          <p class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.88rem] text-muted">
            <span>oleh {{ item.tutorName }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ item.questionCount }} soal</span>
            <span aria-hidden="true">·</span>
            <span>{{ formatDuration(item.durationMinutes) }}</span>
            <span aria-hidden="true">·</span>
            <span>Dibeli {{ formatDate(item.purchasedAt) }}</span>
            <span aria-hidden="true">·</span>
            <span>
              Invoice
              <NuxtLink
                :to="`/akun/pembelian/${item.invoice}`"
                class="font-semibold text-primary tabular-nums transition-colors hover:text-primary-light"
              >
                {{ item.invoice }}
              </NuxtLink>
            </span>
          </p>
        </div>

        <!-- Pembahasan menunjuk percobaan terakhir. Riwayat di bawah tetap
             menautkan pembahasan tiap percobaan satu per satu; yang di sini
             adalah jalan pintas ke yang baru saja dikerjakan, karena itu yang
             dicari orang begitu selesai. -->
        <div class="flex shrink-0 flex-wrap items-center gap-2.5">
          <AppButton
            v-if="latestAttempt"
            :to="`/akun/paket/${item.slug}/kerjakan/pembahasan/${latestAttempt.id}`"
            variant="light"
            size="md"
            class="border border-hairline-strong shadow-none"
          >
            Lihat pembahasan
          </AppButton>
          <AppButton :to="`/akun/paket/${item.slug}/kerjakan`" size="md">
            {{ stats.attemptCount === 0 ? 'Mulai try out' : 'Kerjakan lagi' }}
          </AppButton>
        </div>
      </header>

      <!-- Belum pernah dikerjakan: satu ajakan yang jelas lebih berguna daripada
           empat kartu berisi tanda strip dan dua panel kosong. -->
      <section
        v-if="stats.attemptCount === 0"
        class="grid justify-items-center gap-3 rounded-lg border border-hairline bg-surface px-6 py-12 text-center shadow-xs"
      >
        <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <IconTarget class="h-6 w-6" />
        </span>
        <h2 class="text-[1.1rem] font-bold tracking-[-0.03em]">Paket ini belum pernah kamu kerjakan</h2>
        <p class="max-w-md text-[0.9rem] text-muted">
          Kerjakan simulasi try out pertamamu. Skor, analisis per subtes, dan riwayat latihan akan tercatat rapi di sini.
        </p>
      </section>

      <template v-else>
        <!-- Raw scores are fine here: one package is one exam type, so its own
             scale is consistent across every attempt. -->
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AccountStat tone="star" label="Skor terbaik" :value="String(stats.best!.score)">
            <template #icon><IconTrophy class="h-[1.15rem] w-[1.15rem]" /></template>
          </AccountStat>
          <AccountStat tone="primary" label="Skor terakhir" :value="String(stats.last!.score)">
            <template #icon><IconTarget class="h-[1.15rem] w-[1.15rem]" /></template>
          </AccountStat>
          <AccountStat
            tone="primary"
            label="Jawaban benar"
            :value="`${stats.accuracy!.percent}%`"
          >
            <template #icon><IconCheck class="h-[1.15rem] w-[1.15rem]" /></template>
          </AccountStat>
          <AccountStat tone="success" label="Dikerjakan" :value="`${stats.attemptCount}×`">
            <template #icon><IconRepeat class="h-[1.15rem] w-[1.15rem]" /></template>
          </AccountStat>
        </div>

        <DashboardPanel
          id="subtes"
          title="Analisis per subtes"
          description="Berdasarkan hasil pengerjaan terbaikmu."
        >
          <ul class="grid gap-4">
            <li v-for="section in sections" :key="section.title">
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <span class="inline-flex flex-wrap items-center gap-2 font-semibold tracking-[-0.02em]">
                  {{ section.title }}
                  <DashboardBadge v-if="section.title === weakestTitle" tone="warning">
                    Perlu ditingkatkan
                  </DashboardBadge>
                </span>
                <span class="text-[0.84rem] text-muted tabular-nums">
                  {{ section.correct }} dari {{ section.total }} benar
                </span>
              </div>
              <div class="mt-2 flex items-center gap-3">
                <span class="block h-2 flex-1 overflow-hidden rounded-pill bg-skeleton/60">
                  <span
                    class="block h-full rounded-pill"
                    :class="barTone(section.percent)"
                    :style="{ width: `${section.percent}%` }"
                  />
                </span>
                <span class="w-10 shrink-0 text-right text-[0.8rem] font-semibold tabular-nums">
                  {{ section.percent }}%
                </span>
              </div>
            </li>
          </ul>
        </DashboardPanel>

        <DashboardPanel
          id="riwayat"
          title="Riwayat pengerjaan"
          description="Setiap kali paket ini dikerjakan, terbaru di atas."
        >
          <!-- Layar lebar: tabel, karena lima kolom memang paling enak dibaca
               berdampingan. -->
          <div class="hidden overflow-x-auto sm:block">
            <table class="w-full min-w-140 border-collapse text-left">
              <thead>
                <tr class="border-b border-hairline text-[0.74rem] tracking-widest text-muted uppercase">
                  <th class="pb-2.5 font-bold">Percobaan</th>
                  <th class="pb-2.5 font-bold">Tanggal</th>
                  <th class="pb-2.5 font-bold">Skor</th>
                  <th class="pb-2.5 font-bold">Selisih</th>
                  <th class="pb-2.5 font-bold">Benar</th>
                  <th class="pb-2.5 font-bold">Peringkat</th>
                  <th class="pb-2.5 font-bold" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="attempt in attempts"
                  :key="attempt.id"
                  class="border-t border-hairline transition-colors hover:bg-surface-alt/60"
                >
                  <td class="py-3.5 pr-4 font-semibold tabular-nums">
                    #{{ attempt.number }}
                    <DashboardBadge v-if="attempt.id === stats.best?.id" tone="success" class="ml-2">
                      Terbaik
                    </DashboardBadge>
                  </td>
                  <td class="py-3.5 pr-4 text-[0.9rem] text-muted">{{ formatDate(attempt.finishedAt) }}</td>
                  <td class="py-3.5 pr-4 font-bold tabular-nums">
                    {{ attempt.score }}<span v-if="attempt.maxScore > 0" class="font-medium text-muted">/{{ attempt.maxScore }}</span>
                    <DashboardBadge v-if="attempt.passed !== undefined" :tone="attempt.passed ? 'success' : 'danger'" class="ml-2">
                      {{ attempt.passed ? 'Lulus' : 'Tidak Lulus' }}
                    </DashboardBadge>
                  </td>
                  <td class="py-3.5 pr-4">
                    <span
                      v-if="scoreDelta(attempt) !== null"
                      class="rounded-pill px-2 py-0.5 text-[0.76rem] font-bold tabular-nums"
                      :class="deltaTone(scoreDelta(attempt)!)"
                    >
                      {{ formatDelta(scoreDelta(attempt)!) }}
                    </span>
                    <span v-else class="text-[0.9rem] text-faint">-</span>
                  </td>
                  <td class="py-3.5 pr-4 text-[0.9rem] text-muted tabular-nums">
                    {{ accuracyOf(attempt).correct }}/{{ accuracyOf(attempt).total }}
                  </td>
                  <td class="py-3.5 pr-4 text-[0.9rem] text-muted tabular-nums">{{ attempt.rank }}</td>
                  <td class="py-3.5 text-right">
                    <NuxtLink
                      :to="`/akun/paket/${item.slug}/kerjakan/pembahasan/${attempt.id}`"
                      class="text-[0.86rem] font-semibold text-primary transition-colors hover:text-primary-light"
                    >
                      Lihat pembahasan
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Layar sempit: kartu bertumpuk, supaya skor terbaca tanpa
               menggeser tabel ke samping. -->
          <ul class="grid gap-3 sm:hidden">
            <li
              v-for="attempt in attempts"
              :key="attempt.id"
              class="rounded-md border border-hairline bg-surface-alt/40 p-4"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="inline-flex items-center gap-2 font-semibold tabular-nums">
                  #{{ attempt.number }}
                  <DashboardBadge v-if="attempt.id === stats.best?.id" tone="success">
                    Terbaik
                  </DashboardBadge>
                </span>
                <span class="text-[0.82rem] text-muted">{{ formatDate(attempt.finishedAt) }}</span>
              </div>
              <div class="mt-2.5 flex flex-wrap items-baseline gap-2">
                <span class="text-[1.35rem] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
                  {{ attempt.score }}<span v-if="attempt.maxScore > 0" class="text-[0.9rem] font-semibold text-muted">/{{ attempt.maxScore }}</span>
                </span>
                <DashboardBadge v-if="attempt.passed !== undefined" :tone="attempt.passed ? 'success' : 'danger'">
                  {{ attempt.passed ? 'Lulus' : 'Tidak Lulus' }}
                </DashboardBadge>
                <span
                  v-if="scoreDelta(attempt) !== null"
                  class="rounded-pill px-2 py-0.5 text-[0.74rem] font-bold tabular-nums"
                  :class="deltaTone(scoreDelta(attempt)!)"
                >
                  {{ formatDelta(scoreDelta(attempt)!) }}
                </span>
              </div>
              <p class="mt-2 text-[0.82rem] text-muted tabular-nums">
                {{ accuracyOf(attempt).correct }}/{{ accuracyOf(attempt).total }} benar
                <template v-if="attempt.rank !== '—' && attempt.rank !== '-'"> · Peringkat {{ attempt.rank }}</template>
              </p>
              <NuxtLink
                :to="`/akun/paket/${item.slug}/kerjakan/pembahasan/${attempt.id}`"
                class="mt-2.5 inline-block text-[0.86rem] font-semibold text-primary transition-colors hover:text-primary-light"
              >
                Lihat pembahasan
              </NuxtLink>
            </li>
          </ul>
        </DashboardPanel>

        <!-- Panel ulasan permanen: tempat siswa yang menutup modal tadi (atau
             yang ingin memperbarui ulasannya) menyelesaikannya, tanpa harus
             kembali ke halaman katalog publik. -->
        <DashboardPanel
          id="ulasan"
          :title="hasReviewed ? 'Ulasanmu' : 'Beri ulasan'"
          :description="hasReviewed
            ? 'Ulasan ini tampil di halaman paket dan profil tutornya. Kamu bisa memperbaruinya kapan saja.'
            : 'Bantu tutor dan siswa lain dengan menilai paket yang sudah kamu kerjakan.'"
        >
          <!-- Sudah pernah mengulas: yang tampil adalah ulasannya, bukan form
               kosong kedua. Memperbaruinya lewat "Edit ulasan" di kartu itu,
               yang membuka form yang sama di dalam modal. -->
          <ProductReviewItem
            v-if="reviews.mine.value"
            :review="reviews.mine.value"
            is-mine
            @edit="openReviewEditor"
          />
          <ProductReviewForm
            v-else
            :slug="item.slug"
            embedded
            @submitted="onReviewSubmitted"
          />
        </DashboardPanel>
      </template>

      <!-- Ajakan sekali jalan, tepat setelah sesi selesai. Isinya form yang
           sama dengan panel di atas — satu sumber, dua tempat munculnya. -->
      <AppModal
        v-model="reviewModalOpen"
        :title="hasReviewed ? 'Perbarui ulasanmu' : 'Bagaimana pengalaman try out ini?'"
        :description="hasReviewed
          ? 'Ulasan yang tersimpan akan menggantikan versi sebelumnya.'
          : 'Bantu tutor dan rekan pejuang lainnya dengan memberikan ulasan singkat.'"
      >
        <ProductReviewForm
          :slug="item.slug"
          :existing="reviews.mine.value"
          embedded
          @submitted="onReviewSubmitted"
        />
        <template #footer="{ close }">
          <button
            type="button"
            class="text-[0.88rem] font-semibold text-muted transition-colors hover:text-ink"
            @click="close"
          >
            {{ hasReviewed ? 'Batal' : 'Nanti saja' }}
          </button>
        </template>
      </AppModal>
    </template>
  </div>
</template>
