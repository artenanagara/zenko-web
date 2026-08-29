/**
 * Identity and authorisation, mirroring zenko-api/internal/model/user.go.
 */

/**
 * What a signed-in user may do. Exactly one per account: the dashboards are
 * separate surfaces, not overlapping permission sets.
 */
export type Role = 'student' | 'tutor' | 'admin'

/** Signed-in identity, as returned by GET /auth/me. */
export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string
  role: Role
  /**
   * Whether the address has been proved — by Google at sign-in, or by opening
   * the link Zenko mailed after email registration. Read fresh on /auth/me, so it
   * flips without signing out and back in.
   */
  verified: boolean
  /**
   * When the account first appeared, Unix seconds. Only populated on the
   * admin directory endpoints (e.g. GET /admin/students) — zero elsewhere,
   * since nothing else reads it.
   */
  createdAt: number
}

/**
 * Where a role lands after signing in. Kept next to the Role type so adding a
 * role forces you to decide its home, instead of leaving a silent gap.
 *
 * A student has no dashboard — buying and doing try out happens on the public
 * pages, so their home is the account area reachable from the navbar.
 */
const HOME_PATH: Record<Role, string> = {
  student: '/akun',
  tutor: '/dashboard/tutor',
  admin: '/dashboard/admin',
}

export function homePathFor(role: Role): string {
  return HOME_PATH[role]
}
