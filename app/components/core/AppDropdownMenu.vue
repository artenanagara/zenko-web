<script setup lang="ts">
import { useScrollLock } from '@artenanagara/zenko-design-system'
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
// An anchored panel is positioned against its trigger, so a page that scrolls
// underneath slides the panel away from the control it belongs to. The lock is
// the design system's, shared with AppModal, so a select opened inside a dialog
// does not unlock the page when it closes while the dialog is still up.
useScrollLock(isOpen)
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

    <!-- Floating Action Menu.
         Dibatasi tingginya dan bisa digulir: menu ini juga dipakai sebagai
         pemilih konteks dashboard, yang daftarnya sepanjang jumlah bimbel yang
         dikelola akun. Tanpa batas ini, akun dengan banyak bimbel mendapat
         panel yang menjulur melewati layar, dan entri terakhirnya — termasuk
         pintu ke "Bimbel saya" — tidak bisa dijangkau sama sekali. -->
    <div
      v-if="isOpen"
      class="absolute top-[calc(100%+6px)] z-50 max-h-[min(70vh,22rem)] w-full min-w-48 overflow-y-auto overscroll-contain rounded-md border border-line bg-surface p-1.5 shadow-float"
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
          <div class="flex min-w-0 items-center gap-2">
            <span v-if="item.dot" class="h-1.5 w-1.5 shrink-0 rounded-full" :class="DOT_COLORS[item.dot]" />
            <AppIcon v-if="item.icon" :name="item.icon" :size="14" />
            <!-- Nama bimbel datang dari penggunanya dan bisa sepanjang apa pun;
                 dipotong supaya panelnya tidak melebar mengikuti yang terpanjang. -->
            <span class="truncate">{{ item.label }}</span>
          </div>
          <span v-if="item.badge" class="ml-2 shrink-0 rounded bg-primary-soft px-1.5 py-0.2 text-[0.65rem] font-bold text-primary">{{ item.badge }}</span>
        </button>
      </template>
    </div>
  </div>
</template>
