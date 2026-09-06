<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id?: string
    label: string
    placeholder?: string
    hint?: string
    error?: string
    disabled?: boolean
    required?: boolean
    rows?: string | number
    maxlength?: string | number
  }>(),
  { rows: 4 },
)

const model = defineModel<string>({ required: true })
const generatedId = useId()
const textareaId = computed(() => props.id || `textarea-${generatedId}`)
const errorId = computed(() => `${textareaId.value}-error`)
const hintId = computed(() => `${textareaId.value}-hint`)

const describedBy = computed(() => {
  if (props.error) return errorId.value
  return props.hint ? hintId.value : undefined
})
</script>

<template>
  <div>
    <label :for="textareaId" :class="FIELD_LABEL_TEXT_CLASS" class="mb-2 block">
      {{ label }}
    </label>
    <textarea
      :id="textareaId"
      v-model="model"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :maxlength="maxlength"
      class="w-full resize-y rounded-sm border bg-surface px-3.5 py-2.5 text-[0.9rem] transition-[border-color,box-shadow] duration-200 ease-smooth placeholder:text-placeholder focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted"
      :class="error
        ? 'border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.16)]'
        : 'border-line focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]'"
      :aria-invalid="Boolean(error)"
      :aria-describedby="describedBy"
    />
    <p v-if="error" :id="errorId" class="mt-2 text-[0.82rem] text-red-600">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="mt-2 text-[0.82rem] text-muted">
      {{ hint }}
    </p>
  </div>
</template>
