/**
 * Countdown for "resend" buttons. Not rate limiting — the server enforces
 * that — but expectation-setting: email takes time to arrive, and a freely
 * clickable button invites a pile of requests with four different tokens.
 */
export function useCooldown(seconds = 60) {
  const remaining = ref(0)
  const isCoolingDown = computed(() => remaining.value > 0)

  let timer: ReturnType<typeof setInterval> | undefined

  function clear() {
    if (timer === undefined) return
    clearInterval(timer)
    timer = undefined
  }

  function start() {
    clear()
    remaining.value = seconds
    timer = setInterval(() => {
      remaining.value--
      if (remaining.value <= 0) clear()
    }, 1000)
  }

  // The interval outlives renders; stop it when the component goes away.
  onBeforeUnmount(clear)

  return { remaining, isCoolingDown, start }
}
