import type { ArticleHeading } from '#shared/types/article'

/**
 * Editorial article HTML, prepared for reading.
 *
 * The body arrives from zenko-api already sanitized (internal/richtext), and
 * carries no anchors of its own — the Marketing Hub editor writes plain
 * `<h2>`/`<h3>`. A table of contents therefore has to be derived here, which
 * means giving each heading a stable id to link to.
 *
 * Done as a string rewrite rather than through the DOM on purpose: the
 * article page renders on the server too, where there is no DOMParser, and a
 * table of contents that only appears after hydration would shift the layout
 * on every page load.
 */

const HEADING_PATTERN = /<(h2|h3)\b([^>]*)>([\s\S]*?)<\/\1>/gi
const EXISTING_ID_PATTERN = /\bid="([^"]*)"/i

export interface ArticleContent {
  /** The body with an id on every heading, ready for `v-html`. */
  html: string
  /** One entry per heading, in document order. */
  headings: ArticleHeading[]
}

export function buildArticleContent(rawHtml: string): ArticleContent {
  if (!rawHtml) return { html: '', headings: [] }

  const headings: ArticleHeading[] = []
  const used = new Set<string>()

  const html = rawHtml.replace(HEADING_PATTERN, (whole, tag: string, attrs: string, inner: string) => {
    const text = stripHtmlToText(inner)
    if (!text) return whole

    const existing = EXISTING_ID_PATTERN.exec(attrs)?.[1]
    const id = existing || uniqueId(headingId(text), used)
    used.add(id)
    headings.push({ id, text, level: tag.toLowerCase() === 'h3' ? 3 : 2 })

    // An editor-written heading has no attributes at all in practice, but
    // keeping whatever it does carry costs nothing and avoids dropping, say,
    // a text-align class on a centred heading.
    return existing
      ? whole
      : `<${tag}${attrs} id="${id}">${inner}</${tag}>`
  })

  return { html, headings }
}

/** ASCII slug of the heading text; falls back to a positional id when empty. */
function headingId(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  return slug || 'bagian'
}

/** Two sections can share a title ("Contoh"); the anchor cannot. */
function uniqueId(base: string, used: Set<string>): string {
  if (!used.has(base)) return base
  let suffix = 2
  while (used.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

/**
 * The one-paragraph summary a card shows. The subtitle is what the editor
 * writes for exactly this purpose; the meta description is the next best
 * thing, and the body is the last resort — the index endpoint strips it, so
 * that branch only ever runs on a page that already holds the full article.
 */
export function articleExcerpt(article: { subtitle: string, metaDescription: string, content: string }, max = 180): string {
  const summary = article.subtitle.trim() || article.metaDescription.trim() || stripHtmlToText(article.content)
  if (summary.length <= max) return summary

  const cut = summary.slice(0, max - 1).trimEnd()
  const boundary = cut.lastIndexOf(' ')
  return `${(boundary > 0 ? cut.slice(0, boundary) : cut).trimEnd()}…`
}
