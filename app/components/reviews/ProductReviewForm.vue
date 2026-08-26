<script setup lang="ts">
import type { ProductReviewInput } from '#shared/types/product-review'

/**
 * `embedded` drops the card chrome and the heading: inside AppModal the dialog
 * already supplies both, and keeping them would render a card inside a card
 * under a duplicated title.
 */
const props = defineProps<{ slug: string, productTitle: string, embedded?: boolean }>()
const emit = defineEmits<{ submitted: [] }>()
const reviews = useProductReviews(props.slug)
const rating = ref(0)
const tags = ref<string[]>([])
const reviewText = ref('')
const isAnonymous = ref(false)
const saving = ref(false)
const error = ref('')
const saved = ref(false)
const TAGS = ['Soal mirip ujian asli', 'Pembahasan mudah dipahami', 'Tingkat kesulitan pas', 'Trik cepat membantu']

onMounted(async () => {
  await reviews.refreshMine()
  if (reviews.mine.value) {
    rating.value = reviews.mine.value.rating
    tags.value = [...reviews.mine.value.tags]
    reviewText.value = reviews.mine.value.reviewText
    isAnonymous.value = reviews.mine.value.isAnonymous
  }
})

function toggleTag(tag: string) {
  const index = tags.value.indexOf(tag)
  if (index >= 0) tags.value.splice(index, 1)
  else if (tags.value.length < 5) tags.value.push(tag)
}

async function submit() {
  if (!rating.value) { error.value = 'Pilih rating bintang terlebih dahulu.'; return }
  error.value = ''; saved.value = false; saving.value = true
  try {
    const input: ProductReviewInput = { rating: rating.value, tags: tags.value, reviewText: reviewText.value.trim(), isAnonymous: isAnonymous.value }
    await reviews.save(input)
    saved.value = true
    emit('submitted')
  }
  catch (cause) { error.value = tutorApiMessage(cause, 'Gagal menyimpan ulasan. Pastikan kamu sudah menyelesaikan try out ini.') }
  finally { saving.value = false }
}
</script>

<template>
  <form
    class="grid gap-5"
    :class="embedded ? '' : 'rounded-lg border border-hairline bg-surface p-5 md:p-6'"
    @submit.prevent="submit"
  >
    <div v-if="!embedded">
      <h3 class="font-bold">{{ reviews.mine ? 'Perbarui ulasanmu' : 'Bagaimana pengalaman try out ini?' }}</h3>
      <p class="mt-1 text-[0.88rem] text-muted">Ulasan hanya tersedia setelah kamu menyelesaikan try out. Tidak ada upload gambar.</p>
    </div>
    <div>
      <p class="mb-2 text-[0.9rem] font-semibold">Rating bintang <span class="text-danger-ink">*</span></p>
      <div class="flex gap-1" role="radiogroup" aria-label="Rating bintang">
        <button v-for="star in 5" :key="star" type="button" :aria-label="`${star} bintang`" :aria-checked="rating === star" role="radio" class="p-1 text-2xl leading-none" :class="star <= rating ? 'text-star' : 'text-faint'" @click="rating = star">★</button>
      </div>
    </div>
    <div>
      <p class="mb-2 text-[0.9rem] font-semibold">Apa yang paling kamu sukai? <span class="font-normal text-muted">(opsional)</span></p>
      <div class="flex flex-wrap gap-2">
        <button v-for="tag in TAGS" :key="tag" type="button" class="rounded-pill border px-3 py-1.5 text-[0.82rem]" :class="tags.includes(tag) ? 'border-primary bg-primary-soft text-primary' : 'border-line text-muted'" @click="toggleTag(tag)">{{ tag }}</button>
      </div>
    </div>
    <div>
      <label for="product-review-text" class="mb-2 block text-[0.9rem] font-semibold">Tulis ulasan <span class="font-normal text-muted">(opsional)</span></label>
      <textarea id="product-review-text" v-model="reviewText" rows="4" maxlength="2000" placeholder="Bagian mana yang paling membantu?" class="w-full resize-y rounded-sm border border-line bg-surface px-3.5 py-3 text-[0.9rem] focus:border-primary/40 focus:outline-none" />
    </div>
    <label class="flex items-center gap-2 text-[0.88rem] text-muted"><input v-model="isAnonymous" type="checkbox" class="h-4 w-4 accent-primary"> Tampilkan ulasan secara anonim</label>
    <AppInlineMessage v-if="error" type="error">{{ error }}</AppInlineMessage>
    <AppInlineMessage v-if="saved" type="confirmation">Ulasan berhasil disimpan.</AppInlineMessage>
    <div><AppButton type="submit" size="sm" :disabled="saving" :loading="saving">Kirim ulasan</AppButton></div>
  </form>
</template>
