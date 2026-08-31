/**
 * Wire format returned by zenko-api. Keep in sync with
 * zenko-api/internal/model/catalog.go.
 */

export interface Author {
  name: string
  avatarUrl: string
  /** Stable tutor account ID; used when the tutor has no username yet. */
  id?: string
  /**
   * Handle for `/tutor/:username`. Empty when the tutor has not claimed a
   * handle; callers fall back to `id` for a reachable legacy profile.
   */
  username: string
}

export interface Package {
  id: string
  slug: string
  title: string
  category: string
  /**
   * Level facet kedua di bawah kategori (SKD → CPNS/Kedinasan, TKA → jenjang
   * SD/SMP/SMA/SMK). Kosong untuk kategori tanpa level kedua.
   */
  subcategory: string
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

/**
 * Satu facet level kedua di dalam Category — GET /categories. Count sesuai
 * dengan hasil listing yang difilter category+subcategory.
 */
export interface CategorySubfacet {
  slug: string
  label: string
  count: number
}

/** One facet row of GET /categories; subcategories absen saat tidak punya. */
export interface Category {
  slug: string
  label: string
  count: number
  subcategories?: CategorySubfacet[]
}

export type SortKey = 'featured' | 'bestseller' | 'newest'

export interface SortOption {
  key: SortKey
  label: string
}
