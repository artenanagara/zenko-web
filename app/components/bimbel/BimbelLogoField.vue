<script setup lang="ts">
const model = defineModel<string>({ default: '' })
const props = defineProps<{ disabled?: boolean, name: string }>()
const uploading = ref(false)
const toast = useToast()

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploading.value = true
  try {
    model.value = await uploadTutorImage(file)
  }
  catch (cause) {
    toast.error('Logo gagal diunggah.', tutorApiMessage(cause, 'Gunakan PNG, JPEG, GIF, atau WebP maksimal 5 MB.'))
  }
  finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="grid gap-3">
    <div class="flex items-center gap-4">
      <span class="inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-surface-alt text-primary">
        <img v-if="model" :src="model" :alt="`Logo ${name}`" class="h-full w-full object-cover">
        <AppIcon v-else name="buildings" :size="30" aria-hidden="true" />
      </span>
      <div class="grid gap-2">
        <label class="inline-flex h-10 w-fit cursor-pointer items-center rounded-xs border border-line bg-surface px-3.5 text-[0.84rem] font-semibold text-muted transition-colors hover:text-ink" :class="props.disabled && 'pointer-events-none opacity-50'">
          {{ uploading ? 'Mengunggah…' : model ? 'Ganti logo' : 'Unggah logo' }}
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="hidden" :disabled="uploading || props.disabled" @change="onFileSelected">
        </label>
        <button v-if="model" type="button" class="w-fit text-[0.82rem] font-semibold text-danger hover:underline" :disabled="props.disabled" @click="model = ''">Hapus logo</button>
      </div>
    </div>
    <p class="text-[0.82rem] text-muted">PNG, JPEG, GIF, atau WebP maksimal 5 MB. Gunakan gambar persegi agar logo tidak terpotong.</p>
  </div>
</template>
