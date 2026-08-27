/**
 * Wire format returned by zenko-api. Keep in sync with
 * zenko-api/internal/model/catalog.go.
 */

export interface Author {
  name: string
  avatarUrl: string
  /**
   * Handle for `/tutor/:username`. Empty string for seeded packages that have
   * no tutor account behind them — those render the name as plain text, since
   * a link to `/tutor/` would 404.
   */
  username: string
}

export interface Package {
  id: string
  slug: string
  title: string
  category: string
  thumbnailUrl: string
  author: Author
  rating: number
  /**
   * Berapa kali paket ini sudah dikerjakan, sudah diformat untuk ditampilkan
   * ("0", "740", "1.2rb"). Dulu ini jumlah penjualan, tapi angkanya
   * di-hardcode nol di zenko-api untuk setiap produk tutor sehingga tidak
   * pernah bergerak. Jumlah pengerjaan juga sinyal yang lebih jujur untuk
   * marketplace try out: paket yang dibeli lalu tidak pernah dibuka belum
   * mengajari siapa pun.
   */
  attemptLabel: string
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
