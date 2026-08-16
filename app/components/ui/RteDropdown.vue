<script setup lang="ts">
/**
 * Toolbar dropdown shared by RichTextEditor's tautan/rumus/gambar popovers:
 * a trigger button plus an absolutely-positioned panel that closes on
 * outside click, Escape, or its own close button — none of which the
 * previous ad-hoc popovers had, so they stayed open no matter what you did
 * short of finishing the form.
 */
const props = defineProps<{
  modelValue: boolean
  title: string
  /** Panel width in px — panels stack their contents vertically rather than growing wide, so this stays narrow. */
  width?: number
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const root = ref<HTMLElement | null>(null)
const panelWidth = computed(() => props.width ?? 260)
/**
 * Whether the panel would overflow the viewport's right edge if hung off the
 * trigger's left edge (the normal case) — checked against the trigger itself,
 * not the panel, so this is known before the panel's first paint and there's
 * no flip-after-render flash.
 */
const alignRight = ref(false)

function close() {
  emit('update:modelValue', false)
}

function onDocumentMousedown(event: MouseEvent) {
  if (!props.modelValue) return
  if (root.value && !root.value.contains(event.target as Node)) close()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (props.modelValue && event.key === 'Escape') close()
}

watch(() => props.modelValue, (open) => {
  if (!open || !root.value) return
  const rect = root.value.getBoundingClientRect()
  alignRight.value = rect.left + panelWidth.value > window.innerWidth - 12
})

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMousedown)
  document.addEventListener('keydown', onDocumentKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMousedown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <span ref="root" class="relative inline-flex">
    <slot name="trigger" />
    <div
      v-if="modelValue"
      class="absolute top-full z-20 mt-1.5 grid gap-3 rounded-md border border-hairline-strong bg-surface p-3 shadow-lift"
      :class="alignRight ? 'right-0' : 'left-0'"
      :style="{ width: `${panelWidth}px` }"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-[0.88rem] font-bold tracking-[-0.01em]">{{ title }}</span>
        <button type="button" class="rte-dropdown-close" title="Tutup" @click="close">
          <IconClose class="h-3.5 w-3.5" />
        </button>
      </div>
      <slot name="panel" />
    </div>
  </span>
</template>

<style scoped>
.rte-dropdown-close {
  display: inline-flex;
  height: 1.5rem;
  width: 1.5rem;
  shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  color: var(--color-muted);
  transition: background-color 0.15s ease, color 0.15s ease;
}
.rte-dropdown-close:hover {
  background: var(--color-surface-alt);
  color: var(--color-ink);
}
</style>
