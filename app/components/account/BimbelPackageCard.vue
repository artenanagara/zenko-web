<script setup lang="ts">
import type { BimbelStudentPackage } from '#shared/types/bimbel'

const props = defineProps<{ item: BimbelStudentPackage }>()

const workUrl = computed(() => ({
  path: `/akun/paket/${props.item.packageSlug}/kerjakan`,
  query: { dari: 'bimbel' },
}))
</script>

<template>
  <NuxtLink
    :to="workUrl"
    class="group flex flex-col rounded-lg bg-surface-sunken p-2 transition-transform duration-300 ease-smooth hover:-translate-y-1 focus-visible:-translate-y-1"
    :aria-label="`Kerjakan paket ${item.title} dari ${item.bimbelName}`"
  >
    <article
      class="flex flex-1 flex-col rounded-md bg-surface p-4 shadow-xs transition-shadow duration-300 ease-smooth group-hover:shadow-lift group-focus-visible:shadow-lift"
    >
      <div class="flex items-start justify-between gap-3">
        <span class="rounded-pill bg-primary-soft px-2.5 py-1 text-[0.68rem] font-bold tracking-[0.08em] text-primary uppercase">
          {{ item.category }}
        </span>
        <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-alt text-primary">
          <AppIcon name="buildings" :size="18" aria-hidden="true" />
        </span>
      </div>

      <h2 class="mt-4 clamp-2 text-[1.06rem] leading-[1.35] font-bold tracking-[-0.03em] md:min-h-[2.7em]">
        {{ item.title }}
      </h2>
      <p class="mt-3 truncate text-[0.88rem] text-muted">{{ item.bimbelName }}</p>

      <div class="mt-5 border-t border-hairline pt-4">
        <dl class="grid grid-cols-2 gap-3 text-[0.82rem]">
          <div>
            <dt class="text-muted">Dikerjakan</dt>
            <dd class="mt-0.5 font-bold tabular-nums">{{ item.attemptsUsed }}×</dd>
          </div>
          <div>
            <dt class="text-muted">Skor terbaik</dt>
            <dd class="mt-0.5 font-bold tabular-nums">{{ item.bestScore >= 0 ? item.bestScore : '-' }}</dd>
          </div>
        </dl>

        <p class="mt-4 flex items-center gap-1.5 font-bold tracking-[-0.02em] text-primary">
          {{ item.attemptsUsed ? 'Kerjakan lagi' : 'Kerjakan sekarang' }}
          <IconArrowRight aria-hidden="true" class="h-4 w-4 transition-transform duration-200 ease-smooth group-hover:translate-x-1" />
        </p>
      </div>
    </article>
  </NuxtLink>
</template>
