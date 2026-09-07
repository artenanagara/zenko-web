<script setup lang="ts">
import type { Purchase } from '#shared/types/account'
import type { PaymentProofPayload } from './PaymentProofFields.vue'

/**
 * Konfirmasi pembayaran untuk pesanan paket milik siswa.
 *
 * Isiannya milik PaymentProofFields, yang dipakai bersama tagihan langganan
 * bimbel; komponen ini hanya menghubungkannya ke `useCheckout().confirmPayment`
 * dan ke nominal yang seharusnya dibayar pesanan ini — angka bulat plus kode
 * uniknya, bukan harga paketnya saja.
 *
 * Dirender di dalam dialog yang dibuka tombol "Saya sudah transfer", jadi judul
 * dan kalimat pembukanya milik dialog itu.
 */

const props = defineProps<{ purchase: Purchase }>()
const emit = defineEmits<{ confirmed: [Purchase] }>()

const { error: checkoutError, confirmPayment } = useCheckout()

const submitting = ref(false)
const expectedAmount = computed(() => manualTransferBreakdown(props.purchase).total)

async function onSubmit(payload: PaymentProofPayload) {
  submitting.value = true
  const updated = await confirmPayment(props.purchase.invoice, payload)
  submitting.value = false

  // Pesanan yang dikembalikan server sudah berstatus verifying. Halaman induk
  // yang memutuskan apa yang tampil sesudahnya.
  if (updated) emit('confirmed', updated)
}
</script>

<template>
  <PaymentProofFields
    :expected-amount="expectedAmount"
    :error="checkoutError"
    :submitting="submitting"
    @submit="onSubmit"
  />
</template>
