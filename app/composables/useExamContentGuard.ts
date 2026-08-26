/**
 * Deterrents against lifting question text out of a running sitting.
 *
 * What this can and cannot do, stated plainly so nobody mistakes it for
 * proctoring: **a web page cannot block a screenshot.** No browser exposes an
 * API for it, and Print Screen, the OS snipping tool, a screen recorder, and a
 * phone camera all happen outside anything this page can observe. A student
 * determined to capture the questions will capture them.
 *
 * What is genuinely enforceable is the cheap, high-volume route — select the
 * text, right-click, Ctrl+C, drag a paragraph into another tab, Ctrl+P or
 * "Save as PDF" — and that is what this closes, together with the CSS in
 * main.css keyed on the `exam-locked` class. Obscuring the content while the
 * tab is not the one being looked at raises the cost of a second-monitor
 * capture or a careless screen-share; it does not make one impossible.
 *
 * The student's own answer fields are deliberately exempt: the point is to
 * keep the tutor's questions from leaving, not to stop someone selecting the
 * short answer they just typed.
 */

/** Ctrl/Cmd combos that exist to get content out of the page. */
const EXFILTRATION_KEYS = new Set(['a', 'c', 'x', 'p', 's', 'u'])

function isOwnAnswerField(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  if (!element || typeof element.tagName !== 'string') return false
  const tag = element.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || element.isContentEditable
}

export function useExamContentGuard(active: Ref<boolean>) {
  /**
   * True while this tab is not the one in front of the student. Rendered as a
   * cover over the question area — the timer keeps running underneath, which
   * is the honest behaviour for an exam: looking away costs time.
   */
  const obscured = ref(false)

  function blockEvent(event: Event) {
    if (isOwnAnswerField(event.target)) return
    event.preventDefault()
  }

  function onKeydown(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey)) return
    if (!EXFILTRATION_KEYS.has(event.key.toLowerCase())) return
    if (isOwnAnswerField(event.target)) return
    event.preventDefault()
  }

  function onVisibilityChange() {
    obscured.value = document.hidden
  }

  function onWindowBlur() {
    obscured.value = true
  }

  function onWindowFocus() {
    obscured.value = false
  }

  function attach() {
    document.documentElement.classList.add('exam-locked')
    document.addEventListener('copy', blockEvent)
    document.addEventListener('cut', blockEvent)
    document.addEventListener('contextmenu', blockEvent)
    document.addEventListener('dragstart', blockEvent)
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onWindowBlur)
    window.addEventListener('focus', onWindowFocus)
  }

  function detach() {
    document.documentElement.classList.remove('exam-locked')
    document.removeEventListener('copy', blockEvent)
    document.removeEventListener('cut', blockEvent)
    document.removeEventListener('contextmenu', blockEvent)
    document.removeEventListener('dragstart', blockEvent)
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('blur', onWindowBlur)
    window.removeEventListener('focus', onWindowFocus)
    obscured.value = false
  }

  if (import.meta.client) {
    watch(active, (on) => { on ? attach() : detach() }, { immediate: true })
    // Leaving the page mid-sitting (back button, session timeout) must not
    // leave the whole app unable to copy anything.
    onScopeDispose(detach)
  }

  return { obscured }
}
