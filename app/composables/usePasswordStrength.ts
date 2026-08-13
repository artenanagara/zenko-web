/** Shared by register, login, and reset pages so they never disagree. */
export const MIN_PASSWORD_LENGTH = 8

export interface PasswordStrength {
  /** 0 when empty, then 1–3 to fill the three indicator bars. */
  score: number
  label: string
  /** Bar colour class; empty until there is input. */
  tone: string
}

/**
 * Rough strength signal from length and character variety. Guidance only —
 * the server decides what it accepts. One composable so register and reset
 * grade the same password identically.
 */
export function usePasswordStrength(password: Ref<string>): ComputedRef<PasswordStrength> {
  return computed(() => {
    const value = password.value
    if (!value) return { score: 0, label: '', tone: '' }

    let score = 0
    if (value.length >= MIN_PASSWORD_LENGTH) score++
    if (value.length >= 12) score++
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
    if (/\d/.test(value)) score++
    if (/[^\w\s]/.test(value)) score++

    if (score <= 2) return { score: 1, label: 'Lemah', tone: 'bg-red-400' }
    if (score <= 3) return { score: 2, label: 'Cukup', tone: 'bg-amber-400' }
    return { score: 3, label: 'Kuat', tone: 'bg-success' }
  })
}
