<script setup lang="ts">
/**
 * Shell for the account area (/akun).
 *
 * Unlike the dashboards, this keeps the public header and footer: buying and
 * doing try out happens on the public pages, so the account is a room inside
 * the site rather than a separate building.
 */
const { user } = useAuth()

const initial = computed(() => user.value?.name.trim().charAt(0).toUpperCase() || '?')

const ROLE_LABEL = { student: 'Siswa', tutor: 'Tutor', admin: 'Admin' } as const
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader class="print:hidden" />

    <main class="container-page grid flex-1 gap-6 py-8 md:grid-cols-[220px_minmax(0,1fr)] md:py-10 print:block print:py-0">
      <!-- On narrow screens the sidebar folds into a scrollable chip row, so
           it never eats half the viewport before the content shows.

           min-w-0 adalah yang membuat baris chip itu benar-benar menggulung
           sendiri. Tanpanya <nav> — sebagai grid item — memakai
           `min-width:auto` dan menolak menyusut di bawah lebar min-content
           deretan chip-nya (581px). Track grid ikut melar, `overflow-x-auto`
           pada <ul> tidak pernah kebagian sempitnya, dan yang tergeser ke
           samping adalah seluruh halaman: judul, kartu statistik, footer. -->
      <nav aria-label="Navigasi akun" class="min-w-0 md:sticky md:top-24 md:self-start print:hidden">
        <!-- Identity card, so the rail opens with who you are — hidden on the
             narrow layout where it would push the nav below the fold. -->
        <div
          v-if="user"
          class="mb-4 hidden items-center gap-3 rounded-md border border-hairline bg-surface p-3 shadow-xs md:flex"
        >
          <span class="inline-flex shrink-0 rounded-full bg-linear-to-br from-primary-light to-primary p-0.5">
            <img
              v-if="user.avatarUrl"
              :src="user.avatarUrl"
              alt=""
              referrerpolicy="no-referrer"
              class="h-9 w-9 rounded-full border-2 border-white object-cover"
            >
            <span
              v-else
              aria-hidden="true"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-surface-alt text-[0.9rem] font-bold text-muted"
            >{{ initial }}</span>
          </span>
          <div class="min-w-0">
            <p class="truncate text-[0.9rem] font-semibold tracking-[-0.02em]">{{ user.name }}</p>
            <p class="truncate text-[0.78rem] text-muted">{{ ROLE_LABEL[user.role] }}</p>
          </div>
        </div>

        <ul class="flex gap-2 overflow-x-auto pb-1 md:grid md:gap-1 md:overflow-visible md:pb-0">
          <li v-for="item in ACCOUNT_NAV" :key="item.to" class="shrink-0">
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-[0.92rem] font-medium whitespace-nowrap text-muted transition-colors hover:bg-surface-alt hover:text-ink"
              exact-active-class="bg-primary-soft font-semibold text-primary hover:bg-primary-soft hover:text-primary"
            >
              <component :is="item.icon" class="h-[1.1rem] w-[1.1rem] shrink-0" />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="min-w-0">
        <slot />
      </div>
    </main>

    <AppFooter compact class="print:hidden" />
  </div>
</template>
