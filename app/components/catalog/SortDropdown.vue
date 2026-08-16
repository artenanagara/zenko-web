<script setup lang="ts">
import type { SortKey, SortOption } from '#shared/types/catalog'

/**
 * Sort control for the catalogue. Built by hand rather than on <select> so the
 * trigger and panel carry the same treatment as the rest of the page.
 *
 * Follows the menu pattern: the options are <button role="menuitemradio">, so
 * Enter and Space select natively and only the arrow keys, Escape and Tab need
 * handling. Focus moves onto the options while open and returns to the trigger
 * when it closes by keyboard.
 */
const model = defineModel<SortKey>({ required: true })

const options: SortOption[] = [
  { key: 'featured', label: 'Pilihan' },
  { key: 'bestseller', label: 'Terlaris' },
  { key: 'newest', label: 'Terbaru' },
]

const open = ref(false)
const root = useTemplateRef('root')
const trigger = useTemplateRef('trigger')
const menu = useTemplateRef('menu')
const menuId = useId()

const current = computed(
  () => options.find((option) => option.key === model.value) ?? options[0]!,
)

function items(): HTMLElement[] {
  return [...(menu.value?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])]
}

/** Wraps around, so ArrowUp from the first option lands on the last. */
function focusOption(index: number) {
  const all = items()
  if (all.length === 0) return
  all[((index % all.length) + all.length) % all.length]?.focus()
}

async function openMenu() {
  open.value = true
  await nextTick()
  // Start on the current choice — that is where the eye already is.
  focusOption(options.findIndex((option) => option.key === model.value))
}

function close(returnFocus = true) {
  if (!open.value) return
  open.value = false
  if (returnFocus) trigger.value?.focus()
}

function select(key: SortKey) {
  model.value = key
  close()
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

  event.preventDefault()
  if (open.value) focusOption(event.key === 'ArrowDown' ? 0 : items().length - 1)
  else openMenu()
}

function onMenuKeydown(event: KeyboardEvent) {
  const index = items().indexOf(document.activeElement as HTMLElement)

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusOption(index + 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusOption(index - 1)
      break
    case 'Home':
      event.preventDefault()
      focusOption(0)
      break
    case 'End':
      event.preventDefault()
      focusOption(items().length - 1)
      break
    case 'Escape':
      event.preventDefault()
      close()
      break
    case 'Tab':
      // Let focus leave naturally; just do not leave a panel hanging open.
      close(false)
      break
  }
}

function onPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close(false)
}

// Bound only while open, so a closed dropdown costs nothing.
watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onPointerDown)
  else document.removeEventListener('pointerdown', onPointerDown)
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
</script>

<template>
  <div ref="root" class="relative">
    <button
      ref="trigger"
      type="button"
      class="inline-flex min-h-11 items-center gap-2.5 rounded-xs border border-hairline-strong bg-surface pr-3.5 pl-4 font-medium shadow-xs transition-[border-color,box-shadow] duration-200 ease-smooth hover:border-primary/40"
      :aria-expanded="open"
      :aria-controls="menuId"
      aria-haspopup="true"
      @click="open ? close() : openMenu()"
      @keydown="onTriggerKeydown"
    >
      <span class="text-muted">Urutkan</span>
      <span class="font-semibold tracking-[-0.01em]">{{ current.label }}</span>
      <IconChevron
        class="h-4 w-4 shrink-0 text-faint transition-transform duration-200 ease-smooth"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-smooth"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100 ease-smooth"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-show="open"
        :id="menuId"
        ref="menu"
        class="absolute right-0 z-30 mt-2 w-52 rounded-md border border-hairline bg-surface p-1.5 shadow-float"
        role="menu"
        aria-label="Urutkan daftar paket"
        @keydown="onMenuKeydown"
      >
        <button
          v-for="option in options"
          :key="option.key"
          type="button"
          role="menuitemradio"
          :aria-checked="model === option.key"
          tabindex="-1"
          class="flex w-full items-center justify-between gap-3 rounded-xs px-3.5 py-2.5 text-left transition-colors duration-200 hover:bg-surface-alt"
          :class="model === option.key ? 'font-semibold text-primary' : 'text-muted'"
          @click="select(option.key)"
        >
          {{ option.label }}
          <IconCheck v-if="model === option.key" class="h-4 w-4 shrink-0 text-primary" />
        </button>
      </div>
    </Transition>
  </div>
</template>
