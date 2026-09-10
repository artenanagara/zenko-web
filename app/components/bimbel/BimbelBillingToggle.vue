<script setup lang="ts">
/**
 * Pemilih periode tagihan: Tahunan atau Bulanan.
 *
 * Bentuknya segmented control kecil dengan labelnya di kiri, bukan dua tombol
 * sebesar tombol aksi. Ia mengubah cara harga di sebelahnya dibaca, bukan
 * melakukan sesuatu — dan kontrol yang seukuran tombol beli akan terus-menerus
 * terlihat seperti langkah berikutnya.
 *
 * Tahunan ditaruh lebih dulu karena ia yang lebih murah per bulannya; yang
 * mana yang aktif tetap ditentukan pemanggilnya, jadi urutan ini tidak
 * diam-diam mengubah apa yang dibeli orang.
 */
const period = defineModel<1 | 12>({ required: true })

const uid = useId()
const labelId = `${uid}-label`

const OPTIONS = [
  { value: 12 as const, label: 'Tahunan' },
  { value: 1 as const, label: 'Bulanan' },
]
</script>

<template>
  <div class="inline-flex flex-wrap items-center gap-2.5">
    <span :id="labelId" class="text-[0.84rem] font-medium text-muted">Tagihan</span>

    <div class="inline-flex rounded-pill bg-surface-alt p-0.5" role="group" :aria-labelledby="labelId">
      <button
        v-for="option in OPTIONS"
        :key="option.value"
        type="button"
        class="rounded-pill px-4 py-1.5 text-[0.84rem] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="period === option.value ? 'bg-surface text-ink shadow-xs' : 'text-faint hover:text-muted'"
        :aria-pressed="period === option.value"
        @click="period = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <!-- Tempat pemanggilnya menaruh hematnya, karena angka itu datang dari
         server dan bukan urusan kontrol ini. -->
    <slot name="note" />
  </div>
</template>
