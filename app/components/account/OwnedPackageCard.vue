<script setup lang="ts">
import type { OwnedPackage } from '#shared/types/account'

/**
 * One owned package, as a card. It answers what people open "Paket saya"
 * for: which package, how did I do, what's next. No sales figures or prices —
 * that's catalogue business, not ownership. The whole card is a single link,
 * like PackageCard, so no buttons inside the link.
 *
 * Same tray layout as the catalogue's PackageCard so both listings read as one
 * family; only the contents differ (progress instead of price).
 *
 * A package is one try out that may be redone, so the bar shows how much of it
 * was answered correctly in the best sitting — not "3 of 5 finished", which
 * would describe a bundle this product does not sell.
 */
const props = defineProps<{ item: OwnedPackage }>()

const stats = computed(() => packageStats(props.item))
</script>

<template>
  <!-- Outer tray; the white card sits inside it and lifts as one on hover. -->
  <NuxtLink
    :to="`/akun/paket/${item.slug}`"
    class="group flex flex-col rounded-lg bg-surface-sunken p-2 transition-transform duration-300 ease-smooth hover:-translate-y-1 focus-visible:-translate-y-1"
    :aria-label="`Buka paket ${item.title}`"
  >
    <article
      class="flex flex-1 flex-col rounded-md bg-surface p-2.5 shadow-xs transition-shadow duration-300 ease-smooth group-hover:shadow-lift group-focus-visible:shadow-lift"
    >
      <div class="relative">
        <img
          :src="item.thumbnailUrl"
          :alt="`Thumbnail paket ${item.title}`"
          loading="lazy"
          class="aspect-16/10 w-full rounded-sm bg-[#edf3ff] object-cover"
        >
        <span
          class="absolute top-2.5 left-2.5 rounded-pill bg-white/90 px-2.5 py-1 text-[0.66rem] font-bold tracking-[0.08em] text-ink uppercase shadow-xs backdrop-blur-[2px]"
        >{{ item.category }}</span>
      </div>

      <div class="flex flex-1 flex-col px-1.5 pt-3.5 pb-1.5">
        <h2 class="clamp-2 text-[1.06rem] leading-[1.35] font-bold tracking-[-0.03em] md:min-h-[2.7em]">
          {{ item.title }}
        </h2>

        <p class="mt-3 text-[0.88rem] text-muted">{{ item.tutorName }}</p>

        <p class="mt-2 text-[0.82rem] text-muted">
          {{ item.questionCount }} soal · {{ formatDuration(item.durationMinutes) }}
        </p>

        <!-- Sudah pernah dikerjakan: tunjukkan hasil terbaiknya. -->
        <div v-if="stats.accuracy && stats.last" class="mt-4">
          <div class="flex items-baseline justify-between gap-3 text-[0.82rem]">
            <span class="text-muted">
              {{ stats.accuracy.correct }} dari {{ stats.accuracy.total }} benar
            </span>
            <span class="font-semibold tabular-nums">{{ stats.accuracy.percent }}%</span>
          </div>
          <span class="mt-2 block h-2 overflow-hidden rounded-pill bg-skeleton/60">
            <span
              class="block h-full rounded-pill bg-linear-to-r from-primary-light to-primary"
              :style="{ width: `${stats.accuracy.percent}%` }"
            />
          </span>
          <p class="mt-2 text-[0.78rem] text-muted">
            Dikerjakan {{ stats.attemptCount }}× · terakhir {{ formatDate(stats.last.finishedAt) }}
          </p>
        </div>

        <!-- Never attempted: no empty bar pretending to be progress. -->
        <p v-else class="mt-4 text-[0.86rem] font-semibold text-muted">
          Belum pernah dikerjakan
        </p>

        <dl class="mt-4 grid grid-cols-2 gap-3 border-t border-hairline pt-4 text-[0.82rem]">
          <div>
            <dt class="text-muted">Skor terbaik</dt>
            <dd class="mt-0.5 font-bold tabular-nums">{{ stats.best?.score ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-muted">Dibeli</dt>
            <dd class="mt-0.5 font-semibold">{{ formatDate(item.purchasedAt) }}</dd>
          </div>
        </dl>

        <!-- mt-auto pins the call to action to the card's base, like the
             catalogue card pins its price. -->
        <!-- The card opens the detail page (history + the real "kerjakan"
             button), so the label promises that, not the try out itself. -->
        <p class="mt-auto flex items-center gap-1.5 pt-3 font-bold tracking-[-0.02em] text-primary">
          {{ stats.attemptCount === 0 ? 'Buka paket' : 'Lihat progres' }}
          <span aria-hidden="true" class="transition-transform duration-200 ease-smooth group-hover:translate-x-1">→</span>
        </p>
      </div>
    </article>
  </NuxtLink>
</template>
