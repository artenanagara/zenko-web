<script setup lang="ts">
/**
 * Confirm dialog for admin decisions (design spec §3.1). Unlike
 * useConfirm()/ConfirmDialog — which resolve and close immediately — this one
 * stays open through the async action: the caller drives `busy` and `error`
 * and only closes (v-model:open) after success. The modal itself never shows
 * success; on failure it stays open with the message in the body.
 *
 * `confirmVariant="primary"` for constructive finals (setujui, tayangkan,
 * verifikasi…), `"danger"` for destructive ones.
 */
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  /** Required — the consequence sentence(s), with dynamic values interpolated. */
  description: string
  /** Explicit verb, e.g. "Setujui & jadikan tutor". */
  confirmLabel: string
  confirmVariant?: 'primary' | 'danger'
  busy?: boolean
  /** In-modal API failure message; the modal stays open while set. */
  error?: string
}>(), {
  confirmVariant: 'primary',
  busy: false,
  error: '',
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

/**
 * Overlay/Escape/✕ must not dismiss mid-flight — the decision request is
 * already running, and a reopened modal could double-fire it.
 */
function onModelUpdate(value: boolean) {
  if (props.busy) return
  emit('update:open', value)
}
</script>

<template>
  <AppModal
    :model-value="open"
    :title="title"
    :description="description"
    @update:model-value="onModelUpdate"
  >
    <AppInlineMessage v-if="error" type="error">{{ error }}</AppInlineMessage>

    <template #footer>
      <AppButton variant="outline" size="sm" :disabled="busy" @click="onModelUpdate(false)">
        Batal
      </AppButton>
      <AppButton
        :variant="confirmVariant"
        size="sm"
        :loading="busy"
        :disabled="busy"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>
