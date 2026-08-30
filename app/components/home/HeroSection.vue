<script setup lang="ts">
const popularSearches = ['SKD CPNS', 'Kedinasan', 'TKA SMA', 'TKA SMP']

const query = ref('')

/**
 * Search results live on /paket, which reads `q` from the URL via
 * usePackageFilters, so result links are shareable as-is. An empty query
 * still goes to the catalogue: a bare "Cari" means "show me everything".
 */
function onSubmit() {
  const term = query.value.trim()
  return navigateTo({ path: '/paket', query: term ? { q: term } : {} })
}
</script>

<template>
  <!-- Rounded panel floating on the white page, rather than a full-bleed band. -->
  <section class="container-page pt-3 md:pt-5">
    <div
      class="dot-grid dot-grid-hero hero-aurora relative overflow-hidden rounded-[26px] px-5 pt-12 pb-20 md:rounded-xl md:px-10 md:pt-16 md:pb-28"
    >
      <div class="relative z-1 mx-auto max-w-215 text-center">
        <span
          class="mb-5 inline-flex items-center gap-2 rounded-pill border border-primary/20 bg-white/80 py-2 pr-4 pl-3 text-[0.82rem] font-semibold shadow-[0_2px_8px_rgba(47,111,235,0.06)] backdrop-blur-[6px]"
        >
          <span class="h-2 w-2 rounded-full bg-success shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" aria-hidden="true" />
          Paket try out siap dikerjakan kapan saja
        </span>

        <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter">
          Latihan try out online untuk
          <span class="text-accent mt-1 block">ujian yang kamu tuju</span>
        </h1>

        <p class="mx-auto mt-3.5 max-w-150 text-[1.02rem] text-muted">
          Pilih paket soal SKD (CPNS & Sekolah Kedinasan) dan TKA (SD–SMK) dari tutor terpercaya. Akses langsung latihan, rasakan simulasi ujian sebenarnya, dan kuasai materi pembahasannya langkah demi langkah.
        </p>

        <form
          class="mx-auto mt-6 flex max-w-175 flex-col items-stretch gap-3 rounded-[14px] border border-white/70 bg-white p-3 shadow-xs transition-[border-color,box-shadow] duration-200 ease-smooth focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_rgba(47,111,235,0.1),var(--shadow-float)] sm:flex-row sm:items-center sm:rounded-[18px] sm:py-2 sm:pr-2 sm:pl-5 sm:shadow-[var(--shadow-xs),var(--shadow-float)]"
          aria-label="Cari paket try out"
          @submit.prevent="onSubmit"
        >
          <label class="sr-only" for="search-input">Cari paket</label>
          <IconSearch class="hidden h-5 w-5 shrink-0 text-placeholder sm:block" />
          <input
            id="search-input"
            v-model="query"
            type="search"
            name="query"
            placeholder="Cari paket soal, topik materi, atau nama tutor..."
            class="w-full min-w-0 flex-1 border-0 bg-transparent px-2.5 py-3 text-base placeholder:text-placeholder focus:outline-none sm:px-0 sm:py-3.5"
          >
          <AppButton type="submit" class="w-full min-h-13 rounded-xl sm:w-auto sm:min-w-30">
            Cari Paket
          </AppButton>
        </form>

        <div class="mt-4 flex flex-wrap items-center justify-center gap-2 text-[0.8rem] text-muted sm:text-[0.85rem]">
          <!-- The label sits straight on the wash, so it needs a darker ink
               than the chips, which carry their own near-white background. -->
          <span class="mr-0.5 font-semibold text-ink/75">Pencarian populer</span>
          <!-- Popular-search chips run a real search rather than jumping to
               the grid below because the label promises a keyword. -->
          <NuxtLink
            v-for="term in popularSearches"
            :key="term"
            :to="{ path: '/paket', query: { q: term } }"
            class="rounded-xs border border-white/80 bg-white/85 px-3.5 py-1.5 font-medium shadow-xs backdrop-blur-[6px] transition-[background,border-color,color] duration-200 ease-smooth hover:border-primary/35 hover:bg-white hover:text-primary"
          >{{ term }}</NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
