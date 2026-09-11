import type { Ref } from 'vue'
import type { Attempt, OwnedPackage, RecordAttemptRequest } from '#shared/types/account'
import type { TryoutAnswerState, TryoutAttemptReview, TryoutBlueprint, TryoutResult } from '#shared/types/tryout'
import type { AsyncResource } from '~/composables/useAccountResource'

/**
 * Packages this account owns, read from zenko-api's /me/packages.
 *
 * The calculations below work on the `OwnedPackage` type rather than on the
 * response itself, so they stay independent of the transport.
 *
 * One package is one try out, as the catalogue describes it. Progress is
 * therefore not "3 of 5 done" but "worked through 3 times, best score 412".
 */

export interface Accuracy {
  correct: number
  total: number
  /** 0–100, rounded; drives the bar width and its label. */
  percent: number
}

export interface PackageStats {
  attemptCount: number
  /** Highest-scoring sitting, the one worth showing off. */
  best: Attempt | null
  /** Most recent sitting, which is not always the best one. */
  last: Attempt | null
  /** Correct answers in the best sitting; null before the first attempt. */
  accuracy: Accuracy | null
}

/**
 * Derived from the attempts rather than stored, so a stale "best score" that
 * contradicts its own history cannot exist.
 */
export function packageStats(item: OwnedPackage): PackageStats {
  const { attempts } = item

  const best = attempts.reduce<Attempt | null>(
    (winner, attempt) => (winner === null || attempt.score > winner.score ? attempt : winner),
    null,
  )
  const last = attempts.reduce<Attempt | null>(
    (latest, attempt) => (latest === null || attempt.finishedAt > latest.finishedAt ? attempt : latest),
    null,
  )

  return {
    attemptCount: attempts.length,
    best,
    last,
    accuracy: best === null ? null : accuracyOf(best),
  }
}

/** Correct out of total, summed across subtests. */
export function accuracyOf(attempt: Attempt): Accuracy {
  const correct = attempt.sections.reduce((sum, section) => sum + section.correct, 0)
  const total = attempt.sections.reduce((sum, section) => sum + section.total, 0)

  return {
    correct,
    total,
    percent: total === 0 ? 0 : Math.round((correct / total) * 100),
  }
}

export function useOwnedPackages(): AsyncResource<OwnedPackage[]> {
  return useSessionCollection<OwnedPackage>('/me/packages')
}

/**
 * What POST /me/packages/:slug/tryout/start returns: the sitting the server
 * opened for this run, and the deadline it fixed for it.
 */
export interface TryoutSitting {
  sittingId: string
  startedAt: number
  deadlineAt: number
  durationMinutes: number
}

/**
 * Opens a sitting server-side and returns its handle.
 *
 * The sitting is the authority behind the clock: the room's own countdown runs
 * off sessionStorage, which is editable in devtools, so it can say when to stop
 * rendering questions but never whether a submission was on time. The server
 * fixes the deadline when the sitting opens and checks the submission against
 * that, not against anything this browser claims.
 *
 * This is no longer fire-and-forget. A submission has to spend a sitting, so a
 * failed start means there is nothing to submit against — the caller has to
 * know, rather than letting the student work for an hour and be refused at the
 * end. Returns null on failure and lets the caller decide.
 */
export async function startTryoutSitting(slug: string): Promise<TryoutSitting | null> {
  const { public: config } = useRuntimeConfig()
  try {
    return await useApiFetch<TryoutSitting>(`/me/packages/${slug}/tryout/start`, {
      baseURL: config.apiBase,
      method: 'POST',
      credentials: 'include',
    })
  }
  catch {
    return null
  }
}

/**
 * Submits a finished try out sitting and returns the attempt the server scored.
 *
 * `answers` is the whole payload that matters: zenko-api rebuilds the blueprint
 * from its own copy of the product, judges every answer against the real key,
 * and stores that as the attempt's review snapshot. The score and per-section
 * tallies in `result` are sent for wire compatibility and then discarded — the
 * room has no answer key to compute them from any more, and a number this
 * browser made up was never something the server should have recorded.
 *
 * `sittingId` names the clock this run was worked under. Without it the server
 * falls back to the account's latest open sitting for the package; with no
 * sitting at all the submission is refused, which is what makes the deadline
 * mean something.
 *
 * The returned Attempt carries the authoritative score and is the key to the
 * pembahasan — TryoutResult navigates to
 * `/akun/paket/:slug/kerjakan/pembahasan/:id` with its id.
 */
export async function recordAttempt(
  slug: string,
  result: TryoutResult,
  answers: Record<string, TryoutAnswerState> = {},
  sittingId = '',
): Promise<Attempt | null> {
  const { public: config } = useRuntimeConfig()

  const body: RecordAttemptRequest = {
    score: result.score,
    finishedAt: result.finishedAt,
    sittingId,
    sections: result.sections.map(section => ({
      title: section.title,
      correct: section.correct,
      total: section.total,
    })),
    answers,
  }

  return await useApiFetch<Attempt>(`/me/packages/${slug}/attempts`, {
    baseURL: config.apiBase,
    method: 'POST',
    body,
    credentials: 'include',
  })
}

/**
 * One stored attempt's full pembahasan, read from
 * GET /me/attempts/:attemptId/review. Reopenable at any time — from the
 * result screen right after finishing, or later from Riwayat pengerjaan on
 * the package page — since the detail lives in the database, not in
 * sessionStorage. An attemptId that does not exist, or belongs to another
 * account, 404s through to Nuxt's error page (see useSessionItem), same
 * treatment useOwnedPackage already gives an unowned slug.
 */
export function useAttemptReview(attemptId: string): AsyncResource<TryoutAttemptReview | null> {
  return useSessionItem<TryoutAttemptReview>(
    `/me/attempts/${attemptId}/review`,
    'Pembahasan ini tidak ada di akunmu',
  )
}

/** One owned package; a slug the account doesn't own 404s instead of rendering empty. */
export function useOwnedPackage(slug: string): AsyncResource<OwnedPackage | null> {
  return useSessionItem<OwnedPackage>(`/me/packages/${slug}`, 'Paket ini tidak ada di akunmu')
}

/**
 * Questions and scoring rules for one package the signed-in account owns.
 * The live endpoint performs its own ownership check, so this is the only
 * resource the work area needs before starting a sitting.
 */
export function useTryoutBlueprint(slug: string): AsyncResource<TryoutBlueprint | null> {
  return useSessionItem<TryoutBlueprint>(
    `/me/packages/${slug}/tryout`,
    'Tryout ini tidak ada di akunmu',
  )
}

/**
 * Pre-purchase ownership guard for /checkout/:slug and /paket/:slug — catches
 * an already-owned package before the buyer can attempt to pay for it again,
 * rather than only after zenko-api answers 409 on POST /orders.
 *
 * Deliberately not `useOwnedPackage`: there, "not owned" is a data error (the
 * account page only ever links to packages it owns) and 404s fatally. Here
 * "not owned" is the ordinary outcome — most visitors haven't bought yet — so
 * a 404 simply resolves `owned` to `false`. Any other failure resolves the
 * same way: blocking a purchase because the ownership check itself broke
 * would be worse than not checking at all.
 *
 * Fires from `onMounted`, same as useSessionItem/useSessionCollection above,
 * and for the same reason: SSR never knows who is signed in (the session
 * cookie isn't readable on the server), so the check has to wait for the
 * client. Waiting specifically for the mount hook — rather than e.g. a watcher
 * with `immediate: true`, which can settle mid-setup — matters here: it
 * guarantees the fetch only starts once hydration has fully reconciled the
 * server-rendered "guest" markup, so the eventual update to `owned` is an
 * ordinary post-hydration patch instead of racing hydration and landing in
 * Vue's mismatch handling, which (for already signed-in sessions resolving
 * fast) can leave a stale `class` behind. `enabled` gates the fetch — pass
 * `() => isSignedIn.value` so guests, who cannot own anything, never trigger
 * a request.
 */
export function usePackageOwnershipGuard(slug: string, enabled: () => boolean): { owned: Readonly<Ref<boolean>> } {
  const { public: config } = useRuntimeConfig()

  const owned = ref(false)

  onMounted(async () => {
    if (!enabled()) return

    try {
      await useApiFetch(`/me/packages/${slug}`, {
        baseURL: config.apiBase,
        credentials: 'include',
      })
      owned.value = true
    }
    catch {
      owned.value = false
    }
  })

  return { owned: owned as Readonly<Ref<boolean>> }
}
