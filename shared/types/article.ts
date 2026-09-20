/**
 * Wire format returned by zenko-api's public article endpoints. Keep in sync
 * with zenko-api/internal/model/marketing.go (model.Article).
 */

export interface Article {
  id: string
  slug: string
  title: string
  subtitle: string
  coverUrl: string
  coverAlt: string
  /**
   * Sanitised HTML, rendered with `v-html`. Empty on every item of
   * `GET /articles`: the index strips the body so the payload stays
   * proportional to the number of articles rather than their length. Only
   * `GET /articles/:slug` carries it.
   */
  content: string
  categoryId: string
  categoryName: string
  authorName: string
  metaTitle: string
  metaDescription: string
  /** ISO 8601. Absent while the article has never been published. */
  publishedAt?: string
  createdAt: string
  updatedAt: string
  wordCount: number
  readingMinutes: number
}

/** One entry of an article's table of contents, built from its own headings. */
export interface ArticleHeading {
  id: string
  text: string
  level: 2 | 3
}
