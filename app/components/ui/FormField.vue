<script setup lang="ts">
/**
 * Labelled text input with error handling. Password fields get a
 * show/hide toggle automatically.
 *
 * The error message is wired to the input through aria-describedby, so screen
 * readers announce it instead of leaving the field silently red.
 */
const props = withDefaults(
  defineProps<{
    id: string
    label: string
    type?: 'text' | 'email' | 'password' | 'tel' | 'url'
    placeholder?: string
    autocomplete?: string
    error?: string
    hint?: string
  }>(),
  { type: 'text' },
)

const model = defineModel<string>({ required: true })

const showPassword = ref(false)

const isPassword = computed(() => props.type === 'password')
const resolvedType = computed(() =>
  isPassword.value && showPassword.value ? 'text' : props.type,
)

/**
 * Nudges mobile keyboards toward the right layout per field type. `tel`
 * gets the pure digit pad (`numeric`), not the phone-style one (`tel`,
 * which includes `+`/`*`/`#`) — every `type="tel"` field in this app is a
 * WhatsApp number or a bank account number, always digits-only.
 */
const INPUT_MODES = { email: 'email', tel: 'numeric', url: 'url' } as const

const inputMode = computed(() =>
  INPUT_MODES[props.type as keyof typeof INPUT_MODES] ?? undefined,
)

/**
 * `type="tel"` accepts any character natively (it exists for phone-number
 * *formatting*, not digit validation) — strip non-digits as they're typed
 * rather than only at submit time.
 */
function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (props.type !== 'tel') {
    model.value = input.value
    return
  }
  const digitsOnly = input.value.replace(/\D/g, '')
  model.value = digitsOnly
  if (input.value !== digitsOnly) input.value = digitsOnly
}

const errorId = computed(() => `${props.id}-error`)
const hintId = computed(() => `${props.id}-hint`)
const describedBy = computed(() => {
  if (props.error) return errorId.value
  return props.hint ? hintId.value : undefined
})
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-between gap-3">
      <label :for="id" class="text-[0.9rem] font-semibold">{{ label }}</label>
      <slot name="action" />
    </div>

    <div class="relative">
      <input
        :id="id"
        :value="model"
        :type="resolvedType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :inputmode="inputMode"
        class="w-full rounded-sm border bg-surface py-2.5 pl-3.5 text-[0.9rem] transition-[border-color,box-shadow] duration-200 ease-smooth placeholder:text-placeholder focus:outline-none"
        :class="[
          isPassword ? 'pr-12' : 'pr-3.5',
          error
            ? 'border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.16)]'
            : 'border-line focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]',
        ]"
        :aria-invalid="Boolean(error)"
        :aria-describedby="describedBy"
        @input="onInput"
      >

      <button
        v-if="isPassword"
        type="button"
        class="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-sm text-muted transition-colors hover:text-ink"
        :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
        :aria-pressed="showPassword"
        @click="showPassword = !showPassword"
      >
        <IconEye :off="showPassword" class="h-5 w-5" />
      </button>
    </div>

    <slot name="below" />

    <p v-if="error" :id="errorId" class="mt-2 text-[0.82rem] text-red-600">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="mt-2 text-[0.82rem] text-muted">
      {{ hint }}
    </p>
  </div>
</template>
