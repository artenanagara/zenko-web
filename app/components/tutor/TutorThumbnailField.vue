<script setup lang="ts">
/**
 * Thumbnail produk: URL manual atau unggah file, dengan pratinjau 16:10
 * (mengikuti mockup kartu produk di docs/specs/dashboard-tutor.md). Pola
 * URL-input + hidden-file-input-sebagai-tombol + pratinjau + tombol hapus
 * mengikuti panel gambar di TutorOptionField.vue.
 */
const model = defineModel<string>({ default: '' })
const props = defineProps<{ disabled?: boolean }>()

const uid = useId()
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
    toast.error('Gagal mengunggah gambar.', tutorApiMessage(cause, 'Coba lagi sebentar lagi.'))
  }
  finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="grid gap-3">
    <!-- Judul sectionnya dipasang pemanggil (kolom kanan langkah Info
         produk di TutorProductWizard.vue), jadi label ini tinggal
         menamai input URL-nya untuk pembaca layar — kalau ikut tampil,
         hasilnya dua judul beruntun yang mengatakan hal yang sama. -->
    <label :for="`${uid}-url`" class="sr-only">Tautan thumbnail</label>

    <div v-if="model" class="aspect-[16/10] w-full max-w-80 overflow-hidden rounded-md border border-hairline bg-surface-alt">
      <img :src="model" alt="" class="h-full w-full object-cover">
    </div>
    <div v-else class="grid aspect-[16/10] w-full max-w-80 place-items-center rounded-md border border-dashed border-hairline-strong bg-surface-alt text-muted">
      <span class="flex flex-col items-center gap-1.5 text-[0.82rem]">
        <IconImage class="h-6 w-6" />
        Belum ada thumbnail
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <input
        :id="`${uid}-url`"
        v-model="model"
        type="url"
        placeholder="https://..."
        class="h-10 min-w-0 flex-1 rounded-xs border border-line bg-surface px-3 text-[0.86rem]"
        :disabled="props.disabled"
      >
      <label class="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-xs border border-line bg-surface px-3.5 text-[0.84rem] font-semibold text-muted transition-colors hover:text-ink" :class="props.disabled && 'pointer-events-none opacity-50'">
        {{ uploading ? 'Mengunggah…' : 'Unggah Gambar' }}
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          class="hidden"
          :disabled="uploading || props.disabled"
          @change="onFileSelected"
        >
      </label>
      <button
        v-if="model"
        type="button"
        class="shrink-0 text-[0.82rem] font-semibold text-danger hover:underline"
        @click="model = ''"
        :disabled="props.disabled"
      >
        Hapus
      </button>
    </div>

    <p class="text-[0.82rem] text-muted">Opsional. Gambar sampul produk di katalog, rasio 16:10.</p>
  </div>
</template>
