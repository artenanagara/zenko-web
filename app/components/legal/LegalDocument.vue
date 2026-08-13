<script setup lang="ts">
/**
 * Shared shell for legal pages: header band, readable measure, and the
 * `.legal-prose` styling that lets the content stay plain semantic HTML.
 *
 * `updated` is intentionally optional — left empty it renders a loud
 * placeholder, so an unfilled effective date cannot ship quietly.
 */
defineProps<{
  lead: string
  accent: string
  updated?: string
}>()
</script>

<template>
  <main class="dot-grid relative overflow-hidden bg-linear-to-b from-white to-[#f1f3f7]">
    <div class="container-page relative z-1 py-14 md:py-20">
      <article class="mx-auto max-w-190">
        <header class="mb-10 border-b border-line pb-10">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Dokumen legal
          </p>
          <h1 class="text-[clamp(2rem,3.4vw,3rem)] leading-[1.12] tracking-[-0.04em]">
            {{ lead }} <span class="text-accent">{{ accent }}</span>
          </h1>
          <p class="mt-4 text-muted">
            Terakhir diperbarui:
            <template v-if="updated">{{ updated }}</template>
            <span v-else class="legal-todo">[tanggal]</span>
          </p>
        </header>

        <div class="legal-prose">
          <slot />
        </div>

        <footer class="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-8">
          <NuxtLink to="/" class="font-semibold text-primary hover:underline">
            &larr; Kembali ke beranda
          </NuxtLink>
          <slot name="related" />
        </footer>
      </article>
    </div>
  </main>
</template>
