/**
 * Admin's tutor directory: every account holding the tutor role, and one
 * tutor's profile plus everything they have published. Mirrors
 * zenko-api/internal/model/tutor_profile.go's AdminTutorDetail.
 */

import type { TutorProductSummary } from './tutor-product'
import type { TutorProfile } from './tutor-profile'
import type { User } from './user'

/**
 * GET /admin/tutors/:accountId. User is spread rather than nested — the
 * endpoint's JSON has id/email/name/avatarUrl/role/verified at the top level,
 * the same shape GET /auth/me returns, plus profile and products.
 */
export interface AdminTutorDetail extends User {
  profile: TutorProfile
  products: TutorProductSummary[]
}
