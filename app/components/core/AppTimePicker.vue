<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string
  }>(),
  {
    modelValue: '09:00',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const selectedHour = ref(props.modelValue.split(':')[0] || '09')
const selectedMinute = ref(props.modelValue.split(':')[1] || '00')

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

const presets = [
  { label: 'Pagi (09:00)', value: '09:00' },
  { label: 'Siang (13:30)', value: '13:30' },
  { label: 'Sore (16:00)', value: '16:00' },
  { label: 'Malam (19:30)', value: '19:30' },
]

const updateTime = () => {
  const formatted = `${selectedHour.value}:${selectedMinute.value}`
  emit('update:modelValue', formatted)
}

const applyPreset = (val: string) => {
  const [h, m] = val.split(':')
  selectedHour.value = h ?? selectedHour.value
  selectedMinute.value = m ?? selectedMinute.value
  emit('update:modelValue', val)
}
</script>

<template>
  <div class="inline-block w-72 rounded-md border border-line bg-surface p-4 shadow-xs select-none space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between pb-2 border-b border-line">
      <span class="text-xs font-bold text-ink flex items-center gap-1.5">
        <AppIcon name="clock" :size="14" class="text-primary" />
        <span>Pilih Jam Ujian (WIB)</span>
      </span>
      <span class="font-mono text-sm font-extrabold text-primary bg-primary-soft px-2 py-0.5 rounded-xs">
        {{ selectedHour }}:{{ selectedMinute }}
      </span>
    </div>

    <!-- Quick Presets -->
    <div class="flex flex-wrap gap-1">
      <button
        v-for="p in presets"
        :key="p.value"
        type="button"
        class="rounded-xs bg-surface-alt border border-line px-2 py-0.5 text-[0.65rem] font-semibold text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer"
        @click="applyPreset(p.value)"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- 2 Column Selector (Hours & Minutes) -->
    <div class="grid grid-cols-2 gap-2 pt-1">
      <!-- Hours Column -->
      <div class="space-y-1">
        <span class="text-[0.65rem] font-bold text-muted uppercase tracking-wider block text-center">Jam</span>
        <div class="h-40 overflow-y-auto rounded-xs border border-line bg-surface-sunken p-1 space-y-0.5">
          <button
            v-for="h in hours"
            :key="h"
            type="button"
            class="flex w-full items-center justify-center rounded-xs py-1.5 text-xs font-mono font-bold transition-colors cursor-pointer"
            :class="[
              selectedHour === h
                ? 'bg-primary text-white shadow-xs'
                : 'text-ink hover:bg-surface',
            ]"
            @click="selectedHour = h; updateTime()"
          >
            {{ h }}
          </button>
        </div>
      </div>

      <!-- Minutes Column -->
      <div class="space-y-1">
        <span class="text-[0.65rem] font-bold text-muted uppercase tracking-wider block text-center">Menit</span>
        <div class="h-40 overflow-y-auto rounded-xs border border-line bg-surface-sunken p-1 space-y-0.5">
          <button
            v-for="m in minutes"
            :key="m"
            type="button"
            class="flex w-full items-center justify-center rounded-xs py-1.5 text-xs font-mono font-bold transition-colors cursor-pointer"
            :class="[
              selectedMinute === m
                ? 'bg-primary text-white shadow-xs'
                : 'text-ink hover:bg-surface',
            ]"
            @click="selectedMinute = m; updateTime()"
          >
            {{ m }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
