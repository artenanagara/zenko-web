<script setup lang="ts">
import { homePathFor } from '#shared/types/user'

const { user, isSignedIn } = useAuth()

/** Real routes rather than homepage anchors, so the nav works from any page. */
const NAV_LINKS = [
  { label: 'Paket', to: '/paket' },
  { label: 'Tentang Kami', to: '/tentang' },
  { label: 'Jadi Tutor', to: '/jadi-tutor' },
] as const

/**
 * Only tutors and admins have a dashboard; a student's own surfaces all live in
 * the account menu, so they get no link to a page that is not theirs.
 */
const dashboardPath = computed(() =>
  user.value && user.value.role !== 'student' ? homePathFor(user.value.role) : null,
)

const isScrolled = ref(false)

function syncScrollState() {
  isScrolled.value = window.scrollY > 12
}

/**
 * The search field only exists on the home and catalogue pages; elsewhere
 * this icon leads to the catalogue, where search lives.
 */
function focusSearch(event: MouseEvent) {
  event.preventDefault()
  const input = document.getElementById('search-input')
  if (!input) return navigateTo('/paket')

  input.scrollIntoView({ block: 'center', behavior: 'smooth' })
  input.focus({ preventScroll: true })
}

onMounted(() => {
  syncScrollState()
  window.addEventListener('scroll', syncScrollState, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('scroll', syncScrollState))
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-[box-shadow,border-color] duration-200 ease-smooth"
    :class="isScrolled ? 'border-line shadow-[0_8px_24px_rgba(15,23,42,0.04)]' : 'border-transparent'"
  >
    <nav class="container-page flex min-h-18 items-center justify-between md:min-h-20" aria-label="Navigasi utama">
      <div class="flex items-center gap-9">
        <BrandMark img-class="h-11 md:h-12 w-auto object-contain" />

        <div class="hidden items-center gap-7 font-medium text-muted md:flex">
          <NuxtLink
            v-for="link in NAV_LINKS"
            :key="link.to"
            :to="link.to"
            class="transition-colors duration-200 hover:text-ink"
          >{{ link.label }}</NuxtLink>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <a
          href="#search-input"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors duration-200 ease-smooth hover:bg-surface-alt hover:text-ink"
          aria-label="Cari paket"
          @click="focusSearch"
        >
          <IconSearch class="h-5 w-5" />
        </a>
        <template v-if="isSignedIn && user">
          <NuxtLink
            v-if="dashboardPath"
            :to="dashboardPath"
            class="hidden rounded-xs px-3.5 py-2.5 font-semibold transition-colors hover:bg-surface-alt sm:block"
          >
            Dashboard
          </NuxtLink>
          <ProfileMenu :user="user" />
        </template>

        <template v-else>
          <NuxtLink
            to="/masuk"
            class="rounded-xs px-3.5 py-2.5 font-semibold transition-colors hover:bg-surface-alt"
          >
            Masuk
          </NuxtLink>
          <AppButton to="/daftar" size="sm">Daftar</AppButton>
        </template>
      </div>
    </nav>
  </header>
</template>
