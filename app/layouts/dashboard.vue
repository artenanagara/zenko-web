<script setup lang="ts">
/**
 * Shell for the role dashboards (admin, tutor, and Marketing Hub via useDashboardNav):
 * a full-height sidebar on the left and a content column with its own navbar.
 *
 * - Desktop (md+): the sidebar is a fixed rail, collapsible to icon-only.
 *   The state lives in a cookie rather than localStorage so SSR renders the
 *   chosen width on first paint instead of flashing open and snapping shut.
 * - Mobile (< md): the sidebar becomes an off-canvas drawer behind a
 *   hamburger in the navbar. Body scroll locks while open; Escape and the
 *   overlay close it; focus moves in on open and returns to the hamburger on
 *   close, mirroring the menu pattern in ProfileMenu.vue.
 */
const { user } = useAuth()
const nav = useDashboardNav()
const route = useRoute()
const routeBimbelId = typeof route.params.bimbelId === 'string' ? route.params.bimbelId : ''
const { refresh: refreshBimbelMemberships } = useBimbelMemberships()

const collapsed = useCookie<boolean>('zenko-sidebar-collapsed', {
  default: () => false,
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
})

/**
 * Breadcrumb next to the hamburger. Kept quiet (small, muted) on purpose:
 * every page renders its own h1, and two loud titles would compete.
 */
const activeLabel = computed(() =>
  nav.value.items.find(item => isDashboardItemActive(item, route))?.label ?? '',
)

/**
 * Sidebar badges. One client fetch per layout mount, role-gated; failures
 * simply mean no badge — the pages behind each entry carry the real message.
 *
 * - Tutor: rejected products deserve a signal on every dashboard page, not
 *   just the overview. Reuses useTutorProducts, so its cached error handling
 *   applies and no error ever surfaces from here.
 * - Admin: pending counts per queue from GET /admin/summary (shared state
 *   with the Ringkasan page, so the numbers always agree and the endpoint is
 *   hit once). Rekening bank is a sub-menu, so each child page gets its own
 *   count keyed by its path; the sidebar sums them onto the parent itself.
 *
 * DashboardSidebar hides badges at 0, so zeroes can be assigned freely.
 */
const { data: badgeProducts, refresh: refreshBadgeProducts } = useTutorProducts(
  routeBimbelId ? { bimbelId: routeBimbelId } : undefined,
)
const { data: adminSummary, refresh: refreshAdminSummary } = useAdminSummary()

const sidebarBadges = computed<Record<string, number>>(() => {
  const badges: Record<string, number> = {}

  if (user.value?.role === 'admin') {
    const summary = adminSummary.value
    if (summary) {
      badges['/dashboard/admin/applications'] = summary.pendingTutorApplications
      badges['/dashboard/admin/products'] = summary.pendingProducts
      // Both halves of the one verification queue. Counting only package
      // proofs would send an admin to a page whose badge disagrees with the
      // list they then see — and would leave subscription payers waiting
      // behind a badge that never lit up.
      //
      // Either field is absent on an API that predates its queue, so both
      // default to zero rather than making the badge disappear.
      badges['/dashboard/admin/payments']
        = (summary.pendingPaymentProofs ?? 0) + (summary.pendingBimbelPaymentProofs ?? 0)
      badges['/dashboard/admin/payouts'] = summary.pendingPayouts
      badges['/dashboard/admin/bank-accounts'] = summary.pendingBankVerifications
      badges['/dashboard/admin/bank-accounts/changes'] = summary.pendingBankChangeRequests
    }
    return badges
  }

  if (user.value?.role !== 'tutor') return badges

  const rejected = (badgeProducts.value ?? []).filter(product => product.status === 'rejected').length
  const productPath = routeBimbelId
    ? `/dashboard/bimbel/${routeBimbelId}/products`
    : '/dashboard/tutor/products'
  if (rejected > 0) badges[productPath] = rejected
  return badges
})

onMounted(() => {
  if (routeBimbelId) {
    refreshBimbelMemberships()
    refreshBadgeProducts()
    return
  }
  if (user.value?.role === 'tutor') refreshBadgeProducts()
  if (user.value?.role === 'admin') refreshAdminSummary()
})

/* --------------------------------------------------------------------------
 * Mobile drawer
 * ------------------------------------------------------------------------ */

const drawerOpen = ref(false)
const drawer = useTemplateRef('drawer')
const hamburger = useTemplateRef('hamburger')
const drawerId = useId()

/** Visible targets only — v-show keeps the drawer in the DOM while closed. */
function focusables(): HTMLElement[] {
  return [...(drawer.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])]
    .filter(el => el.offsetParent !== null)
}

async function openDrawer() {
  drawerOpen.value = true
  await nextTick()
  focusables()[0]?.focus()
}

function closeDrawer(returnFocus = true) {
  if (!drawerOpen.value) return
  drawerOpen.value = false
  if (returnFocus) hamburger.value?.focus()
}

/** Escape closes; Tab wraps, so keyboard focus never lands under the overlay. */
function onDrawerKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeDrawer()
    return
  }
  if (event.key !== 'Tab') return

  const items = focusables()
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

// The page behind the drawer must not scroll along with it.
watch(drawerOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

// A route change means the drawer did its job; it should not follow along.
watch(() => route.fullPath, () => closeDrawer(false))

// Crossing into md hides the drawer via CSS; close it too, or the scroll
// lock would silently survive the resize.
let viewport: MediaQueryList | null = null
function onViewportChange(event: MediaQueryListEvent) {
  if (event.matches) closeDrawer(false)
}

onMounted(() => {
  viewport = window.matchMedia('(min-width: 768px)')
  viewport.addEventListener('change', onViewportChange)
})

onBeforeUnmount(() => {
  viewport?.removeEventListener('change', onViewportChange)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="min-h-screen bg-surface-alt">
    <!-- Desktop rail: full viewport height, collapsible to 72px. -->
    <aside
      class="fixed inset-y-0 left-0 z-40 hidden border-r border-hairline bg-surface transition-[width] duration-200 ease-smooth md:block"
      :class="collapsed ? 'w-18' : 'w-66'"
    >
      <DashboardSidebar :nav="nav" :collapsed="collapsed" :badges="sidebarBadges" @toggle="collapsed = !collapsed" />
    </aside>

    <!-- Mobile drawer + overlay. -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-smooth"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-smooth"
      leave-to-class="opacity-0"
    >
      <div
        v-show="drawerOpen"
        class="fixed inset-0 z-40 bg-ink/40 md:hidden"
        aria-hidden="true"
        @click="closeDrawer()"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-200 ease-smooth"
      enter-from-class="-translate-x-full"
      leave-active-class="transition-transform duration-150 ease-smooth"
      leave-to-class="-translate-x-full"
    >
      <div
        v-show="drawerOpen"
        :id="drawerId"
        ref="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu dashboard"
        class="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-hairline bg-surface shadow-float md:hidden"
        @keydown="onDrawerKeydown"
      >
        <DashboardSidebar :nav="nav" variant="drawer" :badges="sidebarBadges" @close="closeDrawer()" />
      </div>
    </Transition>

    <!-- Content column, shifted by the rail's current width. -->
    <div
      class="flex min-h-screen flex-col transition-[padding-left] duration-200 ease-smooth"
      :class="collapsed ? 'md:pl-18' : 'md:pl-66'"
    >
      <header class="sticky top-0 z-30 border-b border-hairline bg-surface/90 backdrop-blur-md">
        <div class="flex min-h-16 items-center justify-between gap-3 px-4 md:px-8">
          <div class="flex min-w-0 items-center gap-2">
            <button
              ref="hamburger"
              type="button"
              class="-ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted transition-colors duration-200 ease-smooth hover:bg-surface-alt hover:text-ink md:hidden"
              :aria-expanded="drawerOpen"
              :aria-controls="drawerId"
              aria-label="Buka menu dashboard"
              @click="drawerOpen ? closeDrawer() : openDrawer()"
            >
              <IconMenu class="h-5 w-5" />
            </button>

            <p class="truncate text-[0.88rem] text-muted">
              {{ nav.title }}
              <template v-if="activeLabel">
                <span class="mx-1 text-faint" aria-hidden="true">/</span>
                <span class="font-semibold text-ink">{{ activeLabel }}</span>
              </template>
            </p>
          </div>

          <!-- Same menu as the navbar: tutors and admins buy packages too, so
               the account page must be reachable from here. -->
          <!-- Workspace headers stay focused on the work surface. Account
               controls live under Pengaturan for admin/marketing/editor and
               are intentionally not shown as a profile dropdown here. -->
          <ProfileMenu v-if="user && !['admin', 'marketing', 'editor'].includes(user.role)" :user="user" />
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
        <slot />
      </main>
    </div>
  </div>
</template>
