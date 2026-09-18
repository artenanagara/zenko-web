<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
const props = withDefaults(defineProps<{
  itemLabel: string
  description: string
  busy?: boolean
  error?: string
}>(), { busy: false, error: '' })
const emit = defineEmits<{ confirm: [] }>()
const confirmation = ref('')
const phraseOk = computed(() => confirmation.value.trim() === 'HAPUS')

watch(open, value => { if (value) confirmation.value = '' })
</script>

<template>
  <AppModal v-model="open" :title="`Hapus ${props.itemLabel}?`" :description="props.description">
    <form id="admin-delete-form" class="grid gap-4" @submit.prevent="emit('confirm')">
      <AppSectionMessage appearance="warning" title="Tindakan permanen">
        Data yang dihapus tidak dapat dipulihkan. Ketik <strong class="font-semibold">HAPUS</strong> untuk melanjutkan.
      </AppSectionMessage>
      <FormField
        id="admin-delete-confirmation"
        v-model="confirmation"
        label="Konfirmasi"
        placeholder="HAPUS"
        autocomplete="off"
        autocapitalize="characters"
      />
      <AppInlineMessage v-if="props.error" type="error">{{ props.error }}</AppInlineMessage>
    </form>
    <template #footer>
      <AppButton variant="outline" size="sm" :disabled="props.busy" @click="open = false">Batal</AppButton>
      <AppButton variant="danger" size="sm" type="submit" form="admin-delete-form" :disabled="!phraseOk || props.busy" :loading="props.busy">
        Hapus permanen
      </AppButton>
    </template>
  </AppModal>
</template>
