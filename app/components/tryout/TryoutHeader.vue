<script setup lang="ts">
/**
 * Fixed top bar for the exam room. White, the same on every package — a
 * candidate switching between a BUMN and an SKD try out should recognise it
 * as the same product, not wonder whether they are on a different site.
 * What changes per system is content (subtest labels), never chrome colour.
 * Closer to how the real CBT systems read too: most run a plain, utilitarian
 * header rather than a solid colour block.
 */
import type { TryoutBrand } from '#shared/types/tryout'

const props = withDefaults(
  defineProps<{
    packageTitle: string
    remainingSeconds: number
    /**
     * Bimbel penyelenggara paket ini. Saat ada logonya, logo itulah yang
     * dipakai di kiri header — bagi siswa sebuah bimbel, ruang ujian ini
     * adalah ruang ujian lembaganya — dan Zenko turun jadi baris "Powered by"
     * di bawahnya. Bimbel tanpa logo tetap memakai lockup Zenko: nama saja
     * bukan pengganti logo, dan header ujian bukan tempat memajang teks
     * panjang.
     */
    brand?: TryoutBrand | null
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
  { simulate: false, brand: null },
)

/**
 * Logo pihak ketiga: URL-nya milik bimbel, jadi bisa saja mati. Sekali gagal
 * dimuat, header kembali ke lockup Zenko alih-alih menyisakan ikon rusak.
 */
const brandLogoFailed = ref(false)
watch(() => props.brand?.logoUrl, () => {
  brandLogoFailed.value = false
})
const brandLogo = computed(() => {
  const url = props.brand?.logoUrl?.trim()
  return url && !brandLogoFailed.value ? url : ''
})

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
        <!-- Logo bimbel menggantikan lockup Zenko, dengan atribusi kecil di
             bawahnya supaya asal platformnya tetap jelas. Bukan tautan:
             tidak ada satu pun hal di header ujian yang boleh membawa siswa
             keluar dari sesi yang sedang berjalan. -->
        <span v-if="brandLogo" class="flex shrink-0 flex-col items-start gap-0.5">
          <img
            :src="brandLogo"
            :alt="brand?.name ?? ''"
            class="h-7 w-auto max-w-[88px] object-contain md:h-9 md:max-w-[168px]"
            @error="brandLogoFailed = true"
          />
          <!-- Di HP atribusinya huruf kecil dan rapat: versi kapital selebar
               96px, dan setiap piksel yang dipakainya diambil dari judul
               paket di sebelahnya. -->
          <span class="text-[0.55rem] leading-none font-semibold text-faint md:text-[0.62rem] md:tracking-[0.04em] md:uppercase">
            Powered by <span class="text-primary">Zenko</span>
          </span>
        </span>

        <!-- Ikon saja di HP: lockup penuh memakan sepertiga lebar layar,
             sementara yang benar-benar harus terbaca adalah judul paket. -->
        <template v-else>
          <BrandIcon class="h-8 w-8 shrink-0 sm:hidden" />
          <BrandMark img-class="h-9 w-auto object-contain shrink-0" class="hidden sm:block" />
        </template>

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
