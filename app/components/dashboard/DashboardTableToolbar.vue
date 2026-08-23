<script setup lang="ts">
import type { TableControlOption } from '~/composables/useTableControls'

/**
 * The one toolbar above every dashboard table: search, status filter, sort
 * order, a result summary, and a Reset that only appears once something is off
 * its default.
 *
 * Deliberately generic — it knows nothing about any single table, so every
 * dashboard table (admin queues and the tutor's own lists alike) reads and
 * behaves identically. It replaces AppTabs, which could only express one axis
 * and turned "look at the decided ones" into a second click; the counts the
 * tabs used to carry live in the summary line instead (the sidebar and
 * Ringkasan badges still carry the pending counts too).
 *
 * Quiet on purpose: this is a utility bar, not a hero — hence AppTextField
 * rather than AppSearchInput (the catalogue's big shadowed form with its own
 * submit button, which would dominate the panel).
 */

/** Search term. Filtering is live, so there is no submit. */
const search = defineModel<string>('search', { required: true })
/** Selected filter value — matches one of `filterOptions`. */
const filter = defineModel<string>('filter', { required: true })
/** Selected sort value — matches one of `sortOptions`. */
const sort = defineModel<string>('sort', { required: true })

withDefaults(
  defineProps<{
    /** Unique id for the search input; its <label> points at it. */
    searchId: string
    /** Visible label for the search field, e.g. "Cari pengajuan". */
    searchLabel: string
    /** Names what is searchable, e.g. "Cari nama, email, atau bidang…". */
    searchPlaceholder: string
    filterOptions: TableControlOption[]
    sortOptions: TableControlOption[]
    /** Rows currently rendered, and rows in the whole dataset. */
    resultCount: number
    totalCount: number
    /** Plural noun for the summary line, e.g. "pengajuan". */
    itemNoun: string
    /** Rows still awaiting a decision — the signal the old tab counts carried. */
    actionableCount?: number
    /** What those rows wait for, e.g. "menunggu keputusan". */
    actionableLabel?: string
    /** True while search/filter/sort sit off their defaults — shows Reset. */
    active?: boolean
    filterLabel?: string
    sortLabel?: string
  }>(),
  {
    actionableCount: 0,
    actionableLabel: '',
    active: false,
    filterLabel: 'Status',
    sortLabel: 'Urutkan',
  },
)

defineEmits<{
  (e: 'reset'): void
}>()
</script>

<template>
  <div class="grid gap-3">
    <!-- Stacks on mobile, one row from sm up. items-start keeps the three
         labels on a single line even though the search input is taller. -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
      <!-- AppTextField and AppSelect are both hardcoded w-full, so widths are
           set on these wrappers rather than with a conflicting utility. -->
      <div class="sm:min-w-56 sm:flex-1">
        <AppTextField
          :id="searchId"
          v-model="search"
          :label="searchLabel"
          :placeholder="searchPlaceholder"
          size="sm"
          clearable
        >
          <template #leading-icon>
            <AppIcon name="magnifying-glass" :size="16" />
          </template>
        </AppTextField>
      </div>

      <div class="sm:w-48 sm:shrink-0">
        <AppSelect
          :options="filterOptions"
          :model-value="filter"
          :label="filterLabel"
          size="sm"
          @update:model-value="filter = String($event)"
        />
      </div>

      <!-- Optional extra control, rendered between filter and sort. Only used
           where a table has a second filtering axis the server owns (tutor
           Penjualan filters by product); every other table leaves it empty and
           keeps the canonical search + filter + sort shape. -->
      <slot name="filter-extra" />

      <div class="sm:w-52 sm:shrink-0">
        <AppSelect
          :options="sortOptions"
          :model-value="sort"
          :label="sortLabel"
          size="sm"
          @update:model-value="sort = String($event)"
        />
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <!-- aria-live so the count is announced while typing, not just seen. -->
      <p class="text-[0.82rem] text-muted" aria-live="polite">
        Menampilkan
        <span class="font-semibold tabular-nums text-ink">{{ resultCount }}</span>
        dari <span class="tabular-nums">{{ totalCount }}</span> {{ itemNoun }}<template v-if="actionableCount > 0 && actionableLabel">
          · <span class="font-semibold tabular-nums text-ink">{{ actionableCount }}</span> {{ actionableLabel }}</template>
      </p>

      <button
        v-if="active"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xs text-[0.82rem] font-semibold text-primary transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="$emit('reset')"
      >
        <AppIcon name="arrow-counter-clockwise" :size="14" />
        Reset
      </button>
    </div>
  </div>
</template>
