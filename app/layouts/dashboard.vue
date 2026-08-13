<script setup lang="ts">
/**
 * Shell for the three role dashboards: brand, sidebar, and a content column.
 *
 * The sidebar contents come from the signed-in user's role, so one layout
 * serves admin, tutor, and student without any branching in the pages.
 */
const { user } = useAuth()
const nav = useDashboardNav()
</script>

<template>
  <div class="min-h-screen bg-surface-alt">
    <header class="sticky top-0 z-50 border-b border-hairline bg-surface/90 backdrop-blur-md">
      <div class="container-page flex min-h-16 items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <BrandMark />
          <span class="hidden text-[0.9rem] font-semibold text-muted sm:block">{{ nav.title }}</span>
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="text-[0.9rem] font-medium text-muted transition-colors hover:text-ink">
            Ke situs
          </NuxtLink>
          <!-- Same menu as the navbar: tutors and admins buy packages too, so
               the account page must be reachable from here. -->
          <ProfileMenu v-if="user" :user="user" />
        </div>
      </div>
    </header>

    <div class="container-page grid gap-6 py-8 md:grid-cols-[220px_minmax(0,1fr)] md:py-10">
      <!-- On narrow screens the sidebar folds into a scrollable chip row, so
           it never eats half the viewport before the content shows. -->
      <nav aria-label="Navigasi dashboard" class="md:sticky md:top-24 md:self-start">
        <ul class="flex gap-2 overflow-x-auto pb-1 md:grid md:gap-1 md:overflow-visible md:pb-0">
          <li v-for="item in nav.items" :key="item.to" class="shrink-0">
            <NuxtLink
              :to="item.to"
              class="block rounded-sm px-3.5 py-2.5 text-[0.92rem] font-medium whitespace-nowrap text-muted transition-colors hover:bg-surface hover:text-ink"
              active-class="bg-surface text-ink shadow-xs"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <main class="min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>
