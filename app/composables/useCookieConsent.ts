export type CookieConsentChoice = 'accepted' | 'rejected'

const COOKIE_NAME = 'zenko_cookie_consent'
const ONE_YEAR = 60 * 60 * 24 * 365

/**
 * Stores the visitor's optional-cookie preference on this device.
 * Essential cookies (for example the authentication session) are not gated by
 * this preference and remain available so the application can function.
 */
export function useCookieConsent() {
  const storedChoice = useCookie<CookieConsentChoice | null>(COOKIE_NAME, {
    default: () => null,
    maxAge: ONE_YEAR,
    sameSite: 'lax',
    path: '/',
  })
  const choice = useState<CookieConsentChoice | null>('cookie-consent-choice', () => storedChoice.value)

  const isVisible = computed(() => choice.value === null)

  function choose(next: CookieConsentChoice) {
    choice.value = next
    storedChoice.value = next
  }

  function accept() {
    choose('accepted')
  }

  function rejectOptional() {
    choose('rejected')
  }

  return {
    choice,
    isVisible,
    accept,
    rejectOptional,
  }
}
