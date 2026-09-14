/**
 * Rows of the admin directories, mirroring zenko-api/internal/model's
 * AdminStudentRow and AdminTutorRow. User is spread rather than nested — the
 * account fields sit at the top level, the same shape GET /auth/me returns,
 * with the directory's extra columns beside them.
 */

import type { User } from './user'

/** GET /admin/students. */
export interface AdminStudentRow extends User {
  /** Paid orders the account holds. */
  purchaseCount: number
  /** Finished try-out sittings it has recorded. */
  attemptCount: number
}

/** GET /admin/tutors. */
export interface AdminTutorRow extends User {
  /** Claimed public handle; empty until the tutor saves one. */
  username: string
  /** Never null — the API sends [] for an unset profile. */
  specializations: string[]
  /** Every marketplace product the tutor authored, any status. */
  productCount: number
  /** The subset currently on sale in the catalogue. */
  liveProductCount: number
}
