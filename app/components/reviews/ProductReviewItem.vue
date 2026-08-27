<script setup lang="ts">
import type { ProductReview } from '#shared/types/product-review'

/**
 * One ulasan, rendered the same way wherever it appears — the public list on
 * /paket/:slug and the "Ulasanmu" panel in the account.
 *
 * `isMine` is what carries the edit affordance: a student who has already
 * reviewed a paket no longer gets a second form underneath the list, they
 * edit the ulasan they are looking at.
 */
defineProps<{ review: ProductReview, isMine?: boolean }>()
const emit = defineEmits<{ edit: [] }>()
</script>

<template>
  <article class="rounded-md border bg-surface p-4" :class="isMine ? 'border-primary/30 bg-primary-soft/20' : 'border-hairline'">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="flex flex-wrap items-center gap-2 font-semibold">
        {{ review.isAnonymous ? 'Siswa anonim' : review.authorName }}
        <span v-if="isMine" class="rounded-pill bg-primary-soft px-2 py-0.5 text-[0.72rem] font-bold text-primary">Ulasanmu</span>
      </p>
      <p class="text-star" :aria-label="`${review.rating} dari 5 bintang`">{{ '★'.repeat(review.rating) }}<span class="text-faint">{{ '★'.repeat(5 - review.rating) }}</span></p>
    </div>
    <p v-if="review.tags.length" class="mt-2 text-[0.8rem] text-muted">{{ review.tags.join(' · ') }}</p>
    <p v-if="review.reviewText" class="mt-3 leading-[1.65] text-muted">{{ review.reviewText }}</p>
    <div v-if="review.tutorReplyText" class="mt-4 border-l-2 border-primary/30 pl-3 text-[0.88rem] text-muted">
      <span class="font-semibold text-ink">Balasan tutor:</span> {{ review.tutorReplyText }}
    </div>
    <div v-if="isMine" class="mt-4 flex flex-wrap items-center gap-3 border-t border-hairline pt-3">
      <button
        type="button"
        class="inline-flex cursor-pointer items-center gap-1.5 text-[0.86rem] font-semibold text-primary transition-colors hover:text-primary-light"
        @click="emit('edit')"
      >
        <AppIcon name="pencil-simple" :size="15" weight="bold" />
        Edit ulasan
      </button>
      <span v-if="review.isAnonymous" class="text-[0.8rem] text-muted">Tampil anonim untuk siswa lain</span>
    </div>
  </article>
</template>
