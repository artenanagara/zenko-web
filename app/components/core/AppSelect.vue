<script setup lang="ts">
export interface SelectOption {
  value: string | number
  label: string
  description?: string
  badge?: string
}

const props = withDefaults(
  defineProps<{
    options: SelectOption[]
    modelValue?: string | number
    label?: string
    placeholder?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    placeholder: 'Pilih opsi...',
    disabled: false,
    size: 'md',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | number): void
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const selectedOption = computed(() => props.options.find(o => o.value === props.modelValue))

const select = (val: string | number) => {
  emit('update:modelValue', val)
  isOpen.value = false
}

// Close dropdown on click outside
const closeOnClickOutside = (ev: MouseEvent) => {
  if (triggerRef.value && !triggerRef.value.contains(ev.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', closeOnClickOutside)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', closeOnClickOutside)
  }
})

const sizes = {
  sm: 'h-9 px-3 text-xs',
  md: 'min-h-11 px-3.5 text-xs sm:text-sm',
  lg: 'min-h-13 px-4 text-sm',
}
</script>

<template>
  <div ref="triggerRef" class="relative flex flex-col gap-1.5 w-full text-left">
    <label v-if="label" class="text-xs font-bold text-ink">{{ label }}</label>

    <!-- Custom Select Trigger -->
    <button
      type="button"
      :disabled="disabled"
      class="flex w-full items-center justify-between rounded-xs border border-line bg-surface py-2 text-ink shadow-xs transition-all hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      :class="[
        sizes[size],
        isOpen ? 'border-primary ring-2 ring-primary-soft' : '',
      ]"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-2 truncate pr-2">
        <span v-if="selectedOption" class="font-semibold text-ink">{{ selectedOption.label }}</span>
        <span v-else class="text-placeholder">{{ placeholder }}</span>
      </div>

      <AppIcon
        name="caret-down"
        :size="14"
        class="text-muted transition-transform duration-200 shrink-0"
        :class="isOpen ? 'rotate-180 text-primary' : ''"
      />
    </button>

    <!-- Custom Dropdown Menu (High Z-Index & Elevation) -->
    <div
      v-if="isOpen"
      class="absolute top-[calc(100%+4px)] left-0 z-50 max-h-64 w-full overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-float"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="flex w-full items-center justify-between rounded-xs px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-surface-alt cursor-pointer"
        :class="modelValue === opt.value ? 'bg-primary-soft text-primary font-bold' : 'text-ink'"
        @click="select(opt.value)"
      >
        <div class="pr-2">
          <div class="flex items-center gap-2">
            <span>{{ opt.label }}</span>
            <span v-if="opt.badge" class="rounded bg-primary/10 px-1.5 py-0.2 text-[0.65rem] font-bold text-primary">{{ opt.badge }}</span>
          </div>
          <div v-if="opt.description" class="text-[0.7rem] text-muted font-normal mt-0.5">{{ opt.description }}</div>
        </div>

        <AppIcon
          v-if="modelValue === opt.value"
          name="check"
          :size="14"
          class="text-primary shrink-0"
          weight="bold"
        />
      </button>
    </div>
  </div>
</template>
