/**
 * Class strings for raw inputs in the tutor wizard, mirroring FormField.vue so
 * fields FormField cannot express (number, select, textarea) look identical.
 *
 * The label constants below are the shared source of truth: FormField.vue and
 * core/AppSelect.vue import them from here (Nuxt auto-imports `app/utils`, and
 * this module imports nothing, so there is no cycle) instead of each keeping
 * its own copy of the class string.
 */

/**
 * A locked field has to *look* locked. Without this a disabled input renders
 * identically to an editable one in this design system — the tutor only finds
 * out it is locked by clicking it and getting nothing. Same treatment as
 * AppCurrencyField and AppSelect already use, so every field in the wizard
 * reads the same way when the product's status takes it out of reach.
 */
export const DISABLED_FIELD_CLASS
  = 'disabled:cursor-not-allowed disabled:border-hairline disabled:bg-surface-sunken disabled:text-muted'

export const FIELD_CLASS
  = 'w-full rounded-sm border border-line bg-surface px-3.5 py-2.5 text-[0.9rem] transition-[border-color,box-shadow] '
    + 'duration-200 ease-smooth placeholder:text-placeholder focus:border-primary/40 '
    + 'focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)] focus:outline-none '
    + DISABLED_FIELD_CLASS

/**
 * The one definition of what a field label looks like. FormField.vue and
 * AppSelect.vue read it from here rather than repeating the class string —
 * three copies had already drifted (AppSelect rendered its label at 12px/700
 * while FIELD_LABEL_CLASS and FormField rendered 14.4px/600), which put two
 * label sizes in a single wizard form.
 */
export const FIELD_LABEL_TEXT_CLASS = 'text-[0.9rem] font-semibold'

/**
 * The compact label used by toolbar-density controls (AppSelect `size="sm"`).
 * Kept deliberately smaller than FIELD_LABEL_TEXT_CLASS, and matched to the
 * design system's AppTextField label — a dashboard toolbar puts an AppTextField
 * and an AppSelect side by side, and AppTextField ships from
 * @artenanagara/zenko-design-system at this size, so a compact AppSelect has to
 * agree with its neighbour rather than with the form field scale.
 */
export const COMPACT_FIELD_LABEL_TEXT_CLASS = 'text-xs font-bold text-ink'

/** Field label including its own block layout, for raw `<label>`/`<span>` markup. */
export const FIELD_LABEL_CLASS = `mb-2 block ${FIELD_LABEL_TEXT_CLASS}`

/** Bordered neutral button, the counterpart of AppButton for secondary actions. */
export const SECONDARY_BUTTON_CLASS
  = 'inline-flex min-h-12 items-center justify-center rounded-xs border border-line bg-surface px-7 '
    + 'font-semibold text-muted transition-colors hover:text-ink disabled:opacity-50'
