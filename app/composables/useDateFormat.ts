/**
 * Indonesian dates from Unix seconds — the shape every zenko-api timestamp
 * arrives in.
 *
 * The zone is pinned to Asia/Jakarta rather than the rendering machine's.
 * Without that, one timestamp can land on different calendar days between SSR
 * and hydration, and Vue reports a mismatch that is really just a time zone.
 */

const TIME_ZONE = 'Asia/Jakarta'

/** 12 Agu 2026 */
export function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIME_ZONE,
  })
}

/** 12 Agustus 2026 — for formal documents such as invoices. */
export function formatDateLong(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  })
}

/** 12 Agu 2026, 14.22 WIB */
export function formatDateTime(unixSeconds: number): string {
  const time = new Date(unixSeconds * 1000).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  })

  return `${formatDate(unixSeconds)}, ${time} WIB`
}

/** 1 jam 40 menit — durasi pengerjaan, sumbernya menit bulat seperti di katalog. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours === 0) return `${rest} menit`
  return rest === 0 ? `${hours} jam` : `${hours} jam ${rest} menit`
}

/**
 * 12 Agustus 2026, dari timestamp ISO 8601.
 *
 * Marketing CMS timestamps (article publish dates) arrive as RFC 3339 strings
 * rather than the Unix seconds the rest of zenko-api sends, so they cannot go
 * through formatDateLong above. The zone is pinned for the same reason it is
 * there: an article published late at night must not render as two different
 * dates between SSR and hydration.
 */
export function formatIsoDateLong(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  })
}
