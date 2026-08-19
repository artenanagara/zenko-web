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
defineProps<{ submitLabel: string }>()

const latex = defineModel<string>({ default: '' })

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

const latexInputRef = ref<HTMLInputElement | null>(null)

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

const previewHtml = computed(() => {
  const value = latex.value.trim()
  if (!value) return ''
  try {
    return katex.renderToString(value, { throwOnError: false, displayMode: false })
  }
  catch {
    return ''
  }
})
</script>

<template>
  <div class="grid gap-3">
    <div class="grid max-h-76 gap-3 overflow-y-auto pr-1">
      <div v-for="category in CATEGORIES" :key="category.title" class="grid gap-1.5">
        <span class="math-cat-label">{{ category.title }}</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="tpl in category.templates"
            :key="tpl.title"
            type="button"
            :title="tpl.title"
            class="math-chip"
            @click="insertTemplate(tpl)"
          >
            {{ tpl.label }}
          </button>
        </div>
      </div>
    </div>

    <label class="grid gap-1.5 text-[0.8rem] font-semibold text-muted">
      Kode LaTeX
      <input
        ref="latexInputRef"
        v-model="latex"
        type="text"
        placeholder="\frac{1}{2} + \sqrt{x}"
        class="math-input font-mono"
        @keydown.enter.prevent="emit('submit')"
      >
    </label>

    <div v-if="previewHtml" class="math-preview" v-html="previewHtml" />

    <AppButton type="button" size="xs" class="w-full" :disabled="!latex.trim()" @click="emit('submit')">
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

.math-preview {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  border: 1px solid var(--color-hairline);
  background: var(--color-surface-alt);
  padding: 0.5rem;
  overflow-x: auto;
}
</style>
