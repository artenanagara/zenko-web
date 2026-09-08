<script setup lang="ts">
import type { PaymentChannel } from '#shared/types/account'

/**
 * Pilihan metode pembayaran di halaman checkout.
 *
 * Perbedaan kedua jalur ini bagi pembeli bukan soal teknis melainkan soal
 * waktu: yang satu membuka paket begitu pembayaran masuk, yang lain menunggu
 * admin mencocokkan mutasi. Karena itu janji waktunya ditulis pada tiap
 * pilihan, bukan disembunyikan di halaman berikutnya — pembeli yang memilih
 * manual tanpa tahu ia harus menunggu akan mengira pesanannya gagal.
 *
 * `upcoming` adalah jalur yang sudah diumumkan tapi belum hidup. Ia digambar
 * sebagai baris mati berlabel "Segera", bukan disembunyikan: pembeli yang
 * sedang menimbang transfer manual berhak tahu bahwa pembayaran seketika
 * memang sedang disiapkan. Radionya benar-benar `disabled`, jadi tidak ada
 * jalan memilih sesuatu yang akan ditolak server — daftar yang boleh dipilih
 * tetap satu-satunya kebenaran.
 */

const props = defineProps<{
  channels: PaymentChannel[]
  upcoming?: PaymentChannel[]
  modelValue: PaymentChannel | null
}>()

const emit = defineEmits<{ 'update:modelValue': [PaymentChannel] }>()

const options = computed(() =>
  props.channels.map(channel => ({ channel, ...paymentChannelCopy(channel) })),
)

const upcomingOptions = computed(() =>
  (props.upcoming ?? []).map(channel => ({ channel, ...paymentChannelCopy(channel) })),
)
</script>

<template>
  <fieldset class="grid gap-3">
    <legend class="sr-only">Metode pembayaran</legend>

    <label
      v-for="option in options"
      :key="option.channel"
      class="flex cursor-pointer items-start gap-3.5 rounded-sm border px-4 py-3.5 transition-colors"
      :class="modelValue === option.channel
        ? 'border-primary bg-primary-soft/40'
        : 'border-hairline-strong bg-surface hover:bg-surface-alt'"
    >
      <input
        type="radio"
        name="payment-channel"
        class="mt-1 h-4 w-4 shrink-0 accent-primary"
        :value="option.channel"
        :checked="modelValue === option.channel"
        @change="emit('update:modelValue', option.channel)"
      >
      <span class="min-w-0">
        <span class="block font-semibold tracking-[-0.01em]">{{ option.label }}</span>
        <span class="mt-0.5 block text-[0.86rem] text-muted">{{ option.hint }}</span>
        <span class="mt-1.5 block text-[0.82rem] font-medium text-ink/70">{{ option.timing }}</span>
      </span>
    </label>

    <!-- Belum hidup. Dibuat jelas mati — kursor, warna, dan atribut disabled
         sekaligus — supaya tidak ada yang mencoba menekannya lalu bertanya
         kenapa tidak terjadi apa-apa. -->
    <label
      v-for="option in upcomingOptions"
      :key="option.channel"
      class="flex cursor-not-allowed items-start gap-3.5 rounded-sm border border-dashed border-hairline-strong bg-surface-alt px-4 py-3.5 opacity-70"
    >
      <input
        type="radio"
        name="payment-channel"
        class="mt-1 h-4 w-4 shrink-0"
        disabled
      >
      <span class="min-w-0">
        <span class="flex flex-wrap items-center gap-2">
          <span class="font-semibold tracking-[-0.01em] text-muted">{{ option.label }}</span>
          <span class="rounded-full bg-hairline-strong px-2 py-0.5 text-[0.7rem] font-bold tracking-wide text-ink/70 uppercase">
            Segera
          </span>
        </span>
        <span class="mt-0.5 block text-[0.86rem] text-muted">{{ option.hint }}</span>
        <span class="mt-1.5 block text-[0.82rem] text-muted">
          Sedang disiapkan — sementara ini pakai transfer QRIS manual di atas.
        </span>
      </span>
    </label>
  </fieldset>
</template>
