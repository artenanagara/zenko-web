<script setup lang="ts">
import type { DashboardNav, DashboardNavItem } from '~/composables/useDashboardNav'

/**
 * Sidebar body shared by the desktop rail and the mobile drawer, so the nav
 * list and its active-state rules exist exactly once.
 *
 * - `rail` (desktop): collapsible to icon-only; the footer carries the
 *   collapse toggle. When collapsed, labels drop to sr-only and each item
 *   gains a `title` tooltip, so the icons never become unlabeled buttons.
 * - `drawer` (mobile): always shows labels; the header swaps the toggle for
 *   a close button. Focus and scroll handling live in the layout.
 */
const props = withDefaults(defineProps<{
  nav: DashboardNav
  /** Icon-only rail. Only meaningful for the rail variant. */
  collapsed?: boolean
  variant?: 'rail' | 'drawer'
  /**
   * Attention counts keyed by item path (e.g. rejected products on
   * "Produk saya"). Rendered as an amber pill — or a dot when collapsed —
   * so the signal survives on every dashboard page.
   */
  badges?: Record<string, number>
}>(), { collapsed: false, variant: 'rail', badges: undefined })

function badgeFor(item: DashboardNavItem): number {
  return props.badges?.[item.to] ?? 0
}

const emit = defineEmits<{ toggle: [], close: [] }>()

const route = useRoute()

/** One place for the item look, since nav links and footer actions match. */
function itemClass(active = false): string[] {
  return [
    'relative flex min-h-11 items-center gap-2.5 rounded-sm text-[0.92rem] font-medium transition-colors duration-200 ease-smooth',
    props.collapsed ? 'justify-center px-0' : 'px-3.5',
    active
      ? 'bg-primary-soft font-semibold text-primary'
      : 'text-muted hover:bg-surface-alt hover:text-ink',
  ]
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- Brand header, same height as the content navbar so the hairlines align. -->
    <div
      class="flex h-16 shrink-0 items-center border-b border-hairline"
      :class="collapsed ? 'justify-center' : 'justify-between pr-3 pl-5'"
    >
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2.5 font-extrabold tracking-[-0.04em]"
        aria-label="Zenko — beranda"
      >
        <BrandIcon class="h-8 w-8 shrink-0 drop-shadow-[0_6px_14px_rgba(47,111,235,0.3)]" />
        <span v-if="!collapsed" class="text-xl">Zenko</span>
      </NuxtLink>

      <button
        v-if="variant === 'drawer'"
        type="button"
        class="inline-flex h-11 w-11 items-center justify-center rounded-sm text-muted transition-colors duration-200 ease-smooth hover:bg-surface-alt hover:text-ink"
        aria-label="Tutup menu"
        @click="emit('close')"
      >
        <IconClose class="h-5 w-5" />
      </button>
    </div>

    <nav aria-label="Navigasi dashboard" class="min-h-0 flex-1 overflow-y-auto p-3">
      <p
        v-if="!collapsed"
        class="px-3.5 pt-1 pb-2 text-[0.72rem] font-bold tracking-widest text-faint uppercase"
      >
        {{ nav.title }}
      </p>

      <ul class="grid gap-1">
        <li v-for="item in nav.items" :key="item.to">
          <NuxtLink
            :to="item.to"
            :class="itemClass(isDashboardItemActive(item, route))"
            :title="collapsed ? item.label : undefined"
            :aria-current="isDashboardItemActive(item, route) ? 'page' : undefined"
          >
            <component :is="item.icon" class="h-[1.1rem] w-[1.1rem] shrink-0" />
            <span :class="collapsed ? 'sr-only' : 'truncate'">{{ item.label }}</span>

            <template v-if="badgeFor(item) > 0">
              <span
                v-if="!collapsed"
                class="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-pill bg-amber-50 px-1.5 text-[0.72rem] font-bold text-amber-800"
              >
                {{ badgeFor(item) }}<span class="sr-only"> perlu perhatian</span>
              </span>
              <!-- Collapsed rail: a dot on the icon, since a number would not fit. -->
              <span v-else class="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500">
                <span class="sr-only">{{ badgeFor(item) }} perlu perhatian</span>
              </span>
            </template>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Pinned footer: the way back out, plus the collapse toggle on desktop. -->
    <div class="shrink-0 border-t border-hairline p-3">
      <NuxtLink
        to="/"
        :class="itemClass()"
        :title="collapsed ? 'Kembali ke situs' : undefined"
      >
        <IconArrowLeft class="h-[1.1rem] w-[1.1rem] shrink-0" />
        <span :class="collapsed ? 'sr-only' : 'truncate'">Kembali ke situs</span>
      </NuxtLink>

      <button
        v-if="variant === 'rail'"
        type="button"
        class="mt-1 w-full"
        :class="itemClass()"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? 'Bentangkan sidebar' : 'Ciutkan sidebar'"
        :title="collapsed ? 'Bentangkan sidebar' : undefined"
        @click="emit('toggle')"
      >
        <IconSidebar class="h-[1.1rem] w-[1.1rem] shrink-0" />
        <span :class="collapsed ? 'sr-only' : 'truncate'">Ciutkan sidebar</span>
      </button>
    </div>
  </div>
</template>
