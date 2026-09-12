<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id?: string
    label: string
    type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'datetime-local'
    placeholder?: string
    autocomplete?: string
    hint?: string
    error?: string
    disabled?: boolean
    required?: boolean
    min?: string | number
    max?: string | number
    step?: string | number
  }>(),
  { type: 'text' },
)

const model = defineModel<string | number>({ required: true })
const generatedId = useId()
const inputId = computed(() => props.id || `input-${generatedId}`)
const errorId = computed(() => `${inputId.value}-error`)
const hintId = computed(() => `${inputId.value}-hint`)

const describedBy = computed(() => {
  if (props.error) return errorId.value
  return props.hint ? hintId.value : undefined
})

const inputMode = computed(() => {
  if (props.type === 'number' || props.type === 'tel') return 'numeric'
  if (props.type === 'email') return 'email'
  if (props.type === 'url') return 'url'
  return undefined
})

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (props.type === 'number') {
    model.value = input.value === '' ? '' : input.valueAsNumber
    return
  }
  if (props.type === 'tel') {
    const digitsOnly = input.value.replace(/\D/g, '')
    model.value = digitsOnly
    if (input.value !== digitsOnly) input.value = digitsOnly
    return
  }
  model.value = input.value
}
</script>

<template>
  <div>
    <label :for="inputId" :class="FIELD_LABEL_TEXT_CLASS" class="mb-2 block">
      {{ label }}
    </label>
    <input
      :id="inputId"
      :value="model"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :required="required"
      :min="min"
      :max="max"
      :step="step"
      :inputmode="inputMode"
      class="w-full rounded-sm border bg-surface px-3.5 py-2.5 text-[0.9rem] transition-[border-color,box-shadow] duration-200 ease-smooth placeholder:text-placeholder focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted"
      :class="error
        ? 'border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.16)]'
        : 'border-line focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]'"
      :aria-invalid="Boolean(error)"
      :aria-describedby="describedBy"
      @input="onInput"
    >
    <p v-if="error" :id="errorId" class="mt-2 text-[0.82rem] text-red-600">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="mt-2 text-[0.82rem] text-muted">
      {{ hint }}
    </p>
  </div>
</template>
