export type ToastAppearance = 'info' | 'success' | 'warning' | 'error'

export interface ToastOptions {
  title: string
  description?: string
  appearance?: ToastAppearance
  /** Milliseconds before it dismisses itself. `0` keeps it until dismissed. */
  duration?: number
}

export interface Toast extends Required<Omit<ToastOptions, 'description'>> {
  id: number
  description?: string
}

// Module-level singleton state, not useState: same rationale as useConfirm —
// toasts are purely client-side, post-hydration feedback (nothing raises one
// during SSR), and the auto-dismiss timers can't live in an SSR payload
// anyway. One ToastHost instance, mounted once in app.vue, renders whatever
// this holds.
const toasts = ref<Toast[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let nextId = 0

/**
 * An error stays around longer than a confirmation: a success toast repeats
 * something the screen already shows, while a failure is the only place the
 * reason appears, and it has to survive being read.
 */
const DEFAULT_DURATION: Record<ToastAppearance, number> = {
  info: 5000,
  success: 4000,
  warning: 7000,
  error: 8000,
}

/** Never more than this on screen at once — older ones fall off the top. */
const MAX_VISIBLE = 3

/**
 * Transient feedback, replacing the inline "tersimpan"/"gagal" line that used
 * to sit at the bottom of a form:
 *
 *   const toast = useToast()
 *   toast.success('Ulasan tersimpan.')
 *   toast.error('Gagal menyimpan ulasan.', 'Coba lagi sebentar.')
 *
 * A toast reports the *outcome* of an action. It is not the place for a
 * validation message that points at one field — say that on the field itself
 * (aria-invalid + focus), with the toast only summarising what went wrong.
 */
export function useToast() {
  function dismiss(id: number) {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  function show(options: ToastOptions): number {
    const appearance = options.appearance ?? 'info'
    const toast: Toast = {
      id: nextId++,
      title: options.title,
      description: options.description,
      appearance,
      duration: options.duration ?? DEFAULT_DURATION[appearance],
    }

    toasts.value = [...toasts.value, toast].slice(-MAX_VISIBLE)
    // Anything the slice just dropped keeps a live timer otherwise.
    for (const [id, timer] of timers) {
      if (!toasts.value.some(item => item.id === id)) {
        clearTimeout(timer)
        timers.delete(id)
      }
    }

    if (toast.duration > 0) {
      timers.set(toast.id, setTimeout(() => dismiss(toast.id), toast.duration))
    }
    return toast.id
  }

  const success = (title: string, description?: string) =>
    show({ title, description, appearance: 'success' })

  const error = (title: string, description?: string) =>
    show({ title, description, appearance: 'error' })

  const info = (title: string, description?: string) =>
    show({ title, description, appearance: 'info' })

  const warning = (title: string, description?: string) =>
    show({ title, description, appearance: 'warning' })

  return { toasts, show, success, error, info, warning, dismiss }
}
