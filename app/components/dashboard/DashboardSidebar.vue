<script setup lang="ts">
import type { DashboardNav, DashboardNavChild, DashboardNavItem } from '~/composables/useDashboardNav'

/**
 * Sidebar body shared by the desktop rail and the mobile drawer, so the nav
 * list and its active-state rules exist exactly once.
 *
 * - `rail` (desktop): collapsible to icon-only; the footer carries the
 *   collapse toggle. When collapsed, labels drop to sr-only and each item
 *   gains a `title` tooltip, so the icons never become unlabeled buttons.
 * - `drawer` (mobile): always shows labels; the header swaps the toggle for
 *   a close button. Focus and scroll handling live in the layout.
 *
 * A nav item with `children` renders as a group header (a button, not a link
 * — the children own the routes) over a nested list. Children carry no icon
 * by construction; they are indented so their labels line up under the
 * parent's.
 *
 * `item.section` is the other, flatter kind of grouping: a heading printed
 * over a run of entries that share it. It only labels tingkatnya — every
 * entry keeps its own route and its own row.
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

/** Badges are keyed by path, so top-level items and children look the same up. */
function badgeFor(item: DashboardNavChild): number {
  return props.badges?.[item.to] ?? 0
}

/** A group's aggregate: the sum of what its children are asking for. */
function groupBadge(item: DashboardNavItem): number {
  return item.children?.reduce((total, child) => total + badgeFor(child), 0) ?? 0
}

/** What a top-level row shows: its own count, or its children's total. */
function rowBadge(item: DashboardNavItem): number {
  return item.children?.length ? groupBadge(item) : badgeFor(item)
}

const emit = defineEmits<{ toggle: [], close: [] }>()

const route = useRoute()

/* --------------------------------------------------------------------------
 * Kelompok bertingkat
 * ------------------------------------------------------------------------ */

/**
 * Daftar dipecah menjadi kelompok menurut `item.section`, mengikuti urutan
 * aslinya — jadi nav yang menentukan tingkatnya, bukan komponen ini.
 *
 * Entri berurutan dengan section yang sama masuk ke kelompok yang sama; entri
 * tanpa section membentuk kelompok tanpa judul. Sengaja tidak dikumpulkan
 * berdasarkan nama (mis. semua 'Keuangan' ditarik jadi satu di mana pun
 * letaknya): itu akan diam-diam menyusun ulang nav, dan urutan di
 * `useDashboardNav` justru bagian yang harus bisa dibaca apa adanya.
 */
const sections = computed<{ label: string, items: DashboardNavItem[] }[]>(() => {
  const groups: { label: string, items: DashboardNavItem[] }[] = []
  for (const item of props.nav.items) {
    const label = item.section ?? ''
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
})

/* --------------------------------------------------------------------------
 * Sub-menu expansion
 * ------------------------------------------------------------------------ */

function hasChildren(item: DashboardNavItem): boolean {
  return (item.children?.length ?? 0) > 0
}

/** True while the user is inside this group — the parent's "you are here". */
function isGroupActive(item: DashboardNavItem): boolean {
  return item.children?.some(child => isDashboardItemActive(child, route)) ?? false
}

/**
 * Expansion is derived, not stored: a group is open because its section is
 * active. `manual` only records a deliberate override, so the default stays
 * identical on the server and the client (no hydration mismatch).
 */
const manual = ref<Record<string, boolean>>({})

function isExpanded(item: DashboardNavItem): boolean {
  return manual.value[item.to] ?? isGroupActive(item)
}

function toggleGroup(item: DashboardNavItem) {
  manual.value = { ...manual.value, [item.to]: !isExpanded(item) }
}

/** Which group the current route belongs to — '' when none does. */
const activeGroup = computed(() =>
  props.nav.items.find(item => hasChildren(item) && isGroupActive(item))?.to ?? '',
)

// Moving into a different section drops the overrides: the group you just
// entered auto-expands even if you had collapsed it on an earlier visit.
watch(activeGroup, () => {
  manual.value = {}
})

/* --------------------------------------------------------------------------
 * Look
 * ------------------------------------------------------------------------ */

/**
 * One place for the item look, since nav links, group headers, sub-menu
 * entries and footer actions all match.
 *
 * - `child`: no icon, so the label is padded to where the parent's starts
 *   (px-3.5 + icon 1.1rem + gap-2.5) and set a step lighter.
 * - `within`: parent of the active child. Deliberately not the full selected
 *   pill — the child carries that; this is only a "you are in here" cue.
 */
function itemClass(active = false, look: { child?: boolean, within?: boolean } = {}): string[] {
  const idleWeight = look.child ? 'font-normal' : 'font-medium'

  return [
    'relative flex min-h-11 items-center rounded-sm transition-colors duration-200 ease-smooth',
    look.child ? 'gap-2 text-[0.88rem]' : 'gap-2.5 text-[0.92rem]',
    look.child
      ? 'pr-3.5 pl-[2.6rem]'
      : props.collapsed ? 'justify-center px-0' : 'px-3.5',
    active
      ? 'bg-primary-soft font-semibold text-primary'
      : look.within
        ? `${idleWeight} text-ink hover:bg-surface-alt`
        : `${idleWeight} text-muted hover:bg-surface-alt hover:text-ink`,
  ]
}

// One id per component instance (the rail and the drawer both render this
// tree), suffixed per group so `aria-controls` never collides.
/** Sakelar ciutkan: ikon saja, ukuran sentuh tetap 40px di kedua keadaan. */
const TOGGLE_CLASS = 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-muted transition-colors duration-200 ease-smooth hover:bg-surface-alt hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'

const uid = useId()
function submenuId(item: DashboardNavItem): string {
  return `${uid}-submenu-${item.to.replace(/[^a-z0-9]+/gi, '-')}`
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- Brand header, same height as the content navbar so the hairlines align. -->
    <div
      class="flex h-16 shrink-0 items-center border-b border-hairline"
      :class="collapsed ? 'justify-center' : 'justify-between pr-3 pl-5'"
    >
      <NuxtLink v-if="collapsed" to="/" aria-label="Zenko — beranda">
        <BrandIcon class="h-8 w-8 shrink-0 drop-shadow-[0_6px_14px_rgba(47,111,235,0.3)]" />
      </NuxtLink>
      <BrandMark v-else img-class="h-9 w-auto object-contain" aria-label="Zenko — beranda" />

      <!-- Ciutkan/bentangkan, di ujung kanan sebaris dengan logo. Ikon saja:
           tempatnya sudah menjelaskan apa yang diciutkan, dan sebagai baris
           bertulisan di kaki sidebar ia dulu terbaca seperti tujuan navigasi
           di antara menu-menu yang lain, bukan sebagai sakelar tampilan. -->
      <button
        v-if="variant === 'rail' && !collapsed"
        type="button"
        :class="TOGGLE_CLASS"
        :aria-expanded="true"
        aria-label="Ciutkan sidebar"
        @click="emit('toggle')"
      >
        <IconSidebar class="h-[1.1rem] w-[1.1rem]" />
      </button>

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

    <!-- Rail yang sudah diciutkan hanya selebar 4.5rem, tidak cukup untuk
         logo dan sakelar berdampingan — jadi di sana sakelarnya turun tepat
         di bawah logo, tetap sebagai hal pertama yang terlihat dan satu-satunya
         jalan membentangkannya kembali. -->
    <div v-if="variant === 'rail' && collapsed" class="flex shrink-0 justify-center border-b border-hairline py-2">
      <button
        type="button"
        :class="TOGGLE_CLASS"
        :aria-expanded="false"
        aria-label="Bentangkan sidebar"
        title="Bentangkan sidebar"
        @click="emit('toggle')"
      >
        <IconSidebar class="h-[1.1rem] w-[1.1rem]" />
      </button>
    </div>

    <nav aria-label="Navigasi dashboard" class="min-h-0 flex-1 overflow-y-auto p-3">
      <!-- ClientOnly, not just an empty-until-resolved `nav` prop: SSR can
           never know the role (the session cookie is HttpOnly on the API
           origin), so every server render would otherwise ship a set of
           <NuxtLink>s hydration has to adopt and then never actually
           corrects — see useDashboardNav's doc comment for the full story.
           Skipping SSR for this block entirely means there is no server DOM
           for the client to (mis)adopt in the first place: every link is
           created fresh, with the right href from the moment it exists, and
           Vue never has to reconcile a mismatch it doesn't fully repair. The
           empty #fallback costs nothing here — the rail's width does not
           depend on its content, so there is no layout shift while it fills
           in a beat after mount. -->
      <ClientOnly>
        <!-- Pemilih konteks menggantikan judul statis: ia menyebut ruang yang
             sedang dibuka sekaligus jadi jalan ke ruang lain. Judul lama hanya
             mengulang apa yang sudah ditampilkan trigger-nya. -->
        <div class="px-2.5 pt-1 pb-3">
          <DashboardContextSwitcher :collapsed="collapsed" />
        </div>

        <template v-for="(section, index) in sections" :key="section.label || `plain-${index}`">
          <!-- Judul kelompok. Pada rail yang diciutkan tidak ada ruang untuk
               teks, jadi pemisahnya jadi garis: tingkatnya tetap terbaca tanpa
               ikon yang tiba-tiba kehilangan konteks. -->
          <p
            v-if="section.label && !collapsed"
            class="px-3.5 pt-5 pb-1.5 text-[0.68rem] font-bold tracking-[0.1em] text-faint uppercase"
          >
            {{ section.label }}
          </p>
          <hr v-else-if="section.label" class="mx-3 my-2.5 border-t border-hairline">

          <ul class="grid gap-1" :aria-label="section.label || undefined">
            <li v-for="item in section.items" :key="item.to">
              <!-- Group: a button over a nested list. Only when there is room for
                   the list — the icon-only rail falls through to the link below. -->
              <template v-if="hasChildren(item) && !collapsed">
                <button
                  type="button"
                  class="w-full"
                  :class="itemClass(false, { within: isGroupActive(item) })"
                  :aria-expanded="isExpanded(item)"
                  :aria-controls="submenuId(item)"
                  @click="toggleGroup(item)"
                >
                  <component :is="item.icon" class="h-[1.1rem] w-[1.1rem] shrink-0" />
                  <span class="truncate">{{ item.label }}</span>

                  <span class="ml-auto flex shrink-0 items-center gap-1.5">
                    <!-- Aggregate only while collapsed: an open sub-menu already
                         shows each child's number, and showing both double-counts. -->
                    <DashboardNavBadge v-if="!isExpanded(item)" :count="groupBadge(item)" />
                    <IconChevron
                      class="h-4 w-4 shrink-0 transition-transform duration-200 ease-smooth"
                      :class="isExpanded(item) ? '' : '-rotate-90'"
                    />
                  </span>
                </button>

                <ul v-show="isExpanded(item)" :id="submenuId(item)" class="mt-1 grid gap-1">
                  <li v-for="child in item.children ?? []" :key="child.to">
                    <NuxtLink
                      :to="child.to"
                      :class="itemClass(isDashboardItemActive(child, route), { child: true })"
                      :aria-current="isDashboardItemActive(child, route) ? 'page' : undefined"
                    >
                      <span class="truncate">{{ child.label }}</span>
                      <DashboardNavBadge :count="badgeFor(child)" />
                    </NuxtLink>
                  </li>
                </ul>
              </template>

              <!-- Leaf — and the icon-only rail's stand-in for a group, which
                   points at its first child since a sub-menu cannot render here. -->
              <NuxtLink
                v-else
                :to="item.children?.[0]?.to ?? item.to"
                :class="itemClass(isDashboardItemActive(item, route))"
                :title="collapsed ? item.label : undefined"
                :aria-current="isDashboardItemActive(item, route) ? 'page' : undefined"
              >
                <component :is="item.icon" class="h-[1.1rem] w-[1.1rem] shrink-0" />
                <span :class="collapsed ? 'sr-only' : 'truncate'">{{ item.label }}</span>
                <DashboardNavBadge :count="rowBadge(item)" :dot="collapsed" />
              </NuxtLink>
            </li>
          </ul>
        </template>
      </ClientOnly>
    </nav>

    <!-- Pinned footer: the way back out. The collapse toggle used to sit here
         too; it now lives beside the brand, where a view switch belongs. -->
    <div class="shrink-0 border-t border-hairline p-3">
      <NuxtLink
        to="/"
        :class="itemClass()"
        :title="collapsed ? 'Kembali ke situs' : undefined"
      >
        <IconArrowLeft class="h-[1.1rem] w-[1.1rem] shrink-0" />
        <span :class="collapsed ? 'sr-only' : 'truncate'">Kembali ke situs</span>
      </NuxtLink>
    </div>
  </div>
</template>
