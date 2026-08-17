<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

/**
 * A 6-digit code split into single-digit boxes instead of one text field —
 * easier to scan and to autofill from an SMS/clipboard OTP prompt.
 *
 * Keeps its own array of digits as the source of truth while typing (so
 * clicking into the middle of the row and typing never scrambles a sibling
 * box), and only resyncs from `modelValue` when the parent changes it out
 * from under us — a reset to '' after resend, or the expired-code wipe.
 *
 * `autocomplete="one-time-code"` is set on every box: Safari and Chrome both
 * know to distribute an SMS-suggested code across a run of inputs that share
 * it, the same way they would fill one. A manual paste is handled the same
 * way through the `paste` event, since a full 6-digit paste can land on any
 * box, not just the first.
 */
const props = withDefaults(
  defineProps<{
    id: string
    length?: number
    error?: boolean
    disabled?: boolean
    describedBy?: string
  }>(),
  { length: 6 },
)

const modelValue = defineModel<string>({ required: true })

const digits = ref<string[]>(Array.from({ length: props.length }, () => ''))
const inputRefs = ref<(HTMLInputElement | null)[]>([])

function setInputRef(el: Element | ComponentPublicInstance | null, index: number) {
  inputRefs.value[index] = el as HTMLInputElement | null
}

function emitUpdate() {
  modelValue.value = digits.value.join('')
}

// Only resync from the outside when the prop no longer matches what we last
// emitted ourselves — otherwise every keystroke would bounce back through
// here and undo the box the user is mid-typing into.
watch(modelValue, (value) => {
  if (value === digits.value.join('')) return
  digits.value = Array.from({ length: props.length }, (_, i) => value[i] ?? '')
})

function focusIndex(index: number) {
  inputRefs.value[index]?.focus()
}

function focusFirst() {
  focusIndex(0)
  inputRefs.value[0]?.select()
}

function distribute(text: string, startIndex: number) {
  const next = [...digits.value]
  let write = startIndex
  for (const char of text) {
    if (write >= props.length) break
    next[write] = char
    write++
  }
  digits.value = next
  emitUpdate()
  focusIndex(Math.min(write, props.length - 1))
}

function onInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const digitsOnly = target.value.replace(/\D/g, '')

  if (digitsOnly.length > 1) {
    // A full code landed in one box — autofill or a fast paste that skipped
    // the paste event. Spread it from here instead of keeping just the last
    // character typed.
    distribute(digitsOnly, index)
    return
  }

  const next = [...digits.value]
  next[index] = digitsOnly
  digits.value = next
  emitUpdate()

  if (digitsOnly.length === 1 && index < props.length - 1) focusIndex(index + 1)
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault()
    focusIndex(index - 1)
    return
  }

  if (event.key === 'ArrowRight' && index < props.length - 1) {
    event.preventDefault()
    focusIndex(index + 1)
    return
  }

  if (event.key !== 'Backspace' || digits.value[index]) return

  // Box was already empty — hop back and clear the one before it, so
  // backspacing through the row feels like deleting from one long field.
  if (index === 0) return
  event.preventDefault()
  const next = [...digits.value]
  next[index - 1] = ''
  digits.value = next
  emitUpdate()
  focusIndex(index - 1)
}

function onPaste(index: number, event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  const digitsOnly = text.replace(/\D/g, '')
  if (!digitsOnly) return

  event.preventDefault()
  distribute(digitsOnly, index)
}

defineExpose({ focusFirst })
</script>

<template>
  <div class="flex justify-between gap-2 sm:gap-3">
    <input
      v-for="(digit, index) in digits"
      :id="index === 0 ? id : undefined"
      :key="index"
      :ref="(el) => setInputRef(el, index)"
      :value="digit"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      pattern="[0-9]*"
      :disabled="disabled"
      :aria-label="`Digit ${index + 1} dari ${length}`"
      :aria-invalid="error"
      :aria-describedby="describedBy"
      class="h-13 w-full min-w-0 rounded-sm border bg-surface text-center text-[1.3rem] font-semibold transition-[border-color,box-shadow] duration-200 ease-smooth focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-muted"
      :class="
        error
          ? 'border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.16)]'
          : 'border-line focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(47,111,235,0.1)]'
      "
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
      @paste="onPaste(index, $event)"
    >
  </div>
</template>
