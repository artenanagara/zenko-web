<script setup lang="ts">
/**
 * Bar aksi ruang ujian. Bentuknya berbeda tajam antara HP dan desktop, dan
 * perbedaannya disengaja:
 *
 * - Desktop (md+): empat aksi berlabel penuh dalam satu baris, "Akhiri" di
 *   ujung kanan yang jauh — persis layout CAT yang ditiru halaman ini.
 * - HP (< md): satu baris rapat berisi ← / Ragu / progres / →. Empat tombol
 *   berlabel penuh tidak muat di 390px; sebelumnya mereka wrap jadi dua baris
 *   setinggi ±110px yang menutupi opsi jawaban terakhir. "Akhiri" tidak ada
 *   di sini sama sekali — ia pindah ke kaki bottom sheet, supaya aksi yang
 *   mengunci jawaban selamanya tidak bersebelahan dengan "Selanjutnya".
 *
 * Tombol progres di tengah (`12/100`) adalah pemicu sheet nomor soal, dan
 * sekaligus satu-satunya tempat hitungan itu terlihat di HP.
 */
defineProps<{
  canPrev: boolean
  canNext: boolean
  doubtful: boolean
  isLastSection: boolean
  /** Ringkasan untuk pemicu sheet di HP. */
  answeredCount: number
  totalQuestions: number
}>()

const emit = defineEmits<{
  prev: []
  next: []
  toggleDoubt: []
  endSection: []
  openNavigator: []
}>()

/** Satu kelas dasar supaya tinggi sentuh 44px berlaku untuk semua tombol. */
const TAP = 'inline-flex min-h-11 touch-manipulation items-center justify-center rounded-xs font-semibold transition-colors'
</script>

<template>
  <div
    class="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
  >
    <!-- HP: satu baris, tanpa wrap. -->
    <div class="container-page flex items-center gap-2 py-2.5 md:hidden">
      <button
        type="button"
        :disabled="!canPrev"
        :class="TAP"
        class="w-11 shrink-0 border border-hairline-strong text-ink disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Soal sebelumnya"
        @click="emit('prev')"
      >
        <IconArrowLeft class="h-4 w-4" />
      </button>

      <button
        type="button"
        :class="[
          TAP,
          'shrink-0 gap-1.5 border px-3.5 text-[0.84rem]',
          doubtful ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-hairline-strong text-ink',
        ]"
        :aria-pressed="doubtful"
        :aria-label="doubtful ? 'Batalkan tanda ragu-ragu' : 'Tandai soal ini ragu-ragu'"
        @click="emit('toggleDoubt')"
      >
        Ragu
      </button>

      <!-- Pemicu sheet: melebar mengisi sisa ruang, jadi target ibu jari
           terbesar di bar ini adalah yang paling sering dibutuhkan. -->
      <button
        type="button"
        :class="TAP"
        class="min-w-0 flex-1 gap-2 border border-hairline-strong bg-surface-alt px-3 text-[0.86rem] text-ink"
        aria-haspopup="dialog"
        @click="emit('openNavigator')"
      >
        <span class="tabular-nums">{{ answeredCount }}/{{ totalQuestions }}</span>
        <span class="truncate text-[0.8rem] font-medium text-muted">soal</span>
        <IconChevron class="h-4 w-4 shrink-0 rotate-180" aria-hidden="true" />
      </button>

      <button
        type="button"
        :disabled="!canNext"
        :class="TAP"
        class="w-11 shrink-0 border border-hairline-strong text-ink disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Soal selanjutnya"
        @click="emit('next')"
      >
        <IconArrowRight class="h-4 w-4" />
      </button>
    </div>

    <!-- Desktop: tidak berubah dari sebelumnya. -->
    <div class="container-page hidden flex-wrap items-center justify-between gap-3 py-3 md:flex">
      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="!canPrev"
          class="rounded-xs border border-hairline-strong px-4 py-2.5 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          @click="emit('prev')"
        >
          <IconArrowLeft class="inline-block h-3.5 w-3.5 -mt-0.5" /> Sebelumnya
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
          Selanjutnya <IconArrowRight class="inline-block h-3.5 w-3.5 -mt-0.5" />
        </button>
      </div>

      <AppButton size="sm" @click="emit('endSection')">
        {{ isLastSection ? 'Selesaikan Ujian' : 'Akhiri Subtes' }}
      </AppButton>
    </div>
  </div>
</template>
