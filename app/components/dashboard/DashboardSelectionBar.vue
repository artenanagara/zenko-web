<script setup lang="ts">
/**
 * Bar aksi massal di atas tabel yang sedang punya baris terpilih.
 *
 * Muncul hanya saat `count` > 0, di tempat yang sama pada setiap tabel
 * dashboard: berapa yang dipilih, ringkasan opsional (mis. total nominal),
 * tombol-tombol aksi yang halaman sediakan lewat slot, dan "Batal pilih".
 * Ia tidak tahu apa-apa soal tabelnya — halaman yang menghitung baris mana
 * yang memenuhi syarat tiap aksi, bar ini hanya menampilkannya.
 *
 * Diberi role="region" + aria-live supaya pembaca layar mendengar jumlah
 * pilihan berubah tanpa harus mencari barnya.
 */
withDefaults(
  defineProps<{
    /** Baris yang sedang dipilih. Bar disembunyikan saat nol. */
    count: number
    /** Kata benda jamak untuk ringkasan, mis. "produk", "transaksi". */
    itemNoun: string
    /** Ringkasan tambahan di sebelah jumlah, mis. "Total Rp1.200.000". */
    summary?: string
  }>(),
  { summary: '' },
)

defineEmits<{
  (e: 'clear'): void
}>()
</script>

<template>
  <div
    v-if="count > 0"
    role="region"
    aria-live="polite"
    aria-label="Aksi untuk baris yang dipilih"
    class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-primary/30 bg-primary-soft/30 px-4 py-3"
  >
    <p class="text-[0.86rem] text-ink">
      <span class="font-semibold tabular-nums">{{ count }}</span> {{ itemNoun }} dipilih<template v-if="summary">
        · <span class="font-semibold">{{ summary }}</span></template>
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <slot />
      <button
        type="button"
        class="inline-flex min-h-8 items-center gap-1.5 rounded-xs px-1 text-[0.82rem] font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="$emit('clear')"
      >
        <AppIcon name="x" :size="14" />
        Batal pilih
      </button>
    </div>
  </div>
</template>
