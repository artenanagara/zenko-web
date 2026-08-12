/**
 * Fires once when an element scrolls into view.
 *
 * `ready` only flips on the client, and the CSS keeps content visible until
 * then — so with JavaScript disabled nothing is ever stuck at opacity 0.
 */
export function useInView(threshold = 0.25) {
  const target = ref<HTMLElement | null>(null)
  const ready = ref(false)
  const isInView = ref(false)

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    ready.value = true

    // Older browsers just get the end state immediately.
    if (!('IntersectionObserver' in window)) {
      isInView.value = true
      return
    }

    if (!target.value) return

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        isInView.value = true
        observer?.disconnect()
      },
      { threshold },
    )

    observer.observe(target.value)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return { target, ready, isInView }
}
