<script setup lang="ts">
import type { TryoutNavigatorGroup } from '~/composables/useTryoutSession'

/**
 * Ruang ujian versi HP: panel nomor soal naik dari bawah layar, bukan
 * menggantung di bawah kartu soal.
 *
 * Alasannya bukan estetika. Di layar 390px, panel yang menempel di bawah
 * kartu soal berada 2–3 layar di bawah lipatan — untuk loncat dari soal 12 ke
 * soal 78 seorang siswa harus melewati seluruh stimulus dan lima opsi dulu,
 * lalu scroll balik. Sheet ini menaruh grid nomor satu ketukan dari ibu jari
 * tanpa mengambil ruang permanen dari soal, yang persis pola dipakai aplikasi
 * CBT mobile sungguhan.
 *
 * Tombol "Akhiri Subtes/Selesaikan Ujian" ikut pindah ke sini, jauh dari
 * "Selanjutnya" di bar bawah. Di desktop keduanya berjauhan secara alami;
 * di HP, aksi yang mengunci jawaban selamanya tidak boleh bersebelahan
 * dengan aksi yang ditekan puluhan kali per sesi.
 *
 * Hanya ada di bawah `md` — desktop tetap memakai rail TryoutNavigator.
 */
const props = defineProps<{
  open: boolean
  groups: TryoutNavigatorGroup[]
  currentIndex: number
  answeredCount: number
  doubtfulCount: number
  totalQuestions: number
  statusOf: (id: string) => 'answered' | 'doubtful' | 'unanswered'
  isLastSection: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'jump': [index: number]
  'endSection': []
}>()

const panel = useTemplateRef('panel')
const titleId = useId()

function close() {
  emit('update:open', false)
}

/** Memilih nomor berarti selesai dengan panelnya — sheet menutup sendiri. */
function jump(index: number) {
  emit('jump', index)
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

// Halaman di belakang sheet tidak boleh ikut bergulir — di iOS itu yang
// membuat sheet terasa "lepas" dari kontennya.
watch(() => props.open, async (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (!open) return
  await nextTick()
  panel.value?.focus()
})

// Melewati md menyembunyikan sheet lewat CSS; state-nya harus ikut ditutup,
// atau kunci scroll di atas akan selamat dari resize dan mengunci halaman.
let viewport: MediaQueryList | null = null
function onViewportChange(event: MediaQueryListEvent) {
  if (event.matches && props.open) close()
}

onMounted(() => {
  viewport = window.matchMedia('(min-width: 768px)')
  viewport.addEventListener('change', onViewportChange)
})

onBeforeUnmount(() => {
  viewport?.removeEventListener('change', onViewportChange)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="md:hidden">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-smooth"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-smooth"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-40 bg-ink/50" aria-hidden="true" @click="close" />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-250 ease-smooth"
      enter-from-class="translate-y-full"
      leave-active-class="transition-transform duration-200 ease-smooth"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="open"
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        class="fixed inset-x-0 bottom-0 z-50 flex max-h-[82svh] flex-col rounded-t-lg border-t border-hairline bg-surface shadow-lift outline-none"
        @keydown="onKeydown"
      >
        <!-- Grip + ringkasan progres: dua hal yang paling dicari saat panel
             dibuka, sebelum grid nomornya. -->
        <div class="shrink-0 px-5 pt-3 pb-4">
          <span class="mx-auto block h-1 w-10 rounded-pill bg-hairline-strong" aria-hidden="true" />

          <div class="mt-3 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 :id="titleId" class="text-[0.98rem] font-bold tracking-[-0.02em]">Navigasi soal</h2>
              <p class="mt-0.5 text-[0.86rem]">
                <span class="font-bold tabular-nums">{{ answeredCount }}</span>
                <span class="text-muted"> dari {{ totalQuestions }} terjawab</span>
                <span v-if="doubtfulCount" class="text-amber-700"> · {{ doubtfulCount }} ragu-ragu</span>
              </p>
            </div>

            <button
              type="button"
              class="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface-alt hover:text-ink"
              aria-label="Tutup navigasi soal"
              @click="close"
            >
              <IconClose class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          <TryoutNavigator
            variant="sheet"
            :groups="groups"
            :current-index="currentIndex"
            :answered-count="answeredCount"
            :doubtful-count="doubtfulCount"
            :total-questions="totalQuestions"
            :status-of="statusOf"
            @jump="jump"
          />
        </div>

        <!-- pb menghormati home indicator iPhone: tanpa ini tombol terakhir
             duduk tepat di bawah garis gestur dan sulit ditekan. -->
        <div
          class="shrink-0 border-t border-hairline px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]"
        >
          <AppButton size="sm" class="w-full" @click="emit('endSection')">
            {{ isLastSection ? 'Selesaikan ujian' : 'Akhiri subtes' }}
          </AppButton>
        </div>
      </div>
    </Transition>
  </div>
</template>
