<script setup lang="ts">
import type { ProductReview, ProductReviewInput } from '#shared/types/product-review'

/**
 * `embedded` drops the card chrome and the heading: inside AppModal the dialog
 * already supplies both, and keeping them would render a card inside a card
 * under a duplicated title.
 *
 * `existing` is the caller's already-loaded ulasan for this paket, used to
 * prefill the fields. The form does not fetch it itself — both call sites
 * already hold it to decide whether to show this form at all, and a second
 * request here would only race with theirs.
 */
const props = defineProps<{ slug: string, embedded?: boolean, existing?: ProductReview | null }>()
const emit = defineEmits<{ submitted: [review: ProductReview] }>()

const reviews = useProductReviews(props.slug)
const toast = useToast()

const rating = ref(0)
const tags = ref<string[]>([])
const reviewText = ref('')
const isAnonymous = ref(false)
const saving = ref(false)

/** Set only after a failed submit, so an untouched form is never marked wrong. */
const ratingInvalid = ref(false)
const ratingGroup = ref<HTMLElement | null>(null)

const TAGS = ['Soal mirip ujian asli', 'Pembahasan mudah dipahami', 'Tingkat kesulitan pas', 'Trik cepat membantu']

watch(
  () => props.existing,
  (existing) => {
    rating.value = existing?.rating ?? 0
    tags.value = [...(existing?.tags ?? [])]
    reviewText.value = existing?.reviewText ?? ''
    isAnonymous.value = existing?.isAnonymous ?? false
    ratingInvalid.value = false
  },
  { immediate: true },
)

function pickRating(star: number) {
  rating.value = star
  ratingInvalid.value = false
}

function toggleTag(tag: string) {
  const index = tags.value.indexOf(tag)
  if (index >= 0) tags.value.splice(index, 1)
  else if (tags.value.length < 5) tags.value.push(tag)
}

function revealRating() {
  ratingInvalid.value = true
  focusField(ratingGroup.value)
}

async function submit() {
  if (!rating.value) {
    revealRating()
    toast.error('Rating bintang belum diisi.', 'Pilih dulu berapa bintang untuk paket ini.')
    return
  }

  saving.value = true
  try {
    const input: ProductReviewInput = {
      rating: rating.value,
      tags: tags.value,
      reviewText: reviewText.value.trim(),
      isAnonymous: isAnonymous.value,
    }
    const saved = await reviews.save(input)
    toast.success(
      props.existing ? 'Ulasan diperbarui.' : 'Ulasan terkirim.',
      'Terima kasih — ulasanmu tampil di halaman paket dan profil tutornya.',
    )
    emit('submitted', saved)
  }
  catch (cause) {
    toast.error(
      'Gagal menyimpan ulasan.',
      tutorApiMessage(cause, 'Pastikan kamu sudah menyelesaikan try out ini, lalu coba lagi.'),
    )
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <form
    class="grid gap-5"
    :class="embedded ? '' : 'rounded-lg border border-hairline bg-surface p-5 md:p-6'"
    novalidate
    @submit.prevent="submit"
  >
    <div v-if="!embedded">
      <h3 class="font-bold">{{ existing ? 'Perbarui ulasanmu' : 'Bagaimana pengalaman try out ini?' }}</h3>
      <p class="mt-1 text-[0.88rem] text-muted">Ulasan hanya tersedia setelah kamu menyelesaikan try out. Tidak ada upload gambar.</p>
    </div>
    <div>
      <p id="product-review-rating-label" class="mb-2 text-[0.9rem] font-semibold">Rating bintang <span class="text-danger-ink">*</span></p>
      <div
        ref="ratingGroup"
        class="flex w-fit scroll-mt-24 gap-1 rounded-sm"
        :class="ratingInvalid ? 'ring-2 ring-danger/40 ring-offset-2 ring-offset-surface' : ''"
        role="radiogroup"
        aria-labelledby="product-review-rating-label"
        :aria-invalid="ratingInvalid || undefined"
        :aria-describedby="ratingInvalid ? 'product-review-rating-error' : undefined"
      >
        <button
          v-for="star in 5"
          :key="star"
          type="button"
          :aria-label="`${star} bintang`"
          :aria-checked="rating === star"
          role="radio"
          class="cursor-pointer p-1 text-2xl leading-none"
          :class="star <= rating ? 'text-star' : 'text-faint'"
          @click="pickRating(star)"
        >★</button>
      </div>
      <p v-if="ratingInvalid" id="product-review-rating-error" class="mt-1.5 text-[0.82rem] font-semibold text-danger-ink">
        Pilih rating bintang terlebih dahulu.
      </p>
    </div>
    <div>
      <p class="mb-2 text-[0.9rem] font-semibold">Apa yang paling kamu sukai? <span class="font-normal text-muted">(opsional)</span></p>
      <div class="flex flex-wrap gap-2">
        <button v-for="tag in TAGS" :key="tag" type="button" class="cursor-pointer rounded-pill border px-3 py-1.5 text-[0.82rem]" :class="tags.includes(tag) ? 'border-primary bg-primary-soft text-primary' : 'border-line text-muted'" @click="toggleTag(tag)">{{ tag }}</button>
      </div>
    </div>
    <div>
      <label for="product-review-text" class="mb-2 block text-[0.9rem] font-semibold">Tulis ulasan <span class="font-normal text-muted">(opsional)</span></label>
      <textarea id="product-review-text" v-model="reviewText" rows="4" maxlength="2000" placeholder="Bagian mana yang paling membantu?" class="w-full resize-y rounded-sm border border-line bg-surface px-3.5 py-3 text-[0.9rem] focus:border-primary/40 focus:outline-none" />
    </div>
    <label class="flex items-center gap-2 text-[0.88rem] text-muted"><input v-model="isAnonymous" type="checkbox" class="h-4 w-4 accent-primary"> Tampilkan ulasan secara anonim</label>
    <div>
      <AppButton type="submit" size="sm" :disabled="saving" :loading="saving">
        {{ existing ? 'Simpan perubahan' : 'Kirim ulasan' }}
      </AppButton>
    </div>
  </form>
</template>
