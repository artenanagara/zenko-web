<script setup lang="ts">
definePageMeta({
  path: '/akun/paket',
  layout: 'account',
  middleware: 'auth',
})

useHead({
  title: 'Paket Saya | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { data: items, pending, error, refresh } = useOwnedPackages()

/**
 * Ordered by what to do next: never-attempted packages first (the ones worth
 * activating), then whichever was worked on most recently.
 */
const orderedItems = computed(() =>
  items.value.filter(matches).sort((a, b) => {
    const sa = packageStats(a)
    const sb = packageStats(b)
    if ((sa.attemptCount === 0) !== (sb.attemptCount === 0)) {
      return sa.attemptCount === 0 ? -1 : 1
    }
    return (sb.last?.finishedAt ?? 0) - (sa.last?.finishedAt ?? 0)
  }),
)

/**
 * Pencarian menggantikan tiga kartu angka yang dulu berdiri di sini — jumlah
 * paket, jumlah pengerjaan, akurasi terbaik.
 *
 * Ketiganya benar tapi tidak dipakai: yang membuka halaman ini datang untuk
 * membuka satu paket, bukan untuk membaca totalnya, dan angka-angka itu
 * mendorong paketnya sendiri turun satu layar penuh. Ringkasan progres punya
 * tempatnya sendiri di /akun. Yang benar-benar berguna di sini adalah cara
 * menemukan satu paket ketika daftarnya sudah panjang.
 */
const search = ref('')
const term = computed(() => search.value.trim().toLowerCase())

function matches(item: typeof items.value[number]): boolean {
  if (!term.value) return true
  // Judul, kategori, dan nama tutor: tiga hal yang diingat orang tentang paket
  // yang pernah dibelinya, dan satu-satunya yang tercetak di kartunya.
  return [item.title, item.category, item.tutorName]
    .some(field => field.toLowerCase().includes(term.value))
}
</script>

<template>
  <div class="grid gap-6">
    <header>
      <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">Paket saya</h1>
      <p class="mt-1.5 text-muted">Semua paket dan progres tryout-mu tersimpan di sini.</p>
    </header>

    <!-- Memuat: kerangka statistik dan kartu, bukan halaman kosong. -->
    <div v-if="pending" class="grid gap-6" aria-busy="true">
      <p class="sr-only" role="status">Memuat paket…</p>
      <div class="h-11 max-w-100 animate-pulse rounded-sm bg-surface-sunken" aria-hidden="true" />
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
      <!-- Kolom pencarian hanya dirender kalau memang ada yang bisa dicari:
           pada akun tanpa paket ia cuma menambah satu kontrol yang menjawab
           "tidak ada" apa pun yang diketik. -->
      <!-- AppTextField hardcoded w-full, jadi lebarnya dibatasi pembungkus ini
           dan bukan lewat utility yang saling menimpa — pola yang sama dengan
           DashboardTableToolbar. -->
      <div v-if="items.length" class="max-w-100">
        <AppTextField
          id="owned-packages-search"
          v-model="search"
          label="Cari paket"
          placeholder="Cari judul, kategori, atau nama tutor…"
          clearable
        >
          <template #leading-icon>
            <AppIcon name="magnifying-glass" :size="16" />
          </template>
        </AppTextField>
      </div>

      <!-- Columns follow the content column's width, not the viewport, so the
           cards never cramp beside the account sidebar. Matches PackageGrid. -->
      <section v-if="orderedItems.length" class="@container">
        <div class="grid gap-5 @min-[520px]:grid-cols-2 @min-[900px]:grid-cols-3">
          <OwnedPackageCard v-for="item in orderedItems" :key="item.slug" :item="item" />
        </div>
      </section>

      <!-- Paketnya ada, cuma tidak ada yang cocok: yang dibutuhkan jalan keluar
           dari pencariannya, bukan jalan ke katalog. -->
      <AppEmptyState
        v-else-if="items.length"
        title="Paketnya belum ketemu"
        :description="`Belum ada paket yang cocok dengan &quot;${search.trim()}&quot;. Coba kata kunci lain.`"
        action-label="Hapus pencarian"
        @action="search = ''"
      />

      <!-- An empty state is not an empty page: there is one way out of it. -->
      <DashboardPanel v-else title="Paketmu masih kosong" description="Mulai dari satu paket yang paling sesuai dengan targetmu.">
        <div class="flex items-start gap-3">
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-surface-alt text-muted">
            <IconGrid class="h-5 w-5" />
          </span>
          <p class="text-[0.9rem] text-muted">
            Paket yang kamu beli akan muncul di sini beserta progres latihannya.
          </p>
        </div>
        <div class="mt-4">
          <AppButton to="/paket" size="sm">Cari paket</AppButton>
        </div>
      </DashboardPanel>

      <p v-if="items.length" class="text-[0.86rem] text-muted">
        Mencari paket lain?
        <NuxtLink to="/paket" class="font-semibold text-primary transition-colors hover:text-primary-light">
          Lihat katalog
        </NuxtLink>
      </p>
    </template>
  </div>
</template>
