<script setup lang="ts">
// English file name, Indonesian URL; `path` keeps circulating links alive.
definePageMeta({ path: '/paket/:slug()' })

const route = useRoute()
const slug = route.params.slug as string

const detail = await usePackageDetail(slug)
const related = useRelatedPackages(detail.value.category, slug)

// Same pre-checkout guard as /checkout/:slug, applied to the "Beli sekarang"
// CTA: an already-owned package points at the account instead of a checkout
// page that would just redirect there anyway.
const { isSignedIn } = useAuth()
const { owned: ownsPackage } = usePackageOwnershipGuard(slug, () => isSignedIn.value)
const productReviews = useProductReviews(slug)

// refreshMine() runs for everyone, signed in or not: the session cookie rides
// along with the request either way, and waiting for useAuth to resolve first
// would only delay knowing whether this visitor already has an ulasan here.
// A signed-out visitor gets a 401, which the composable reads as "none".
onMounted(() => {
  productReviews.refresh()
  productReviews.refreshMine()
})

/**
 * Satu ulasan per siswa per paket. Begitu ulasannya ada, form di atas daftar
 * hilang — memperbaruinya dimulai dari tombol "Edit ulasan" pada ulasan itu
 * sendiri, yang membuka form ini di dalam modal.
 */
const myReview = computed(() => productReviews.mine.value)
const reviewEditorOpen = ref(false)

// refreshMine() matters as much as refresh(): the form saves through its own
// composable instance, so without this the page still believes this visitor
// has no ulasan and keeps offering a blank form under the list.
async function onReviewSubmitted() {
  reviewEditorOpen.value = false
  await Promise.all([productReviews.refresh(), productReviews.refreshMine()])
}

const discountPercent = computed(() => {
  const { price, priceOriginal } = detail.value
  if (priceOriginal <= price) return 0
  return Math.round(((priceOriginal - price) / priceOriginal) * 100)
})

// Durasi dan tanggal dibagi lewat useDateFormat: satu paket harus terbaca
// sama di katalog dan di halaman akun.
const durationLabel = computed(() => formatDuration(detail.value.durationMinutes))

const updatedLabel = computed(() =>
  new Date(detail.value.updatedAt * 1000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
)

const canonicalUrl = `https://zenkoedu.id/paket/${detail.value.slug}`

useSeoMeta({
  title: `${detail.value.title} | Zenko`,
  description: detail.value.description.slice(0, 160),
  ogTitle: `${detail.value.title} | Zenko`,
  ogDescription: detail.value.description.slice(0, 160),
  ogImage: detail.value.thumbnailUrl || PACKAGE_COVER_FALLBACK_OG,
  ogUrl: canonicalUrl,
  twitterCard: 'summary_large_image',
})

// Product (not Course): a fixed-price bundle of practice questions with a
// rating and review count fits Google's Product/Offer guidance better than
// Course, which is meant for instructor-led educational content.
const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: detail.value.title,
  description: detail.value.description,
  category: detail.value.category,
  image: detail.value.thumbnailUrl,
  // Brand is who sells it, author is who wrote it — and for a bimbel's package
  // those are two different parties. Naming the tutor as the brand was right
  // while a tutor was the only kind of seller; now that a package can be sold
  // under an organisation's name, the markup should say the same thing the
  // page does rather than credit the seller to whoever happens to be listed
  // first. Author is stated in both cases, so the person is never dropped.
  brand: { '@type': 'Brand', name: detail.value.bimbel?.name || detail.value.author.name },
  author: { '@type': 'Person', name: detail.value.author.name },
  offers: {
    '@type': 'Offer',
    price: detail.value.price,
    priceCurrency: 'IDR',
    availability: 'https://schema.org/InStock',
    url: canonicalUrl,
  },
  ...(detail.value.reviewCount > 0
    ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: detail.value.rating,
          reviewCount: detail.value.reviewCount,
        },
      }
    : {}),
}

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(productJsonLd) }],
})
</script>

<template>
  <main>
    <!-- Header band, same treatment as the landing hero -->
    <section class="dot-grid relative overflow-hidden border-b border-line bg-linear-to-b from-white to-[#f1f3f7]">
      <div class="container-page relative z-1 py-8 md:py-12">
        <AppBreadcrumbs
          class="mb-6"
          :items="[
            { label: 'Beranda', to: '/' },
            { label: detail.category, to: '/#paket' },
            { label: detail.title },
          ]"
        />

        <div class="max-w-190">
          <span class="inline-block rounded-pill bg-primary-soft px-3.5 py-1.5 text-[0.78rem] font-bold tracking-[0.06em] text-primary uppercase">
            {{ detail.subcategory ? `${detail.category} · ${detail.subcategory}` : detail.category }}
          </span>

          <h1 class="mt-4 text-[clamp(1.8rem,3.2vw,2.75rem)] leading-[1.14] tracking-[-0.04em]">
            {{ detail.title }}
          </h1>

          <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-[0.92rem] text-muted">
            <!-- Penulis + bimbel penerbitnya, komponen yang sama dengan kartu
                 katalog supaya satu paket tidak beratribusi berbeda antara
                 tempat ia ditemukan dan tempat ia dibeli. -->
            <PackageAttribution :author="detail.author" :bimbel="detail.bimbel" variant="detail" />
            <span class="flex items-center gap-1.5">
              <IconStar class="h-3.5 w-3.5 text-star" />
              <span class="font-semibold text-ink">{{ detail.rating.toFixed(1) }}</span>
              ({{ detail.reviewCount }} ulasan)
            </span>
            <span>{{ detail.attemptLabel }} dikerjakan</span>
          </div>
        </div>
      </div>
    </section>

    <section class="container-page py-10 md:py-14">
      <div class="grid grid-cols-1 items-start gap-10 min-[901px]:grid-cols-[minmax(0,1fr)_360px]">
        <!-- Left column: content -->
        <div>
          <AppThumbnail
            :src="detail.thumbnailUrl"
            :alt="`Thumbnail paket ${detail.title}`"
            class="aspect-video w-full rounded-lg bg-[#edf3ff] object-cover shadow-xs"
          />

          <h2 class="mt-10 mb-3 text-[1.35rem] font-bold tracking-[-0.03em]">Tentang paket ini</h2>
          <p class="leading-[1.75] text-muted">{{ detail.description }}</p>

          <h2 class="mt-10 mb-4 text-[1.35rem] font-bold tracking-[-0.03em]">Materi yang dibahas</h2>
          <ul class="divide-y divide-line overflow-hidden rounded-lg border border-hairline">
            <li
              v-for="topic in detail.topics"
              :key="topic.title"
              class="flex items-center justify-between gap-4 bg-surface px-5 py-4"
            >
              <span class="font-semibold">{{ topic.title }}</span>
              <span class="shrink-0 text-[0.88rem] text-muted">{{ topic.count }} soal</span>
            </li>
          </ul>

          <h2 class="mt-10 mb-4 text-[1.35rem] font-bold tracking-[-0.03em]">Yang kamu dapatkan</h2>
          <ul class="grid gap-3 min-[560px]:grid-cols-2">
            <li v-for="item in detail.includes" :key="item" class="flex items-start gap-3 text-muted">
              <IconCheck class="mt-1 h-5 w-5 shrink-0 text-primary" />
              {{ item }}
            </li>
          </ul>

          <div class="mt-10 grid gap-5">
            <div>
              <h2 class="mb-1 text-[1.35rem] font-bold tracking-[-0.03em]">Ulasan siswa</h2>
              <p class="text-[0.88rem] text-muted">Lihat penilaian dan cerita siswa yang sudah mengerjakan paket ini.</p>
            </div>
            <!-- Di atas daftar, bukan di bawahnya: siswa yang baru selesai
                 mengerjakan datang ke sini untuk menulis, bukan untuk membaca
                 ulasan orang lain dulu. `ownsPackage` bukan sekadar cosmetic —
                 tanpa itu form muncul untuk siapa pun yang login, termasuk
                 orang yang belum pernah membeli paket ini, dan mereka baru
                 tahu tidak boleh mengulas setelah menulis dan ditolak server. -->
            <ProductReviewForm
              v-if="isSignedIn && ownsPackage && !myReview"
              :slug="slug"
              @submitted="onReviewSubmitted"
            />

            <div v-if="productReviews.data.value.length" class="grid gap-4">
              <ProductReviewItem
                v-for="review in productReviews.data.value"
                :key="review.id"
                :review="review"
                :is-mine="review.id === myReview?.id"
                @edit="reviewEditorOpen = true"
              />
            </div>
            <p v-else class="rounded-md border border-dashed border-line px-4 py-6 text-center text-muted">Ulasannya masih kosong. Selesaikan tryout, lalu bagikan pengalamanmu di sini.</p>

            <!-- Ulasan siswa ini belum dipublikasikan (masih dimoderasi), jadi
                 tidak ada di daftar di atas dan tidak punya tombol edit di
                 sana — panel ringkas ini yang menyediakannya. -->
            <div
              v-if="myReview && !productReviews.data.value.some(review => review.id === myReview!.id)"
              class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary-soft/20 px-4 py-3"
            >
              <p class="text-[0.88rem] text-muted">
                Ulasanmu sudah terkirim dan sedang menunggu tayang.
              </p>
              <button
                type="button"
                class="inline-flex cursor-pointer items-center gap-1.5 text-[0.86rem] font-semibold text-primary transition-colors hover:text-primary-light"
                @click="reviewEditorOpen = true"
              >
                <AppIcon name="pencil-simple" :size="15" weight="bold" />
                Edit ulasan
              </button>
            </div>

          </div>
        </div>

        <!-- Right column: purchase card, sticks while the content scrolls -->
        <aside class="min-[901px]:sticky min-[901px]:top-24">
          <div class="rounded-lg border border-hairline bg-surface p-6 shadow-float">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                class="text-[2rem] font-extrabold tracking-[-0.04em]"
                :class="detail.price > 0 ? '' : 'text-success-ink'"
              >
                {{ detail.price > 0 ? formatRupiah(detail.price) : 'Gratis' }}
              </span>
              <span v-if="detail.priceOriginal > detail.price" class="text-[0.95rem] text-muted line-through">
                {{ formatRupiah(detail.priceOriginal) }}
              </span>
            </div>

            <p v-if="discountPercent > 0" class="mt-2">
              <span class="rounded-pill bg-success-soft px-2.5 py-1 text-[0.78rem] font-bold text-success-ink">
                Hemat {{ discountPercent }}%
              </span>
            </p>

            <div class="mt-6 grid gap-3">
              <AppButton
                :to="ownsPackage ? '/akun/paket' : `/checkout/${detail.slug}`"
                size="lg"
                class="w-full"
              >
                {{ ownsPackage ? 'Buka paket saya' : 'Beli paket' }}
              </AppButton>
              <AppButton
                :to="`/paket/${detail.slug}/coba`"
                variant="light"
                size="lg"
                class="w-full border border-hairline shadow-none"
              >
                Coba 5 soal gratis
              </AppButton>
            </div>

            <dl class="mt-6 grid gap-3 border-t border-line pt-6 text-[0.92rem]">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted">Jumlah soal</dt>
                <dd class="font-semibold">{{ detail.questionCount }} soal</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted">Durasi pengerjaan</dt>
                <dd class="font-semibold">{{ durationLabel }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted">Terakhir diperbarui</dt>
                <dd class="font-semibold">{{ updatedLabel }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted">Akses</dt>
                <dd class="font-semibold">Selamanya</dd>
              </div>
            </dl>

            <p class="mt-6 flex items-start gap-2.5 border-t border-line pt-6 text-[0.85rem] text-muted">
              <IconSeal class="mt-px h-5 w-5 shrink-0" />
              Disusun oleh tutor terpercaya. Bayar aman, lalu langsung buka latihan di sistem CBT.
            </p>
          </div>
        </aside>
      </div>
    </section>

    <!-- Related packages -->
    <section v-if="related.length > 0" class="border-t border-hairline bg-surface-alt py-14">
      <div class="container-page">
        <h2 class="mb-7 text-[1.5rem] font-bold tracking-[-0.03em]">
          Paket lain di <span class="text-accent">{{ detail.category }}</span>
        </h2>

        <div class="grid grid-cols-1 gap-5 min-[560px]:grid-cols-2 min-[901px]:grid-cols-4">
          <PackageCard v-for="item in related" :key="item.id" :item="item" />
        </div>
      </div>
    </section>

    <!-- Form yang sama dengan yang tampil di atas daftar untuk siswa yang
         belum mengulas — di sini ia hanya muncul lewat tombol "Edit ulasan". -->
    <AppModal
      v-model="reviewEditorOpen"
      title="Perbarui ulasanmu"
      description="Ulasan yang tersimpan akan menggantikan versi sebelumnya."
    >
      <ProductReviewForm
        :slug="slug"
        :existing="myReview"
        embedded
        @submitted="onReviewSubmitted"
      />
    </AppModal>
  </main>
</template>
