<script setup lang="ts">
import {
  IconUser,
  IconWallet,
  IconTarget,
  IconHandshake,
  IconUsers,
  IconSettings,
  IconArrowLeft,
  IconCheckCircle,
  IconImage,
  IconMail,
  IconRocket,
  IconCheck,
  IconClose,
} from '#components'
import { getHelpArticle, getHelpCategory, type HelpCategoryIcon } from '~/data/help-center'

// English file name, Indonesian URL. Kept as a flat file (not
// pages/help-center/[slug].vue) so it doesn't nest under help-center.vue,
// which has no <NuxtPage /> outlet for a child route to render into.
definePageMeta({ path: '/pusat-bantuan/:slug()' })

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const article = computed(() => getHelpArticle(slug.value))

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Panduan tidak ditemukan', fatal: true })
}

const category = computed(() => getHelpCategory(article.value!.categorySlug))

const categoryIcons: Record<HelpCategoryIcon, unknown> = {
  user: IconUser,
  wallet: IconWallet,
  target: IconTarget,
  handshake: IconHandshake,
  users: IconUsers,
  settings: IconSettings,
}

const current = article.value!
const pageTitle = `${current.title} | Pusat Bantuan Zenko`
const pageUrl = `https://zenkoedu.id/pusat-bantuan/${current.slug}`

useSeoMeta({
  title: pageTitle,
  description: current.summary,
  ogTitle: pageTitle,
  ogDescription: current.summary,
  ogImage: 'https://zenkoedu.id/brand/zenko-lockup-horizontal-blue.png',
  ogUrl: pageUrl,
  twitterCard: 'summary_large_image',
  robots: current.comingSoon ? 'noindex' : undefined,
})

useHead({
  link: [{ rel: 'canonical', href: pageUrl }],
})

const feedbackGiven = ref<'ya' | 'tidak' | null>(null)
</script>

<template>
  <main v-if="article" class="relative bg-white">
    <div class="container-page relative py-10 md:py-16">
      <!-- Wrapper tunggal untuk breadcrumb + grid: keduanya harus berbagi
           lebar dan titik tengah yang sama, kalau tidak breadcrumb dan
           konten di bawahnya bergeser (tidak rata kiri satu sama lain). -->
      <div class="mx-auto max-w-190 lg:max-w-280">
        <!-- Breadcrumb -->
        <nav class="mb-6 flex items-center gap-1.5 text-[0.85rem] text-muted" aria-label="Breadcrumb">
          <NuxtLink to="/pusat-bantuan" class="font-semibold text-primary hover:underline">Pusat Bantuan</NuxtLink>
          <span aria-hidden="true">/</span>
          <NuxtLink :to="`/pusat-bantuan#${category?.slug}-heading`" class="truncate hover:text-ink">
            {{ category?.title }}
          </NuxtLink>
        </nav>

        <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article class="min-w-0">
          <!-- Header -->
          <header class="mb-8 border-b border-line pb-8">
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft px-3 py-1 text-[0.76rem] font-bold text-primary"
              >
                <component :is="categoryIcons[category!.icon]" class="h-3.5 w-3.5" />
                {{ category?.title }}
              </span>
              <span
                v-if="article.comingSoon"
                class="inline-flex items-center gap-1.5 rounded-pill bg-purple-50 px-3 py-1 text-[0.76rem] font-bold text-purple-700"
              >
                <IconRocket class="h-3.5 w-3.5" />
                Segera Hadir
              </span>
            </div>

            <h1 class="text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.15] tracking-[-0.03em]">
              {{ article.title }}
            </h1>

            <p class="mt-3 text-[0.86rem] text-muted">
              Diperbarui: {{ article.updated }} &middot; Estimasi baca: {{ article.readMinutes }} menit
            </p>
          </header>

          <AppSectionMessage v-if="article.comingSoon" appearance="discovery" title="Panduan ini menjelaskan fitur yang belum tersedia" class="mb-8">
            Kami tetap menerbitkan gambarannya supaya kamu tahu apa yang sedang kami siapkan, tapi langkah di
            bawah ini <strong>belum bisa dikerjakan di produk Zenko saat ini</strong>. Butuh bantuan terkait ini
            sekarang? Hubungi tim kami lewat kanal di bagian bawah halaman.
          </AppSectionMessage>

          <!-- Ringkasan -->
          <section class="mb-8">
            <h2 class="mb-2 text-[1.05rem] font-bold tracking-[-0.02em]">Ringkasan Panduan</h2>
            <p class="leading-[1.7] text-muted">{{ article.summary }}</p>
          </section>

          <!-- Prasyarat -->
          <section v-if="article.prerequisites.length" id="prasyarat" class="mb-8">
            <h2 class="mb-3 text-[1.05rem] font-bold tracking-[-0.02em]">Prasyarat Sebelum Memulai</h2>
            <ul class="space-y-2">
              <li v-for="item in article.prerequisites" :key="item" class="flex items-start gap-2.5 leading-[1.6]">
                <IconCheckCircle class="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
                <span class="text-ink">{{ item }}</span>
              </li>
            </ul>
          </section>

          <!-- Langkah-langkah -->
          <section id="langkah-langkah" class="mb-10">
            <h2 class="mb-5 text-[1.05rem] font-bold tracking-[-0.02em]">Langkah-Langkah Pengerjaan</h2>
            <ol class="space-y-8">
              <li
                v-for="(step, index) in article.steps"
                :id="`langkah-${index + 1}`"
                :key="step.title"
                class="scroll-mt-24"
              >
                <div class="flex items-start gap-3.5">
                  <span
                    class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[0.82rem] font-bold text-white"
                    aria-hidden="true"
                  >
                    {{ index + 1 }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <h3 class="mb-1.5 font-bold tracking-[-0.02em]">{{ step.title }}</h3>
                    <p class="leading-[1.7] text-muted">{{ step.body }}</p>

                    <div
                      v-if="step.screenshot"
                      class="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-line bg-surface-alt px-4 py-3.5"
                    >
                      <IconImage class="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                      <p class="text-[0.83rem] leading-[1.5] text-muted">
                        <span class="font-semibold text-ink">Tangkapan layar:</span> {{ step.screenshot }}
                      </p>
                    </div>

                    <AppSectionMessage
                      v-if="step.note"
                      :appearance="step.note.appearance"
                      :title="step.note.title ?? (step.note.appearance === 'discovery' ? 'Segera hadir' : 'Catatan penting')"
                      class="mt-4"
                    >
                      {{ step.note.body }}
                    </AppSectionMessage>
                  </div>
                </div>
              </li>
            </ol>
          </section>

          <!-- Troubleshooting -->
          <section v-if="article.troubleshooting.length" id="troubleshooting" class="mb-10 scroll-mt-24">
            <h2 class="mb-3 text-[1.05rem] font-bold tracking-[-0.02em]">Troubleshooting dan Tanya Jawab Terkait</h2>
            <div class="space-y-3 rounded-2xl bg-surface-alt p-4 md:p-5">
              <details
                v-for="item in article.troubleshooting"
                :key="item.question"
                class="group rounded-lg border border-hairline bg-surface px-4 py-3.5"
              >
                <summary
                  class="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.94rem] font-bold tracking-[-0.01em] [&::-webkit-details-marker]:hidden"
                >
                  {{ item.question }}
                  <span class="relative h-3.5 w-3.5 shrink-0" aria-hidden="true">
                    <span class="absolute top-1/2 left-0 h-0.5 w-3.5 -translate-y-1/2 rounded-pill bg-primary" />
                    <span
                      class="absolute top-0 left-1/2 h-3.5 w-0.5 -translate-x-1/2 rounded-pill bg-primary transition-[opacity,rotate] duration-300 ease-smooth group-open:rotate-90 group-open:opacity-0"
                    />
                  </span>
                </summary>
                <p class="mt-2.5 text-[0.9rem] leading-[1.65] text-muted">{{ item.answer }}</p>
              </details>
            </div>
          </section>

          <!-- Feedback -->
          <section class="mb-10 rounded-2xl border border-hairline bg-surface p-5 text-center md:p-6">
            <p class="font-bold tracking-[-0.02em]">Apakah panduan ini membantu?</p>
            <div v-if="!feedbackGiven" class="mt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-pill border border-hairline px-5 py-2 text-[0.86rem] font-semibold transition-colors duration-200 hover:border-primary/40 hover:text-primary"
                @click="feedbackGiven = 'ya'"
              >
                <IconCheck class="h-4 w-4" />
                Ya
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-pill border border-hairline px-5 py-2 text-[0.86rem] font-semibold transition-colors duration-200 hover:border-danger/40 hover:text-danger"
                @click="feedbackGiven = 'tidak'"
              >
                <IconClose class="h-4 w-4" />
                Tidak
              </button>
            </div>
            <p v-else class="mt-3 text-[0.9rem] text-muted">
              {{
                feedbackGiven === 'ya'
                  ? 'Terima kasih atas masukanmu!'
                  : 'Terima kasih, masukanmu membantu kami memperbaiki panduan ini. Kalau masih butuh bantuan, hubungi tim kami di bawah.'
              }}
            </p>
          </section>

          <!-- Kembali -->
          <NuxtLink to="/pusat-bantuan" class="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
            <IconArrowLeft class="h-4 w-4" />
            Kembali ke Pusat Bantuan
          </NuxtLink>
        </article>

        <!-- Daftar isi + kanal eskalasi: satu wrapper sticky, supaya
             keduanya tetap menempel bersamaan saat discroll (bukan cuma
             kotak pertama yang nempel lalu kotak kedua tertinggal). -->
        <aside class="hidden lg:block">
          <div class="sticky top-24 space-y-4">
            <div class="rounded-2xl border border-line bg-surface-alt p-8 shadow-lift">
              <p class="mb-5 text-[0.76rem] font-bold tracking-widest text-muted uppercase">Di halaman ini</p>
              <ul class="space-y-4 text-[0.86rem]">
                <li v-if="article.prerequisites.length">
                  <a href="#prasyarat" class="text-muted hover:text-primary">Prasyarat</a>
                </li>
                <li v-for="(step, index) in article.steps" :key="step.title">
                  <a :href="`#langkah-${index + 1}`" class="truncate text-muted hover:text-primary">
                    Langkah {{ index + 1 }}: {{ step.title }}
                  </a>
                </li>
                <li v-if="article.troubleshooting.length">
                  <a href="#troubleshooting" class="text-muted hover:text-primary">Troubleshooting</a>
                </li>
              </ul>
            </div>

            <!-- Kanal eskalasi -->
            <div class="rounded-2xl bg-ink p-8 text-white shadow-lift">
              <p class="font-bold tracking-[-0.02em]">Butuh bantuan lebih lanjut?</p>
              <p class="mt-1.5 text-[0.83rem] leading-[1.6] text-white/70">
                Tim Zenko siap membantu, Senin&ndash;Jumat 09.00&ndash;17.00 WIB.
              </p>
              <a
                href="mailto:halo@zenkoedu.id"
                class="mt-3.5 flex items-center gap-2 text-[0.86rem] font-semibold text-white hover:underline"
              >
                <IconMail class="h-4 w-4 shrink-0" />
                halo@zenkoedu.id
              </a>
              <a href="tel:+6288227663468" class="mt-2 block text-[0.86rem] font-semibold text-white hover:underline">
                0882-2766-3468
              </a>
            </div>
          </div>
        </aside>
        </div>
      </div>
    </div>
  </main>
</template>
