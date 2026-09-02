<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import { TextStyle, FontFamily, FontSize } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { MathExtension } from '@aarkue/tiptap-math-extension'
import 'katex/dist/katex.min.css'
import type { MenuItem } from '~/components/core/AppDropdownMenu.vue'

/**
 * Moodle-style question editor: formatting, headings, colour/highlight, fonts,
 * lists (incl. task lists), code blocks, alignment/indent, links, tables,
 * images, LaTeX, special characters and emoji — for the tutor wizard's
 * question prompt/explanation fields (TutorQuestionForm.vue).
 *
 * The four insertion flows (link, table, LaTeX, image) open full AppModal
 * dialogs; lightweight pickers (colour, highlight, font, symbols, emoji) stay
 * as small dropdown popovers, which is the right weight for choosing a swatch.
 *
 * Emits sanitized-on-the-server HTML; the server (internal/richtext) is the
 * actual trust boundary — its allowlist mirrors exactly the markup this
 * toolbar can produce (font/size/colour allowlists MUST stay in sync with the
 * FONT_FAMILIES / FONT_SIZES / *_COLORS constants below).
 */
const props = defineProps<{
  modelValue: string
  placeholder?: string
  ariaLabel?: string
  /**
   * Toolbar ringkas + tanpa min-height besar — untuk ditanam di dalam baris
   * opsi jawaban (TutorOptionField.vue), bukan field pertanyaan/pembahasan
   * penuh. Menyisakan hanya yang masuk akal untuk frasa pendek: tebal/
   * miring/garis bawah, sub/superskrip, rumus, dan gambar — heading, warna,
   * font, tabel, daftar, perataan, tautan, alat, dan urungkan/ulangi dilepas
   * (riwayat urungkan bawaan ProseMirror tetap jalan lewat Ctrl/Cmd+Z).
   */
  compact?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

/**
 * Block indent as a pinned `data-indent` level (1–8) on paragraph/heading —
 * deliberately an attribute, not an inline `margin-left`, so there is no CSS
 * string for a bypassing caller to inject and nothing for the server
 * sanitizer to have to parse. The level maps to padding purely via CSS
 * (.rte-content / .prose-question `[data-indent]`).
 */
const Indent = Extension.create<{ types: string[], maxLevel: number }>({
  name: 'indent',
  addOptions() {
    return { types: ['paragraph', 'heading'], maxLevel: 8 }
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        indent: {
          default: 0,
          parseHTML: (element: HTMLElement) => {
            const level = Number.parseInt(element.getAttribute('data-indent') ?? '0', 10)
            if (!Number.isFinite(level)) return 0
            return Math.min(Math.max(level, 0), this.options.maxLevel)
          },
          renderHTML: (attributes: Record<string, unknown>) => {
            const level = Number(attributes.indent) || 0
            return level > 0 ? { 'data-indent': String(level) } : {}
          },
        },
      },
    }]
  },
})

const editor = useEditor({
  content: toEditorHtml(props.modelValue),
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      },
    }),
    Subscript,
    Superscript,
    // TextStyle is the carrier mark the three below hang their inline styles
    // on; without it setColor/setFontFamily/setFontSize are no-ops.
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TextAlign.configure({ types: ['paragraph', 'heading'] }),
    Indent,
    Placeholder.configure({ placeholder: props.placeholder ?? '' }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Image.configure({ HTMLAttributes: { class: 'rte-image' } }),
    // Renders LaTeX between $-delimiters live as you type — the editor shows
    // the typeset formula itself, never raw LaTeX source. Evaluation (turning
    // "2*3=" into a computed result) is out of scope, so left off.
    MathExtension.configure({ evaluation: false, delimiters: 'dollar' }),
  ],
  editorProps: {
    attributes: {
      class: 'rte-content',
      ...(props.ariaLabel ? { 'aria-label': props.ariaLabel } : {}),
    },
    // The math node is atom+selectable (see MathExtension), so a click on it
    // would otherwise just node-select it with no way to change its LaTeX.
    // Intercepting the click and opening the editor modal instead is what
    // makes an inserted formula's values changeable at all.
    handleClickOn: (_view, _pos, node, nodePos) => {
      if (node.type.name !== 'inlineMath') return false
      openMathEditor(node.attrs.latex as string, nodePos)
      return true
    },
  },
  onUpdate: ({ editor: instance }) => {
    const html = instance.isEmpty ? '' : instance.getHTML()
    if (html !== props.modelValue) emit('update:modelValue', html)
  },
})

/*
 * Only resync from an external prop change, never while this editor itself is
 * the source of that change — onUpdate's emit lands back here as a prop
 * update, and syncing on it too would race the next keystroke. isFocused is
 * `true` for exactly the "still typing here" case this must skip; an external
 * reset (a different question loaded into this field) happens while unfocused.
 */
watch(() => props.modelValue, (value) => {
  const instance = editor.value
  if (!instance || instance.isFocused) return
  const incoming = toEditorHtml(value)
  if (incoming !== instance.getHTML()) instance.commands.setContent(incoming, { emitUpdate: false })
})

/* Contextual table toolbar only makes sense with the cursor inside a table. */
const inTable = ref(false)
watch(editor, (instance, _old, onCleanup) => {
  if (!instance) return
  const sync = () => { inTable.value = instance.isActive('table') }
  instance.on('selectionUpdate', sync)
  instance.on('transaction', sync)
  onCleanup(() => {
    instance.off('selectionUpdate', sync)
    instance.off('transaction', sync)
  })
}, { immediate: true })

/* ---------------------------------------------------------------------------
 * Heading / paragraph
 * ------------------------------------------------------------------------- */
const HEADING_VALUES = ['p', '1', '2', '3'] as const
type HeadingValue = typeof HEADING_VALUES[number]

const headingValue = computed<HeadingValue>(() => {
  const instance = editor.value
  if (!instance) return 'p'
  for (const level of [1, 2, 3] as const) {
    if (instance.isActive('heading', { level })) return String(level) as HeadingValue
  }
  return 'p'
})

const HEADING_ITEMS: MenuItem[] = [
  { id: 'p', label: 'Teks biasa' },
  { id: '1', label: 'Judul 1' },
  { id: '2', label: 'Judul 2' },
  { id: '3', label: 'Judul 3' },
]

const headingLabel = computed(() => HEADING_ITEMS.find(item => item.id === headingValue.value)?.label ?? 'Teks biasa')

function setHeading(value: string) {
  const instance = editor.value
  if (!instance) return
  if (value === 'p') instance.chain().focus().setParagraph().run()
  else instance.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 | 3 }).run()
}

/* ---------------------------------------------------------------------------
 * Focus handoff: an insertion command runs while a modal still owns DOM focus.
 * The command's own `.focus()` fires, then AppModal restores focus to the
 * trigger button on close. Scheduling one more focus on the nextTick (which
 * flushes after AppModal's pre-render watcher) lands the caret back in the
 * editor, where the tutor expects to keep typing.
 * ------------------------------------------------------------------------- */
function refocusEditor() {
  nextTick(() => editor.value?.chain().focus().run())
}

/* ---------------------------------------------------------------------------
 * Link modal
 * ------------------------------------------------------------------------- */
const linkModalOpen = ref(false)
const linkUrl = ref('')
const linkText = ref('')
const linkError = ref('')

/** Only http(s) and mailto may become an href; everything else (javascript:, data:) is rejected. */
function isSafeLinkUrl(url: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(url)
}

function openLinkModal() {
  const instance = editor.value
  if (!instance) return
  linkUrl.value = instance.getAttributes('link').href ?? ''
  const { from, to } = instance.state.selection
  linkText.value = from === to ? '' : instance.state.doc.textBetween(from, to, ' ')
  linkError.value = ''
  linkModalOpen.value = true
}

function applyLink() {
  const instance = editor.value
  if (!instance) return
  const url = linkUrl.value.trim()
  if (url === '') {
    instance.chain().focus().unsetLink().run()
    linkModalOpen.value = false
    refocusEditor()
    return
  }
  if (!isSafeLinkUrl(url)) {
    linkError.value = 'Gunakan tautan yang diawali http://, https://, atau mailto:.'
    return
  }
  const text = linkText.value.trim()
  const chain = instance.chain().focus().extendMarkRange('link')
  if (text) chain.insertContent({ type: 'text', text, marks: [{ type: 'link', attrs: { href: url } }] }).run()
  else chain.setLink({ href: url }).run()
  linkModalOpen.value = false
  refocusEditor()
}

function removeLink() {
  editor.value?.chain().focus().unsetLink().run()
  linkModalOpen.value = false
  refocusEditor()
}

/* ---------------------------------------------------------------------------
 * Table modal + contextual table controls
 * ------------------------------------------------------------------------- */
const tableModalOpen = ref(false)
const tableRows = ref(3)
const tableCols = ref(3)
const tableHeaderRow = ref(true)

function openTableModal() {
  tableRows.value = 3
  tableCols.value = 3
  tableHeaderRow.value = true
  tableModalOpen.value = true
}

function clampTableDim(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(Math.max(Math.round(value), 1), 20)
}

function applyTable() {
  const rows = clampTableDim(tableRows.value)
  const cols = clampTableDim(tableCols.value)
  editor.value?.chain().focus().insertTable({ rows, cols, withHeaderRow: tableHeaderRow.value }).run()
  tableModalOpen.value = false
  refocusEditor()
}

/* ---------------------------------------------------------------------------
 * LaTeX modal (reuses MathPanel as its body)
 *
 * The math extension has no insert command of its own — it only reacts to
 * typed/pasted "$...$" — and its node is atom+selectable, so a click only
 * selects it. Editing an inserted formula therefore happens entirely through
 * this modal: clicking an existing formula (see handleClickOn) reopens it
 * pre-filled and applies an update instead of an insert.
 * ------------------------------------------------------------------------- */
const mathModalOpen = ref(false)
const mathLatex = ref('')
/** null while inserting a new formula; the node's doc position while editing an existing one. */
const mathEditPos = ref<number | null>(null)

const mathModalTitle = computed(() => mathEditPos.value === null ? 'Sisipkan rumus' : 'Ubah rumus')
const mathSubmitLabel = computed(() => mathEditPos.value === null ? 'Sisipkan' : 'Terapkan')

function openMathModal() {
  mathLatex.value = ''
  mathEditPos.value = null
  mathModalOpen.value = true
}

function openMathEditor(latex: string, pos: number) {
  mathLatex.value = latex
  mathEditPos.value = pos
  mathModalOpen.value = true
}

function submitMath() {
  const value = mathLatex.value.trim()
  const instance = editor.value
  if (!value || !instance) return

  if (mathEditPos.value !== null) {
    const pos = mathEditPos.value
    instance.chain().focus().command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, { latex: value, evaluate: 'no', display: 'no' })
      return true
    }).run()
  }
  else {
    instance.chain().focus().insertContent({
      type: 'inlineMath',
      attrs: { latex: value, evaluate: 'no', display: 'no' },
    }).run()
  }
  mathModalOpen.value = false
  refocusEditor()
}

/* ---------------------------------------------------------------------------
 * Image modal (upload via uploadTutorImage, or paste a URL) + alt text
 * ------------------------------------------------------------------------- */
const imageModalOpen = ref(false)
const imageUrl = ref('')
const imageAlt = ref('')
const imageUploading = ref(false)
const imageError = ref('')
const imageFileInput = ref<HTMLInputElement | null>(null)

function openImageModal() {
  imageUrl.value = ''
  imageAlt.value = ''
  imageError.value = ''
  imageModalOpen.value = true
}

function applyImageUrl() {
  const url = imageUrl.value.trim()
  if (!url) return
  editor.value?.chain().focus().setImage({ src: url, alt: imageAlt.value.trim() || undefined }).run()
  imageModalOpen.value = false
  refocusEditor()
}

function triggerImageUpload() {
  imageFileInput.value?.click()
}

async function onImageFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // allow re-picking the same file later
  if (!file) return

  imageUploading.value = true
  imageError.value = ''
  try {
    const url = await uploadTutorImage(file)
    editor.value?.chain().focus().setImage({ src: url, alt: imageAlt.value.trim() || undefined }).run()
    imageModalOpen.value = false
    refocusEditor()
  }
  catch (cause) {
    imageError.value = tutorApiMessage(cause, 'Gagal mengunggah gambar.')
  }
  finally {
    imageUploading.value = false
  }
}

/* ---------------------------------------------------------------------------
 * Colour / highlight / font — small dropdown popovers with a fixed palette.
 * Values below are the exact CSS the server sanitizer allowlists; keep them in
 * sync with internal/richtext/richtext.go (AllowedFontFamilies/AllowedFontSizes
 * and the hex-only colour matcher).
 * ------------------------------------------------------------------------- */
const TEXT_COLORS = [
  '#0f172a', '#475569', '#b91c1c', '#c2410c', '#b45309', '#15803d',
  '#0e7490', '#1d4ed8', '#6d28d9', '#be185d',
] as const
const HIGHLIGHT_COLORS = [
  '#fef08a', '#fed7aa', '#bbf7d0', '#bae6fd', '#ddd6fe', '#fbcfe8',
] as const
const FONT_FAMILIES: { label: string, value: string }[] = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
]
const FONT_SIZES: { label: string, value: string }[] = [
  { label: 'Sangat kecil', value: '12px' },
  { label: 'Kecil', value: '14px' },
  { label: 'Normal', value: '16px' },
  { label: 'Sedang', value: '18px' },
  { label: 'Besar', value: '20px' },
  { label: 'Sangat besar', value: '24px' },
  { label: 'Judul', value: '30px' },
]

const colorPopoverOpen = ref(false)
const highlightPopoverOpen = ref(false)
const fontFamilyPopoverOpen = ref(false)
const fontSizePopoverOpen = ref(false)
const specialCharPopoverOpen = ref(false)
const emojiPopoverOpen = ref(false)

function setTextColor(color: string) {
  editor.value?.chain().focus().setColor(color).run()
  colorPopoverOpen.value = false
}
function clearTextColor() {
  editor.value?.chain().focus().unsetColor().run()
  colorPopoverOpen.value = false
}
function setHighlightColor(color: string) {
  editor.value?.chain().focus().toggleHighlight({ color }).run()
  highlightPopoverOpen.value = false
}
function clearHighlight() {
  editor.value?.chain().focus().unsetHighlight().run()
  highlightPopoverOpen.value = false
}
function setFont(value: string) {
  editor.value?.chain().focus().setFontFamily(value).run()
  fontFamilyPopoverOpen.value = false
}
function clearFont() {
  editor.value?.chain().focus().unsetFontFamily().run()
  fontFamilyPopoverOpen.value = false
}
function setSize(value: string) {
  editor.value?.chain().focus().setFontSize(value).run()
  fontSizePopoverOpen.value = false
}
function clearSize() {
  editor.value?.chain().focus().unsetFontSize().run()
  fontSizePopoverOpen.value = false
}

/* ---------------------------------------------------------------------------
 * Special characters + emoji — insert as plain text (no new markup).
 * ------------------------------------------------------------------------- */
const SPECIAL_CHARS = [
  '×', '÷', '±', '∓', '·', '≤', '≥', '≠', '≈', '≡',
  '→', '←', '↔', '⇒', '⇔', '∞', '∑', '∏', '∫', '√',
  '∂', '∇', '∈', '∉', '⊂', '⊃', '∪', '∩', '∅', '°',
  'π', 'µ', 'Ω', 'Δ', 'α', 'β', 'γ', 'θ', 'λ', 'σ',
  '‰', '€', '£', '¥', '©', '®', '™', '§', '¶', '…',
]
const EMOJIS = [
  '😀', '😉', '😍', '🤔', '👍', '👏', '🙌', '🎉', '🔥', '✅',
  '❌', '⚠️', '❓', '❗', '💡', '📌', '📝', '📚', '⭐', '🚀',
  '🧠', '⏰', '✏️', '🔍', '📊', '💯', '🎯', '🏆', '👀', '🙏',
]

function insertText(text: string) {
  editor.value?.chain().focus().insertContent(text).run()
}

/* ---------------------------------------------------------------------------
 * Indent / outdent (custom Indent extension)
 * ------------------------------------------------------------------------- */
function changeIndent(delta: number) {
  const instance = editor.value
  if (!instance) return
  const current = (instance.getAttributes('paragraph').indent as number | undefined)
    ?? (instance.getAttributes('heading').indent as number | undefined)
    ?? 0
  const next = Math.min(Math.max(current + delta, 0), 8)
  instance.chain().focus()
    .updateAttributes('paragraph', { indent: next })
    .updateAttributes('heading', { indent: next })
    .run()
}

/* ---------------------------------------------------------------------------
 * Clear formatting — drops every mark (bold, colour, font, highlight, link…)
 * and lifts block nodes back to paragraphs.
 * ------------------------------------------------------------------------- */
function clearFormatting() {
  editor.value?.chain().focus().unsetAllMarks().clearNodes().run()
}

/* ---------------------------------------------------------------------------
 * View / edit HTML source
 *
 * "Editable-terbatas": the tutor may hand-edit the HTML, but applying it runs
 * it back through Tiptap's schema (setContent → parseHTML), which drops any
 * tag/attribute the editor cannot itself model — and the server sanitizes it
 * again on save. So this cannot widen what ends up stored.
 * ------------------------------------------------------------------------- */
const sourceModalOpen = ref(false)
const sourceHtml = ref('')

function openSourceModal() {
  sourceHtml.value = editor.value?.getHTML() ?? ''
  sourceModalOpen.value = true
}

function applySource() {
  editor.value?.commands.setContent(sourceHtml.value, { emitUpdate: true })
  sourceModalOpen.value = false
  refocusEditor()
}

/* ---------------------------------------------------------------------------
 * Fullscreen toggle (pure UI — no markup change)
 * ------------------------------------------------------------------------- */
const isFullscreen = ref(false)
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}
function onRootKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
}

/* ---------------------------------------------------------------------------
 * Toolbar button models
 * ------------------------------------------------------------------------- */
interface ToolbarButton {
  title: string
  /** Dipakai kalau tidak ada `icon` — huruf B/I/U/S dan x₂/x² memang lebih
   *  terbaca sebagai label tipografis daripada sebagai ikon. */
  label?: string
  /** Nama ikon Phosphor (lihat AppIcon.vue). */
  icon?: string
  run: () => void
  active: () => boolean
}

const markButtons = computed<ToolbarButton[]>(() => {
  const instance = editor.value
  const all: ToolbarButton[] = [
    { title: 'Tebal', label: 'B', run: () => instance?.chain().focus().toggleBold().run(), active: () => instance?.isActive('bold') ?? false },
    { title: 'Miring', label: 'I', run: () => instance?.chain().focus().toggleItalic().run(), active: () => instance?.isActive('italic') ?? false },
    { title: 'Garis bawah', label: 'U', run: () => instance?.chain().focus().toggleUnderline().run(), active: () => instance?.isActive('underline') ?? false },
    { title: 'Coret', label: 'S', run: () => instance?.chain().focus().toggleStrike().run(), active: () => instance?.isActive('strike') ?? false },
    { title: 'Subskrip', label: 'x₂', run: () => instance?.chain().focus().toggleSubscript().run(), active: () => instance?.isActive('subscript') ?? false },
    { title: 'Superskrip', label: 'x²', run: () => instance?.chain().focus().toggleSuperscript().run(), active: () => instance?.isActive('superscript') ?? false },
  ]
  // Coret dilepas di mode compact — opsi jawaban jarang butuh coret, dan
  // ruangnya lebih berharga untuk sub/superskrip yang jauh lebih sering dipakai.
  return props.compact ? all.filter(btn => btn.label !== 'S') : all
})

const listButtons = computed<ToolbarButton[]>(() => {
  const instance = editor.value
  return [
    { title: 'Daftar poin', icon: 'list-bullets', run: () => instance?.chain().focus().toggleBulletList().run(), active: () => instance?.isActive('bulletList') ?? false },
    { title: 'Daftar bernomor', icon: 'list-numbers', run: () => instance?.chain().focus().toggleOrderedList().run(), active: () => instance?.isActive('orderedList') ?? false },
    { title: 'Daftar tugas (centang)', icon: 'list-checks', run: () => instance?.chain().focus().toggleTaskList().run(), active: () => instance?.isActive('taskList') ?? false },
  ]
})

const blockButtons = computed<ToolbarButton[]>(() => {
  const instance = editor.value
  return [
    { title: 'Kutipan', icon: 'quotes', run: () => instance?.chain().focus().toggleBlockquote().run(), active: () => instance?.isActive('blockquote') ?? false },
    { title: 'Blok kode', icon: 'code', run: () => instance?.chain().focus().toggleCodeBlock().run(), active: () => instance?.isActive('codeBlock') ?? false },
    { title: 'Garis pemisah', icon: 'minus', run: () => instance?.chain().focus().setHorizontalRule().run(), active: () => false },
  ]
})

const ALIGN_OPTIONS = [
  { title: 'Rata kiri', value: 'left' as const },
  { title: 'Rata tengah', value: 'center' as const },
  { title: 'Rata kanan', value: 'right' as const },
  { title: 'Rata kiri-kanan', value: 'justify' as const },
]

onBeforeUnmount(() => editor.value?.destroy())

/**
 * Dipakai TutorOptionField.vue supaya Tab bisa loncat antar-opsi lewat ref
 * tanpa memaksa pemanggil tahu cara kerja instance Tiptap di dalamnya.
 */
defineExpose({
  focus: () => { editor.value?.chain().focus().run() },
})
</script>

<template>
  <div
    class="rte rounded-sm border border-line bg-surface"
    :class="{ 'rte-compact': compact, 'rte-fullscreen': isFullscreen }"
    @keydown="onRootKeydown"
  >
    <div class="rte-toolbar flex flex-wrap items-center gap-1 rounded-t-[11px] border-b border-line bg-surface-alt px-2 py-1.5">
      <template v-if="!compact">
        <AppDropdownMenu :items="HEADING_ITEMS" label="Format teks" @select="setHeading">
          <template #trigger="{ open, isOpen }">
            <button
              type="button"
              title="Format teks"
              aria-label="Format teks"
              class="rte-btn gap-1 !px-2.5"
              @mousedown.prevent
              @click="open"
            >
              {{ headingLabel }}
              <AppIcon name="caret-down" :size="10" class="shrink-0 transition-transform" :class="isOpen ? 'rotate-180' : ''" />
            </button>
          </template>
        </AppDropdownMenu>

        <span class="rte-sep" aria-hidden="true" />
      </template>

      <button
        v-for="mark in markButtons"
        :key="mark.title"
        type="button"
        :title="mark.title"
        :aria-pressed="mark.active()"
        class="rte-btn"
        :class="{ 'rte-btn-active': mark.active() }"
        @mousedown.prevent
        @click="mark.run"
      >
        {{ mark.label }}
      </button>

      <template v-if="!compact">
        <span class="rte-sep" aria-hidden="true" />

        <!-- Warna teks -->
        <RteDropdown v-model="colorPopoverOpen" title="Warna teks" :width="216">
          <template #trigger>
            <button
              type="button"
              title="Warna teks"
              class="rte-btn"
              :class="{ 'rte-btn-active': !!editor?.getAttributes('textStyle').color }"
              @mousedown.prevent
              @click="colorPopoverOpen = !colorPopoverOpen"
            >
              <AppIcon name="palette" :size="16" />
            </button>
          </template>
          <template #panel>
            <div class="rte-swatch-grid">
              <button
                v-for="color in TEXT_COLORS"
                :key="color"
                type="button"
                class="rte-swatch"
                :title="color"
                :style="{ background: color }"
                @mousedown.prevent
                @click="setTextColor(color)"
              />
            </div>
            <AppButton type="button" variant="outline" size="xs" class="w-full" @click="clearTextColor">
              Hapus warna
            </AppButton>
          </template>
        </RteDropdown>

        <!-- Sorotan (highlight) -->
        <RteDropdown v-model="highlightPopoverOpen" title="Sorotan" :width="216">
          <template #trigger>
            <button
              type="button"
              title="Sorotan"
              class="rte-btn"
              :class="{ 'rte-btn-active': editor?.isActive('highlight') }"
              @mousedown.prevent
              @click="highlightPopoverOpen = !highlightPopoverOpen"
            >
              <AppIcon name="highlighter" :size="16" />
            </button>
          </template>
          <template #panel>
            <div class="rte-swatch-grid">
              <button
                v-for="color in HIGHLIGHT_COLORS"
                :key="color"
                type="button"
                class="rte-swatch"
                :title="color"
                :style="{ background: color }"
                @mousedown.prevent
                @click="setHighlightColor(color)"
              />
            </div>
            <AppButton type="button" variant="outline" size="xs" class="w-full" @click="clearHighlight">
              Hapus sorotan
            </AppButton>
          </template>
        </RteDropdown>

        <!-- Jenis font -->
        <RteDropdown v-model="fontFamilyPopoverOpen" title="Jenis font" :width="220">
          <template #trigger>
            <button
              type="button"
              title="Jenis font"
              class="rte-btn !px-2.5"
              @mousedown.prevent
              @click="fontFamilyPopoverOpen = !fontFamilyPopoverOpen"
            >
              <AppIcon name="text-aa" :size="16" />
            </button>
          </template>
          <template #panel>
            <div class="grid gap-1">
              <button
                v-for="font in FONT_FAMILIES"
                :key="font.value"
                type="button"
                class="rte-menu-item"
                :style="{ fontFamily: font.value }"
                @mousedown.prevent
                @click="setFont(font.value)"
              >
                {{ font.label }}
              </button>
            </div>
            <AppButton type="button" variant="outline" size="xs" class="w-full" @click="clearFont">
              Font bawaan
            </AppButton>
          </template>
        </RteDropdown>

        <!-- Ukuran font -->
        <RteDropdown v-model="fontSizePopoverOpen" title="Ukuran font" :width="200">
          <template #trigger>
            <button
              type="button"
              title="Ukuran font"
              class="rte-btn !px-2.5"
              @mousedown.prevent
              @click="fontSizePopoverOpen = !fontSizePopoverOpen"
            >
              <AppIcon name="text-t" :size="16" />
            </button>
          </template>
          <template #panel>
            <div class="grid gap-1">
              <button
                v-for="size in FONT_SIZES"
                :key="size.value"
                type="button"
                class="rte-menu-item flex items-center justify-between"
                @mousedown.prevent
                @click="setSize(size.value)"
              >
                <span>{{ size.label }}</span>
                <span class="text-muted">{{ size.value }}</span>
              </button>
            </div>
            <AppButton type="button" variant="outline" size="xs" class="w-full" @click="clearSize">
              Ukuran bawaan
            </AppButton>
          </template>
        </RteDropdown>

        <span class="rte-sep" aria-hidden="true" />

        <button
          v-for="list in listButtons"
          :key="list.title"
          type="button"
          :title="list.title"
          :aria-pressed="list.active()"
          class="rte-btn"
          :class="{ 'rte-btn-active': list.active() }"
          @mousedown.prevent
          @click="list.run"
        >
          <AppIcon :name="list.icon!" :size="16" />
        </button>

        <button
          v-for="block in blockButtons"
          :key="block.title"
          type="button"
          :title="block.title"
          :aria-pressed="block.active()"
          class="rte-btn"
          :class="{ 'rte-btn-active': block.active() }"
          @mousedown.prevent
          @click="block.run"
        >
          <AppIcon :name="block.icon!" :size="16" />
        </button>

        <span class="rte-sep" aria-hidden="true" />

        <button
          v-for="align in ALIGN_OPTIONS"
          :key="align.value"
          type="button"
          :title="align.title"
          :aria-pressed="editor?.isActive({ textAlign: align.value })"
          class="rte-btn"
          :class="{ 'rte-btn-active': editor?.isActive({ textAlign: align.value }) }"
          @mousedown.prevent
          @click="editor?.chain().focus().setTextAlign(align.value).run()"
        >
          <IconAlign v-if="align.value !== 'justify'" :variant="align.value" class="h-4 w-4" />
          <AppIcon v-else name="text-align-justify" :size="16" />
        </button>

        <button type="button" title="Kurangi indentasi" class="rte-btn" @mousedown.prevent @click="changeIndent(-1)">
          <AppIcon name="text-outdent" :size="16" />
        </button>
        <button type="button" title="Tambah indentasi" class="rte-btn" @mousedown.prevent @click="changeIndent(1)">
          <AppIcon name="text-indent" :size="16" />
        </button>

        <span class="rte-sep" aria-hidden="true" />

        <button
          type="button"
          title="Tautan"
          class="rte-btn"
          :class="{ 'rte-btn-active': editor?.isActive('link') }"
          @mousedown.prevent
          @click="openLinkModal"
        >
          <IconLink class="h-4 w-4" />
        </button>

        <button type="button" title="Sisipkan tabel" class="rte-btn" @mousedown.prevent @click="openTableModal">
          <IconTableInsert class="h-4 w-4" />
        </button>
      </template>

      <button type="button" title="Sisipkan rumus (LaTeX)" class="rte-btn" @mousedown.prevent @click="openMathModal">
        ∑
      </button>

      <button type="button" title="Sisipkan gambar" class="rte-btn" @mousedown.prevent @click="openImageModal">
        <IconImage class="h-4 w-4" />
      </button>
      <input
        ref="imageFileInput"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        class="hidden"
        @change="onImageFileSelected"
      >

      <template v-if="!compact">
        <!-- Karakter khusus -->
        <RteDropdown v-model="specialCharPopoverOpen" title="Karakter khusus" :width="272">
          <template #trigger>
            <button type="button" title="Karakter khusus" class="rte-btn" @mousedown.prevent @click="specialCharPopoverOpen = !specialCharPopoverOpen">
              Ω
            </button>
          </template>
          <template #panel>
            <div class="rte-glyph-grid">
              <button
                v-for="char in SPECIAL_CHARS"
                :key="char"
                type="button"
                class="rte-glyph"
                :title="char"
                @mousedown.prevent
                @click="insertText(char); specialCharPopoverOpen = false"
              >
                {{ char }}
              </button>
            </div>
          </template>
        </RteDropdown>

        <!-- Emoji -->
        <RteDropdown v-model="emojiPopoverOpen" title="Emoji" :width="272">
          <template #trigger>
            <button type="button" title="Emoji" class="rte-btn" @mousedown.prevent @click="emojiPopoverOpen = !emojiPopoverOpen">
              <AppIcon name="smiley" :size="16" />
            </button>
          </template>
          <template #panel>
            <div class="rte-glyph-grid">
              <button
                v-for="emoji in EMOJIS"
                :key="emoji"
                type="button"
                class="rte-glyph"
                :title="emoji"
                @mousedown.prevent
                @click="insertText(emoji); emojiPopoverOpen = false"
              >
                {{ emoji }}
              </button>
            </div>
          </template>
        </RteDropdown>

        <span class="rte-sep" aria-hidden="true" />

        <button type="button" title="Hapus format" class="rte-btn" @mousedown.prevent @click="clearFormatting">
          <AppIcon name="text-t-slash" :size="16" />
        </button>
        <button type="button" title="Lihat / edit HTML" class="rte-btn" @mousedown.prevent @click="openSourceModal">
          <AppIcon name="code-simple" :size="16" />
        </button>
        <button
          type="button"
          :title="isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'"
          class="rte-btn"
          :class="{ 'rte-btn-active': isFullscreen }"
          @mousedown.prevent
          @click="toggleFullscreen"
        >
          <AppIcon :name="isFullscreen ? 'arrows-in' : 'arrows-out'" :size="16" />
        </button>

        <span class="rte-sep" aria-hidden="true" />

        <button
          type="button"
          title="Urungkan"
          class="rte-btn"
          :disabled="!editor?.can().undo()"
          @mousedown.prevent
          @click="editor?.chain().focus().undo().run()"
        >
          <IconUndo class="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Ulangi"
          class="rte-btn"
          :disabled="!editor?.can().redo()"
          @mousedown.prevent
          @click="editor?.chain().focus().redo().run()"
        >
          <IconRedo class="h-4 w-4" />
        </button>
      </template>
    </div>

    <!-- Toolbar tabel kontekstual — muncul hanya saat kursor ada di dalam tabel. -->
    <div v-if="inTable && !compact" class="flex flex-wrap items-center gap-1 border-b border-line bg-primary-soft/60 px-2 py-1.5 text-[0.8rem]">
      <span class="mr-1 shrink-0 font-semibold text-primary">Tabel</span>
      <button type="button" class="rte-chip" @mousedown.prevent @click="editor?.chain().focus().addColumnBefore().run()">
        + Kolom kiri
      </button>
      <button type="button" class="rte-chip" @mousedown.prevent @click="editor?.chain().focus().addColumnAfter().run()">
        + Kolom kanan
      </button>
      <button type="button" class="rte-chip" @mousedown.prevent @click="editor?.chain().focus().deleteColumn().run()">
        Hapus kolom
      </button>
      <span class="h-5 w-px shrink-0 bg-line" aria-hidden="true" />
      <button type="button" class="rte-chip" @mousedown.prevent @click="editor?.chain().focus().addRowBefore().run()">
        + Baris atas
      </button>
      <button type="button" class="rte-chip" @mousedown.prevent @click="editor?.chain().focus().addRowAfter().run()">
        + Baris bawah
      </button>
      <button type="button" class="rte-chip" @mousedown.prevent @click="editor?.chain().focus().deleteRow().run()">
        Hapus baris
      </button>
      <span class="h-5 w-px shrink-0 bg-line" aria-hidden="true" />
      <button
        type="button"
        class="rte-chip"
        :disabled="!editor?.can().mergeCells()"
        @mousedown.prevent
        @click="editor?.chain().focus().mergeCells().run()"
      >
        Gabung sel
      </button>
      <button
        type="button"
        class="rte-chip"
        :disabled="!editor?.can().splitCell()"
        @mousedown.prevent
        @click="editor?.chain().focus().splitCell().run()"
      >
        Pisah sel
      </button>
      <button type="button" class="rte-chip" @mousedown.prevent @click="editor?.chain().focus().toggleHeaderRow().run()">
        Judul baris
      </button>
      <span class="h-5 w-px shrink-0 bg-line" aria-hidden="true" />
      <button type="button" class="rte-chip rte-chip-danger" @mousedown.prevent @click="editor?.chain().focus().deleteTable().run()">
        Hapus tabel
      </button>
    </div>

    <EditorContent :editor="editor" class="rte-scroll" />

    <!-- ======================= MODALS =======================
         Declared inside the single root so this component stays single-root
         (callers pass through `class`/`ref` — e.g. TutorOptionField's
         `class="flex-1"`). AppModal teleports each to <body>, so their
         position here has no layout effect. -->

  <!-- Tautan -->
  <AppModal v-model="linkModalOpen" title="Sisipkan tautan">
    <form class="grid gap-3" @submit.prevent="applyLink">
      <label class="grid gap-1.5 text-[0.85rem] font-semibold text-ink">
        URL
        <input
          v-model="linkUrl"
          type="text"
          inputmode="url"
          placeholder="https://…"
          class="rte-field"
          @keydown.enter.prevent="applyLink"
        >
      </label>
      <label class="grid gap-1.5 text-[0.85rem] font-semibold text-ink">
        Teks tampilan <span class="font-normal text-muted">(opsional)</span>
        <input
          v-model="linkText"
          type="text"
          placeholder="Teks yang terlihat"
          class="rte-field"
          @keydown.enter.prevent="applyLink"
        >
      </label>
      <p v-if="linkError" role="alert" class="text-[0.82rem] font-semibold text-red-600">{{ linkError }}</p>
    </form>
    <template #footer="{ close }">
      <AppButton
        v-if="editor?.isActive('link')"
        variant="outline"
        size="sm"
        class="mr-auto"
        @click="removeLink"
      >
        Hapus tautan
      </AppButton>
      <AppButton variant="outline" size="sm" @click="close">Batal</AppButton>
      <AppButton size="sm" @click="applyLink">Terapkan</AppButton>
    </template>
  </AppModal>

  <!-- Tabel -->
  <AppModal v-model="tableModalOpen" title="Sisipkan tabel">
    <form class="grid gap-4" @submit.prevent="applyTable">
      <div class="grid grid-cols-2 gap-3">
        <label class="grid gap-1.5 text-[0.85rem] font-semibold text-ink">
          Baris
          <input v-model.number="tableRows" type="number" min="1" max="20" class="rte-field" @keydown.enter.prevent="applyTable">
        </label>
        <label class="grid gap-1.5 text-[0.85rem] font-semibold text-ink">
          Kolom
          <input v-model.number="tableCols" type="number" min="1" max="20" class="rte-field" @keydown.enter.prevent="applyTable">
        </label>
      </div>
      <label class="flex items-center gap-2 text-[0.85rem] font-semibold text-ink">
        <input v-model="tableHeaderRow" type="checkbox" class="h-4 w-4 rounded border-line accent-primary">
        Baris pertama sebagai judul
      </label>
    </form>
    <template #footer="{ close }">
      <AppButton variant="outline" size="sm" @click="close">Batal</AppButton>
      <AppButton size="sm" @click="applyTable">Sisipkan</AppButton>
    </template>
  </AppModal>

  <!-- LaTeX -->
  <AppModal v-model="mathModalOpen" :title="mathModalTitle">
    <MathPanel v-model="mathLatex" :submit-label="mathSubmitLabel" hide-submit @submit="submitMath" />
    <p class="mt-2 text-[0.78rem] text-muted">Klik rumus yang sudah ada di editor untuk mengubahnya.</p>
    <template #footer="{ close }">
      <AppButton variant="outline" size="sm" @click="close">Batal</AppButton>
      <AppButton size="sm" :disabled="!mathLatex.trim()" @click="submitMath">{{ mathSubmitLabel }}</AppButton>
    </template>
  </AppModal>

  <!-- Gambar -->
  <AppModal v-model="imageModalOpen" title="Sisipkan gambar">
    <div class="grid gap-3">
      <AppButton type="button" size="sm" class="w-full" :disabled="imageUploading" @click="triggerImageUpload">
        {{ imageUploading ? 'Mengunggah…' : 'Unggah dari perangkat' }}
      </AppButton>
      <p class="-mt-1.5 text-[0.78rem] text-muted">JPG, PNG, WEBP, atau GIF (maksimal 5 MB).</p>

      <div class="flex items-center gap-2">
        <span class="h-px flex-1 bg-line" aria-hidden="true" />
        <span class="text-[0.78rem] text-muted">atau tempel URL</span>
        <span class="h-px flex-1 bg-line" aria-hidden="true" />
      </div>

      <label class="grid gap-1.5 text-[0.85rem] font-semibold text-ink">
        URL gambar
        <input v-model="imageUrl" type="text" inputmode="url" placeholder="https://…" class="rte-field" @keydown.enter.prevent="applyImageUrl">
      </label>
      <label class="grid gap-1.5 text-[0.85rem] font-semibold text-ink">
        Teks alternatif (alt) <span class="font-normal text-muted">(opsional)</span>
        <input v-model="imageAlt" type="text" placeholder="Deskripsi singkat gambar" class="rte-field">
      </label>
      <p v-if="imageError" role="alert" class="text-[0.82rem] font-semibold text-red-600">{{ imageError }}</p>
    </div>
    <template #footer="{ close }">
      <AppButton variant="outline" size="sm" @click="close">Batal</AppButton>
      <AppButton size="sm" :disabled="!imageUrl.trim() || imageUploading" @click="applyImageUrl">Sisipkan URL</AppButton>
    </template>
  </AppModal>

  <!-- Lihat / edit HTML -->
  <AppModal v-model="sourceModalOpen" title="HTML sumber" description="Perubahan disaring ulang oleh editor dan server saat diterapkan.">
    <textarea
      v-model="sourceHtml"
      rows="12"
      spellcheck="false"
      class="rte-field w-full resize-y font-mono text-[0.82rem] leading-relaxed"
    />
    <template #footer="{ close }">
      <AppButton variant="outline" size="sm" @click="close">Batal</AppButton>
      <AppButton size="sm" @click="applySource">Terapkan</AppButton>
    </template>
  </AppModal>
  </div>
</template>

<style scoped>
.rte-btn {
  display: inline-flex;
  height: 2rem;
  min-width: 2rem;
  shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  padding-inline: 0.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-muted);
  transition: background-color 0.15s ease, color 0.15s ease;
}
.rte-btn:hover:not(:disabled) {
  background: var(--color-surface);
  color: var(--color-ink);
}
.rte-btn:disabled {
  opacity: 0.35;
}
.rte-btn-active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.rte-sep {
  margin-inline: 0.25rem;
  height: 1.25rem;
  width: 1px;
  flex-shrink: 0;
  background: var(--color-line);
}

.rte-chip {
  display: inline-flex;
  height: 1.75rem;
  align-items: center;
  border-radius: var(--radius-pill);
  padding-inline: 0.65rem;
  font-weight: 600;
  color: var(--color-primary-dark);
  background: var(--color-surface);
  border: 1px solid var(--color-hairline-strong);
  white-space: nowrap;
}
.rte-chip:hover:not(:disabled) {
  background: var(--color-primary-soft);
}
.rte-chip:disabled {
  opacity: 0.4;
}
.rte-chip-danger {
  color: #b91c1c;
}

/* Swatch grid (warna teks / sorotan) */
.rte-swatch-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.4rem;
}
.rte-swatch {
  height: 1.6rem;
  width: 100%;
  border-radius: var(--radius-xs);
  border: 1px solid var(--color-hairline-strong);
  cursor: pointer;
  transition: transform 0.1s ease;
}
.rte-swatch:hover {
  transform: scale(1.08);
}

/* Menu item (font / ukuran) */
.rte-menu-item {
  display: block;
  width: 100%;
  border-radius: var(--radius-xs);
  padding: 0.4rem 0.55rem;
  text-align: left;
  font-size: 0.86rem;
  color: var(--color-ink);
}
.rte-menu-item:hover {
  background: var(--color-surface-alt);
}

/* Glyph grid (karakter khusus / emoji) */
.rte-glyph-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.15rem;
  max-height: 12rem;
  overflow-y: auto;
}
.rte-glyph {
  display: inline-flex;
  height: 1.7rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  font-size: 0.95rem;
  color: var(--color-ink);
}
.rte-glyph:hover {
  background: var(--color-surface-alt);
}

/* Field bersama untuk isi modal */
.rte-field {
  width: 100%;
  border-radius: var(--radius-xs);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  padding: 0.55rem 0.65rem;
  font-size: 0.9rem;
  color: var(--color-ink);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.rte-field::placeholder {
  color: var(--color-placeholder);
}
.rte-field:focus {
  outline: none;
  border-color: rgba(47, 111, 235, 0.4);
  box-shadow: 0 0 0 4px rgba(47, 111, 235, 0.1);
}

.rte-scroll {
  max-height: 26rem;
  overflow-y: auto;
}

/* Layar penuh: editor menutupi viewport, area edit memanjang mengisi sisa. */
.rte-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  border-radius: 0;
}
.rte-fullscreen .rte-scroll {
  max-height: none;
  flex: 1;
}

:deep(.rte-content) {
  min-height: 14rem;
  padding: 0.85rem 1rem;
  outline: none;
}

/* Mode compact (TutorOptionField.vue): toolbar & area edit menyusut. */
.rte-compact .rte-toolbar {
  padding-block: 0.3rem;
  gap: 0.15rem;
}
.rte-compact .rte-btn {
  height: 1.6rem;
  min-width: 1.6rem;
  padding-inline: 0.3rem;
  font-size: 0.72rem;
}
.rte-compact .rte-scroll {
  max-height: 10rem;
}
.rte-compact :deep(.rte-content) {
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.94rem;
}
:deep(.rte-content p) {
  margin: 0 0 0.6em;
}
:deep(.rte-content p:last-child) {
  margin-bottom: 0;
}
:deep(.rte-content h1) {
  margin: 0.4em 0;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
:deep(.rte-content h2) {
  margin: 0.4em 0;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
:deep(.rte-content h3) {
  margin: 0.4em 0;
  font-size: 1.02rem;
  font-weight: 700;
}
/* Preflight Tailwind mematikan list-style pada ul/ol, jadi tanpa ini butir
   daftar kehilangan bulatan/angkanya dan hanya tampak sebagai baris menjorok. */
:deep(.rte-content ul:not([data-type='taskList'])),
:deep(.rte-content ol) {
  margin: 0.4em 0;
  padding-left: 1.4em;
}
:deep(.rte-content ul:not([data-type='taskList'])) {
  list-style: disc;
}
:deep(.rte-content ul:not([data-type='taskList']) ul) {
  list-style: circle;
}
:deep(.rte-content ol) {
  list-style: decimal;
}
:deep(.rte-content li) {
  margin: 0.15em 0;
}
:deep(.rte-content li > p) {
  margin: 0;
}
/* Daftar tugas (task list) — tanpa bullet, kotak centang sejajar teks. */
:deep(.rte-content ul[data-type='taskList']) {
  list-style: none;
  margin: 0.4em 0;
  padding-left: 0.2em;
}
:deep(.rte-content ul[data-type='taskList'] li) {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
}
:deep(.rte-content ul[data-type='taskList'] li > label) {
  margin-top: 0.2em;
  flex-shrink: 0;
  user-select: none;
}
:deep(.rte-content ul[data-type='taskList'] li > div) {
  flex: 1 1 auto;
  min-width: 0;
}
:deep(.rte-content blockquote) {
  margin: 0.5em 0;
  border-left: 3px solid var(--color-line);
  padding-left: 0.85em;
  color: var(--color-muted);
}
:deep(.rte-content pre) {
  margin: 0.6em 0;
  border-radius: var(--radius-xs);
  background: #0f172a;
  color: #e2e8f0;
  padding: 0.75em 0.9em;
  overflow-x: auto;
  font-size: 0.88em;
}
:deep(.rte-content pre code) {
  background: none;
  color: inherit;
  padding: 0;
  font-family: 'Courier New', monospace;
}
:deep(.rte-content code) {
  background: var(--color-surface-alt);
  border-radius: 3px;
  padding: 0.1em 0.3em;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}
:deep(.rte-content mark) {
  border-radius: 2px;
  padding: 0 0.05em;
}
:deep(.rte-content hr) {
  margin: 0.9em 0;
  border: none;
  border-top: 1px solid var(--color-line);
}
:deep(.rte-content a) {
  color: var(--color-primary);
  text-decoration: underline;
}
:deep(.rte-content [data-indent='1']) { padding-left: 1.5em; }
:deep(.rte-content [data-indent='2']) { padding-left: 3em; }
:deep(.rte-content [data-indent='3']) { padding-left: 4.5em; }
:deep(.rte-content [data-indent='4']) { padding-left: 6em; }
:deep(.rte-content [data-indent='5']) { padding-left: 7.5em; }
:deep(.rte-content [data-indent='6']) { padding-left: 9em; }
:deep(.rte-content [data-indent='7']) { padding-left: 10.5em; }
:deep(.rte-content [data-indent='8']) { padding-left: 12em; }
:deep(.rte-content table) {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 0.6em 0;
}
:deep(.rte-content td),
:deep(.rte-content th) {
  border: 1px solid var(--color-line);
  padding: 0.4rem 0.6rem;
  vertical-align: top;
  position: relative;
}
:deep(.rte-content th) {
  background: var(--color-surface-alt);
  font-weight: 700;
  text-align: left;
}
:deep(.rte-content .selectedCell) {
  background: var(--color-primary-soft);
}
:deep(.rte-content img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-xs);
  margin: 0.5em 0;
}
:deep(.rte-content img.ProseMirror-selectednode) {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
:deep(.rte-content span[data-type='inlineMath']) {
  border-radius: 3px;
  padding: 0 0.1em;
}
:deep(.rte-content span[data-type='inlineMath']:hover) {
  background: var(--color-primary-soft);
  cursor: text;
}
:deep(.rte-content p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  color: var(--color-placeholder);
  pointer-events: none;
}
</style>
