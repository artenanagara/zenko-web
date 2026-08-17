<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string
  }>(),
  {
    modelValue: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const viewMode = ref<'days' | 'months' | 'years'>('days')

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const currentYear = ref(2026)
const currentMonthIndex = ref(7) // August (0-indexed)
const selectedDay = ref(16)

const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030]
const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const formattedDate = computed(() => {
  const m = String(currentMonthIndex.value + 1).padStart(2, '0')
  const d = String(selectedDay.value).padStart(2, '0')
  return `${currentYear.value}-${m}-${d}`
})

const selectMonth = (idx: number) => {
  currentMonthIndex.value = idx
  viewMode.value = 'days'
  emit('update:modelValue', formattedDate.value)
}

const selectYear = (yr: number) => {
  currentYear.value = yr
  viewMode.value = 'months'
  emit('update:modelValue', formattedDate.value)
}

const selectDay = (d: number) => {
  selectedDay.value = d
  emit('update:modelValue', formattedDate.value)
}

const nextMonth = () => {
  if (currentMonthIndex.value === 11) {
    currentMonthIndex.value = 0
    currentYear.value++
  } else {
    currentMonthIndex.value++
  }
}

const prevMonth = () => {
  if (currentMonthIndex.value === 0) {
    currentMonthIndex.value = 11
    currentYear.value--
  } else {
    currentMonthIndex.value--
  }
}
</script>

<template>
  <div class="inline-block w-72 rounded-md border border-line bg-surface p-4 shadow-xs select-none">
    <!-- Header with Clickable Month & Year -->
    <div class="flex items-center justify-between pb-3 border-b border-line">
      <div class="flex items-center gap-1.5 font-bold text-xs">
        <button
          type="button"
          class="rounded-xs px-1.5 py-0.5 text-ink hover:bg-primary-soft hover:text-primary transition-colors cursor-pointer"
          @click="viewMode = viewMode === 'months' ? 'days' : 'months'"
        >
          {{ months[currentMonthIndex] }}
        </button>

        <button
          type="button"
          class="rounded-xs px-1.5 py-0.5 text-ink hover:bg-primary-soft hover:text-primary transition-colors cursor-pointer"
          @click="viewMode = viewMode === 'years' ? 'days' : 'years'"
        >
          {{ currentYear }}
        </button>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="p-1 rounded text-muted hover:bg-surface-alt hover:text-ink cursor-pointer transition-colors"
          @click="prevMonth"
        >
          <AppIcon name="caret-left" :size="14" />
        </button>
        <button
          type="button"
          class="p-1 rounded text-muted hover:bg-surface-alt hover:text-ink cursor-pointer transition-colors"
          @click="nextMonth"
        >
          <AppIcon name="caret-right" :size="14" />
        </button>
      </div>
    </div>

    <!-- 1. Days Grid View -->
    <div v-if="viewMode === 'days'">
      <div class="grid grid-cols-7 gap-1 pt-3 text-center text-[0.68rem] font-bold text-muted">
        <span v-for="d in daysOfWeek" :key="d">{{ d }}</span>
      </div>

      <div class="grid grid-cols-7 gap-1 pt-2 text-center text-xs">
        <!-- Offset placeholder -->
        <span v-for="i in 6" :key="`empty-${i}`" class="p-1 text-transparent">-</span>

        <button
          v-for="d in 31"
          :key="d"
          type="button"
          class="h-8 w-8 rounded-xs font-semibold transition-colors cursor-pointer flex items-center justify-center"
          :class="[
            selectedDay === d
              ? 'bg-primary text-white font-bold shadow-xs'
              : 'text-ink hover:bg-surface-alt',
          ]"
          @click="selectDay(d)"
        >
          {{ d }}
        </button>
      </div>
    </div>

    <!-- 2. Months Grid View -->
    <div v-else-if="viewMode === 'months'" class="grid grid-cols-3 gap-2 pt-3">
      <button
        v-for="(m, idx) in months"
        :key="m"
        type="button"
        class="rounded-xs py-2 text-xs font-bold transition-colors cursor-pointer"
        :class="[
          currentMonthIndex === idx
            ? 'bg-primary text-white'
            : 'bg-surface-alt text-ink hover:bg-primary-soft hover:text-primary',
        ]"
        @click="selectMonth(idx)"
      >
        {{ m.slice(0, 3) }}
      </button>
    </div>

    <!-- 3. Years Grid View -->
    <div v-else class="grid grid-cols-3 gap-2 pt-3">
      <button
        v-for="yr in years"
        :key="yr"
        type="button"
        class="rounded-xs py-2 text-xs font-mono font-bold transition-colors cursor-pointer"
        :class="[
          currentYear === yr
            ? 'bg-primary text-white'
            : 'bg-surface-alt text-ink hover:bg-primary-soft hover:text-primary',
        ]"
        @click="selectYear(yr)"
      >
        {{ yr }}
      </button>
    </div>

    <!-- Footer Selected Display -->
    <div class="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-[0.7rem] text-muted">
      <span>Terpilih:</span>
      <span class="font-mono font-bold text-primary">{{ formattedDate }}</span>
    </div>
  </div>
</template>
