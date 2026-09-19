import type {
  MyLeaderboardResponse,
  PublicLeaderboardResponse,
  TutorLeaderboardSummary,
} from '#shared/types/leaderboard'

export type LeaderboardPeriod = 'all' | 'week'

/**
 * Leaderboard transport for public, owned-package, and tutor surfaces.
 * Protected requests are explicit so account pages do not try to resolve a
 * HttpOnly API session during SSR.
 */
export function useLeaderboard(slug: string) {
  const { public: config } = useRuntimeConfig()
  const publicPodium = ref<PublicLeaderboardResponse | null>(null)
  const publicPending = ref(true)
  const publicError = ref<unknown>(null)
  const mine = ref<MyLeaderboardResponse | null>(null)
  const minePending = ref(false)
  const mineError = ref<unknown>(null)
  const tutorSummary = ref<TutorLeaderboardSummary | null>(null)
  const tutorPending = ref(false)
  const tutorError = ref<unknown>(null)

  async function refreshPublic() {
    publicPending.value = true
    publicError.value = null
    try {
      publicPodium.value = await useApiFetch<PublicLeaderboardResponse>(
        `/packages/${encodeURIComponent(slug)}/leaderboard/podium`,
        { baseURL: config.apiBase },
      )
    }
    catch (cause) {
      publicError.value = cause
    }
    finally {
      publicPending.value = false
    }
  }

  async function fetchMine(period: LeaderboardPeriod = 'all', page = 1, pageSize = 20) {
    minePending.value = true
    mineError.value = null
    try {
      mine.value = await useApiFetch<MyLeaderboardResponse>(
        `/me/packages/${encodeURIComponent(slug)}/leaderboard?period=${period}&page=${page}&pageSize=${pageSize}`,
        { baseURL: config.apiBase, credentials: 'include' },
      )
    }
    catch (cause) {
      mineError.value = cause
    }
    finally {
      minePending.value = false
    }
  }

  async function fetchTutorSummary(productId: string) {
    tutorPending.value = true
    tutorError.value = null
    try {
      tutorSummary.value = await useApiFetch<TutorLeaderboardSummary>(
        `/tutor/products/${encodeURIComponent(productId)}/leaderboard-summary`,
        { baseURL: config.apiBase, credentials: 'include' },
      )
    }
    catch (cause) {
      tutorError.value = cause
    }
    finally {
      tutorPending.value = false
    }
  }

  return {
    publicPodium,
    publicPending,
    publicError,
    refreshPublic,
    mine,
    minePending,
    mineError,
    fetchMine,
    tutorSummary,
    tutorPending,
    tutorError,
    fetchTutorSummary,
  }
}

export function useTutorLeaderboardSummary(productId: string) {
  const { public: config } = useRuntimeConfig()
  const data = ref<TutorLeaderboardSummary | null>(null)
  const pending = ref(false)
  const error = ref<unknown>(null)

  async function refresh() {
    pending.value = true
    error.value = null
    try {
      data.value = await useApiFetch<TutorLeaderboardSummary>(
        `/tutor/products/${encodeURIComponent(productId)}/leaderboard-summary`,
        { baseURL: config.apiBase, credentials: 'include' },
      )
    }
    catch (cause) {
      error.value = cause
    }
    finally {
      pending.value = false
    }
  }

  onMounted(refresh)
  return { data, pending, error, refresh }
}
