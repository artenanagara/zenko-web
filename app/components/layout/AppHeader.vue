<script setup lang="ts">
const { user, isSignedIn } = useAuth()
const route = useRoute()

/**
 * Real routes rather than homepage anchors, so the nav works from any page.
 *
 * Dua kelompok, dua sisi header: BROWSE_LINKS adalah tujuan pengunjung biasa
 * dan menempel pada logo, sedangkan PARTNER_LINKS adalah pintu masuk mitra
 * (tutor dan bimbel) dan duduk di gugus kanan bersama tombol akun. Drawer
 * mobile tetap memuat keduanya, dipisah satu garis.
 */
const BROWSE_LINKS = [
  { label: 'Paket', to: '/paket' },
  { label: 'Tentang Kami', to: '/tentang' },
] as const

const PARTNER_LINKS = [
  { label: 'Jadi Tutor', to: '/jadi-tutor' },
  { label: 'Untuk Bimbel', to: '/untuk-bimbel' },
] as const

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

onBeforeUnmount(() => {
  window.removeEventListener('scroll', syncScrollState)
  document.body.style.overflow = ''
})

/* --------------------------------------------------------------------------
 * Menu mobile
 *
 * Di bawah lg, tautan navigasi sebelumnya `hidden` tanpa pengganti apa pun — tidak
 * ada hamburger, tidak ada drawer. Artinya pengunjung HP tidak punya jalan ke
 * katalog, halaman Tentang, atau Jadi Tutor selain lewat tautan di footer.
 * Drawer ini mengembalikan seluruh navigasi utama ke layar kecil; polanya
 * (kunci scroll, Escape, jebakan Tab, fokus kembali ke pemicu) sengaja dibuat
 * sama dengan drawer dashboard supaya keduanya berperilaku identik.
 * ------------------------------------------------------------------------ */

const menuOpen = ref(false)
const panel = useTemplateRef('panel')
const hamburger = useTemplateRef('hamburger')
const menuId = useId()

function focusables(): HTMLElement[] {
  return [...(panel.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])]
    .filter(el => el.offsetParent !== null)
}

async function openMenu() {
  menuOpen.value = true
  await nextTick()
  focusables()[0]?.focus()
}

function closeMenu(returnFocus = true) {
  if (!menuOpen.value) return
  menuOpen.value = false
  if (returnFocus) hamburger.value?.focus()
}

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu()
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

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

// Berpindah halaman berarti drawer sudah selesai tugasnya.
watch(() => route.fullPath, () => closeMenu(false))

// Melewati lg menyembunyikan drawer lewat CSS; state-nya ikut ditutup, atau
// kunci scroll di atas akan selamat dari resize dan mengunci halaman.
let viewport: MediaQueryList | null = null
function onViewportChange(event: MediaQueryListEvent) {
  if (event.matches) closeMenu(false)
}

onMounted(() => {
  viewport = window.matchMedia('(min-width: 1024px)')
  viewport.addEventListener('change', onViewportChange)
})

onBeforeUnmount(() => viewport?.removeEventListener('change', onViewportChange))
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-[box-shadow,border-color] duration-200 ease-smooth"
    :class="isScrolled ? 'border-line shadow-[0_8px_24px_rgba(15,23,42,0.04)]' : 'border-transparent'"
  >
    <nav class="container-page flex min-h-16 items-center justify-between gap-2 md:min-h-20" aria-label="Navigasi utama">
      <div class="flex min-w-0 items-center gap-3 lg:gap-9">
        <!-- Hamburger di KIRI logo pada layar sempit, mengikuti kebiasaan
             aplikasi mobile: menu di pojok kiri, identitas/profil di kanan.
             Sebelumnya ia menempel di kanan bersama profil, dan dua kontrol
             ikon berdampingan di sana membuat keduanya sama-sama sulit
             ditebak. -->
        <button
          ref="hamburger"
          type="button"
          class="-ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted transition-colors duration-200 ease-smooth hover:bg-surface-alt hover:text-ink lg:hidden"
          :aria-expanded="menuOpen"
          :aria-controls="menuId"
          aria-label="Buka menu navigasi"
          @click="menuOpen ? closeMenu() : openMenu()"
        >
          <IconMenu class="h-5 w-5" />
        </button>

        <!-- 80% dari 36/44/48px sebelumnya. Nilai px eksplisit karena 20% tidak
             mendarat di skala Tailwind mana pun; membulatkannya ke h-7/h-9
             akan meleset sampai 4px di breakpoint md. Tinggi header sendiri
             dipatok min-h-16/md:min-h-20, jadi mengecilkan logo tidak
             menggeser apa pun yang menempel di bawahnya (strip tab profil
             tutor memakai top-16/md:top-20). -->
        <BrandMark img-class="h-[29px] sm:h-[35px] md:h-[38px] w-auto object-contain" />

        <div class="hidden items-center gap-6 font-medium text-muted lg:flex lg:gap-7">
          <NuxtLink
            v-for="link in BROWSE_LINKS"
            :key="link.to"
            :to="link.to"
            class="transition-colors duration-200 hover:text-ink"
          >{{ link.label }}</NuxtLink>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 md:gap-2 lg:gap-3">
        <div class="hidden items-center gap-6 font-medium text-muted lg:flex lg:gap-7">
          <NuxtLink
            v-for="link in PARTNER_LINKS"
            :key="link.to"
            :to="link.to"
            class="whitespace-nowrap transition-colors duration-200 hover:text-ink"
          >{{ link.label }}</NuxtLink>
        </div>

        <span class="mx-1 hidden h-5 w-px bg-hairline-strong lg:mx-2 lg:block" aria-hidden="true" />

        <a
          href="#search-input"
          class="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-200 ease-smooth hover:bg-surface-alt hover:text-ink"
          aria-label="Cari paket"
          @click="focusSearch"
        >
          <IconSearch class="h-5 w-5" />
        </a>

        <template v-if="isSignedIn && user">
          <ProfileMenu :user="user" />
        </template>

        <template v-else>
          <!-- "Masuk" pindah ke dalam drawer di layar sempit: empat kontrol
               berlabel di lebar 390px membuat semuanya menyusut di bawah ambang
               sentuh. "Daftar" tetap terlihat — ia CTA utama halaman. -->
          <NuxtLink
            to="/masuk"
            class="hidden rounded-xs px-3.5 py-2.5 font-semibold transition-colors hover:bg-surface-alt lg:block"
          >
            Masuk
          </NuxtLink>
          <AppButton to="/daftar" size="sm">Daftar</AppButton>
        </template>
      </div>
    </nav>

    <!-- Drawer mobile.

         Latar gelapnya `absolute`, bukan `fixed`: header memakai
         `backdrop-blur`, dan backdrop-filter menjadikan header containing
         block bagi turunan `fixed`. Dengan `fixed inset-0 top-16` tingginya
         terhitung dari kotak header (65px) dikurangi 64px, jadi tersisa ~0px
         — latarnya tidak pernah terlihat dan tidak bisa diklik untuk menutup.
         Sebagai `absolute top-full h-[100dvh]` ia mulai persis di bawah
         header dan menutup sisa layar (scroll body sudah dikunci). -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-smooth"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-smooth"
      leave-to-class="opacity-0"
    >
      <div
        v-show="menuOpen"
        class="absolute inset-x-0 top-full z-40 h-[100dvh] bg-ink/40 lg:hidden"
        aria-hidden="true"
        @click="closeMenu()"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-200 ease-smooth"
      enter-from-class="-translate-y-4 opacity-0"
      leave-active-class="transition-[transform,opacity] duration-150 ease-smooth"
      leave-to-class="-translate-y-4 opacity-0"
    >
      <div
        v-show="menuOpen"
        :id="menuId"
        ref="panel"
        class="absolute inset-x-0 top-full z-50 border-b border-line bg-surface shadow-float lg:hidden"
        @keydown="onMenuKeydown"
      >
        <div class="container-page grid gap-1 py-3">
          <NuxtLink
            v-for="link in BROWSE_LINKS"
            :key="link.to"
            :to="link.to"
            class="flex min-h-12 items-center rounded-sm px-3 font-medium text-ink transition-colors hover:bg-surface-alt"
            active-class="bg-primary-soft font-semibold text-primary"
          >{{ link.label }}</NuxtLink>

          <!-- Pintu masuk mitra, dipisah garis seperti di header lebar. -->
          <div class="mt-2 grid gap-1 border-t border-hairline pt-2">
            <NuxtLink
              v-for="link in PARTNER_LINKS"
              :key="link.to"
              :to="link.to"
              class="flex min-h-12 items-center rounded-sm px-3 font-medium text-ink transition-colors hover:bg-surface-alt"
              active-class="bg-primary-soft font-semibold text-primary"
            >{{ link.label }}</NuxtLink>
          </div>

          <NuxtLink
            v-if="!isSignedIn"
            to="/masuk"
            class="mt-1 flex min-h-12 items-center rounded-sm border border-hairline-strong px-3 font-semibold text-ink transition-colors hover:bg-surface-alt"
          >
            Masuk
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </header>
</template>
