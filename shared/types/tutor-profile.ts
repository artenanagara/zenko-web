/**
 * The tutor-authored side of a tutor's account — bio, experience,
 * specialisation tags, social links — mirroring
 * zenko-api/internal/model/tutor_profile.go. Distinct from the tutor
 * application (tutor-application.ts): that one is a one-off, admin-reviewed
 * record of applying for the role; this one a tutor can re-save any time.
 */
export interface TutorProfile {
  accountId: string
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
  /** Unix seconds. 0 means the tutor has never saved a profile yet. */
  updatedAt: number
}

/** Body of PUT /tutor/profile — everything but accountId/updatedAt, which the server fills in. */
export type TutorProfileInput = Omit<TutorProfile, 'accountId' | 'updatedAt'>
