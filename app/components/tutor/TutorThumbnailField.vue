<script setup lang="ts">
/**
 * Thumbnail produk: unggah berkas dengan pratinjau 16:10 (mengikuti mockup
 * kartu produk di docs/specs/dashboard-tutor.md). Pola
 * hidden-file-input-sebagai-tombol + pratinjau + tombol hapus mengikuti panel
 * gambar di TutorOptionField.vue.
 *
 * Tidak ada lagi input URL manual. Yang tersimpan tetap sebuah URL, tapi URL
 * itu selalu datang dari unggahan ke penyimpanan Zenko — menempelkan tautan
 * gambar milik situs lain hanya menghasilkan sampul yang bisa hilang atau
 * berganti isi kapan saja di luar kendali kami, dan katalog sudah punya
 * gambar cadangan untuk paket tanpa sampul (AppThumbnail).
 */
const model = defineModel<string>({ default: '' })
const props = defineProps<{ disabled?: boolean }>()

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
    <!-- Pratinjau memakai gambar cadangan yang sama dengan katalog saat
         belum ada sampul, jadi yang dilihat tutor di sini persis yang dilihat
         siswa nanti — bukan kotak putus-putus yang tidak pernah tayang. -->
    <div class="aspect-16/10 w-full max-w-80 overflow-hidden rounded-md border border-hairline bg-surface-alt">
      <AppThumbnail :src="model" alt="Pratinjau sampul produk" class="h-full w-full object-cover" />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <label class="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-xs border border-line bg-surface px-3.5 text-[0.84rem] font-semibold text-muted transition-colors hover:text-ink" :class="props.disabled && 'pointer-events-none opacity-50'">
        {{ uploading ? 'Mengunggah…' : model ? 'Ganti gambar' : 'Unggah gambar' }}
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

    <p class="text-[0.82rem] text-muted">
      Opsional, rasio 16:10. Paket tanpa sampul memakai gambar bawaan Zenko di katalog.
    </p>
  </div>
</template>
