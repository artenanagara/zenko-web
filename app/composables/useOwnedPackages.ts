import type { Ref } from 'vue'
import type { Attempt, OwnedPackage, RecordAttemptRequest } from '#shared/types/account'
import type { TryoutResult } from '#shared/types/tryout'
import type { AsyncResource } from '~/composables/useAccountResource'
import { ownedPackages } from '~/mocks/account'

/**
 * Packages this account owns.
 *
 * Live it reads zenko-api's /me/packages; with NUXT_PUBLIC_USE_MOCK on it
 * falls back to fixtures, the same switch the catalogue uses. The calculations
 * below work on the `OwnedPackage` type, not on either source, so they are
 * untouched by which one answers.
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
  const { public: config } = useRuntimeConfig()

  if (config.useMock) return settledResource<OwnedPackage[]>(ownedPackages)

  return useSessionCollection<OwnedPackage>('/me/packages')
}

/**
 * Persists a finished try out sitting and returns the stored attempt.
 *
 * Live it posts the result — score and per-section tallies — to
 * POST /me/packages/:slug/attempts; the questions are not sent, only the
 * outcome. In mock mode it appends to the fixture in place, which lasts for
 * the tab's session and resets on reload, the same trade every mock makes.
 */
export async function recordAttempt(slug: string, result: TryoutResult): Promise<Attempt | null> {
  const { public: config } = useRuntimeConfig()

  const body: RecordAttemptRequest = {
    score: result.score,
    finishedAt: result.finishedAt,
    sections: result.sections.map(section => ({
      title: section.title,
      correct: section.correct,
      total: section.total,
    })),
  }

  if (config.useMock) {
    const item = ownedPackages.find(owned => owned.slug === slug)
    if (!item) return null

    const attempt: Attempt = {
      id: `${slug}-${item.attempts.length + 1}`,
      number: item.attempts.length + 1,
      finishedAt: body.finishedAt ?? Math.floor(Date.now() / 1000),
      score: body.score,
      // No cohort to rank against outside a real batch test — honest about it
      // rather than inventing a placement.
      rank: '—',
      sections: body.sections,
    }

    item.attempts = [attempt, ...item.attempts]
    return attempt
  }

  return await $fetch<Attempt>(`/me/packages/${slug}/attempts`, {
    baseURL: config.apiBase,
    method: 'POST',
    body,
    credentials: 'include',
  })
}

/** One owned package; a slug the account doesn't own 404s instead of rendering empty. */
export function useOwnedPackage(slug: string): AsyncResource<OwnedPackage | null> {
  const { public: config } = useRuntimeConfig()

  if (config.useMock) {
    const item = ownedPackages.find(owned => owned.slug === slug)
    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Paket ini tidak ada di akunmu',
        fatal: true,
      })
    }
    return settledResource<OwnedPackage | null>(item)
  }

  return useSessionItem<OwnedPackage>(`/me/packages/${slug}`, 'Paket ini tidak ada di akunmu')
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

    if (config.useMock) {
      owned.value = ownedPackages.some(item => item.slug === slug)
      return
    }

    try {
      await $fetch(`/me/packages/${slug}`, {
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
