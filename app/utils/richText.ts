/**
 * Bridges the rich-text question editor with data written before it existed.
 * Prompt/explanation used to be plain text; the editor now stores sanitized
 * HTML (see zenko-api's internal/richtext package, the server-side trust
 * boundary this client-side normalization mirrors for display only).
 */

import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * Shared KaTeX options for every render path below.
 *
 * SECURITY INVARIANT — `trust` is pinned to false (its default) and MUST stay
 * that way. This markup is injected (via v-html) into HTML the server already
 * sanitized (see zenko-api internal/richtext), i.e. downstream of the trust
 * boundary, and it comes from tutor-authored `data-latex`. With `trust: true`
 * KaTeX would honour commands like \href and \htmlData, letting that LaTeX
 * smuggle a `javascript:` link or arbitrary attributes into every student's
 * exam view — stored XSS. Do not enable it; if a formula ever needs a trusted
 * command, gate it far more narrowly than a blanket `trust: true`.
 */
const KATEX_OPTIONS = { throwOnError: false, displayMode: false, trust: false } as const

const HTML_TAG_PATTERN = /<\/?(p|br|h[1-3]|ul|ol|li|table|thead|tbody|tr|td|th|strong|b|em|i|u|s|strike|sub|sup|blockquote|hr|pre|code|mark|a|img|span)\b/i

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
 *
 * Decoded first, then escaped: a tagless value is not raw text anymore — the
 * server sanitizes every prompt/explanation on save (internal/richtext), and
 * bluemonday writes a quote as `&#34;`. Escaping that a second time turns it
 * into `&amp;#34;`, which is how a CSV-imported explanation showed literal
 * "&#34;kota bebas banjir&#34;" in the editor. Decoding restores the
 * characters the tutor wrote; the escape that follows still protects a
 * literal "<" from being parsed as a tag.
 */
export function plainTextToEditorHtml(value: string): string {
  const escaped = escapeHtml(decodeHtmlEntities(value))
  const paragraphs = escaped.split(/\n+/).filter(line => line.trim() !== '')
  if (paragraphs.length === 0) return ''
  return paragraphs.map(line => `<p>${line}</p>`).join('')
}

/**
 * Normalizes any stored prompt/explanation value into HTML the editor can
 * load, then upgrades bare `$latex$` / `$$latex$$` text into real inlineMath
 * nodes (see upgradeBareMathToNodes) so CSV-imported formulas typeset inside
 * the editor too, not only in student-facing views.
 */
export function toEditorHtml(value: string): string {
  if (!value) return ''
  const html = looksLikeRichTextHtml(value) ? value : plainTextToEditorHtml(value)
  return upgradeBareMathToNodes(html)
}

/**
 * Tokens the upgrade below must step over untouched: an existing inlineMath
 * span (its text content is literally `$latex$`, so a naive pass would wrap
 * it twice) and any other tag (a `$` inside an attribute value is not math).
 */
const MATH_SPAN_OR_TAG_PATTERN = /<span\b[^>]*data-type="inlineMath"[^>]*>.*?<\/span>|<[^>]+>/gi

/**
 * `$$latex$$` first (display, own centered line), then `$latex$` (inline).
 * The inner class excludes `$` and angle brackets, so a formula never spans a
 * tag boundary and a lone dollar sign ("Rp 5$ ") is left alone; `\S` at both
 * ends keeps "$ 5 $"-style prose from being mistaken for math.
 */
const BARE_DISPLAY_MATH_PATTERN = /\$\$(\S(?:[^$<>]*?\S)?)\$\$/g
const BARE_INLINE_MATH_PATTERN = /\$(\S(?:[^$<>]*?\S)?)\$/g

/**
 * Rewrites bare `$latex$` text into the `<span data-type="inlineMath">` node
 * markup @aarkue/tiptap-math-extension parses on load.
 *
 * Why this is needed: the extension recognises `$..$` only through an
 * InputRule/PasteRule, which ProseMirror runs for live typing and paste —
 * never for `content:` initial load or `setContent()`. Those go through the
 * schema's parseHTML, which for inlineMath matches only the span. A CSV
 * import (questionCsv.ts) stores its cells as `<p>$latex$</p>`, so until this
 * pass the editor showed the raw dollar text and the tutor had to re-type
 * every formula for it to render — while the student view, which goes
 * through renderInlineMathHtml, already typeset it. Once the tutor saves,
 * the editor persists the span form and this pass becomes a no-op.
 *
 * `data-latex` keeps the entity-escaped text as-is: the value came from HTML
 * text, so `&lt;`/`&amp;` are already attribute-safe, and the extension's
 * parseHTML reads the attribute back through the DOM, which decodes them.
 * Only `"` needs converting, since it would end the attribute early.
 */
export function upgradeBareMathToNodes(html: string): string {
  if (!html.includes('$')) return html

  const wrap = (latex: string, display: boolean): string => {
    const attr = latex.replace(/"/g, '&quot;')
    const delimiter = display ? '$$' : '$'
    return `<span data-type="inlineMath" data-latex="${attr}" data-evaluate="no" data-display="${display ? 'yes' : 'no'}">${delimiter}${latex}${delimiter}</span>`
  }

  let out = ''
  let last = 0
  for (const match of html.matchAll(MATH_SPAN_OR_TAG_PATTERN)) {
    out += upgradeTextRun(html.slice(last, match.index), wrap)
    out += match[0]
    last = match.index + match[0].length
  }
  out += upgradeTextRun(html.slice(last), wrap)
  return out
}

function upgradeTextRun(text: string, wrap: (latex: string, display: boolean) => string): string {
  if (!text.includes('$')) return text
  return text
    .replace(BARE_DISPLAY_MATH_PATTERN, (_whole, latex: string) => wrap(latex, true))
    .replace(BARE_INLINE_MATH_PATTERN, (_whole, latex: string) => wrap(latex, false))
}

const BLOCK_BOUNDARY_PATTERN = /<\/(p|div|li|h[1-3]|tr)>|<br\s*\/?>/gi
const IMAGE_PATTERN = /<img\b[^>]*>/gi
const MATH_PATTERN = /<span\b[^>]*data-type="inlineMath"[^>]*>.*?<\/span>/gi

const INLINE_MATH_SPAN_PATTERN = /<span\b([^>]*data-type="inlineMath"[^>]*)>.*?<\/span>/gi
const LATEX_ATTR_PATTERN = /data-latex="([^"]*)"/
/** `data-display="yes"` marks a block/display formula (own centered line) rather than inline. */
const DISPLAY_ATTR_PATTERN = /data-display="yes"/

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
      return katex.renderToString(decodeHtmlEntities(latex), KATEX_OPTIONS)
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
    // Spread keeps the trust:false invariant; only displayMode varies, so a
    // formula the tutor marked "baris sendiri" typesets as a centered block.
    const options = { ...KATEX_OPTIONS, displayMode: DISPLAY_ATTR_PATTERN.test(attrs) }
    try {
      return katex.renderToString(latex, options)
    }
    catch {
      return whole
    }
  })
  return renderBareMathSegments(withSpansRendered)
}

/**
 * Turns the entities the sanitizer emits back into characters.
 *
 * Numeric references are covered as well as named ones: the editor stores an
 * apostrophe as `&#39;`, which no list of named entities would ever catch —
 * that is how "Letraset&#39;s" reached a wacana preview verbatim.
 *
 * `&amp;` is decoded LAST on purpose. Decoding it first would turn text an
 * author literally typed as "&#39;" (stored as "&amp;#39;") into an
 * apostrophe on the next pass, silently rewriting what they wrote.
 */
export function decodeHtmlEntities(value: string): string {
  if (!value) return ''
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (whole, code: string) => codePointOr(whole, Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (whole, code: string) => codePointOr(whole, Number.parseInt(code, 16)))
    .replace(/&amp;/g, '&')
}

/** A reference outside Unicode is left as written rather than throwing. */
function codePointOr(whole: string, code: number): string {
  return Number.isInteger(code) && code >= 0 && code <= 0x10FFFF
    ? String.fromCodePoint(code)
    : whole
}

/** Strips tags for plain-text previews (e.g. the question list row) — display only, never used for security. */
export function stripHtmlToText(html: string): string {
  if (!html) return ''
  // Entities are decoded by the shared helper rather than a second, shorter
  // list kept here — the two lists drifted, and this one was missing the
  // apostrophe every editor-typed quote is stored as.
  return decodeHtmlEntities(
    html
      .replace(MATH_PATTERN, ' [rumus] ')
      .replace(IMAGE_PATTERN, ' [gambar] ')
      .replace(BLOCK_BOUNDARY_PATTERN, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim()
}
