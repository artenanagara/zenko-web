<script setup lang="ts">
/**
 * Lencana "Pembayaran berhasil" di /pembayaran/:invoice.
 *
 * `celebrate` membedakan dua situasi yang tampilannya sama-sama "sudah
 * lunas" tapi maknanya beda: true hanya saat status baru saja berpindah dari
 * pending/verifying ke paid selagi halaman ini terbuka — lihat `livePaid` di
 * payment.vue, yang cuma diisi oleh callback polling (`resumeWaiting`'s
 * `onPaid`), bukan oleh fetch awal. Itu satu-satunya momen yang pantas
 * dirayakan; membuka invoice yang memang sudah lunas (bookmark, refresh
 * setelah lunas) memakai lencana statis supaya animasinya tidak terputar
 * ulang setiap kali halaman dibuka.
 */
const { celebrate = false } = defineProps<{ celebrate?: boolean }>()

const CONFETTI_COLORS = [
  'var(--color-primary)',
  'var(--color-primary-light)',
  'var(--color-success)',
  'var(--color-star)',
] as const

/** 10 titik menyebar merata di sekeliling lencana, warna dan jeda diselang-seling
 * supaya semburannya terasa organik, bukan seperti cincin yang berputar rapi. */
const confetti = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2
  const distance = 42 + (i % 3) * 10
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
    delay: (i % 5) * 35,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }
})
</script>

<template>
  <span
    class="psb-badge relative inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-ink"
    :class="{ 'psb-pop': celebrate }"
    aria-hidden="true"
  >
    <template v-if="celebrate">
      <span
        v-for="(dot, i) in confetti"
        :key="i"
        class="psb-dot"
        :style="{ '--x': `${dot.x}px`, '--y': `${dot.y}px`, '--delay': `${dot.delay}ms`, background: dot.color }"
      />
      <svg class="psb-check h-9 w-9" viewBox="0 0 36 36" fill="none">
        <circle class="psb-ring" cx="18" cy="18" r="15" stroke="currentColor" stroke-width="2.5" />
        <path class="psb-tick" d="M11 18.5L15.5 23L25 12.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </template>
    <IconCheckCircle v-else class="h-9 w-9" />
  </span>
</template>

<style scoped>
/* Lencana muncul dengan sedikit overshoot, bukan langsung ukuran penuh —
   ritme yang sama seperti zenko-draw di design system, tapi sekali jalan
   (bukan loop) karena momen ini tidak akan terulang selama halaman terbuka. */
.psb-pop {
  animation: psb-pop 0.45s var(--ease-smooth) both;
}

@keyframes psb-pop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  60% {
    transform: scale(1.06);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Lingkaran dan centangnya digambar berurutan (stroke-dashoffset ke 0),
   bukan langsung muncul penuh — lingkaran dulu, baru centangnya menyusul
   begitu lingkarannya "selesai". */
.psb-ring {
  stroke-dasharray: 95;
  stroke-dashoffset: 95;
  animation: psb-draw 0.5s var(--ease-smooth) 0.05s forwards;
}

.psb-tick {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: psb-draw 0.3s var(--ease-smooth) 0.45s forwards;
}

@keyframes psb-draw {
  to {
    stroke-dashoffset: 0;
  }
}

/* Semburan titik-titik kecil dari tengah lencana, memudar sambil menjauh.
   --x/--y datang dari style inline per titik (lihat script), jadi satu
   keyframe ini cukup untuk seluruh pola. */
.psb-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  height: 6px;
  width: 6px;
  margin: -3px;
  border-radius: 999px;
  opacity: 0;
  animation: psb-burst 0.7s ease-out var(--delay, 0ms) forwards;
}

@keyframes psb-burst {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--x), var(--y)) scale(0);
    opacity: 0;
  }
}
</style>
