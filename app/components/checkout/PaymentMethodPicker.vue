<script setup lang="ts">
import type { PaymentMethodId } from '#shared/types/order'

/**
 * Payment family picker.
 *
 * Deliberately its own component: gateways with a hosted checkout (Midtrans
 * Snap, Xendit Invoice) show their own picker, and then this one is redundant
 * and should be deleted rather than kept in sync. It earns its place only with
 * a direct-API integration, where Zenko chooses the channel.
 */
const model = defineModel<PaymentMethodId>({ required: true })

const methods: { id: PaymentMethodId, label: string, hint: string }[] = [
  { id: 'va', label: 'Transfer Virtual Account', hint: 'BCA, BNI, BRI, Mandiri, Permata' },
  { id: 'qris', label: 'QRIS', hint: 'Scan dari aplikasi bank atau e-wallet apa pun' },
  { id: 'ewallet', label: 'E-wallet', hint: 'GoPay, OVO, DANA, ShopeePay' },
  { id: 'card', label: 'Kartu kredit / debit', hint: 'Visa, Mastercard, JCB' },
]
</script>

<template>
  <fieldset>
    <legend class="mb-4 font-bold tracking-[-0.02em]">Metode pembayaran</legend>

    <div class="grid gap-2.5">
      <label
        v-for="method in methods"
        :key="method.id"
        class="flex cursor-pointer items-start gap-3.5 rounded-sm border bg-surface px-4 py-3.5 transition-[border-color,background] duration-200 ease-smooth"
        :class="
          model === method.id
            ? 'border-primary bg-primary-soft/40'
            : 'border-hairline-strong hover:border-primary/40'
        "
      >
        <input
          v-model="model"
          type="radio"
          name="payment-method"
          :value="method.id"
          class="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        >
        <span class="min-w-0">
          <span class="block font-semibold tracking-[-0.01em]">{{ method.label }}</span>
          <span class="mt-0.5 block text-[0.86rem] text-muted">{{ method.hint }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
