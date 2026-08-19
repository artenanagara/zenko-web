export interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
}

// Module-level singleton state, not useState: this is purely client-side,
// post-hydration interaction (nobody calls confirm() during SSR), and the
// pending-promise resolver can't be stored in useState anyway (functions
// aren't part of the SSR payload). One ConfirmDialog instance, mounted once
// in app.vue, renders whatever this holds.
const isOpen = ref(false)
const options = ref<ConfirmOptions>({ title: '', description: '' })
let resolver: ((value: boolean) => void) | null = null

/**
 * Promise-based replacement for `window.confirm()`, backed by AppModal
 * instead of the unstyled native dialog. Usage is a drop-in swap:
 *
 *   if (!window.confirm('Hapus ini?')) return
 *   →
 *   if (!(await confirm({ title: 'Hapus ini?', description: 'Tindakan ini tidak bisa dibatalkan.' }))) return
 *
 * `description` is required so every confirm dialog explains the
 * consequence, not just the action — a bare title reads as "delete this?"
 * with no indication of what's lost or whether it's reversible.
 *
 * (the enclosing function needs to be `async`, same as any other `await`.)
 */
export function useConfirm() {
  function confirm(opts: ConfirmOptions): Promise<boolean> {
    // If a previous confirm() is still pending when a new one fires, resolve
    // it false rather than leaking the promise forever.
    resolver?.(false)
    options.value = opts
    isOpen.value = true
    return new Promise((resolve) => {
      resolver = resolve
    })
  }

  function handleConfirm() {
    isOpen.value = false
    resolver?.(true)
    resolver = null
  }

  function handleCancel() {
    isOpen.value = false
    resolver?.(false)
    resolver = null
  }

  return { isOpen, options, confirm, handleConfirm, handleCancel }
}
