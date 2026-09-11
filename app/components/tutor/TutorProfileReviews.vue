<script setup lang="ts">
import type { ProductReview } from '#shared/types/product-review'

const props = defineProps<{
  reviews: ProductReview[]
  pending: boolean
  failed: boolean
  ratingAverage: number
  ratingCount: number
  tutorName: string
  hasProducts: boolean
}>()

const emit = defineEmits<{ retry: [] }>()

/** How many reviews render before the first "muat lagi". */
const PAGE_SIZE = 8

/**
 * The headline average and count come from `stats`, which arrives with the
 * page, so the summary is already correct in the SSR HTML and never flickers.
 * Only the 5→1 breakdown has to wait for the list — the aggregate carries no
 * per-star counts, so it is tallied here.
 *
 * Safe to derive: the API's `ListByTutor` and the aggregate behind `stats`
 * both filter on `is_published`, so the two totals cover the same rows.
 */
const distribution = computed(() => {
  const total = props.reviews.length || 1
  return [5, 4, 3, 2, 1].map((star) => {
    const count = props.reviews.filter(review => review.rating === star).length
    return { star, count, percent: Math.round((count / total) * 100) }
  })
})

/**
 * Filtering happens here rather than through a `?rating=` request on purpose:
 * the distribution bars are computed from the full array, so narrowing the
 * fetch would make the very control you just used disappear.
 */
const activeStar = ref<number | null>(null)
const visibleCount = ref(PAGE_SIZE)

const filteredReviews = computed(() =>
  activeStar.value === null
    ? props.reviews
    : props.reviews.filter(review => review.rating === activeStar.value),
)
const visibleReviews = computed(() => filteredReviews.value.slice(0, visibleCount.value))
const remaining = computed(() => filteredReviews.value.length - visibleReviews.value.length)

// A filter that outlives the list it was chosen from strands the panel on an
// empty result — e.g. "Coba lagi" succeeding with a different set of reviews.
watch(() => props.reviews, () => {
  activeStar.value = null
  visibleCount.value = PAGE_SIZE
})

// Changing the filter restarts paging; keeping the old offset would show a
// list that is already cut off at a position chosen for a different filter.
watch(activeStar, () => (visibleCount.value = PAGE_SIZE))

function toggleStar(star: number) {
  activeStar.value = activeStar.value === star ? null : star
}

function clearFilter() {
  activeStar.value = null
}

const reviewList = ref<HTMLElement | null>(null)

/**
 * "Muat lagi" removes itself once nothing is left, which would drop keyboard
 * focus onto <body>. When that is about to happen, focus moves to the first
 * review that just appeared instead — the thing the click was asking for.
 */
function loadMore() {
  const firstNewIndex = visibleCount.value
  visibleCount.value += PAGE_SIZE
  nextTick(() => {
    if (remaining.value > 0) return
    const items = reviewList.value?.querySelectorAll<HTMLElement>('[data-review-item]')
    items?.[firstNewIndex]?.focus()
  })
}

/** `ratingCount` is authoritative — a tutor with 0 has nothing to summarise. */
const hasRatings = computed(() => props.ratingCount > 0)
const averageLabel = computed(() => props.ratingAverage.toFixed(1))
const roundedAverage = computed(() => Math.round(props.ratingAverage))

const emptyDescription = computed(() =>
  props.hasProducts
    ? `Ulasan muncul setelah siswa menyelesaikan paket dari ${props.tutorName} dan memberi penilaian.`
    : `Ulasan muncul setelah ada siswa yang mengerjakan paket dari ${props.tutorName}.`,
)
</script>

<template>
  <!-- 279 (1116px) = sidebar 322 + jarak 40 + kolom ulasan ~750. Lebar
       sectionnya ikut naik bersama sidebar supaya yang melebar cuma panel
       ringkasan; kolom ulasan tetap ~760px, lebar baca yang sama dengan
       daftar ulasan di /paket/:slug. -->
  <section class="max-w-279">
    <TutorProfileEmpty
      v-if="!hasRatings && !failed"
      icon="chat-circle-text"
      title="Ulasannya masih kosong"
      :description="emptyDescription"
    />

    <template v-else>
      <!-- Ringkasan kiri, daftar kanan. Grid hanya dipecah kalau ringkasannya
           memang ada — kalau tidak, kolom pertama akan menyisakan lubang
           selebar 248px di sebelah pesan gagal-muat. -->
      <div class="grid gap-8" :class="hasRatings ? 'lg:grid-cols-[322px_minmax(0,1fr)] lg:gap-10' : ''">
        <!-- `self-start` wajib: tanpa itu item grid meregang setinggi kolom
             kanan dan sticky tidak pernah punya ruang untuk menempel.
             top-36 (144px) = tinggi header 80 + strip tab 57 + sedikit napas. -->
        <aside
          v-if="hasRatings"
          class="rounded-lg border border-hairline bg-surface-alt p-5 lg:sticky lg:top-36 lg:self-start"
        >
          <div class="flex items-baseline gap-1.5">
            <p class="text-[2.25rem] leading-none font-bold tracking-[-0.04em]">{{ averageLabel }}</p>
            <p class="text-[0.84rem] text-muted">dari 5</p>
          </div>
          <p
            class="mt-2 flex items-center gap-0.5"
            :aria-label="`Rata-rata ${averageLabel} dari 5 bintang`"
          >
            <IconStar
              v-for="star in 5"
              :key="star"
              class="h-4 w-4"
              :class="star <= roundedAverage ? 'text-star' : 'text-line'"
            />
          </p>
          <p class="mt-1.5 text-[0.84rem] text-muted">{{ ratingCount }} ulasan</p>

        <!-- Bars are the only part that waits on the client fetch, so they —
             and not the numbers next to them — are what gets skeletoned.
             Each bar with results behind it is a real <button>: pressing it
             narrows the list below, pressing it again clears the filter. -->
        <ul class="mt-4 grid gap-0.5" :aria-busy="pending">
          <li v-for="bucket in distribution" :key="bucket.star">
            <component
              :is="bucket.count > 0 && !pending && !failed ? 'button' : 'div'"
              :type="bucket.count > 0 && !pending && !failed ? 'button' : undefined"
              :aria-pressed="bucket.count > 0 && !pending && !failed ? activeStar === bucket.star : undefined"
              :aria-label="
                bucket.count > 0 && !pending && !failed
                  ? `Saring ${bucket.count} ulasan ${bucket.star} bintang`
                  : undefined
              "
              class="flex min-h-11 w-full items-center gap-3 rounded-xs px-2 text-left transition-colors duration-200 ease-smooth"
              :class="
                bucket.count > 0 && !pending && !failed
                  ? activeStar === bucket.star
                    ? 'cursor-pointer bg-primary-soft'
                    : 'cursor-pointer hover:bg-surface-sunken'
                  : ''
              "
              @click="bucket.count > 0 && !pending && !failed && toggleStar(bucket.star)"
            >
              <span
                class="w-9 shrink-0 text-[0.84rem] tabular-nums"
                :class="activeStar === bucket.star ? 'font-bold text-primary' : 'text-muted'"
              >
                {{ bucket.star }} <span aria-hidden="true">★</span>
              </span>
              <span class="h-2 flex-1 overflow-hidden rounded-pill bg-line">
                <span
                  v-if="!pending && !failed"
                  class="block h-full rounded-pill bg-star"
                  :style="{ width: `${bucket.percent}%` }"
                />
                <span v-else class="block h-full w-full rounded-pill bg-skeleton" />
              </span>
              <span
                class="w-6 shrink-0 text-right text-[0.84rem] tabular-nums"
                :class="activeStar === bucket.star ? 'font-bold text-primary' : 'text-muted'"
              >
                {{ pending || failed ? '' : bucket.count }}
              </span>
            </component>
          </li>
        </ul>
        </aside>

      <!-- Kolom kanan: seluruh rantai v-if/v-else-if daftar ulasan. -->
      <div class="min-w-0">
      <!-- Failure has to be visible: a silently empty panel is indistinguishable
           from a tutor who simply has no reviews. -->
      <div
        v-if="failed"
        class="rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center"
        
      >
        <span aria-hidden="true" class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger-ink">
          <AppIcon name="warning-circle" :size="26" />
        </span>
        <p class="mt-4 font-bold tracking-[-0.02em]">Ulasan belum berhasil dimuat</p>
        <p class="mt-1.5 text-[0.92rem] text-muted">Periksa koneksimu lalu coba lagi.</p>
        <AppButton variant="outline" size="sm" class="mt-5 min-h-11 bg-surface" @click="emit('retry')">
          <AppIcon name="arrow-clockwise" :size="17" />
          Coba lagi
        </AppButton>
      </div>

      <div v-else-if="pending && !reviews.length" class="grid gap-4" aria-busy="true">
        <span class="sr-only">Memuat ulasan…</span>
        <div v-for="row in 3" :key="row" class="grid gap-2.5 rounded-md border border-hairline bg-surface p-4 sm:p-5">
          <div class="h-4 w-40 rounded-xs bg-skeleton" />
          <div class="h-3 w-full rounded-xs bg-skeleton" />
          <div class="h-3 w-4/5 rounded-xs bg-skeleton" />
        </div>
      </div>

      <div v-else-if="reviews.length">
        <!-- Says out loud how much of the list is on screen, so a filter or a
             page limit never reads as "the other reviews are gone". -->
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p class="text-[0.88rem] text-muted" aria-live="polite">
            Menampilkan {{ visibleReviews.length }} dari {{ filteredReviews.length }} ulasan{{ activeStar !== null ? ` ${activeStar} bintang` : '' }}
          </p>
          <button
            v-if="activeStar !== null"
            type="button"
            class="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-[0.88rem] font-semibold text-primary transition-colors duration-200 ease-smooth hover:text-primary-dark hover:underline"
            @click="clearFilter"
          >
            <AppIcon name="x" :size="15" weight="bold" />
            Tampilkan semua ulasan
          </button>
        </div>

        <div v-if="visibleReviews.length" ref="reviewList" class="mt-4 grid gap-4">
          <article
            v-for="review in visibleReviews"
            :key="review.id"
            data-review-item
            tabindex="-1"
            class="rounded-md border border-hairline bg-surface p-4 sm:p-5"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-semibold break-words">{{ review.isAnonymous ? 'Siswa anonim' : review.authorName }}</p>
              <p class="flex items-center gap-0.5" :aria-label="`${review.rating} dari 5 bintang`">
                <IconStar
                  v-for="star in 5"
                  :key="star"
                  class="h-3.5 w-3.5"
                  :class="star <= review.rating ? 'text-star' : 'text-line'"
                />
              </p>
            </div>

            <p class="mt-1 flex flex-wrap items-center gap-x-1.5 text-[0.82rem] text-muted">
              <NuxtLink
                v-if="review.productSlug && review.productTitle"
                :to="`/paket/${review.productSlug}`"
                class="font-semibold text-primary hover:underline"
              >{{ review.productTitle }}</NuxtLink>
              <span v-else-if="review.productTitle">{{ review.productTitle }}</span>
              <span v-if="review.productTitle" aria-hidden="true" class="opacity-60">·</span>
              <span>{{ formatDate(review.createdAt) }}</span>
            </p>

            <ul v-if="review.tags.length" class="mt-3 flex flex-wrap gap-1.5">
              <li
                v-for="tag in review.tags"
                :key="tag"
                class="rounded-pill bg-surface-sunken px-2.5 py-1 text-[0.78rem] font-medium text-muted"
              >{{ tag }}</li>
            </ul>

            <p v-if="review.reviewText" class="mt-3 leading-[1.65] text-muted">{{ review.reviewText }}</p>

            <div v-if="review.tutorReplyText" class="mt-4 border-l-2 border-primary/30 pl-3 text-[0.88rem] leading-[1.65] text-muted">
              <span class="font-semibold text-ink">Balasan {{ tutorName }}:</span> {{ review.tutorReplyText }}
            </div>
          </article>
        </div>

        <!-- Only reachable if the list changed under an active filter; the
             zero buckets are not clickable in the first place. -->
        <div v-else class="mt-4 rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center">
          <p class="font-bold tracking-[-0.02em]">Ulasan {{ activeStar }} bintang belum tersedia.</p>
          <AppButton variant="outline" size="sm" class="mt-4 min-h-11 bg-surface" @click="clearFilter">
            Tampilkan semua ulasan
          </AppButton>
        </div>

        <div v-if="remaining > 0" class="mt-6 flex justify-center">
          <AppButton variant="outline" size="sm" class="min-h-11 bg-surface" @click="loadMore">
            Muat {{ Math.min(remaining, PAGE_SIZE) }} ulasan lagi
            <AppIcon name="caret-down" :size="16" weight="bold" />
          </AppButton>
        </div>
      </div>

      <!-- ratingCount says there are ratings but none of them carry a row we
           can render — treat it as the empty list it is, not as a blank area. -->
      <TutorProfileEmpty
        v-else
        icon="chat-circle-text"
        title="Ulasannya masih kosong"
        :description="emptyDescription"
      />
      </div>
      </div>
    </template>
  </section>
</template>
