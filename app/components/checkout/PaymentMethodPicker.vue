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
 */

const props = defineProps<{
  channels: PaymentChannel[]
  modelValue: PaymentChannel | null
}>()

const emit = defineEmits<{ 'update:modelValue': [PaymentChannel] }>()

const options = computed(() =>
  props.channels.map(channel => ({ channel, ...paymentChannelCopy(channel) })),
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
        : 'border-hairline-strong bg-surface hover:border-hairline-strong hover:bg-surface-alt'"
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
  </fieldset>
</template>
