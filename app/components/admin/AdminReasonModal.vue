<script setup lang="ts">
/**
 * Reject-with-reason dialog for admin decisions (design spec §3.2): same
 * stay-open-through-the-async-action contract as AdminConfirmModal, plus a
 * required reason textarea. FormField only renders an <input>, so the
 * textarea is built raw here, mirroring FormField's label/error styling (the
 * become-tutor recipe).
 *
 * Validation contract:
 * - pristine/empty → submit disabled, no error text yet;
 * - touched then empty (blur or submit attempt) → red border + error line;
 * - the typed reason survives an API `error` (only reopening resets it).
 */
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  /** Consequence copy. */
  description: string
  label?: string
  /** Per-queue example text. */
  placeholder: string
  /** Shown right of the label, muted (FormField pattern). */
  hint?: string
  /** Explicit verb, e.g. "Tolak produk". */
  confirmLabel: string
  busy?: boolean
  /** In-modal API failure message; the modal stays open while set. */
  error?: string
}>(), {
  label: 'Alasan penolakan',
  busy: false,
  error: '',
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm', reason: string): void
}>()

const uid = useId()
const fieldId = `${uid}-reason`
const errorId = `${uid}-reason-error`

const textarea = useTemplateRef<HTMLTextAreaElement>('textarea')

const reason = ref('')
const touched = ref(false)

const empty = computed(() => reason.value.trim() === '')
const showValidation = computed(() => touched.value && empty.value)

watch(() => props.open, async (open) => {
  if (!open) return
  reason.value = ''
  touched.value = false
  // Two ticks: on the first, AppModal renders and focuses its panel; the
  // second moves focus onto the field that is this modal's whole job.
  await nextTick()
  await nextTick()
  textarea.value?.focus()
})

/** Overlay/Escape/✕ must not dismiss mid-flight (see AdminConfirmModal). */
function onModelUpdate(value: boolean) {
  if (props.busy) return
  emit('update:open', value)
}

function submit() {
  if (props.busy) return
  if (empty.value) {
    touched.value = true
    return
  }
  emit('confirm', reason.value.trim())
}
</script>

<template>
  <AppModal
    :model-value="open"
    :title="title"
    :description="description"
    @update:model-value="onModelUpdate"
  >
    <form class="grid gap-2" @submit.prevent="submit">
      <!-- Label row mirrors FormField: label + required asterisk, hint right. -->
      <div class="flex items-center justify-between">
        <label :for="fieldId" class="flex items-center gap-1 text-[0.9rem] font-semibold text-ink">
          {{ label }}
          <span class="font-bold text-danger-ink">*</span>
        </label>
        <span v-if="hint" class="text-xs text-muted">{{ hint }}</span>
      </div>

      <textarea
        :id="fieldId"
        ref="textarea"
        v-model="reason"
        rows="4"
        :placeholder="placeholder"
        :disabled="busy"
        class="w-full resize-y rounded-sm border bg-surface px-4 py-3 text-ink transition-[border-color,box-shadow] duration-200 ease-smooth placeholder:text-placeholder focus:outline-none"
        :class="
          showValidation
            ? 'border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.16)]'
            : 'border-line focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]'
        "
        :aria-invalid="showValidation || undefined"
        :aria-describedby="showValidation ? errorId : undefined"
        @blur="touched = true"
      />

      <p v-if="showValidation" :id="errorId" class="text-[0.82rem] text-red-600">
        Alasan penolakan wajib diisi.
      </p>

      <AppInlineMessage v-if="error" type="error">{{ error }}</AppInlineMessage>
    </form>

    <template #footer>
      <AppButton variant="outline" size="sm" :disabled="busy" @click="onModelUpdate(false)">
        Batal
      </AppButton>
      <AppButton
        variant="danger"
        size="sm"
        :loading="busy"
        :disabled="empty || busy"
        @click="submit"
      >
        {{ confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>
