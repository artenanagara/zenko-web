import type { ProductStatus } from '#shared/types/tutor-product'

export interface PublicTutorProfile {
  accountId: string
  displayName: string
  avatarUrl: string
  username: string
  usernameChangedAt: number
  bio: string
  experience: string
  specializations: string[]
  education: string
  portfolioUrl: string
  instagramUrl: string
  tiktokUrl: string
  linkedinUrl: string
  youtubeUrl: string
  websiteUrl: string
  updatedAt: number
}

export interface PublicTutorProduct {
  id: string
  type: 'single' | 'bundle'
  title: string
  slug: string
  category: string
  /** Level facet kedua (SKD → CPNS/Kedinasan, TKA → jenjang); kosong untuk bundel/legacy. */
  subcategory: string
  thumbnailUrl: string
  price: number
  priceOriginal: number
  status: ProductStatus
  questionCount: number
  questionTarget: number
  /** Average of this product's published reviews; 0 when it has none yet. */
  rating: number
  /** Times taken, already formatted for display ("0", "740", "1.2rb"). */
  attemptLabel: string
  updatedAt: number
}

export interface PublicTutorDetail {
  id: string
  username: string
  name: string
  avatarUrl: string
  verified: boolean
  profile: PublicTutorProfile
  products: PublicTutorProduct[]
  stats: { activePackages: number, ratingAverage: number, ratingCount: number }
}
