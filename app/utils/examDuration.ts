/** Anything carrying a section timer: a blueprint template or a live section. */
interface SectionDuration {
  durationMinutes: number
  /** Exact timer, when the section does not last a whole number of minutes. */
  durationSeconds?: number
}

/**
 * A section's timer in seconds — the only figure worth doing arithmetic on.
 *
 * Sections written in whole minutes leave `durationSeconds` unset, so nothing
 * has to state its duration twice. UTBK-SNBT is why this exists at all: two of
 * its subtests run 42.5 minutes, and rounding each one before adding them up
 * puts the 195-minute sitting a minute out.
 */
export function sectionSeconds(section: SectionDuration): number {
  return section.durationSeconds && section.durationSeconds > 0
    ? section.durationSeconds
    : section.durationMinutes * 60
}

export function totalSeconds(sections: SectionDuration[]): number {
  return sections.reduce((sum, section) => sum + sectionSeconds(section), 0)
}

/**
 * Minutes as a reader sees them: whole where the timer is whole, one decimal
 * where it is not ("42,5 menit"). Half minutes are shown rather than hidden —
 * it is how the organiser publishes them, and a rounded label next to an
 * unrounded total only looks like a bug.
 */
export function formatMinutes(seconds: number): string {
  const minutes = seconds / 60
  const rendered = Number.isInteger(minutes)
    ? String(minutes)
    : minutes.toFixed(1).replace('.', ',')
  return `${rendered} menit`
}

/** One section's timer, formatted. */
export function sectionDurationLabel(section: SectionDuration): string {
  return formatMinutes(sectionSeconds(section))
}
