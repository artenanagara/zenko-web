<script setup lang="ts">
import type { PublicTutorDetail } from '#shared/types/public-tutor'

/**
 * Identity band at the top of /tutor/:username: who this is, what they teach,
 * and the few numbers that are actually true about them.
 *
 * No action buttons live here: Zenko has no follow/hire relationship, and the
 * one honest jump ("lihat paket") is already what the stat pills do. Social
 * links belong to the Tentang tab, next to the rest of the profile.
 */
const props = defineProps<{
  tutor: PublicTutorDetail
  displayName: string
  avatarUrl: string
}>()

const emit = defineEmits<{ 'select-tab': [tab: string] }>()

const initial = computed(() => props.displayName.trim().charAt(0).toUpperCase() || 'Z')
const totalQuestions = computed(() =>
  props.tutor.products.reduce((sum, product) => sum + (product.questionCount || 0), 0),
)

/**
 * Stat pills, UI8-style — but unlike UI8's, these are real buttons that move
 * the tab, so the button shape is honest.
 *
 * Zero is handled per pill rather than uniformly: "0 paket aktif" is a true,
 * useful fact and stays (just not clickable); a "0,0" rating would read as a
 * bad tutor when it means "no data yet", so it becomes a plain label; and a
 * second empty pill next to it ("0 ulasan") only makes a new profile look
 * broken, so that one disappears entirely.
 */
interface StatPill {
  key: string
  icon: string
  text: string
  strong?: string
  tab?: string
  ariaLabel?: string
}

const stats = computed<StatPill[]>(() => {
  const { activePackages, ratingAverage, ratingCount } = props.tutor.stats
  const items: StatPill[] = [
    {
      key: 'paket',
      icon: 'squares-four',
      strong: String(activePackages),
      text: 'paket aktif',
      ...(activePackages > 0
        ? { tab: 'produk', ariaLabel: `Lihat ${activePackages} paket dari ${props.displayName}` }
        : {}),
    },
  ]

  items.push(
    ratingCount > 0
      ? {
          key: 'rating',
          icon: 'star',
          strong: ratingAverage.toFixed(1),
          text: 'rating',
          tab: 'ulasan',
          ariaLabel: `Rating rata-rata ${ratingAverage.toFixed(1)} dari 5, lihat ulasan`,
        }
      : { key: 'rating', icon: 'star', text: 'Belum ada rating' },
  )

  if (ratingCount > 0) {
    items.push({
      key: 'ulasan',
      icon: 'chat-circle-text',
      strong: String(ratingCount),
      text: 'ulasan',
      tab: 'ulasan',
      ariaLabel: `Lihat ${ratingCount} ulasan untuk ${props.displayName}`,
    })
  }

  if (totalQuestions.value > 0) {
    items.push({
      key: 'soal',
      icon: 'list-checks',
      strong: totalQuestions.value.toLocaleString('id-ID'),
      text: 'soal',
    })
  }

  return items
})

/** Long specialization lists would push the pills below the fold on mobile. */
const VISIBLE_SPECIALIZATIONS = 4
const specializationLabel = computed(() => {
  const all = props.tutor.profile.specializations
  if (all.length <= VISIBLE_SPECIALIZATIONS) return all.join(' \u00B7 ')
  const shown = all.slice(0, VISIBLE_SPECIALIZATIONS).join(' \u00B7 ')
  return `${shown} \u00B7 +${all.length - VISIBLE_SPECIALIZATIONS} lainnya`
})

</script>

<template>
  <section class="border-b border-line bg-surface-alt">
    <div class="container-page py-8 md:py-12">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-9">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="`Foto ${displayName}`"
          class="h-22 w-22 shrink-0 rounded-full bg-surface object-cover ring-4 ring-surface sm:h-28 sm:w-28 lg:h-33 lg:w-33"
        >
        <span
          v-else
          aria-hidden="true"
          class="inline-flex h-22 w-22 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[2rem] font-bold text-primary ring-4 ring-surface sm:h-28 sm:w-28 sm:text-[2.5rem] lg:h-33 lg:w-33 lg:text-[3rem]"
        >{{ initial }}</span>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 class="text-[clamp(1.7rem,4vw,2.6rem)] leading-[1.1] tracking-[-0.04em] break-words">
              {{ displayName }}
            </h1>
            <span
              v-if="tutor.verified"
              class="inline-flex items-center gap-1.5 rounded-pill bg-success-soft px-2.5 py-1 text-[0.76rem] font-bold text-success-ink"
            >
              <AppIcon name="seal-check" :size="14" weight="fill" />
              Tutor terverifikasi
            </span>
          </div>

          <p v-if="tutor.username" class="mt-1.5 text-[0.9rem] text-muted">@{{ tutor.username }}</p>
          <p v-if="tutor.profile.specializations.length" class="mt-2 max-w-160 text-muted">
            {{ specializationLabel }}
          </p>

          <ul class="mt-5 flex flex-wrap items-center gap-2">
            <li v-for="stat in stats" :key="stat.key">
              <!-- Only the pills that actually move a tab render as buttons —
                   a button shape with nothing behind it is the dishonest part
                   of the UI8 original. -->
              <component
                :is="stat.tab ? 'button' : 'span'"
                :type="stat.tab ? 'button' : undefined"
                :aria-label="stat.ariaLabel"
                class="inline-flex min-h-11 items-center gap-2 rounded-pill border border-hairline-strong bg-surface px-4 text-[0.9rem] text-muted transition-[color,border-color,background] duration-200 ease-smooth"
                :class="stat.tab ? 'cursor-pointer hover:border-primary/40 hover:bg-primary-soft/40 hover:text-primary' : ''"
                @click="stat.tab && emit('select-tab', stat.tab)"
              >
                <AppIcon
                  :name="stat.icon"
                  :size="16"
                  :weight="stat.key === 'rating' && stat.strong ? 'fill' : 'regular'"
                  :class="stat.key === 'rating' && stat.strong ? 'text-star' : ''"
                />
                <span v-if="stat.strong" class="font-bold tabular-nums text-ink">{{ stat.strong }}</span>
                {{ stat.text }}
              </component>
            </li>
          </ul>
        </div>

      </div>
    </div>
  </section>
</template>
