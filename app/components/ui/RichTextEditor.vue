<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
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
import { MathExtension } from '@aarkue/tiptap-math-extension'
import 'katex/dist/katex.min.css'
import type { MenuItem } from '~/components/core/AppDropdownMenu.vue'

/**
 * Moodle-style question editor: formatting, headings, lists, alignment,
 * links, and a table with per-row/-column insert & delete — for the tutor
 * wizard's question prompt/explanation fields (TutorQuestionForm.vue).
 *
 * Emits sanitized-on-the-server HTML; the server (internal/richtext) is the
 * actual trust boundary, this only shapes what the toolbar can produce.
 */
const props = defineProps<{
  modelValue: string
  placeholder?: string
  ariaLabel?: string
  /**
   * Toolbar ringkas + tanpa min-height besar — untuk ditanam di dalam baris
   * opsi jawaban (TutorOptionField.vue), bukan field pertanyaan/pembahasan
   * penuh. Menyisakan hanya yang masuk akal untuk frasa pendek: tebal/
   * miring/garis bawah, sub/superskrip, rumus, dan gambar — heading, tabel,
   * kutipan, daftar, perataan, tautan, dan urungkan/ulangi dilepas (riwayat
   * urungkan bawaan ProseMirror tetap jalan lewat Ctrl/Cmd+Z biar tanpa
   * tombolnya, cuma UI-nya yang disembunyikan).
   */
  compact?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

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
    TextAlign.configure({ types: ['paragraph', 'heading'] }),
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
    // Intercepting the click and opening the editor popover instead is what
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
 * update, and syncing on it too would race the next keystroke: Vue batches
 * watcher callbacks, so a burst of edits (e.g. toggling bold, then pressing
 * Enter) can flush this watcher with an HTML snapshot that already lags
 * behind what's on screen, and setContent would stomp the newer state.
 * isFocused is `true` for exactly the "still typing here" case this must
 * skip; an external reset (a different question loaded into this field)
 * happens while unfocused, so it still syncs.
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

const linkPopoverOpen = ref(false)
const linkUrl = ref('')

function openLinkPopover() {
  const instance = editor.value
  if (!instance) return
  linkUrl.value = instance.getAttributes('link').href ?? ''
  linkPopoverOpen.value = true
}

function applyLink() {
  const instance = editor.value
  if (!instance) return
  const url = linkUrl.value.trim()
  if (url === '') instance.chain().focus().unsetLink().run()
  else instance.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  linkPopoverOpen.value = false
}

function removeLink() {
  editor.value?.chain().focus().unsetLink().run()
  linkPopoverOpen.value = false
}

function insertTable() {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

/*
 * The math extension has no insert command of its own — it only reacts to
 * typed/pasted "$...$" — and its node is atom+selectable, meaning a click
 * only selects it, not "enters" it the way a Word equation field does. So
 * editing an inserted formula's values happens entirely through this
 * popover: templates fill the field rather than inserting straight away,
 * the field live-previews through the same KaTeX the editor itself uses,
 * and clicking an existing formula (see handleClickOn above) reopens this
 * same popover pre-filled, applying an update instead of an insert.
 */
const mathPopoverOpen = ref(false)
const mathLatex = ref('')
/** null while inserting a new formula; the node's doc position while editing an existing one. */
const mathEditPos = ref<number | null>(null)

const mathDropdownTitle = computed(() => mathEditPos.value === null ? 'Sisipkan rumus' : 'Ubah rumus')
const mathSubmitLabel = computed(() => mathEditPos.value === null ? 'Sisipkan' : 'Terapkan')

function openMathPopover() {
  mathLatex.value = ''
  mathEditPos.value = null
  mathPopoverOpen.value = true
}

function openMathEditor(latex: string, pos: number) {
  mathLatex.value = latex
  mathEditPos.value = pos
  mathPopoverOpen.value = true
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
  mathPopoverOpen.value = false
}

const imagePopoverOpen = ref(false)
const imageUrl = ref('')
const imageUploading = ref(false)
const imageError = ref('')
const imageFileInput = ref<HTMLInputElement | null>(null)

function openImagePopover() {
  imageUrl.value = ''
  imageError.value = ''
  imagePopoverOpen.value = true
}

function applyImageUrl() {
  const url = imageUrl.value.trim()
  if (!url) return
  editor.value?.chain().focus().setImage({ src: url }).run()
  imagePopoverOpen.value = false
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
    editor.value?.chain().focus().setImage({ src: url }).run()
    imagePopoverOpen.value = false
  }
  catch (cause) {
    imageError.value = tutorApiMessage(cause, 'Gagal mengunggah gambar.')
  }
  finally {
    imageUploading.value = false
  }
}

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

const blockButtons = computed<ToolbarButton[]>(() => {
  const instance = editor.value
  return [
    { title: 'Daftar poin', icon: 'list-bullets', run: () => instance?.chain().focus().toggleBulletList().run(), active: () => instance?.isActive('bulletList') ?? false },
    { title: 'Daftar bernomor', icon: 'list-numbers', run: () => instance?.chain().focus().toggleOrderedList().run(), active: () => instance?.isActive('orderedList') ?? false },
    { title: 'Kutipan', icon: 'quotes', run: () => instance?.chain().focus().toggleBlockquote().run(), active: () => instance?.isActive('blockquote') ?? false },
    { title: 'Garis pemisah', icon: 'minus', run: () => instance?.chain().focus().setHorizontalRule().run(), active: () => false },
  ]
})

const ALIGN_OPTIONS = [
  { title: 'Rata kiri', value: 'left' as const },
  { title: 'Rata tengah', value: 'center' as const },
  { title: 'Rata kanan', value: 'right' as const },
]

onBeforeUnmount(() => editor.value?.destroy())

/**
 * Dipakai TutorOptionField.vue supaya Tab bisa loncat antar-opsi lewat ref
 * (bukan lagi query DOM `<textarea>` — ProseMirror bukan textarea, lihat
 * jumpBetweenOptions di TutorQuestionForm.vue) tanpa memaksa pemanggil tahu
 * cara kerja instance Tiptap di dalamnya.
 */
defineExpose({
  focus: () => { editor.value?.chain().focus().run() },
})
</script>

<template>
  <!--
    Sengaja TANPA overflow-hidden: popover toolbar (tautan/rumus/gambar)
    digantung dari tombolnya dan menjulur ke luar kotak editor, jadi meng-clip
    di sini akan memotongnya — sudut atas dibulatkan lewat toolbar itu sendiri.
  -->
  <div class="rte rounded-sm border border-line bg-surface" :class="{ 'rte-compact': compact }">
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

        <span class="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />
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
        <span class="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />

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
          <AppIcon v-if="block.icon" :name="block.icon" :size="16" />
          <template v-else>{{ block.label }}</template>
        </button>

        <span class="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />

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
          <IconAlign :variant="align.value" class="h-4 w-4" />
        </button>

        <span class="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />

        <RteDropdown v-model="linkPopoverOpen" title="Sisipkan tautan" :width="260">
          <template #trigger>
            <button
              type="button"
              title="Tautan"
              class="rte-btn"
              :class="{ 'rte-btn-active': editor?.isActive('link') }"
              @mousedown.prevent
              @click="openLinkPopover"
            >
              <IconLink class="h-4 w-4" />
            </button>
          </template>
          <template #panel>
            <input
              v-model="linkUrl"
              type="url"
              placeholder="https://…"
              class="rte-dropdown-input"
              @keydown.enter.prevent="applyLink"
            >
            <AppButton type="button" size="xs" class="w-full" @click="applyLink">
              Terapkan
            </AppButton>
            <AppButton
              v-if="editor?.isActive('link')"
              type="button"
              variant="outline"
              size="xs"
              class="w-full"
              @click="removeLink"
            >
              Hapus tautan
            </AppButton>
          </template>
        </RteDropdown>

        <button type="button" title="Sisipkan tabel" class="rte-btn" @mousedown.prevent @click="insertTable">
          <IconTableInsert class="h-4 w-4" />
        </button>
      </template>

      <RteDropdown v-model="mathPopoverOpen" :title="mathDropdownTitle" :width="340">
        <template #trigger>
          <button type="button" title="Sisipkan rumus (LaTeX)" class="rte-btn" @mousedown.prevent @click="openMathPopover">
            ∑
          </button>
        </template>
        <template #panel>
          <MathPanel v-model="mathLatex" :submit-label="mathSubmitLabel" @submit="submitMath" />
          <p class="text-[0.76rem] text-muted">Klik rumus yang sudah ada untuk mengubahnya.</p>
        </template>
      </RteDropdown>

      <RteDropdown v-model="imagePopoverOpen" title="Sisipkan gambar" :width="260">
        <template #trigger>
          <button
            type="button"
            title="Sisipkan gambar"
            class="rte-btn"
            @mousedown.prevent
            @click="openImagePopover"
          >
            <IconImage class="h-4 w-4" />
          </button>
        </template>
        <!--
          Unggah dulu, URL belakangan: tutor jauh lebih sering punya file
          gambar di perangkatnya daripada URL yang sudah terhosting.
        -->
        <template #panel>
          <AppButton type="button" size="xs" class="w-full" :disabled="imageUploading" @click="triggerImageUpload">
            {{ imageUploading ? 'Mengunggah…' : 'Unggah dari perangkat' }}
          </AppButton>
          <p class="-mt-1.5 text-[0.76rem] text-muted">JPG, PNG, WEBP, atau GIF (maksimal 5 MB).</p>
          <div class="flex items-center gap-2">
            <span class="h-px flex-1 bg-line" aria-hidden="true" />
            <span class="text-[0.76rem] text-muted">atau tempel URL</span>
            <span class="h-px flex-1 bg-line" aria-hidden="true" />
          </div>
          <input
            v-model="imageUrl"
            type="url"
            placeholder="https://…"
            aria-label="URL gambar"
            class="rte-dropdown-input"
            @keydown.enter.prevent="applyImageUrl"
          >
          <AppButton
            type="button"
            variant="outline"
            size="xs"
            class="w-full"
            :disabled="!imageUrl.trim()"
            @click="applyImageUrl"
          >
            Sisipkan URL
          </AppButton>
          <p v-if="imageError" role="alert" class="text-[0.78rem] font-semibold text-red-600">
            {{ imageError }}
          </p>
        </template>
      </RteDropdown>
      <input
        ref="imageFileInput"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        class="hidden"
        @change="onImageFileSelected"
      >

      <template v-if="!compact">
        <span class="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />

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

.rte-dropdown-input {
  height: 2.25rem;
  width: 100%;
  border-radius: var(--radius-xs);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  padding-inline: 0.65rem;
  font-size: 0.86rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.rte-dropdown-input::placeholder {
  color: var(--color-placeholder);
}
.rte-dropdown-input:focus {
  outline: none;
  border-color: rgba(47, 111, 235, 0.4);
  box-shadow: 0 0 0 4px rgba(47, 111, 235, 0.1);
}

.rte-dropdown-preview {
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

.rte-scroll {
  max-height: 26rem;
  overflow-y: auto;
}

:deep(.rte-content) {
  min-height: 14rem;
  padding: 0.85rem 1rem;
  outline: none;
}

/* Mode compact (TutorOptionField.vue): toolbar & area edit menyusut supaya
   satu baris opsi A–E tidak membengkak jadi blok rich-text setinggi field
   pertanyaan. */
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
:deep(.rte-content ul),
:deep(.rte-content ol) {
  margin: 0.4em 0;
  padding-left: 1.4em;
}
:deep(.rte-content ul) {
  list-style: disc;
}
:deep(.rte-content ul ul) {
  list-style: circle;
}
:deep(.rte-content ol) {
  list-style: decimal;
}
:deep(.rte-content li) {
  margin: 0.15em 0;
}
/* Tiptap membungkus isi tiap butir dalam <p>; margin bawaannya membuat daftar
   terlihat renggang dan bulatannya tidak sejajar dengan barisnya. */
:deep(.rte-content li > p) {
  margin: 0;
}
:deep(.rte-content blockquote) {
  margin: 0.5em 0;
  border-left: 3px solid var(--color-line);
  padding-left: 0.85em;
  color: var(--color-muted);
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
