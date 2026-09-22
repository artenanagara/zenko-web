<script setup lang="ts">
import { useScrollLock } from '@artenanagara/zenko-design-system'
import type { ComponentPublicInstance } from 'vue'

/**
 * The marketplace's form dropdown: a label above a full-width trigger, so it
 * lines up with FormField and the raw `FIELD_CLASS` inputs it sits beside in
 * the tutor wizard.
 *
 * Built on the ARIA APG "select-only combobox" pattern rather than a bare
 * button + panel. Every screen that replaces a native `<select>` with this
 * component inherits what the native control gave away for free — open with
 * Enter/Space/Arrow, move with Arrow/Home/End, jump by first letter, close
 * with Escape, and focus staying on the trigger while `aria-activedescendant`
 * points at the highlighted option. The implementation is the same one the
 * design system's own AppSelect uses; this local copy exists (see
 * nuxt.config's `ignore` list) only for the marketplace's placeholder and
 * disabled treatment.
 *
 * Sibling components to reach for instead of this one:
 * - core/AppMenuSelect — toolbar control whose label lives *inside* the
 *   trigger ("Urutkan: Terbaru"). No label above, shrink-to-fit width.
 * - core/AppDropdownMenu — a menu of actions, not a value to pick.
 */
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
    /** Accessible name when the visible label lives outside this component. */
    ariaLabel?: string
    placeholder?: string
    disabled?: boolean
    /**
     * Marks the control as failing validation (`aria-invalid`). Kept as a plain
     * flag rather than an error string: the forms using this component already
     * render their own message, and a second one inside the field would say the
     * same thing twice.
     */
    invalid?: boolean
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

const uid = useId()
const listboxId = `${uid}-listbox`
const labelId = `${uid}-label`
const optionId = (index: number) => `${uid}-opt-${index}`

const rootRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const optionRefs = ref<(HTMLElement | null)[]>([])

const isOpen = ref(false)
// An anchored panel is positioned against its trigger, so a page that scrolls
// underneath slides the panel away from the control it belongs to. The lock is
// the design system's, shared with AppModal, so a select opened inside a dialog
// does not unlock the page when it closes while the dialog is still up.
useScrollLock(isOpen)
/** The visually highlighted option while open — not the committed value. */
const activeIndex = ref(-1)

const selectedIndex = computed(() => props.options.findIndex(o => o.value === props.modelValue))
const selectedOption = computed(() => props.options.find(o => o.value === props.modelValue))
const activeOptionId = computed(() => (isOpen.value && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined))

const setOptionRef = (el: Element | ComponentPublicInstance | null, index: number) => {
  optionRefs.value[index] = (el as HTMLElement | null)
}

const scrollActiveIntoView = () => {
  nextTick(() => {
    optionRefs.value[activeIndex.value]?.scrollIntoView({ block: 'nearest' })
  })
}

/**
 * Typeahead, the one native-`<select>` habit users notice missing: consecutive
 * presses of the same character cycle through its matches, any other character
 * starts a new search.
 */
let typeaheadChar = ''
let typeaheadMatchCursor = 0
let typeaheadTimer: ReturnType<typeof setTimeout> | null = null

const resetTypeahead = () => {
  typeaheadChar = ''
  typeaheadMatchCursor = 0
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  typeaheadTimer = null
}

const handleTypeahead = (char: string) => {
  const lower = char.toLowerCase()

  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  typeaheadTimer = setTimeout(resetTypeahead, 500)

  const matches = props.options
    .map((opt, index) => ({ opt, index }))
    .filter(({ opt }) => opt.label.trim().toLowerCase().startsWith(lower))

  if (!matches.length) return

  typeaheadMatchCursor = lower === typeaheadChar ? (typeaheadMatchCursor + 1) % matches.length : 0
  typeaheadChar = lower

  activeIndex.value = matches[typeaheadMatchCursor]!.index
  scrollActiveIntoView()
}

const openList = (initialIndex?: number) => {
  if (props.disabled) return
  resetTypeahead()
  isOpen.value = true
  // Start on the current choice — that is where the eye already is.
  activeIndex.value = initialIndex !== undefined ? initialIndex : (selectedIndex.value >= 0 ? selectedIndex.value : 0)
  scrollActiveIntoView()
}

const closeList = () => {
  isOpen.value = false
  activeIndex.value = -1
  resetTypeahead()
}

const toggleOpen = () => {
  if (props.disabled) return
  if (isOpen.value) closeList()
  else openList()
}

const commitActive = () => {
  const opt = props.options[activeIndex.value]
  if (opt) emit('update:modelValue', opt.value)
  closeList()
  buttonRef.value?.focus()
}

const select = (val: string | number) => {
  emit('update:modelValue', val)
  closeList()
}

const isPrintableChar = (key: string) => key.length === 1 && /\S/.test(key)

const onKeydown = (ev: KeyboardEvent) => {
  if (props.disabled) return
  const key = ev.key

  if (!isOpen.value) {
    if (key === 'Enter' || key === ' ' || key === 'ArrowDown') {
      ev.preventDefault()
      openList(selectedIndex.value >= 0 ? selectedIndex.value : 0)
      return
    }
    if (key === 'ArrowUp') {
      ev.preventDefault()
      openList(selectedIndex.value >= 0 ? selectedIndex.value : props.options.length - 1)
      return
    }
    if (isPrintableChar(key)) {
      ev.preventDefault()
      openList(0)
      handleTypeahead(key)
    }
    return
  }

  switch (key) {
    case 'Enter':
    case ' ':
      ev.preventDefault()
      commitActive()
      break
    case 'Escape':
      ev.preventDefault()
      closeList()
      break
    case 'ArrowDown':
      ev.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, props.options.length - 1)
      scrollActiveIntoView()
      break
    case 'ArrowUp':
      ev.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, 0)
      scrollActiveIntoView()
      break
    case 'Home':
      ev.preventDefault()
      activeIndex.value = 0
      scrollActiveIntoView()
      break
    case 'End':
      ev.preventDefault()
      activeIndex.value = props.options.length - 1
      scrollActiveIntoView()
      break
    case 'Tab':
      // No preventDefault — let focus move on normally, just do not leave a
      // panel hanging open behind it.
      closeList()
      break
    default:
      if (isPrintableChar(key)) {
        ev.preventDefault()
        handleTypeahead(key)
      }
  }
}

const closeOnClickOutside = (ev: MouseEvent) => {
  if (rootRef.value && !rootRef.value.contains(ev.target as Node)) closeList()
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
  resetTypeahead()
})

const sizes = {
  sm: 'h-9 px-3 text-xs',
  md: 'min-h-11 px-3.5 text-xs sm:text-sm',
  lg: 'min-h-13 px-4 text-sm',
}

/**
 * `size` already says whether this is a toolbar control or a form field, so
 * the label follows it instead of adding a second prop to keep in sync:
 * `sm` keeps the compact toolbar label (matching AppTextField beside it),
 * `md`/`lg` use the same 14.4px/600 label as FormField and FIELD_LABEL_CLASS
 * so one form does not show two label sizes.
 */
const isCompact = computed(() => props.size === 'sm')
</script>

<template>
  <div
    ref="rootRef"
    class="relative flex w-full flex-col text-left"
    :class="isCompact ? 'gap-1.5' : 'gap-2'"
  >
    <!-- No `for`: this labels a <button>, which `for` cannot target, so the
         trigger claims it through aria-labelledby instead. -->
    <label
      v-if="label"
      :id="labelId"
      :class="isCompact ? COMPACT_FIELD_LABEL_TEXT_CLASS : FIELD_LABEL_TEXT_CLASS"
    >{{ label }}</label>

    <!-- Trigger (ARIA APG "select-only combobox"). -->
    <button
      ref="buttonRef"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      :aria-activedescendant="activeOptionId"
      :aria-labelledby="label ? labelId : undefined"
      :aria-label="!label ? ariaLabel : undefined"
      :aria-invalid="invalid || undefined"
      :disabled="disabled"
      class="flex w-full cursor-pointer items-center justify-between rounded-xs border border-line bg-surface py-2 text-ink shadow-xs transition-all hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      :class="[
        sizes[size],
        isOpen ? 'border-primary ring-2 ring-primary-soft' : '',
      ]"
      @click="toggleOpen"
      @keydown="onKeydown"
    >
      <div class="flex items-center gap-2 truncate pr-2">
        <span v-if="selectedOption" class="truncate font-semibold text-ink">{{ selectedOption.label }}</span>
        <span v-else class="truncate text-placeholder">{{ placeholder }}</span>
      </div>

      <AppIcon
        name="caret-down"
        :size="14"
        class="shrink-0 text-muted transition-transform duration-200"
        :class="isOpen ? 'rotate-180 text-primary' : ''"
      />
    </button>

    <!-- Options are <div role="option">, not buttons: focus stays on the
         combobox and aria-activedescendant carries the highlight, which is
         what lets one keydown handler own the whole list. -->
    <div
      v-if="isOpen"
      :id="listboxId"
      role="listbox"
      :aria-labelledby="label ? labelId : undefined"
      :aria-label="!label ? ariaLabel : undefined"
      class="absolute top-[calc(100%+4px)] left-0 z-50 max-h-64 w-full overflow-y-auto overscroll-contain rounded-md border border-line bg-surface p-1 shadow-float"
    >
      <div
        v-for="(opt, index) in options"
        :id="optionId(index)"
        :key="opt.value"
        :ref="el => setOptionRef(el, index)"
        role="option"
        :aria-selected="opt.value === modelValue"
        class="flex w-full cursor-pointer items-center justify-between rounded-xs px-3 py-2.5 text-left text-xs font-medium transition-colors"
        :class="[
          opt.value === modelValue ? 'bg-primary-soft font-bold text-primary' : 'text-ink',
          index === activeIndex ? 'bg-surface-alt' : '',
        ]"
        @click="select(opt.value)"
        @mousemove="activeIndex = index"
      >
        <div class="pr-2">
          <div class="flex items-center gap-2">
            <span>{{ opt.label }}</span>
            <span v-if="opt.badge" class="rounded bg-primary/10 px-1.5 py-0.2 text-[0.65rem] font-bold text-primary">{{ opt.badge }}</span>
          </div>
          <div v-if="opt.description" class="mt-0.5 text-[0.7rem] font-normal text-muted">{{ opt.description }}</div>
        </div>

        <AppIcon
          v-if="opt.value === modelValue"
          name="check"
          :size="14"
          class="shrink-0 text-primary"
          weight="bold"
        />
      </div>
    </div>
  </div>
</template>
