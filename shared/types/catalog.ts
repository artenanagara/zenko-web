/**
 * Wire format returned by zenko-api. Keep in sync with
 * zenko-api/internal/model/catalog.go.
 */

export interface Author {
  name: string
  avatarUrl: string
}

export interface Package {
  id: string
  slug: string
  title: string
  category: string
  thumbnailUrl: string
  author: Author
  rating: number
  soldLabel: string
  price: number
  priceOriginal: number
}

/** One section of material inside a package. */
export interface Topic {
  title: string
  count: number
}

/**
 * Full view of a package, returned only by the by-slug endpoint. The list
 * endpoint stays on the lighter `Package`.
 */
export interface PackageDetail extends Package {
  description: string
  questionCount: number
  durationMinutes: number
  reviewCount: number
  includes: string[]
  topics: Topic[]
  /** Unix seconds. */
  updatedAt: number
}

export interface Testimonial {
  id: string
  name: string
  role: string
  avatarUrl: string
  quote: string
  rating: number
}

export type SortKey = 'featured' | 'bestseller' | 'newest'

export interface SortOption {
  key: SortKey
  label: string
}
