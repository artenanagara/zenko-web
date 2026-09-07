<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Dashboard Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const bimbelId = String(useRoute().params.bimbelId)
const bimbel = useBimbelDetail(bimbelId)
const classes = useBimbelClasses(bimbelId)
const assignments = useBimbelAssignments(bimbelId)
const products = useTutorProducts({ bimbelId })

// Client-only fetch: session cookie milik origin API, tidak pernah sampai ke
// server Nuxt, jadi semuanya baru resolve setelah hydration.
function load() {
  return Promise.all([bimbel.refresh(), classes.refresh(), assignments.refresh(), products.refresh()])
}
onMounted(load)

const privateProducts = computed(() => products.data.value.filter(item => item.visibility === 'bimbel'))
const ongoing = computed(() => assignments.data.value.filter(item => item.phase === 'ongoing').length)

const pending = computed(() =>
  bimbel.pending.value || classes.pending.value || assignments.pending.value || products.pending.value,
)

/**
 * Satu pesan untuk empat sumber. Ringkasan ini hanya berguna kalau seluruh
 * angkanya benar: satu fetch yang gagal membuat kartu di bawahnya berbohong,
 * karena "0 kelas" terlihat persis sama dengan "kelas gagal dimuat".
 */
const loadError = computed(() =>
  bimbel.error.value || classes.error.value || assignments.error.value || products.error.value,
)

const stats = computed(() => [
  { label: 'Siswa aktif', value: String(bimbel.data.value?.seatsUsed ?? 0) },
  { label: 'Paket privat', value: String(privateProducts.value.length) },
  { label: 'Kelas', value: String(classes.data.value.length) },
  { label: 'Tugas berlangsung', value: String(ongoing.value) },
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
        <AppButton :to="`/dashboard/bimbel/${bimbelId}/assignments/baru`" size="sm">Buat penugasan</AppButton>
      </template>
    </AppPageHeader>

    <AppSectionMessage
      v-if="bimbel.data.value?.status === 'grace' || bimbel.data.value?.status === 'suspended'"
      appearance="warning"
      title="Langganan perlu diperpanjang"
    >
      Data tetap aman dan dapat dibaca, tetapi pembuatan materi atau tugas baru dibatasi.
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
      <DashboardPanel title="Mulai dari bank soal" description="Susun soal sekali, lalu gunakan untuk banyak kelas dan jadwal.">
        <p class="text-sm leading-relaxed text-muted">
          Buat paket dari template SKD, SNBT, TKA, TOEFL, mapel sekolah, atau format kustom.
          Paket privat tidak muncul di marketplace.
        </p>
        <AppButton :to="`/dashboard/bimbel/${bimbelId}/products/new`" class="mt-5" size="sm">Buat paket soal</AppButton>
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
