<script setup lang="ts">
/**
 * Sampul paket, dengan gambar cadangan.
 *
 * Thumbnail produk selalu opsional untuk tutor (dan kolomnya kosong pada
 * produk lama), jadi tiap tempat yang menampilkan kartu paket dulu memilih
 * sendiri antara `<img>` yang src-nya kosong — yang tampil sebagai ikon
 * gambar rusak — dan kotak abu-abu buatan sendiri. Komponen ini menyatukan
 * keduanya: satu berkas cadangan bermerek di `public/brand/` (JPEG 1280×800,
 * rasio 16:10 seperti sampul unggahan tutor), dipakai baik
 * saat `src` memang kosong maupun saat URL-nya gagal dimuat (tautan lama,
 * berkas terhapus di penyimpanan).
 *
 * Kelas dari pemanggil jatuh ke `<img>` lewat attribute fallthrough, jadi
 * tiap kartu tetap memutuskan rasio dan sudutnya sendiri.
 */
const props = defineProps<{
  /** URL sampul dari server; kosong/undefined langsung memakai cadangan. */
  src?: string | null
  alt: string
  /** Diteruskan apa adanya ke `<img>`; kartu daftar memakai "lazy". */
  loading?: 'lazy' | 'eager'
}>()

/** Satu-satunya sumber gambar cadangan — lihat public/brand/. */
const FALLBACK = '/brand/package-thumbnail-fallback.jpg'

/**
 * Dipakai untuk memaksa render ulang saat `src` berganti: sekali `failed`
 * menyala untuk satu URL, URL berikutnya berhak dicoba lagi.
 */
const failedSrc = ref('')

const resolved = computed(() => {
  const src = props.src?.trim()
  if (!src || src === failedSrc.value) return FALLBACK
  return src
})

function onError() {
  const src = props.src?.trim()
  if (src) failedSrc.value = src
}
</script>

<template>
  <img
    :src="resolved"
    :alt="alt"
    width="1280"
    height="800"
    :loading="loading"
    @error="onError"
  >
</template>
