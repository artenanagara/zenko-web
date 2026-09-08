interface SectionDuration {
  durationMinutes: number
  durationSeconds?: number
}

/** Keep half-minute sections exact, while accepting older API payloads. */
export function sectionDurationSeconds(section: SectionDuration): number {
  return section.durationSeconds && section.durationSeconds > 0
    ? section.durationSeconds
    : section.durationMinutes * 60
}

export function sectionDurationLabel(section: SectionDuration): string {
  const seconds = sectionDurationSeconds(section)
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder ? `${minutes} menit ${remainder} detik` : `${minutes} menit`
}
