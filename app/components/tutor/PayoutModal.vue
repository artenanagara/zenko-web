<script setup lang="ts">
/**
 * "Cairkan" modal — same amount/validation logic payouts.vue already had,
 * just relocated from an always-visible panel into a popup. Uses the design
 * system's AppModal (Teleport + focus trap + Esc-to-close + backdrop click),
 * which cleanly covers everything the old hand-rolled native <dialog> did.
 */
const props = defineProps<{
  hasBankAccount: boolean
  availableBalance: number
  minimum: number
  amountError: string
  payoutError: string
  payoutSuccess: string
  submitting: boolean
  canSubmit: boolean
}>()

const emit = defineEmits<{ submit: [] }>()

const open = defineModel<boolean>('open', { required: true })
const amount = defineModel<number | null>('amount', { required: true })

const modalDescription = computed(() =>
  `Minimum ${formatRupiah(props.minimum)}. Saldo tersedia berkurang begitu pengajuan dibuat.`,
)
</script>

<template>
  <AppModal v-model="open" title="Ajukan pencairan" :description="modalDescription">
    <!-- No bank account yet: point at Settings instead of a dead form. -->
    <AppSectionMessage v-if="!hasBankAccount" appearance="warning">
      Simpan rekening bank terlebih dahulu — pencairan butuh rekening tujuan transfer.
      <NuxtLink to="/dashboard/tutor/settings#rekening" class="font-semibold underline hover:no-underline">
        Buka Pengaturan
      </NuxtLink>
    </AppSectionMessage>

    <form v-else class="grid gap-5" @submit.prevent="emit('submit')">
      <div>
        <label for="payout-amount" :class="FIELD_LABEL_CLASS">Nominal</label>
        <AppCurrencyField
          id="payout-amount"
          v-model="amount"
          placeholder="100.000"
          :ariaInvalid="Boolean(amountError)"
          :ariaDescribedby="amountError ? 'payout-amount-error' : undefined"
        />
        <AppInlineMessage v-if="amountError" id="payout-amount-error" type="error" class="mt-2">
          {{ amountError }}
        </AppInlineMessage>
        <p v-else class="mt-2 text-[0.82rem] text-muted">
          Saldo tersedia: {{ formatRupiah(availableBalance) }}
        </p>
      </div>

      <AppInlineMessage v-if="payoutError" type="error">{{ payoutError }}</AppInlineMessage>
      <AppInlineMessage v-else-if="payoutSuccess" type="confirmation">{{ payoutSuccess }}</AppInlineMessage>

      <div>
        <AppButton type="submit" size="sm" :disabled="!canSubmit">
          {{ submitting ? 'Mengajukan...' : 'Ajukan pencairan' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
