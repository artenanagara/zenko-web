<script setup lang="ts">
// Single global instance, mounted once in app.vue — see useConfirm() for the
// promise-based API that drives it. Replaces window.confirm() with a styled,
// on-brand dialog for destructive actions (archive/delete, etc.).
const { isOpen, options, handleConfirm, handleCancel } = useConfirm()
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="options.title"
    :description="options.description"
    @update:model-value="(v: boolean) => !v && handleCancel()"
  >
    <template #footer>
      <AppButton variant="outline" size="sm" @click="handleCancel">
        {{ options.cancelLabel || 'Batal' }}
      </AppButton>
      <AppButton variant="danger" size="sm" @click="handleConfirm">
        {{ options.confirmLabel || 'Lanjutkan' }}
      </AppButton>
    </template>
  </AppModal>
</template>
