import type { PublicTutorProduct } from '#shared/types/public-tutor'

/** Public, safe projection of a bimbel profile. Never includes join codes. */
export interface PublicBimbelDetail {
  id: string
  slug: string
  name: string
  city: string
  description: string
  logoUrl: string
  products: PublicTutorProduct[]
  stats: { activePackages: number }
}
