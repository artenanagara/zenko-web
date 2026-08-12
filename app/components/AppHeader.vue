<script setup lang="ts">
const { user, isSignedIn, signOut } = useAuth()

const isScrolled = ref(false)

function syncScrollState() {
  isScrolled.value = window.scrollY > 12
}

function focusSearch(event: MouseEvent) {
  event.preventDefault()
  const input = document.getElementById('search-input')
  if (!input) return

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
        <NuxtLink to="/" class="inline-flex items-center gap-2.5 font-extrabold tracking-[-0.04em]" aria-label="Zenko home">
          <span
            class="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-linear-to-b from-primary-light to-primary text-[0.96rem] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_18px_rgba(47,111,235,0.2)]"
          >Z</span>
          <span class="text-xl">Zenko</span>
        </NuxtLink>

        <div class="hidden items-center gap-7 font-medium text-muted md:flex">
          <a href="#paket" class="transition-colors duration-200 hover:text-ink">Paket</a>
          <a href="#cara-kerja" class="transition-colors duration-200 hover:text-ink">Tentang</a>
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
        <template v-if="isSignedIn">
          <span class="hidden items-center gap-2.5 sm:flex">
            <img
              v-if="user?.avatarUrl"
              :src="user.avatarUrl"
              alt=""
              referrerpolicy="no-referrer"
              class="h-8 w-8 rounded-full object-cover"
            >
            <span class="max-w-35 truncate font-semibold">{{ user?.name }}</span>
          </span>
          <button
            type="button"
            class="rounded-xs px-3.5 py-2.5 font-semibold transition-colors hover:bg-surface-alt"
            @click="signOut"
          >
            Keluar
          </button>
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
