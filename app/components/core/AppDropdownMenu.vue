<script setup lang="ts">
export interface MenuItem {
  id: string
  label: string
  icon?: string
  badge?: string
  /** Small colored status dot before the label — same vocabulary as AppBadge's variants. */
  dot?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  danger?: boolean
  divider?: boolean
}

const DOT_COLORS: Record<NonNullable<MenuItem['dot']>, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-muted',
}

const props = withDefaults(
  defineProps<{
    items: MenuItem[]
    label?: string
    align?: 'left' | 'right'
  }>(),
  {
    label: 'Menu Aksi',
    align: 'left',
  },
)

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const handleSelect = (id: string) => {
  emit('select', id)
  isOpen.value = false
}

const closeOnClickOutside = (ev: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(ev.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('click', closeOnClickOutside)
})
onUnmounted(() => {
  if (typeof window !== 'undefined') window.removeEventListener('click', closeOnClickOutside)
})
</script>

<template>
  <div ref="menuRef" class="relative inline-block text-left">
    <!-- Trigger Button Slot or Default -->
    <slot name="trigger" :open="() => isOpen = !isOpen" :is-open="isOpen">
      <AppButton variant="outline" size="sm" @click="isOpen = !isOpen">
        <span>{{ label }}</span>
        <AppIcon name="caret-down" :size="12" class="transition-transform" :class="isOpen ? 'rotate-180' : ''" />
      </AppButton>
    </slot>

    <!-- Floating Action Menu -->
    <div
      v-if="isOpen"
      class="absolute top-[calc(100%+6px)] z-50 w-full min-w-48 rounded-md border border-line bg-surface p-1.5 shadow-float"
      :class="align === 'right' ? 'right-0' : 'left-0'"
    >
      <template v-for="item in items" :key="item.id">
        <div v-if="item.divider" class="my-1 border-t border-line" />
        <button
          v-else
          type="button"
          class="flex w-full items-center justify-between rounded-xs px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer"
          :class="[
            item.danger
              ? 'text-red-600 hover:bg-red-50'
              : 'text-ink hover:bg-surface-alt hover:text-primary',
          ]"
          @click="handleSelect(item.id)"
        >
          <div class="flex items-center gap-2">
            <span v-if="item.dot" class="h-1.5 w-1.5 shrink-0 rounded-full" :class="DOT_COLORS[item.dot]" />
            <AppIcon v-if="item.icon" :name="item.icon" :size="14" />
            <span>{{ item.label }}</span>
          </div>
          <span v-if="item.badge" class="rounded bg-primary-soft px-1.5 py-0.2 text-[0.65rem] font-bold text-primary">{{ item.badge }}</span>
        </button>
      </template>
    </div>
  </div>
</template>
