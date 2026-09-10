<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Dashboard Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const bimbel = useBimbelDetail(bimbelId)
const classes = useBimbelClasses(bimbelId)
const products = useTutorProducts({ bimbelId })
const plans = useBimbelPlans(bimbelId)

// Client-only fetch: session cookie milik origin API, tidak pernah sampai ke
// server Nuxt, jadi semuanya baru resolve setelah hydration.
function load() {
  return Promise.all([bimbel.refresh(), classes.refresh(), products.refresh(), plans.refresh()])
}
onMounted(load)

const privateProducts = computed(() => products.data.value.filter(item => item.visibility === 'bimbel'))
/**
 * Paket privat yang tayang — inilah yang benar-benar terbuka untuk siswa,
 * karena keanggotaan aktif memberi akses ke seluruh bank soal bimbel.
 */
const openProducts = computed(() => privateProducts.value.filter(item => item.status === 'live').length)

const pending = computed(() =>
  bimbel.pending.value || classes.pending.value || products.pending.value || plans.pending.value,
)

/**
 * Satu pesan untuk tiga sumber. Ringkasan ini hanya berguna kalau seluruh
 * angkanya benar: satu fetch yang gagal membuat kartu di bawahnya berbohong,
 * karena "0 kelas" terlihat persis sama dengan "kelas gagal dimuat".
 */
const loadError = computed(() =>
  bimbel.error.value || classes.error.value || products.error.value || plans.error.value,
)

const daysLeft = computed(() => {
  const until = bimbel.data.value?.activeUntil ?? 0
  return until ? Math.max(0, Math.ceil((until - Date.now() / 1000) / 86400)) : 0
})
const currentPlan = computed(() => plans.data.value.find(plan => plan.plan === bimbel.data.value?.plan))
const expiryNotice = computed(() => {
  const detail = bimbel.data.value
  if (!detail) return null
  if (detail.status === 'trial') {
    const price = currentPlan.value ? ` Mulai ${formatRupiah(currentPlan.value.pricePerMonth)} per bulan setelahnya.` : ''
    return {
      title: daysLeft.value <= 3 ? `Uji coba berakhir ${daysLeft.value} hari lagi` : 'Uji coba 7 hari sedang berjalan',
      body: `Semua fitur ${bimbelPlanLabel(detail.plan)} aktif sampai ${formatDate(detail.activeUntil)}.${price}`,
    }
  }
  if (detail.status === 'active' && daysLeft.value <= 14) {
    return {
      title: `Masa aktif tersisa ${daysLeft.value} hari`,
      body: 'Perpanjang sekarang; periode baru tetap dimulai setelah masa aktif saat ini berakhir.',
    }
  }
  return null
})

const stats = computed(() => [
  { label: 'Siswa aktif', value: String(bimbel.data.value?.seatsUsed ?? 0) },
  { label: 'Paket privat', value: String(privateProducts.value.length) },
  { label: 'Paket terbuka untuk siswa', value: String(openProducts.value) },
  { label: 'Kelas', value: String(classes.data.value.length) },
])

const seatsUsed = computed(() => bimbel.data.value?.seatsUsed ?? 0)
const seatQuota = computed(() => bimbel.data.value?.seatQuota ?? 0)
const seatPercent = computed(() => Math.min(100, (seatsUsed.value / Math.max(1, seatQuota.value)) * 100))
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      :title="bimbel.data.value?.name || 'Dashboard bimbel'"
      description="Kelola siswa, ubah latihan kertas menjadi online, dan pantau hasil dari satu tempat."
    >
      <template #actions>
        <AppButton :to="`/dashboard/bimbel/${bimbelId}/products/new`" size="sm">Buat paket</AppButton>
      </template>
    </AppPageHeader>

    <AppSectionMessage v-if="expiryNotice" appearance="warning" :title="expiryNotice.title">
      {{ expiryNotice.body }}
      <NuxtLink :to="`/dashboard/bimbel/${bimbelId}/billing`" class="ml-1 font-semibold text-primary underline">Lihat langganan</NuxtLink>
    </AppSectionMessage>

    <AppSectionMessage
      v-if="bimbel.data.value?.status === 'grace' || bimbel.data.value?.status === 'suspended'"
      appearance="warning"
      title="Langganan perlu diperpanjang"
    >
      Data tetap aman dan dapat dibaca, tetapi pembuatan materi baru dibatasi.
    </AppSectionMessage>

    <DashboardSkeleton v-if="pending" variant="stats" :count="4" label="Memuat ringkasan bimbel…" />

    <div v-else-if="loadError" class="rounded-md border border-line bg-surface px-5 py-6 text-center shadow-xs">
      <AppInlineMessage type="error">{{ loadError }}</AppInlineMessage>
      <button type="button" class="mt-3 font-semibold text-primary hover:underline" @click="load">
        Coba lagi
      </button>
    </div>

    <DashboardStats v-else :items="stats" :columns="4" />

    <div class="grid gap-6 lg:grid-cols-2">
      <DashboardPanel title="Mulai dari bank soal" description="Susun soal sekali, lalu biarkan terbuka untuk seluruh siswa bimbel.">
        <p class="text-sm leading-relaxed text-muted">
          Buat paket dari template SKD, SNBT, TKA, TOEFL, mapel sekolah, atau format kustom.
          Paket privat tidak muncul di marketplace, dan setiap siswa aktif dapat mengerjakannya kapan saja.
        </p>
        <AppButton :to="`/dashboard/bimbel/${bimbelId}/products`" class="mt-5" size="sm" variant="secondary">
          Buka bank soal
        </AppButton>
      </DashboardPanel>

      <DashboardPanel title="Kapasitas siswa" description="Hanya siswa aktif yang memakai kursi langganan.">
        <div class="flex items-end justify-between">
          <strong class="text-2xl tabular-nums">{{ seatsUsed }}</strong>
          <span class="text-sm text-muted">dari {{ seatQuota }} kursi</span>
        </div>
        <AppProgressBar
          class="mt-3"
          :value="seatPercent"
          role="progressbar"
          :aria-valuenow="seatsUsed"
          :aria-valuemin="0"
          :aria-valuemax="seatQuota"
          :aria-label="`${seatsUsed} dari ${seatQuota} kursi siswa terpakai`"
        />
        <AppButton :to="`/dashboard/bimbel/${bimbelId}/members`" class="mt-5" variant="secondary" size="sm">
          Kelola siswa
        </AppButton>
      </DashboardPanel>
    </div>
  </div>
</template>
