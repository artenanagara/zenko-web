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

useHead({
  title: `${detail.value.title} — Zenko`,
  meta: [{ name: 'description', content: detail.value.description.slice(0, 160) }],
})
</script>

<template>
  <main>
    <!-- Header band, same treatment as the landing hero -->
    <section class="dot-grid relative overflow-hidden border-b border-line bg-linear-to-b from-white to-[#f1f3f7]">
      <div class="container-page relative z-1 py-8 md:py-12">
        <nav class="mb-6 flex flex-wrap items-center gap-2 text-[0.85rem] text-muted" aria-label="Breadcrumb">
          <NuxtLink to="/" class="transition-colors hover:text-ink">Beranda</NuxtLink>
          <span aria-hidden="true">/</span>
          <NuxtLink to="/#paket" class="transition-colors hover:text-ink">{{ detail.category }}</NuxtLink>
          <span aria-hidden="true">/</span>
          <span class="text-ink">{{ detail.title }}</span>
        </nav>

        <div class="max-w-190">
          <span class="inline-block rounded-pill bg-primary-soft px-3.5 py-1.5 text-[0.78rem] font-bold tracking-[0.06em] text-primary uppercase">
            {{ detail.category }}
          </span>

          <h1 class="mt-4 text-[clamp(1.8rem,3.2vw,2.75rem)] leading-[1.14] tracking-[-0.04em]">
            {{ detail.title }}
          </h1>

          <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-[0.92rem] text-muted">
            <span class="flex items-center gap-2">
              <img :src="detail.author.avatarUrl" alt="" class="h-7 w-7 rounded-full object-cover">
              <span class="font-semibold text-ink">{{ detail.author.name }}</span>
            </span>
            <span class="flex items-center gap-1.5">
              <IconStar class="h-3.5 w-3.5 text-star" />
              <span class="font-semibold text-ink">{{ detail.rating.toFixed(1) }}</span>
              ({{ detail.reviewCount }} ulasan)
            </span>
            <span>{{ detail.soldLabel }} terjual</span>
          </div>
        </div>
      </div>
    </section>

    <section class="container-page py-10 md:py-14">
      <div class="grid grid-cols-1 items-start gap-10 min-[901px]:grid-cols-[minmax(0,1fr)_360px]">
        <!-- Left column: content -->
        <div>
          <img
            :src="detail.thumbnailUrl"
            :alt="`Thumbnail paket ${detail.title}`"
            class="aspect-video w-full rounded-lg bg-[#edf3ff] object-cover shadow-xs"
          >

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
        </div>

        <!-- Right column: purchase card, sticks while the content scrolls -->
        <aside class="min-[901px]:sticky min-[901px]:top-24">
          <div class="rounded-lg border border-hairline bg-surface p-6 shadow-float">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span class="text-[2rem] font-extrabold tracking-[-0.04em]">
                {{ formatRupiah(detail.price) }}
              </span>
              <span class="text-[0.95rem] text-muted line-through">
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
                {{ ownsPackage ? 'Sudah dimiliki — lihat paket saya' : 'Beli sekarang' }}
              </AppButton>
              <AppButton
                :to="`/paket/${detail.slug}/coba`"
                variant="light"
                size="lg"
                class="w-full border border-hairline shadow-none"
              >
                Coba gratis 5 soal
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
              Tutor terverifikasi. Garansi uang kembali 7 hari bila materi tidak sesuai deskripsi.
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
  </main>
</template>
