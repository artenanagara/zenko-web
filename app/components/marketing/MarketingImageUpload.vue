<script setup lang="ts">
const model = defineModel<string>({ default: '' })
const props = withDefaults(defineProps<{ label: string, help?: string, alt?: string, accept?: string }>(), {
  help: 'PNG, JPEG, WebP, maksimal 5 MB.',
  alt: 'Pratinjau gambar',
  accept: 'image/png,image/jpeg,image/webp',
})
const uploading = ref(false)
const error = ref('')

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploading.value = true
  error.value = ''
  try { model.value = await uploadMarketingImage(file) }
  catch { error.value = 'Gambar belum berhasil diunggah. Coba lagi.' }
  finally { uploading.value = false }
}
</script>

<template>
  <div class="grid gap-3">
    <p class="text-xs font-semibold text-muted">{{ props.label }}</p>
    <div v-if="model" class="relative overflow-hidden rounded-md border border-hairline bg-surface-alt">
      <img :src="model" :alt="props.alt" class="aspect-[16/7] w-full object-cover">
      <button type="button" class="absolute right-2 top-2 rounded-xs bg-surface px-2 py-1 text-xs font-semibold text-danger shadow-sm hover:bg-surface-alt" @click="model = ''">Hapus</button>
    </div>
    <label class="inline-flex min-h-10 w-fit cursor-pointer items-center rounded-xs border border-line bg-surface px-3.5 text-[0.84rem] font-semibold text-muted transition-colors hover:border-primary/40 hover:text-primary" :class="uploading && 'pointer-events-none opacity-50'">
      {{ uploading ? 'Mengunggah…' : model ? 'Ganti gambar' : 'Unggah gambar' }}
      <input type="file" :accept="props.accept" class="sr-only" :disabled="uploading" @change="onFileSelected">
    </label>
    <p class="text-xs text-muted">{{ props.help }}</p>
    <p v-if="error" role="alert" class="text-xs font-medium text-danger">{{ error }}</p>
  </div>
</template>
