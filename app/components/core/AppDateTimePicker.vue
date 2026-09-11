<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    dateValue?: string
    timeValue?: string
    label?: string
  }>(),
  {
    dateValue: '2026-08-16',
    timeValue: '09:00',
    label: 'Jadwal sesi ujian tryout',
  },
)

const emit = defineEmits<{
  (e: 'update:dateValue', val: string): void
  (e: 'update:timeValue', val: string): void
}>()

const isDateOpen = ref(false)
const isTimeOpen = ref(false)

const localDate = ref(props.dateValue)
const localTime = ref(props.timeValue)

watch(localDate, val => emit('update:dateValue', val))
watch(localTime, val => emit('update:timeValue', val))
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full text-left">
    <label v-if="label" class="text-xs font-bold text-ink">{{ label }}</label>

    <div class="flex flex-wrap items-center gap-3">
      <!-- 1. Custom Date Picker Trigger -->
      <div class="relative">
        <button
          type="button"
          class="flex min-h-11 items-center gap-2 rounded-xs border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink shadow-xs hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none cursor-pointer transition-all"
          :class="isDateOpen ? 'border-primary ring-2 ring-primary-soft' : ''"
          @click="isDateOpen = !isDateOpen; isTimeOpen = false"
        >
          <AppIcon name="calendar" :size="15" class="text-primary" />
          <span>{{ localDate }}</span>
          <AppIcon name="caret-down" :size="12" class="text-muted transition-transform" :class="isDateOpen ? 'rotate-180' : ''" />
        </button>

        <!-- Floating Custom Calendar -->
        <div v-if="isDateOpen" class="absolute top-[calc(100%+6px)] left-0 z-50 shadow-float">
          <AppCalendar v-model="localDate" @update:model-value="isDateOpen = false" />
        </div>
      </div>

      <!-- 2. Custom Time Picker Trigger -->
      <div class="relative">
        <button
          type="button"
          class="flex min-h-11 items-center gap-2 rounded-xs border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink shadow-xs hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none cursor-pointer transition-all"
          :class="isTimeOpen ? 'border-primary ring-2 ring-primary-soft' : ''"
          @click="isTimeOpen = !isTimeOpen; isDateOpen = false"
        >
          <AppIcon name="clock" :size="15" class="text-primary" />
          <span class="font-mono font-bold">{{ localTime }} WIB</span>
          <AppIcon name="caret-down" :size="12" class="text-muted transition-transform" :class="isTimeOpen ? 'rotate-180' : ''" />
        </button>

        <!-- Floating Custom Time Picker -->
        <div v-if="isTimeOpen" class="absolute top-[calc(100%+6px)] left-0 z-50 shadow-float">
          <AppTimePicker v-model="localTime" @update:model-value="isTimeOpen = false" />
        </div>
      </div>
    </div>
  </div>
</template>
