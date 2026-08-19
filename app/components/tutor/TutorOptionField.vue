<script setup lang="ts">
import { RichTextEditor } from '#components'

/**
 * Satu baris opsi jawaban: RichTextEditor mode compact (rich HTML, sama
 * seperti Question.Prompt — lihat docs/tutor-flow-contract.md §2). Gambar
 * (soal figural) disisipkan langsung lewat tombol gambar bawaan
 * RichTextEditor (inline di dalam `text`), bukan lagi field `imageUrl`
 * terpisah dengan tombol/panel upload sendiri di sini — satu jalur unggah
 * gambar sudah cukup, dan dua jalur berisiko tutor bingung mana yang dipakai.
 * Rumus juga lewat tombol ∑ bawaan RichTextEditor sebagai node inlineMath,
 * sama seperti field pertanyaan/pembahasan.
 *
 * `imageUrl` tetap ada sebagai model (bukan dihapus dari skema) supaya opsi
 * lama yang sudah punya gambar lewat jalur ini sebelum perubahan ini tidak
 * kehilangan datanya saat soal disimpan ulang — cuma kontrol untuk MENGISI
 * field ini yang dilepas dari UI.
 *
 * `rowIndex` diberi sebagai `data-option-row` pada elemen akar, supaya
 * TutorQuestionForm.vue bisa mencegat Tab dan meloncat ke opsi berikutnya
 * lewat `focus()` yang diekspos di bawah (bukan lagi query
 * `<textarea data-option-row>` — RichTextEditor bukan textarea, lihat
 * jumpBetweenOptions di sana).
 */
defineProps<{
  letter: string
  rowIndex: number
  placeholder?: string
  showWeight?: boolean
}>()

const text = defineModel<string>('text', { default: '' })
const weight = defineModel<number | null>('weight', { default: null })
defineModel<string>('imageUrl', { default: '' })

const uid = useId()
const richTextRef = ref<InstanceType<typeof RichTextEditor> | null>(null)

defineExpose({
  focus: () => richTextRef.value?.focus(),
})

/**
 * Bobot hanya 1–5 (gaya TKP) — filter tiap keystroke daripada memvalidasi
 * belakangan lewat min/max native `type="number"`, yang tetap membiarkan
 * "1e2", "-", atau angka di luar rentang masuk sampai blur. Nilai apa pun di
 * luar 1–5 (termasuk non-digit) balik kosong — placeholder "1–5" muncul lagi
 * daripada menampilkan angka yang tidak valid.
 */
function onWeightInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digit = Number(input.value.replace(/\D/g, '').slice(0, 1))
  weight.value = digit >= 1 && digit <= 5 ? digit : null
  input.value = weight.value === null ? '' : String(weight.value)
}
</script>

<template>
  <div class="grid gap-1.5" :data-option-row="rowIndex">
    <div class="flex items-start gap-2.5">
      <span class="mt-2.5 w-5 shrink-0 text-[0.86rem] font-bold text-muted">{{ letter }}.</span>

      <RichTextEditor
        ref="richTextRef"
        v-model="text"
        compact
        :placeholder="placeholder ?? `Opsi ${letter}`"
        :aria-label="`Teks opsi ${letter}`"
        class="flex-1"
      />

      <template v-if="showWeight">
        <label :for="`${uid}-weight`" class="sr-only">Bobot opsi {{ letter }}</label>
        <input
          :id="`${uid}-weight`"
          type="text"
          inputmode="numeric"
          :value="weight ?? ''"
          placeholder="1–5"
          class="mt-0.5 w-20 shrink-0 rounded-sm border border-line bg-surface px-2.5 py-2 text-center text-[0.9rem] tabular-nums"
          @input="onWeightInput"
        >
      </template>
    </div>
  </div>
</template>
