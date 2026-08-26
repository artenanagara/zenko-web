export interface ProductReview {
  id: string
  productId: string
  attemptId: string
  productSlug?: string
  productTitle?: string
  authorName: string
  rating: number
  tags: string[]
  reviewText: string
  isAnonymous: boolean
  tutorReplyText?: string
  tutorRepliedAt?: number
  isPublished: boolean
  createdAt: number
  updatedAt: number
}

export interface ProductReviewInput {
  attemptId?: string
  rating: number
  tags: string[]
  reviewText: string
  isAnonymous: boolean
}
