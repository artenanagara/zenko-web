<script setup lang="ts">
import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * Isi popover "Sisipkan rumus", dipakai bersama oleh RichTextEditor.vue
 * (pertanyaan/pembahasan/wacana dan, lewat mode compact, opsi jawaban di
 * TutorOptionField.vue — semuanya rumus jadi node inlineMath) — supaya
 * templat cepat dan pratinjau KaTeX-nya persis sama di semua tempat.
 *
 * Yang membungkusnya jadi popover adalah RteDropdown di masing-masing
 * pemanggil; komponen ini hanya isinya, dan menyerahkan penyisipan akhir
 * (submit) ke pemanggil karena tiap pemanggil menyisipkan hasilnya dengan
 * cara berbeda (mis. sebagai node ProseMirror vs. teks `$..$`).
 *
 * Klik templat/simbol di sini APPEND ke posisi kursor pada input "Kode
 * LaTeX" di bawah (bukan replace seluruh isi) — dengan ~40 entri lintas 8
 * kategori termasuk operator/huruf Yunani satuan, replace-on-click akan
 * membuat mustahil menyusun sesuatu seperti `\alpha + \beta \leq \gamma`
 * lewat klik saja.
 */
defineProps<{
  submitLabel: string
  /**
   * Ketika komponen ini dipakai sebagai isi modal (RteMathModal via
   * RichTextEditor), tombol Sisipkan/Terapkan hidup di footer modal, jadi
   * tombol internal di bawah disembunyikan agar tidak dobel. Enter di input
   * LaTeX tetap men-submit lewat emit('submit').
   */
  hideSubmit?: boolean
}>()

const latex = defineModel<string>({ default: '' })
/**
 * Whether the formula renders on its own centered line (display/block math,
 * `$$..$$`) instead of inline. Bound from the "Tampilkan di baris sendiri"
 * checkbox; the caller writes it onto the inlineMath node's `display` attr.
 */
const displayMode = defineModel<boolean>('display', { default: false })

const emit = defineEmits<{ submit: [] }>()

interface MathTemplate {
  /** Ditampilkan di badge — glyph Unicode kalau ada (Σ, α, ≤, …), atau bentuk singkat (a⁄b, xⁿ) untuk templat berkerangka. */
  label: string
  /** Judul/tooltip — kode LaTeX-nya sendiri untuk entri simbol tunggal, deskripsi Indonesia untuk templat berkerangka. */
  title: string
  latex: string
}

interface MathCategory {
  title: string
  templates: MathTemplate[]
}

/** Entri simbol tunggal: tooltip-nya kode LaTeX itu sendiri, label-nya glyph render-annya. */
function symbol(latexCode: string, label: string): MathTemplate {
  return { label, title: latexCode, latex: latexCode }
}

const CATEGORIES: MathCategory[] = [
  {
    title: 'Pecahan & Akar',
    templates: [
      { label: 'a⁄b', title: 'Pecahan', latex: '\\frac{a}{b}' },
      { label: '√x', title: 'Akar', latex: '\\sqrt{x}' },
      { label: 'ⁿ√x', title: 'Akar N', latex: '\\sqrt[n]{x}' },
    ],
  },
  {
    title: 'Pangkat & Indeks',
    templates: [
      { label: 'xⁿ', title: 'Pangkat', latex: 'x^{n}' },
      { label: 'xₙ', title: 'Subscript', latex: 'x_{n}' },
      { label: 'xₙᵐ', title: 'Sub & Sup', latex: 'x_{n}^{m}' },
    ],
  },
  {
    title: 'Operator Besar',
    templates: [
      { label: 'Σ', title: 'Sigma (penjumlahan)', latex: '\\sum_{i=1}^{n}' },
      { label: '∏', title: 'Pi (produk)', latex: '\\prod_{i=1}^{n}' },
      { label: '∫', title: 'Integral', latex: '\\int_{a}^{b}' },
      { label: 'lim', title: 'Limit', latex: '\\lim_{x \\to 0}' },
    ],
  },
  {
    title: 'Tanda Kurung',
    templates: [
      { label: '(a)', title: 'Kurung', latex: '\\left(a\\right)' },
      { label: '|a|', title: 'Absolut', latex: '\\left|a\\right|' },
      { label: '[a b]', title: 'Matriks', latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
    ],
  },
  {
    title: 'Operator',
    templates: [
      symbol('+', '+'),
      symbol('-', '−'),
      symbol('\\times', '×'),
      symbol('\\div', '÷'),
      symbol('\\%', '%'),
      symbol('\\pm', '±'),
      symbol('\\mp', '∓'),
      symbol('\\cdot', '·'),
      symbol('*', '∗'),
      symbol('\\oplus', '⊕'),
      symbol('\\otimes', '⊗'),
    ],
  },
  {
    title: 'Relasi',
    templates: [
      symbol('=', '='),
      symbol('\\neq', '≠'),
      symbol('\\approx', '≈'),
      symbol('\\equiv', '≡'),
      symbol('\\leq', '≤'),
      symbol('\\geq', '≥'),
      symbol('<', '<'),
      symbol('>', '>'),
      symbol('\\propto', '∝'),
      symbol('\\sim', '∼'),
    ],
  },
  {
    title: 'Yunani',
    templates: [
      symbol('\\pi', 'π'),
      symbol('\\theta', 'θ'),
      symbol('\\alpha', 'α'),
      symbol('\\beta', 'β'),
      symbol('\\gamma', 'γ'),
      symbol('\\delta', 'δ'),
      symbol('\\epsilon', 'ε'),
      symbol('\\lambda', 'λ'),
      symbol('\\mu', 'μ'),
      symbol('\\sigma', 'σ'),
      symbol('\\phi', 'φ'),
      symbol('\\omega', 'ω'),
      symbol('\\Delta', 'Δ'),
      symbol('\\Omega', 'Ω'),
    ],
  },
  {
    title: 'Lainnya',
    templates: [
      symbol('\\infty', '∞'),
      symbol('\\partial', '∂'),
      symbol('\\nabla', '∇'),
      symbol('\\in', '∈'),
      symbol('\\notin', '∉'),
      symbol('\\subset', '⊂'),
      symbol('\\supset', '⊃'),
      symbol('\\cup', '∪'),
      symbol('\\cap', '∩'),
      symbol('\\emptyset', '∅'),
      symbol('\\to', '→'),
      symbol('\\leftrightarrow', '↔'),
      symbol('\\Rightarrow', '⇒'),
      symbol('\\Leftrightarrow', '⇔'),
      symbol('^\\circ', '°'),
      symbol('\\prime', '′'),
      symbol('\\prime\\prime', '″'),
    ],
  },
]

/**
 * One flat, label-less palette — the category grouping stays in the source
 * above for readability, but rendering every heading made the modal too tall
 * (it overflowed the viewport). The order is preserved, so related symbols
 * still sit together; the tooltip on each chip carries its meaning.
 */
const ALL_SYMBOLS: MathTemplate[] = CATEGORIES.flatMap(category => category.templates)

const latexInputRef = ref<HTMLTextAreaElement | null>(null)

/**
 * Sisipkan `tpl.latex` di posisi kursor input Kode LaTeX (bukan replace
 * seluruh isi) — kalau input belum pernah difokuskan, `selectionStart`-nya
 * `null`/awal, jadi fallback ke akhir string supaya klik pertama tetap
 * append, bukan menimpa awal isian. Sama seperti pola cursor-splice yang
 * dipakai TutorOptionField.vue/TutorQuestionForm.vue untuk kasus serupa.
 */
function insertTemplate(tpl: MathTemplate) {
  const el = latexInputRef.value
  const start = el?.selectionStart ?? latex.value.length
  const end = el?.selectionEnd ?? start

  latex.value = latex.value.slice(0, start) + tpl.latex + latex.value.slice(end)

  nextTick(() => {
    if (!el) return
    el.focus()
    const caret = start + tpl.latex.length
    el.setSelectionRange(caret, caret)
  })
}

/**
 * Live KaTeX preview of the current code. `trust` stays at its default false
 * (see zenko-web app/utils/richText.ts for why that invariant matters); this
 * is the same renderer the student-facing view uses, so what the tutor sees
 * here is what a student will see. Returns '' on empty or invalid input, which
 * the template shows as the "belum ada" placeholder rather than a broken box.
 */
const previewHtml = computed(() => {
  const value = latex.value.trim()
  if (!value) return ''
  try {
    return katex.renderToString(value, { throwOnError: false, displayMode: displayMode.value })
  }
  catch {
    return ''
  }
})

/** True only when there is code but KaTeX could not parse it — drives an inline hint. */
const previewInvalid = computed(() => latex.value.trim() !== '' && previewHtml.value === '')

/**
 * The code box is a multi-line textarea (matrices and aligned blocks need real
 * newlines), so a plain Enter must add a line, not submit. Ctrl/Cmd+Enter is
 * the submit shortcut instead — the same chord the tutor question form uses.
 */
function onCodeKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault()
    emit('submit')
  }
}
</script>

<template>
  <div class="grid gap-3">
    <div class="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1">
      <button
        v-for="tpl in ALL_SYMBOLS"
        :key="tpl.title"
        type="button"
        :title="tpl.title"
        class="math-chip"
        @click="insertTemplate(tpl)"
      >
        {{ tpl.label }}
      </button>
    </div>

    <label class="grid gap-1.5 text-[0.8rem] font-semibold text-muted">
      Kode LaTeX
      <textarea
        ref="latexInputRef"
        v-model="latex"
        rows="3"
        placeholder="\frac{1}{2} + \sqrt{x}"
        class="math-input math-textarea font-mono"
        @keydown="onCodeKeydown"
      />
    </label>

    <label class="flex cursor-pointer items-center gap-2.5 text-[0.86rem] text-ink">
      <input
        v-model="displayMode"
        type="checkbox"
        class="h-4 w-4 rounded-[4px] accent-primary"
      >
      Tampilkan di baris sendiri (rumus besar)
    </label>

    <div class="grid gap-1.5">
      <span class="math-cat-label">Pratinjau</span>
      <div class="math-preview" :class="{ 'math-preview--empty': !previewHtml }">
        <div v-if="previewHtml" class="math-preview-render" v-html="previewHtml" />
        <span v-else class="text-[0.85rem]" :class="previewInvalid ? 'text-amber-700' : 'text-placeholder'">
          {{ previewInvalid ? 'Kode LaTeX belum bisa ditampilkan — periksa lagi.' : 'Pratinjau tampil di sini' }}
        </span>
      </div>
    </div>

    <AppButton v-if="!hideSubmit" type="button" size="xs" class="w-full" :disabled="!latex.trim()" @click="emit('submit')">
      {{ submitLabel }}
    </AppButton>
  </div>
</template>

<style scoped>
.math-cat-label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-muted);
}

.math-chip {
  display: inline-flex;
  height: 1.75rem;
  min-width: 1.75rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  padding-inline: 0.65rem;
  font-weight: 500;
  color: var(--color-ink);
  background: var(--color-surface);
  border: 1px solid var(--color-hairline-strong);
  white-space: nowrap;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.math-chip:hover {
  background: var(--color-surface-alt);
  border-color: var(--color-line);
}

.math-input {
  height: 2.25rem;
  width: 100%;
  border-radius: var(--radius-xs);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  padding-inline: 0.65rem;
  font-size: 0.86rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.math-input::placeholder {
  color: var(--color-placeholder);
}
.math-input:focus {
  outline: none;
  border-color: rgba(47, 111, 235, 0.4);
  box-shadow: 0 0 0 4px rgba(47, 111, 235, 0.1);
}

.math-textarea {
  height: auto;
  min-height: 5rem;
  padding-block: 0.55rem;
  line-height: 1.5;
  resize: vertical;
}

.math-preview {
  display: flex;
  min-height: 4rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  border: 1px solid var(--color-hairline);
  background: var(--color-surface-alt);
  padding: 0.75rem;
  overflow-x: auto;
}
/* Empty (or invalid) preview reads as a placeholder, not a real result box. */
.math-preview--empty {
  border-style: dashed;
  background: transparent;
}
.math-preview-render {
  max-width: 100%;
}
</style>
