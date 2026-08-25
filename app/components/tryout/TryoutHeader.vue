<script setup lang="ts">
/**
 * Fixed top bar for the exam room. White, the same on every package — a
 * candidate switching between a BUMN and an SKD try out should recognise it
 * as the same product, not wonder whether they are on a different site.
 * What changes per system is content (subtest labels), never chrome colour.
 * Closer to how the real CBT systems read too: most run a plain, utilitarian
 * header rather than a solid colour block.
 */
const props = withDefaults(
  defineProps<{
    packageTitle: string
    remainingSeconds: number
    /**
     * Mode simulasi (tutor/admin menjajal soalnya sendiri, hasil tidak
     * disimpan). Menyalakan pil "Mode Simulasi" dan mengganti dasar bar jadi
     * amber — bahasa visual yang sama dengan caption "(Khusus Pratinjau
     * Tutor)" di TutorQuestionPreview, cuma jauh lebih kentara karena di sini
     * yang dipinjam adalah UI ujian sungguhan. Sesi siswa asli tidak pernah
     * mengoper prop ini, jadi tampilannya tidak berubah sedikit pun.
     */
    simulate?: boolean
  }>(),
  { simulate: false },
)

const clock = computed(() => {
  const total = Math.max(0, props.remainingSeconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
})

const isUrgent = computed(() => props.remainingSeconds <= 60)
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-40 border-b shadow-xs"
    :class="simulate ? 'border-amber-200 bg-amber-50' : 'border-hairline bg-surface'"
  >
    <!-- 56px di HP, 64px di desktop. Di layar 390px setiap piksel yang tidak
         dipakai chrome adalah piksel untuk soal, dan header ujian tidak punya
         satu pun aksi yang perlu ruang bernapas. -->
    <div class="container-page flex h-14 items-center justify-between gap-3 md:h-16 md:gap-4">
      <div class="flex min-w-0 items-center gap-2 md:gap-3">
        <!-- Ikon saja di HP: lockup penuh memakan sepertiga lebar layar,
             sementara yang benar-benar harus terbaca adalah judul paket. -->
        <BrandIcon class="h-8 w-8 shrink-0 sm:hidden" />
        <BrandMark img-class="h-9 w-auto object-contain shrink-0" class="hidden sm:block" />

        <DashboardBadge v-if="simulate" tone="warning">Mode Simulasi</DashboardBadge>

        <span class="min-w-0 truncate">
          <span class="hidden text-faint sm:inline" aria-hidden="true">·</span>
          <span class="text-[0.85rem] font-medium text-muted sm:ml-2 md:text-[0.92rem]">{{ packageTitle }}</span>
        </span>
      </div>

      <div class="flex shrink-0 items-center gap-2 md:gap-2.5">
        <!-- Kosong pada sesi siswa; simulasi menaruh tombol "Keluar" di sini. -->
        <slot name="action" />

        <div
          class="flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 tabular-nums md:gap-2 md:px-3"
          :class="isUrgent ? 'animate-pulse bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-primary-soft text-primary ring-1 ring-primary/15'"
          role="timer"
          aria-live="polite"
        >
          <IconAlert v-if="isUrgent" class="h-4 w-4" />
          <span class="text-[0.98rem] font-extrabold md:text-[1.05rem]">{{ clock }}</span>
        </div>
      </div>
    </div>
  </header>
</template>
