/**
 * Bridges the rich-text question editor with data written before it existed.
 * Prompt/explanation used to be plain text; the editor now stores sanitized
 * HTML (see zenko-api's internal/richtext package, the server-side trust
 * boundary this client-side normalization mirrors for display only).
 */

const HTML_TAG_PATTERN = /<\/?(p|br|h[1-3]|ul|ol|li|table|thead|tbody|tr|td|th|strong|b|em|i|u|s|strike|sub|sup|blockquote|hr|a|img|span)\b/i

/** Heuristic: does this already look like markup the editor itself would produce? */
export function looksLikeRichTextHtml(value: string): boolean {
  return HTML_TAG_PATTERN.test(value)
}

/**
 * Escapes legacy plain text and wraps each line in a paragraph, so content
 * written before the editor existed loads as literal text instead of being
 * misparsed as HTML (a stray "<" from "x < 10" would otherwise open a bogus tag).
 */
export function plainTextToEditorHtml(value: string): string {
  const escaped = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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
