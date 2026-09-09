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
const props = withDefaults(defineProps<{
  letter: string
  rowIndex: number
  placeholder?: string
  showWeight?: boolean
  /**
   * Bobot dipilih dari daftar alih-alih diketik — skalanya cuma beberapa
   * nilai, dan memilih membuatnya mustahil salah ketik.
   */
  weightAsSelect?: boolean
  maxWeight?: number
  /**
   * Bobot yang sudah dipakai opsi LAIN pada soal yang sama. Nilai-nilai ini
   * tidak bisa dipilih lagi: satu bobot mewakili satu tingkat kesesuaian
   * jawaban, jadi dua opsi yang berbagi bobot berarti soalnya tidak
   * membedakan keduanya.
   *
   * Bobot milik baris ini sendiri tidak pernah ikut, sehingga soal lama yang
   * terlanjur punya bobot kembar tetap bisa dibuka dan disimpan ulang.
   */
  takenWeights?: number[]
}>(), { maxWeight: 5, takenWeights: () => [] })

const text = defineModel<string>('text', { default: '' })
const weight = defineModel<number | null>('weight', { default: null })
defineModel<string>('imageUrl', { default: '' })

const uid = useId()
const richTextRef = ref<InstanceType<typeof RichTextEditor> | null>(null)

defineExpose({
  focus: () => richTextRef.value?.focus(),
})

/**
 * Pilihan bobot, dengan yang sudah terpakai opsi lain ditandai tidak bisa
 * dipilih. Pilihan yang sedang dipegang baris ini sendiri selalu tersedia.
 */
const weightOptions = computed(() =>
  Array.from({ length: props.maxWeight }, (_, index) => index + 1).map(value => ({
    value,
    label: String(value),
    disabled: value !== weight.value && props.takenWeights.includes(value),
  })),
)

/**
 * Bobot hanya 1..maxWeight — filter tiap keystroke daripada memvalidasi
 * belakangan lewat min/max native `type="number"`, yang tetap membiarkan
 * "1e2", "-", atau angka di luar rentang masuk sampai blur. Nilai apa pun di
 * luar rentang (termasuk non-digit) balik kosong — placeholder muncul lagi
 * daripada menampilkan angka yang tidak valid. Bobot yang sudah dipakai opsi
 * lain juga ditolak, aturan yang sama dengan daftar pilihannya.
 */
function onWeightInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digit = Number(input.value.replace(/\D/g, '').slice(0, 1))
  const usable = digit >= 1 && digit <= props.maxWeight && !props.takenWeights.includes(digit)
  weight.value = usable ? digit : null
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
        <!-- Baris tombol, bukan dropdown: skalanya paling banyak lima nilai
             satu digit, jadi seluruhnya muat terbaca sekaligus dan memilih
             jadi satu klik. Dropdown-nya juga tidak pernah tampil rapi —
             popup native tidak bisa distyle, dan daftar mengambang akan
             terpotong tepi dialog di tempat lain. -->
        <div
          v-if="weightAsSelect"
          class="mt-0.5 flex shrink-0 gap-1"
          role="radiogroup"
          :aria-label="`Bobot opsi ${letter}`"
        >
          <button
            v-for="option in weightOptions"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="weight === option.value"
            :disabled="option.disabled"
            :title="option.disabled ? `Bobot ${option.value} sudah dipakai opsi lain` : undefined"
            class="size-9 rounded-sm border text-[0.86rem] font-bold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35"
            :class="weight === option.value
              ? 'border-primary bg-primary text-white'
              : 'border-line bg-surface text-muted enabled:hover:border-primary/40 enabled:hover:text-ink'"
            @click="weight = weight === option.value ? null : option.value"
          >
            {{ option.label }}
          </button>
        </div>
        <input
          v-else
          :id="`${uid}-weight`"
          type="text"
          inputmode="numeric"
          :value="weight ?? ''"
          :placeholder="`1–${maxWeight}`"
          class="mt-0.5 w-20 shrink-0 rounded-sm border border-line bg-surface px-2.5 py-2 text-center text-[0.9rem] tabular-nums"
          @input="onWeightInput"
        >
      </template>
    </div>
  </div>
</template>
