/**
 * Scroll an invalid field into view and put the caret in it.
 *
 * Pairs with a toast: the toast says *what* is wrong, this puts the student or
 * tutor in front of the field that is wrong. A toast on its own leaves them
 * scrolling a long form hunting for it, which is the whole reason the inline
 * message at the foot of the form was not enough either.
 *
 *   if (!name.trim()) {
 *     nameError.value = 'Nama tidak boleh kosong.'
 *     focusField('account-name')
 *     toast.error('Nama belum diisi.')
 *     return
 *   }
 *
 * `preventScroll` on focus() stops the browser's own instant jump from racing
 * the smooth scroll. Give the target a `scroll-mt-*` class where a sticky
 * header would otherwise cover it.
 */
export function focusField(target: string | HTMLElement | null | undefined) {
  if (!import.meta.client || !target) return

  const element = typeof target === 'string'
    ? document.getElementById(target)
    : target
  if (!element) return

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // The element handed in is sometimes a wrapper (a radiogroup, a fieldset)
  // rather than something focusable itself — focus the first control inside it.
  const focusable = element.matches('input, select, textarea, button, [tabindex]')
    ? element
    : element.querySelector<HTMLElement>('input, select, textarea, button, [tabindex]:not([tabindex="-1"])')

  focusable?.focus({ preventScroll: true })
}
