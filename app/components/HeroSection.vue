<script setup lang="ts">
const popularSearches = ['SKD 2026', 'BUMN', 'SNBT Literasi', 'Kedinasan']

const query = ref('')

function onSubmit() {
  // TODO: route to /paket?query= once the search results page exists.
}
</script>

<template>
  <!-- Rounded panel floating on the white page, rather than a full-bleed band. -->
  <section class="container-page pt-3 md:pt-5">
    <div
      class="dot-grid dot-grid-hero hero-aurora relative overflow-hidden rounded-[26px] px-5 pt-12 pb-20 md:rounded-[32px] md:px-10 md:pt-16 md:pb-28"
    >
      <div class="relative z-1 mx-auto max-w-[860px] text-center">
        <span
          class="mb-[18px] inline-flex items-center gap-2 rounded-pill border border-primary/20 bg-white/80 py-[7px] pr-4 pl-3 text-[0.82rem] font-semibold shadow-[0_2px_8px_rgba(47,111,235,0.06)] backdrop-blur-[6px]"
        >
          <span class="h-[7px] w-[7px] rounded-full bg-success shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" aria-hidden="true" />
          120+ paket baru ditambahkan minggu ini
        </span>

        <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-[-0.05em]">
          Temukan paket try out untuk
          <span class="text-accent mt-1 block">impian yang kamu kejar</span>
        </h1>

        <p class="mx-auto mt-3.5 max-w-[600px] text-[1.02rem] text-muted">
          Latihan SKD/CPNS, BUMN, SNBT, dan TKA dengan soal realistis dari tutor
          terverifikasi — beli per paket, tanpa langganan.
        </p>

        <form
          class="mx-auto mt-6 flex max-w-[700px] flex-col items-stretch gap-3 rounded-[14px] border border-white/70 bg-white p-3 shadow-xs transition-[border-color,box-shadow] duration-200 ease-smooth focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_rgba(47,111,235,0.1),var(--shadow-float)] sm:flex-row sm:items-center sm:rounded-[18px] sm:py-2 sm:pr-2 sm:pl-[18px] sm:shadow-[var(--shadow-xs),var(--shadow-float)]"
          aria-label="Cari paket try out"
          @submit.prevent="onSubmit"
        >
          <label class="sr-only" for="search-input">Cari paket</label>
          <IconSearch class="hidden h-5 w-5 shrink-0 stroke-placeholder stroke-[1.8] sm:block" />
          <input
            id="search-input"
            v-model="query"
            type="search"
            name="query"
            placeholder="Cari paket, topik, atau tutor..."
            class="w-full min-w-0 flex-1 border-0 bg-transparent px-2.5 py-3 text-base placeholder:text-placeholder focus:outline-none sm:px-0 sm:py-3.5"
          >
          <AppButton type="submit" class="w-full min-h-[52px] rounded-xl sm:w-auto sm:min-w-[120px]">
            Cari
          </AppButton>
        </form>

        <div class="mt-4 flex flex-wrap items-center justify-center gap-2 text-[0.8rem] text-muted sm:text-[0.85rem]">
          <!-- The label sits straight on the wash, so it needs a darker ink
               than the chips, which carry their own near-white background. -->
          <span class="mr-0.5 font-semibold text-ink/75">Populer</span>
          <a
            v-for="term in popularSearches"
            :key="term"
            href="#paket"
            class="rounded-pill border border-white/80 bg-white/85 px-3.5 py-1.5 font-medium shadow-xs backdrop-blur-[6px] transition-[background,border-color,color] duration-200 ease-smooth hover:border-primary/35 hover:bg-white hover:text-primary"
          >{{ term }}</a>
        </div>
      </div>
    </div>
  </section>
</template>
