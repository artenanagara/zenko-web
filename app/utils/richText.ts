/**
 * Bridges the rich-text question editor with data written before it existed.
 * Prompt/explanation used to be plain text; the editor now stores sanitized
 * HTML (see zenko-api's internal/richtext package, the server-side trust
 * boundary this client-side normalization mirrors for display only).
 */

import katex from 'katex'
import 'katex/dist/katex.min.css'

const HTML_TAG_PATTERN = /<\/?(p|br|h[1-3]|ul|ol|li|table|thead|tbody|tr|td|th|strong|b|em|i|u|s|strike|sub|sup|blockquote|hr|a|img|span)\b/i

/** Heuristic: does this already look like markup the editor itself would produce? */
export function looksLikeRichTextHtml(value: string): boolean {
  return HTML_TAG_PATTERN.test(value)
}

/**
 * Escapes `&`, `<`, `>` for embedding literal text inside HTML. Shared by
 * plainTextToEditorHtml below (legacy plain-text prompt/explanation) and
 * questionCsv.ts (CSV-imported answer options, which — same as this file's
 * other legacy-data path — arrive as plain text, not markup the editor
 * produced itself).
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Escapes legacy plain text and wraps each line in a paragraph, so content
 * written before the editor existed loads as literal text instead of being
 * misparsed as HTML (a stray "<" from "x < 10" would otherwise open a bogus tag).
 */
export function plainTextToEditorHtml(value: string): string {
  const escaped = escapeHtml(value)
  const paragraphs = escaped.split(/\n+/).filter(line => line.trim() !== '')
  if (paragraphs.length === 0) return ''
  return paragraphs.map(line => `<p>${line}</p>`).join('')
}

/** Normalizes any stored prompt/explanation value into HTML the editor can load. */
export function toEditorHtml(value: string): string {
  if (!value) return ''
  return looksLikeRichTextHtml(value) ? value : plainTextToEditorHtml(value)
}

const BLOCK_BOUNDARY_PATTERN = /<\/(p|div|li|h[1-3]|tr)>|<br\s*\/?>/gi
const IMAGE_PATTERN = /<img\b[^>]*>/gi
const MATH_PATTERN = /<span\b[^>]*data-type="inlineMath"[^>]*>.*?<\/span>/gi

const INLINE_MATH_SPAN_PATTERN = /<span\b([^>]*data-type="inlineMath"[^>]*)>.*?<\/span>/gi
const LATEX_ATTR_PATTERN = /data-latex="([^"]*)"/

/**
 * A second, plain-text math format: `$latex$` with no wrapping span, as
 * produced by questionCsv.ts wrapping an imported cell into `<p>${escapeHtml(cell)}</p>`
 * (the CSV format itself stays "plain text + $..$", per docs/tutor-flow-contract.md
 * §6 — only what happens to it on the way into QuestionOption.text changes).
 *
 * This does NOT get upgraded to a real inlineMath node just by loading it into
 * RichTextEditor: @aarkue/tiptap-math-extension's `$..$` recognition is an
 * InputRule/PasteRule, which ProseMirror only runs in response to live
 * typing/paste — never during `content:`-based initial load or a programmatic
 * `setContent()` (both go through the node schema's `parseHTML`, which for
 * inlineMath only matches `span[data-type="inlineMath"]`, not bare text).
 * Confirmed by reading node_modules/@aarkue/tiptap-math-extension/dist/index.js
 * before relying on it — the editor view itself still shows raw "$latex$"
 * text for CSV-imported options until a tutor re-touches the field, but that
 * is out of scope here (a third-party-extension change); this function only
 * needs to make it typeset correctly for STUDENT-FACING display (question
 * preview, exam), which is what it's used for everywhere it's called.
 */
const BARE_MATH_SEGMENT_PATTERN = /\$([^$<>]+)\$/g

function renderBareMathSegments(html: string): string {
  return html.replace(BARE_MATH_SEGMENT_PATTERN, (whole, latex: string) => {
    try {
      // decodeHtmlEntities undoes escapeHtml's &/</>  encoding so KaTeX sees
      // the tutor's actual LaTeX source (e.g. "x < y", "a & b" in a matrix),
      // not literal "&lt;"/"&amp;" — mirrors the span path just below, which
      // decodes its data-latex attribute for the same reason.
      return katex.renderToString(decodeHtmlEntities(latex), { throwOnError: false, displayMode: false })
    }
    catch {
      return whole
    }
  })
}

/**
 * Hydrates stored prompt/explanation/stimulus/option HTML for display outside
 * the Tiptap editor (the question-preview panel, and eventually the real exam
 * view). The math extension (see RichTextEditor.vue) only renders formulas
 * live inside its own ProseMirror view — the HTML it persists for a
 * tutor-authored formula is `<span data-type="inlineMath"
 * data-latex="...">$latex$</span>`, a placeholder, not the typeset formula.
 * This finds those spans and replaces their content with real KaTeX markup,
 * then does a second pass for bare `$latex$` segments (see
 * renderBareMathSegments above) so CSV-imported options typeset too.
 */
export function renderInlineMathHtml(html: string): string {
  if (!html) return ''
  const withSpansRendered = html.replace(INLINE_MATH_SPAN_PATTERN, (whole, attrs: string) => {
    const match = LATEX_ATTR_PATTERN.exec(attrs)
    if (!match) return whole
    const latex = decodeHtmlEntities(match[1] ?? '')
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: false })
    }
    catch {
      return whole
    }
  })
  return renderBareMathSegments(withSpansRendered)
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Strips tags for plain-text previews (e.g. the question list row) — display only, never used for security. */
export function stripHtmlToText(html: string): string {
  if (!html) return ''
  return html
    .replace(MATH_PATTERN, ' [rumus] ')
    .replace(IMAGE_PATTERN, ' [gambar] ')
    .replace(BLOCK_BOUNDARY_PATTERN, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}
