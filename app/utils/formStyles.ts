/**
 * Class strings for raw inputs in the tutor wizard, mirroring FormField.vue so
 * fields FormField cannot express (number, select, textarea) look identical.
 */

export const FIELD_CLASS
  = 'w-full rounded-sm border border-line bg-surface px-4 py-3 transition-[border-color,box-shadow] '
    + 'duration-200 ease-smooth placeholder:text-placeholder focus:border-primary/40 '
    + 'focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)] focus:outline-none'

export const FIELD_LABEL_CLASS = 'mb-2 block text-[0.9rem] font-semibold'

/** Bordered neutral button, the counterpart of AppButton for secondary actions. */
export const SECONDARY_BUTTON_CLASS
  = 'inline-flex min-h-12 items-center justify-center rounded-xs border border-line bg-surface px-7 '
    + 'font-semibold text-muted transition-colors hover:text-ink disabled:opacity-50'
