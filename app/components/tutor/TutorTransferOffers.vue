<script setup lang="ts">
import type { TutorProductDetail } from '#shared/types/tutor-product'

/**
 * Paket yang admin Zenko ketikkan untuk tutor ini dan kini menunggu
 * jawabannya.
 *
 * Kartu ini adalah satu-satunya tempat kepemilikan paket berpindah. Admin
 * menyusun paketnya di rak sendiri lalu menawarkannya; sampai tutor menekan
 * "Terima", paket itu belum jadi miliknya dan tidak muncul di tabel produk di
 * bawah. Karena itulah soal-soalnya dibentangkan di sini: tutor harus bisa
 * memastikan "ya, ini memang tulisan saya" sebelum mengakuinya.
 *
 * Tidak dirender sama sekali saat tidak ada tawaran — ini bukan panel kosong
 * yang menunggu diisi, melainkan interupsi yang hanya muncul saat ada.
 */
const props = defineProps<{
  offers: TutorProductDetail[]
  /** Id paket yang aksinya sedang berjalan, agar hanya barisnya yang terkunci. */
  busyId: string
}>()

const emit = defineEmits<{
  accept: [product: TutorProductDetail]
  decline: [product: TutorProductDetail]
}>()

/** Prompt soal apa adanya — rich text dari editor dirender sebagai teks. */
function promptText(html: string): string {
  if (!import.meta.client) return html
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent?.trim() || ''
}

function questionsOf(product: TutorProductDetail) {
  return (product.sections ?? []).flatMap(section => section.questions ?? [])
}

const hasOffers = computed(() => props.offers.length > 0)
</script>

<template>
  <DashboardPanel v-if="hasOffers">
    <div class="grid gap-4">
      <div class="flex items-start gap-3">
        <AppIcon name="handshake" :size="22" class="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 class="font-semibold tracking-[-0.02em] text-ink">Paket menunggu persetujuanmu</h2>
          <p class="mt-1 text-[0.88rem] text-muted">
            Tim Zenko membantu memasukkan soal yang kamu tulis. Periksa isinya, lalu terima
            untuk menjadikannya milikmu — setelah itu paket bisa kamu edit dan ajukan tayang
            seperti paket buatanmu sendiri.
          </p>
        </div>
      </div>

      <article
        v-for="offer in offers"
        :key="offer.id"
        class="grid gap-3 rounded-2xl border border-line bg-surface-soft p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold tracking-[-0.02em] text-ink">{{ offer.title }}</h3>
            <p class="mt-1 text-[0.84rem] text-muted">
              {{ offer.subcategory ? `${offer.category} · ${offer.subcategory}` : (offer.category || 'Umum') }}
              · {{ questionsOf(offer).length }} soal
              <template v-if="offer.price > 0"> · {{ formatRupiah(offer.price) }}</template>
              <template v-else> · Gratis</template>
            </p>
            <p v-if="offer.transferOfferedAt" class="mt-1 text-[0.8rem] text-muted">
              Ditawarkan {{ formatDate(offer.transferOfferedAt) }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <AppButton
              size="xs"
              :disabled="busyId === offer.id"
              :loading="busyId === offer.id"
              @click="emit('accept', offer)"
            >
              Terima
            </AppButton>
            <AppButton
              variant="outline"
              size="xs"
              :disabled="busyId === offer.id"
              @click="emit('decline', offer)"
            >
              Tolak
            </AppButton>
          </div>
        </div>

        <p v-if="offer.description" class="text-[0.86rem] text-muted">{{ offer.description }}</p>

        <!-- Isi paket, terbuka atas permintaan: menerima berarti mengakui soal
             ini sebagai tulisan sendiri, jadi harus ada cara memeriksanya
             tanpa perlu memiliki paketnya lebih dulu. -->
        <details v-if="questionsOf(offer).length" class="group">
          <summary
            class="inline-flex cursor-pointer items-center gap-1.5 text-[0.86rem] font-semibold text-primary hover:underline"
          >
            <AppIcon
              name="caret-right"
              :size="15"
              class="transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
            Periksa {{ questionsOf(offer).length }} soal
          </summary>
          <ol class="mt-3 grid list-decimal gap-2 pl-5 text-[0.86rem] text-ink">
            <li v-for="question in questionsOf(offer)" :key="question.id">
              {{ promptText(question.prompt) }}
            </li>
          </ol>
        </details>
      </article>
    </div>
  </DashboardPanel>
</template>
