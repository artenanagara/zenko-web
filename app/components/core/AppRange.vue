<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    label?: string
    disabled?: boolean
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void
}>()

const percentage = computed(() => {
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100
})
</script>

<template>
  <div class="flex flex-col gap-2.5 w-full select-none">
    <div v-if="label || $slots.label" class="flex items-center justify-between text-xs">
      <span class="font-bold text-ink">{{ label }}</span>
      <span class="font-mono font-extrabold text-primary bg-primary-soft px-2 py-0.5 rounded-xs">
        {{ modelValue }}
      </span>
    </div>

    <!-- Custom Styled Track & Range Input -->
    <div class="relative flex items-center py-2">
      <!-- Visible Base Track Line -->
      <div class="h-2.5 w-full rounded-full bg-slate-200 border border-slate-300/80 overflow-hidden">
        <!-- Active Progress Fill -->
        <div
          class="h-full bg-linear-to-r from-primary to-primary-light rounded-full transition-all duration-75"
          :style="{ width: `${percentage}%` }"
        />
      </div>

      <!-- Native Range with Transparent Track for Smooth Dragging -->
      <input
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        :disabled="disabled"
        class="absolute inset-0 h-full w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      >

      <!-- Custom Thumb Indicator -->
      <div
        class="pointer-events-none absolute h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-primary shadow-md transition-transform duration-75"
        :style="{ left: `${percentage}%` }"
      />
    </div>

    <div class="flex justify-between text-[0.68rem] font-mono text-muted">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>
  </div>
</template>
