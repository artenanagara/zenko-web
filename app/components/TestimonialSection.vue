<script setup lang="ts">
import type { Testimonial } from '~~/types/catalog'

defineProps<{ items: Testimonial[] }>()

/** Five glyphs, the ones beyond the rating rendered dim. */
function stars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => index < Math.round(rating))
}
</script>

<template>
  <section class="py-18 md:py-22" aria-labelledby="testimonials-heading">
    <div class="container-page">
      <div class="mx-auto mb-11 max-w-160 text-center">
        <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
          Testimoni siswa
        </p>
        <h2 id="testimonials-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
          Ribuan siswa sudah <span class="text-accent">lebih percaya diri</span>
        </h2>
        <p class="mt-3.5 text-[1.02rem] text-muted">
          Cerita mereka yang latihan rutin di Zenko sebelum hari ujian tiba.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-5 min-[769px]:grid-cols-3">
        <article
          v-for="item in items"
          :key="item.id"
          class="relative flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface px-7 pt-8 pb-7 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift"
        >
          <!-- Oversized decorative closing quote -->
          <span
            class="pointer-events-none absolute -top-7 right-5 text-[8rem] leading-none font-extrabold text-primary/[0.09]"
            aria-hidden="true"
          >&rdquo;</span>

          <div class="text-[0.95rem] tracking-[0.16em]" :aria-label="`Rating ${item.rating} dari 5`">
            <span
              v-for="(filled, index) in stars(item.rating)"
              :key="index"
              :class="filled ? 'text-star' : 'text-[rgba(148,163,184,0.45)]'"
            >★</span>
          </div>

          <blockquote class="relative mt-4 flex-1 text-[1.02rem] leading-[1.68] tracking-[-0.01em]">
            {{ item.quote }}
          </blockquote>

          <footer class="mt-6 flex items-center gap-3 border-t border-[rgba(148,163,184,0.2)] pt-5">
            <img :src="item.avatarUrl" alt="" loading="lazy" class="h-11 w-11 shrink-0 rounded-full object-cover">
            <div>
              <h3 class="text-[0.98rem] tracking-[-0.02em]">{{ item.name }}</h3>
              <span class="text-[0.84rem] text-muted">{{ item.role }}</span>
            </div>
          </footer>
        </article>
      </div>
    </div>
  </section>
</template>
