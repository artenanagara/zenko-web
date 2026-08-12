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
