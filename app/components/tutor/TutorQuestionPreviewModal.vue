<script setup lang="ts">
import type { TutorPassage, TutorSection } from '#shared/types/tutor-product'

/**
 * Modal pratinjau soal untuk langkah 4 (Review & ajukan) — dibuka dari baris
 * TutorQuestionSummaryTable.vue, isinya TutorQuestionPreview.vue (yang
 * membawa simulasi jawaban sendiri). Navigasi lintas SEMUA soal produk
 * (bukan cuma satu subtes) lewat tombol panah, tombol panah keyboard, atau
 * geser (swipe) di layar sentuh — nomor urutnya sama persis dengan kolom "#"
 * di tabel ringkasan (lintas subtes, tidak direset per subtes).
 *
 * Bukan AppModal (design-system): AppModal terkunci `max-w-lg`, terlalu
 * sempit untuk layout wacana 2-kolom TutorQuestionPreview di desktop. Dialog
 * kustom di sini meniru pola AppModal sendiri (Teleport + backdrop + focus
 * trap + Escape) tapi dengan panel lebih lebar.
 */
const props = defineProps<{
  sections: TutorSection[]
  /** Index ke daftar soal lintas-subtes yang di-flatten, 0-based. */
  startIndex: number
}>()

const open = defineModel<boolean>('open', { required: true })

interface FlatQuestion {
  no: number
  sectionTitle: string
  question: TutorSection['questions'][number]
  passage: TutorPassage | null
}

const flatQuestions = computed<FlatQuestion[]>(() => {
  const ordered = props.sections.slice().sort((a, b) => a.position - b.position)
  const list: FlatQuestion[] = []
  let no = 0
  for (const section of ordered) {
    const questions = section.questions.slice().sort((a, b) => a.position - b.position)
    for (const question of questions) {
      no += 1
      list.push({
        no,
        sectionTitle: section.title,
        question,
        passage: question.passageId
          ? section.passages?.find(passage => passage.id === question.passageId) ?? null
          : null,
      })
    }
  }
  return list
})

const index = ref(props.startIndex)

// Setiap kali modal dibuka (bukan setiap render), mulai dari baris yang
// diklik — tapi navigasi selanjutnya di dalam modal harus tetap bebas
// tanpa "ditarik balik" ke startIndex oleh watcher ini.
watch(open, (isOpen) => {
  if (isOpen) index.value = props.startIndex
})

const total = computed(() => flatQuestions.value.length)
const current = computed(() => flatQuestions.value[index.value] ?? null)
const canPrev = computed(() => index.value > 0)
const canNext = computed(() => index.value < total.value - 1)

function prev() {
  if (canPrev.value) index.value -= 1
}
function next() {
  if (canNext.value) index.value += 1
}
function close() {
  open.value = false
}

/* --------------------------------------------------------------------------
 * Focus trap + Escape — pola yang sama dengan AppModal.
 * ------------------------------------------------------------------------ */

const panelRef = ref<HTMLElement | null>(null)
const previouslyFocusedEl = ref<HTMLElement | null>(null)
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key === 'ArrowLeft') {
    prev()
    return
  }
  if (event.key === 'ArrowRight') {
    next()
    return
  }
  if (event.key !== 'Tab') return

  const focusable = panelRef.value ? Array.from(panelRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : []
  if (focusable.length === 0) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  const active = document.activeElement

  if (event.shiftKey) {
    if (active === first || !panelRef.value?.contains(active)) {
      event.preventDefault()
      last.focus()
    }
  }
  else if (active === last || !panelRef.value?.contains(active)) {
    event.preventDefault()
    first.focus()
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    previouslyFocusedEl.value = document.activeElement as HTMLElement | null
    nextTick(() => panelRef.value?.focus())
  }
  else {
    if (previouslyFocusedEl.value && document.contains(previouslyFocusedEl.value)) {
      previouslyFocusedEl.value.focus()
    }
    previouslyFocusedEl.value = null
  }
})

/* --------------------------------------------------------------------------
 * Geser (swipe) — kiri untuk berikutnya, kanan untuk sebelumnya, sama
 * seperti carousel pada umumnya. Ambang 40px membedakan geser sungguhan dari
 * ketukan/scroll vertikal biasa.
 * ------------------------------------------------------------------------ */

const SWIPE_THRESHOLD = 40
let touchStartX = 0
let touchStartY = 0

function onTouchStart(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch) return
  touchStartX = touch.clientX
  touchStartY = touch.clientY
}

function onTouchEnd(event: TouchEvent) {
  const touch = event.changedTouches[0]
  if (!touch) return
  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  // Lebih horizontal daripada vertikal — kalau tidak, ini scroll konten
  // wacana yang panjang, bukan niat pindah soal.
  if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) return
  if (deltaX < 0) next()
  else prev()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && current"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
      @click.self="close"
    >
      <div
        ref="panelRef"
        role="dialog"
        aria-modal="true"
        :aria-label="`Pratinjau soal ${current.no} dari ${total}`"
        tabindex="-1"
        class="grid max-h-[92vh] w-full max-w-3xl grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-hairline bg-surface shadow-float focus:outline-none"
        @keydown="onKeydown"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
      >
        <div class="flex items-center justify-between gap-3 border-b border-line bg-surface-alt px-5 py-3">
          <div class="flex min-w-0 items-center gap-2">
            <span class="shrink-0 rounded-pill bg-primary-soft px-2.5 py-1 text-[0.78rem] font-bold text-primary">
              Soal {{ current.no }} / {{ total }}
            </span>
            <span class="truncate text-[0.82rem] text-muted">{{ current.sectionTitle }}</span>
          </div>

          <div class="flex shrink-0 items-center gap-1.5">
            <AppIconButton variant="ghost" size="sm" ariaLabel="Soal sebelumnya" :disabled="!canPrev" @click="prev">
              <AppIcon name="caret-left" :size="16" />
            </AppIconButton>
            <AppIconButton variant="ghost" size="sm" ariaLabel="Soal berikutnya" :disabled="!canNext" @click="next">
              <AppIcon name="caret-right" :size="16" />
            </AppIconButton>
            <span class="mx-1 h-5 w-px bg-line" aria-hidden="true" />
            <AppIconButton variant="ghost" size="sm" ariaLabel="Tutup pratinjau" @click="close">
              <IconClose class="h-4 w-4" />
            </AppIconButton>
          </div>
        </div>

        <div class="min-h-0 overflow-hidden p-4">
          <TutorQuestionPreview :key="current.question.id" :question="current.question" :passage="current.passage" class="h-full max-h-full" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
