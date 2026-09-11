<script setup lang="ts">
/**
 * Shell for Pusat Bantuan (/pusat-bantuan and its articles).
 *
 * Deliberately lighter than the public site: only the brand mark and a way
 * back, no browse links, no profile menu. Readers land here from inside a
 * dashboard mid-task; the page's job is one answer, and every extra control
 * in the chrome is a place to wander off before finding it. The footer stays
 * for the legal links.
 */
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="sticky top-0 z-30 border-b border-hairline bg-surface/95 backdrop-blur-xs print:hidden">
      <div class="container-page flex min-h-16 items-center justify-between gap-4 md:min-h-20">
        <BrandMark img-class="h-[29px] sm:h-[35px] md:h-[38px] w-auto object-contain" />
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-muted transition-colors hover:text-ink"
        >
          <AppIcon name="arrow-left" :size="16" aria-hidden="true" />
          Kembali ke Zenko
        </NuxtLink>
      </div>
    </header>

    <div class="flex-1">
      <slot />
    </div>

    <AppFooter class="print:hidden" />
  </div>
</template>
