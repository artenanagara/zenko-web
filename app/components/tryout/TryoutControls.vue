<script setup lang="ts">
defineProps<{
  canPrev: boolean
  canNext: boolean
  doubtful: boolean
  isLastSection: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
  toggleDoubt: []
  endSection: []
}>()
</script>

<template>
  <div class="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur-md">
    <div class="container-page flex flex-wrap items-center justify-between gap-3 py-3">
      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="!canPrev"
          class="rounded-xs border border-hairline-strong px-4 py-2.5 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          @click="emit('prev')"
        >
          ← Sebelumnya
        </button>
        <button
          type="button"
          class="rounded-xs border px-4 py-2.5 text-[0.88rem] font-semibold transition-colors"
          :class="doubtful ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-hairline-strong text-ink hover:bg-surface-alt'"
          @click="emit('toggleDoubt')"
        >
          {{ doubtful ? 'Batalkan ragu-ragu' : 'Ragu-ragu' }}
        </button>
        <button
          v-if="canNext"
          type="button"
          class="rounded-xs border border-hairline-strong px-4 py-2.5 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-surface-alt"
          @click="emit('next')"
        >
          Selanjutnya →
        </button>
      </div>

      <AppButton size="sm" @click="emit('endSection')">
        {{ isLastSection ? 'Selesaikan Ujian' : 'Akhiri Subtes' }}
      </AppButton>
    </div>
  </div>
</template>
