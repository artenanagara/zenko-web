<script setup lang="ts">
/**
 * Rupiah amount input — "Rp" prefix baked into the field (not just the
 * label), live id-ID thousand-separator grouping as you type, digit-only
 * entry (non-digit keystrokes are stripped, not merely validated after the
 * fact). v-model is always the plain integer rupiah value — or null when
 * empty — never the formatted display string.
 */
const modelValue = defineModel<number | null>({ required: true })

defineProps<{
  id?: string
  placeholder?: string
  ariaDescribedby?: string
  ariaInvalid?: boolean
  disabled?: boolean
}>()

const displayValue = computed(() =>
  modelValue.value === null ? '' : modelValue.value.toLocaleString('id-ID'),
)

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digitsOnly = input.value.replace(/\D/g, '')
  modelValue.value = digitsOnly === '' ? null : Number(digitsOnly)
  // Re-sync manually: the browser already shows the raw keystroke, but the
  // next render only re-formats if `displayValue` actually changes — typing
  // a leading zero or a non-digit needs the field to snap back even when
  // the resulting number is unchanged.
  if (input.value !== displayValue.value) input.value = displayValue.value
}
</script>

<template>
  <div
    class="flex items-stretch overflow-hidden rounded-sm border border-line bg-surface transition-[border-color,box-shadow] duration-200 ease-smooth focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]"
    :class="disabled && 'bg-surface-sunken'"
  >
    <span class="flex shrink-0 items-center border-r border-line bg-surface-alt px-3.5 font-semibold text-muted">Rp</span>
    <input
      :id="id"
      type="text"
      inputmode="numeric"
      :value="displayValue"
      :placeholder="placeholder"
      :aria-describedby="ariaDescribedby"
      :aria-invalid="ariaInvalid"
      :disabled="disabled"
      class="w-full min-w-0 bg-transparent px-4 py-3 tabular-nums placeholder:text-placeholder focus:outline-none disabled:cursor-not-allowed disabled:text-muted"
      @input="onInput"
    >
  </div>
</template>
