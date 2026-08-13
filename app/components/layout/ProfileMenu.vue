<script setup lang="ts">
import { homePathFor, type Role, type User } from '#shared/types/user'

/**
 * Navbar account menu: identity on top, the account pages below it, and the
 * way out at the bottom — the order a person reads when they open it.
 *
 * Follows the same menu pattern as the catalogue's sort dropdown: the entries
 * are `role="menuitem"`, focus moves into the panel while it is open and
 * returns to the trigger when it closes by keyboard.
 */
const props = defineProps<{ user: User }>()

const { signOut } = useAuth()
const route = useRoute()

const open = ref(false)
const root = useTemplateRef('root')
const trigger = useTemplateRef('trigger')
const menu = useTemplateRef('menu')
const menuId = useId()

/** First letter as a stand-in when the account has no Google avatar. */
const initial = computed(() => props.user.name.trim().charAt(0).toUpperCase() || '?')

/** A student is the default account and wears no badge; the others say so. */
const ROLE_BADGE: Partial<Record<Role, { label: string, tone: 'brand' | 'neutral' }>> = {
  tutor: { label: 'Tutor', tone: 'brand' },
  admin: { label: 'Admin', tone: 'neutral' },
}
const roleBadge = computed(() => ROLE_BADGE[props.user.role] ?? null)

/**
 * Only tutors and admins have a dashboard. The navbar's Dashboard link is
 * hidden below `sm`, so on a phone this menu is the only way there — the link
 * below carries `sm:hidden` to fill exactly that gap without duplicating it on
 * desktop.
 */
const dashboardPath = computed(() =>
  props.user.role === 'student' ? null : homePathFor(props.user.role),
)

/**
 * Visible items only: the mobile Dashboard link is `display:none` on desktop,
 * and roving focus must not land on something the reader cannot see.
 */
function items(): HTMLElement[] {
  return [...(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    .filter(el => el.offsetParent !== null)
}

/** Wraps around, so ArrowUp from the first entry lands on the last. */
function focusItem(index: number) {
  const all = items()
  if (all.length === 0) return
  all[((index % all.length) + all.length) % all.length]?.focus()
}

async function openMenu(index = 0) {
  open.value = true
  await nextTick()
  focusItem(index)
}

function close(returnFocus = true) {
  if (!open.value) return
  open.value = false
  if (returnFocus) trigger.value?.focus()
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

  event.preventDefault()
  if (open.value) focusItem(event.key === 'ArrowDown' ? 0 : items().length - 1)
  else openMenu(event.key === 'ArrowDown' ? 0 : -1)
}

function onMenuKeydown(event: KeyboardEvent) {
  const index = items().indexOf(document.activeElement as HTMLElement)

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusItem(index + 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusItem(index - 1)
      break
    case 'Home':
      event.preventDefault()
      focusItem(0)
      break
    case 'End':
      event.preventDefault()
      focusItem(items().length - 1)
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

/**
 * Signing out from a guarded page would leave the reader staring at a screen
 * they no longer have a session for, so leave for the homepage too.
 */
async function onSignOut() {
  close(false)
  await signOut()
  await navigateTo('/')
}

// Bound only while open, so a closed menu costs nothing.
watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onPointerDown)
  else document.removeEventListener('pointerdown', onPointerDown)
})

// A route change means the menu did its job; it should not follow the reader.
watch(() => route.fullPath, () => close(false))

onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
</script>

<template>
  <div ref="root" class="relative">
    <button
      ref="trigger"
      type="button"
      class="inline-flex items-center gap-2 rounded-pill py-1.5 pr-2.5 pl-1.5 font-semibold transition-colors duration-200 ease-smooth hover:bg-surface-alt"
      :aria-expanded="open"
      :aria-controls="menuId"
      aria-haspopup="true"
      :aria-label="`Menu akun, ${user.name}`"
      @click="open ? close() : openMenu()"
      @keydown="onTriggerKeydown"
    >
      <img
        v-if="user.avatarUrl"
        :src="user.avatarUrl"
        alt=""
        referrerpolicy="no-referrer"
        class="h-8 w-8 rounded-full object-cover"
      >
      <span
        v-else
        aria-hidden="true"
        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-[0.9rem] font-bold text-muted"
      >{{ initial }}</span>

      <span class="hidden max-w-32 truncate sm:block">{{ user.name }}</span>
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
        class="absolute right-0 z-30 mt-2 w-64 rounded-md border border-hairline bg-surface p-1.5 shadow-float"
        role="menu"
        aria-label="Menu akun"
        @keydown="onMenuKeydown"
      >
        <!-- Identity, not a target: it tells you which account you are in. -->
        <div class="border-b border-hairline px-3.5 pt-2 pb-3">
          <p class="flex items-center gap-1.5 font-semibold tracking-[-0.02em]">
            <span class="truncate">{{ user.name }}</span>
            <!-- IconSeal hardcodes aria-hidden, so the accessible name lives on
                 this wrapper — otherwise "verified" is announced to no one. -->
            <span
              v-if="user.verified"
              role="img"
              aria-label="Email terverifikasi"
              class="inline-flex shrink-0"
            >
              <IconSeal class="h-4 w-4" />
            </span>
          </p>
          <p class="mt-0.5 truncate text-[0.82rem] text-muted">{{ user.email }}</p>

          <DashboardBadge v-if="roleBadge" :tone="roleBadge.tone" class="mt-2.5">
            {{ roleBadge.label }}
          </DashboardBadge>

          <!-- Unverified: a nudge with somewhere to go, not a dead status. -->
          <NuxtLink
            v-if="!user.verified"
            to="/verifikasi-email"
            role="menuitem"
            tabindex="-1"
            class="mt-2.5 flex items-center gap-1.5 rounded-xs bg-amber-50 px-2.5 py-2 text-[0.8rem] font-semibold text-amber-800 transition-colors duration-200 hover:bg-amber-100"
            @click="close(false)"
          >
            <IconAlert class="h-3.5 w-3.5 shrink-0" />
            Verifikasi email
          </NuxtLink>
        </div>

        <NuxtLink
          v-for="item in ACCOUNT_MENU"
          :key="item.to"
          :to="item.to"
          role="menuitem"
          tabindex="-1"
          class="mt-1 flex min-h-11 items-center gap-2.5 rounded-xs px-3.5 text-[0.94rem] font-medium text-muted transition-colors duration-200 first:mt-1.5 hover:bg-surface-alt hover:text-ink"
          exact-active-class="bg-primary-soft font-semibold text-primary"
          @click="close(false)"
        >
          <component :is="item.icon" class="h-[1.1rem] w-[1.1rem] shrink-0" />
          {{ item.label }}
        </NuxtLink>

        <!-- Mobile only: the navbar's Dashboard link disappears below `sm`. -->
        <div v-if="dashboardPath" class="mt-1.5 border-t border-hairline pt-1.5 sm:hidden">
          <NuxtLink
            :to="dashboardPath"
            role="menuitem"
            tabindex="-1"
            class="flex min-h-11 items-center rounded-xs px-3.5 text-[0.94rem] font-medium text-muted transition-colors duration-200 hover:bg-surface-alt hover:text-ink"
            exact-active-class="bg-primary-soft font-semibold text-primary"
            @click="close(false)"
          >
            Dashboard
          </NuxtLink>
        </div>

        <div class="mt-1.5 border-t border-hairline pt-1.5">
          <button
            type="button"
            role="menuitem"
            tabindex="-1"
            class="flex min-h-11 w-full items-center rounded-xs px-3.5 text-left text-[0.94rem] font-semibold text-ink transition-colors duration-200 hover:bg-surface-sunken hover:text-red-600"
            @click="onSignOut"
          >
            Keluar
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
