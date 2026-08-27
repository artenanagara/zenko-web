<script setup lang="ts">
interface TutorProfileTab {
  id: string
  label: string
  /** Hidden when undefined — a "0" badge reads as broken, not as empty. */
  count?: number
}

/**
 * The Produk / Tentang / Ulasan switcher on /tutor/:username.
 *
 * A real tablist (not the toggle-group SortTabs renders): each button owns a
 * tabpanel, so the WAI-ARIA keyboard contract applies — one tab stop for the
 * whole strip (roving tabindex) and Arrow/Home/End to move between tabs.
 * Keyboard logic follows the design system's AppTabs; only the skin differs,
 * so the strip matches the .tab-track pill used elsewhere in the marketplace.
 *
 * Placement is the caller's job (the page makes it sticky) — this renders the
 * track only.
 */
const props = defineProps<{ tabs: TutorProfileTab[], ariaLabel?: string }>()
const model = defineModel<string>({ required: true })

const tabRefs = ref<Record<string, HTMLButtonElement | undefined>>({})

function setTabRef(id: string, el: unknown) {
  tabRefs.value[id] = (el as HTMLButtonElement) || undefined
}

function select(id: string, focus = true) {
  model.value = id
  if (focus) tabRefs.value[id]?.focus()
}

function onKeydown(event: KeyboardEvent) {
  const ids = props.tabs.map(tab => tab.id)
  const current = ids.indexOf(model.value)
  if (current === -1) return

  const target
    = event.key === 'ArrowRight'
      ? ids[(current + 1) % ids.length]
      : event.key === 'ArrowLeft'
        ? ids[(current - 1 + ids.length) % ids.length]
        : event.key === 'Home'
          ? ids[0]
          : event.key === 'End'
            ? ids[ids.length - 1]
            : undefined

  if (!target) return
  event.preventDefault()
  select(target)
}
</script>

<template>
  <!-- `-mb-px` pulls each tab's own bottom border down onto the strip's rule
       (the sticky wrapper draws it), so the active underline sits on that line
       rather than a pixel above it.
       Scrolls sideways on narrow screens instead of wrapping into two rows,
       which would change the sticky strip's height mid-scroll. -->
  <div
    role="tablist"
    :aria-label="ariaLabel || 'Bagian profil tutor'"
    class="-mb-px flex max-w-full items-center gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    @keydown="onKeydown"
  >
    <button
      v-for="tab in props.tabs"
      :id="`tutor-tab-${tab.id}`"
      :key="tab.id"
      :ref="el => setTabRef(tab.id, el)"
      type="button"
      role="tab"
      :aria-selected="model === tab.id"
      :aria-controls="`tutor-panel-${tab.id}`"
      :tabindex="model === tab.id ? 0 : -1"
      class="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 border-b-2 pb-3 font-semibold tracking-[-0.01em] transition-[color,border-color] duration-200 ease-smooth"
      :class="
        model === tab.id
          ? 'border-primary text-primary'
          : 'border-transparent text-muted hover:border-line hover:text-ink'
      "
      @click="select(tab.id, false)"
    >
      {{ tab.label }}
      <span
        v-if="tab.count !== undefined && tab.count > 0"
        class="rounded-pill px-1.5 py-0.5 text-[0.72rem] font-bold tabular-nums"
        :class="model === tab.id ? 'bg-primary-soft text-primary' : 'bg-surface-sunken text-muted'"
      >{{ tab.count }}</span>
    </button>
  </div>
</template>
