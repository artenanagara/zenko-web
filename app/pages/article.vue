<script setup lang="ts">
import type { Article } from '#shared/types/article'
import { SUPPORT_CONTACT } from '~/data/support-contact'

// English file name, Indonesian URL. Flat file rather than
// pages/artikel/[slug].vue so it does not nest under articles.vue, which has
// no <NuxtPage /> outlet for a child route to render into.
definePageMeta({ path: '/artikel/:slug()' })

const route = useRoute()
const slug = computed(() => String(route.params.slug))

// Throws a real 404 for an unknown slug — see useArticle.
const article = await useArticle(slug)
onMounted(() => trackArticleView({ articleId: article.value.id, articleSlug: article.value.slug, articleName: article.value.title }))

const canonicalUrl = computed(() => `https://zenkoedu.id/artikel/${article.value.slug}`)
const pageTitle = computed(() => article.value.metaTitle || `${article.value.title} | Zenko`)
const description = computed(() =>
  metaDescription(article.value.metaDescription || article.value.subtitle || article.value.content),
)
const publishedAt = computed(() => article.value.publishedAt ?? article.value.createdAt)

/**
 * Where the category chip leads. The index page filters on a slug derived
 * from the category name (the API sends names, not slugs), so the same
 * derivation has to happen here — see categorySlug in articles.vue.
 */
const categoryFilterUrl = computed(() => {
  const slug = article.value.categoryName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `/artikel?kategori=${slug}`
})

/**
 * The body carries no anchors of its own, so the ids the table of contents
 * links to are added here — on the server too, which is why it is a string
 * rewrite rather than a DOM pass. See buildArticleContent.
 */
const content = computed(() => buildArticleContent(article.value.content))

useSeoMeta({
  title: pageTitle,
  description,
  ogTitle: pageTitle,
  ogDescription: description,
  ogType: 'article',
  ogUrl: canonicalUrl,
  // An article without its own cover falls back to the site card rather than
  // sharing with no image at all.
  ...(article.value.coverUrl
    ? { ogImage: article.value.coverUrl, ogImageAlt: article.value.coverAlt || article.value.title }
    : DEFAULT_OG),
  articlePublishedTime: publishedAt,
  articleModifiedTime: computed(() => article.value.updatedAt),
  twitterCard: 'summary_large_image',
  robots: computed(() => (article.value.noIndex ? 'noindex,follow' : undefined)),
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': article.value.title,
        'description': description.value,
        'image': article.value.coverUrl || DEFAULT_OG.ogImage,
        'author': { '@type': 'Person', name: article.value.authorName || 'Tim Zenko' },
        'publisher': {
          '@type': 'Organization',
          'name': 'Zenko',
          'logo': { '@type': 'ImageObject', url: 'https://zenkoedu.id/brand/zenko-icon-gradient.png' },
        },
        'datePublished': publishedAt.value,
        'dateModified': article.value.updatedAt,
        'mainEntityOfPage': canonicalUrl.value,
        'wordCount': article.value.wordCount,
      })),
    },
    {
      type: 'application/ld+json',
      innerHTML: computed(() => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://zenkoedu.id/' },
          { '@type': 'ListItem', position: 2, name: 'Artikel', item: 'https://zenkoedu.id/artikel' },
          { '@type': 'ListItem', position: 3, name: article.value.title, item: canonicalUrl.value },
        ],
      })),
    },
  ],
})

// --------------------------------------------------------------------------
// Baca juga — artikel lain dari kategori yang sama, dilengkapi artikel
// terbaru bila kategorinya baru berisi satu tulisan. Memakai key yang sama
// dengan halaman indeks, jadi pembaca yang datang dari sana tidak memicu
// permintaan kedua.
// --------------------------------------------------------------------------
const { data: allArticles } = usePublishedArticles()

const related = computed<Article[]>(() => {
  const others = (allArticles.value ?? []).filter(item => item.slug !== article.value.slug)
  const sameCategory = others.filter(
    item => item.categoryName && item.categoryName === article.value.categoryName,
  )
  const fillers = others.filter(item => !sameCategory.includes(item))
  return [...sameCategory, ...fillers].slice(0, 3)
})

// --------------------------------------------------------------------------
// Bagikan
// --------------------------------------------------------------------------
const shareText = computed(() => `${article.value.title} — ${canonicalUrl.value}`)
const whatsappShareUrl = computed(
  () => `https://wa.me/?text=${encodeURIComponent(shareText.value)}`,
)

const copied = ref(false)
let copyResetHandle: ReturnType<typeof setTimeout> | null = null

async function copyLink() {
  try {
    await navigator.clipboard.writeText(canonicalUrl.value)
    copied.value = true
    if (copyResetHandle !== null) clearTimeout(copyResetHandle)
    copyResetHandle = setTimeout(() => { copied.value = false }, 2000)
  }
  catch {
    // Clipboard ditolak browser (izin, atau konteks non-HTTPS). Alamatnya
    // tetap terbaca di bilah alamat dan bisa disalin manual.
  }
}

onUnmounted(() => {
  if (copyResetHandle !== null) clearTimeout(copyResetHandle)
})
</script>

<template>
  <main class="bg-surface">
    <div class="container-page py-8 md:py-12">
      <!-- Satu pembungkus untuk breadcrumb dan grid: keduanya harus berbagi
           lebar dan titik tengah, kalau tidak breadcrumb bergeser dari
           kolom artikel di bawahnya. -->
      <div class="mx-auto max-w-190 lg:max-w-280">
        <nav class="mb-7 flex flex-wrap items-center gap-1.5 text-[0.85rem] text-muted" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-ink">Beranda</NuxtLink>
          <span aria-hidden="true">/</span>
          <NuxtLink to="/artikel" class="font-semibold text-primary hover:underline">Artikel</NuxtLink>
          <span aria-hidden="true">/</span>
          <span class="truncate text-faint">{{ article.title }}</span>
        </nav>

        <div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article class="min-w-0">
            <!-- ==========================================================
                 Kepala artikel
                 ========================================================== -->
            <header>
              <NuxtLink
                v-if="article.categoryName"
                :to="categoryFilterUrl"
                class="inline-flex rounded-pill bg-primary-soft px-3 py-1 text-[0.74rem] font-bold tracking-[0.1em] text-primary uppercase transition-colors duration-200 hover:bg-primary hover:text-white"
              >
                {{ article.categoryName }}
              </NuxtLink>

              <h1 class="mt-4 text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.12] tracking-[-0.04em]">
                {{ article.title }}
              </h1>

              <p v-if="article.subtitle" class="mt-4 text-[1.1rem] leading-[1.65] text-muted">
                {{ article.subtitle }}
              </p>

              <!-- Byline. Inisial penulis dipakai sebagai avatar: penulis
                   artikel adalah akun Marketing Hub, yang tidak punya foto
                   profil publik. -->
              <div class="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-hairline pt-6">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[0.9rem] font-bold text-primary"
                  aria-hidden="true"
                >
                  {{ (article.authorName || 'Zenko').charAt(0).toUpperCase() }}
                </span>
                <div class="text-[0.86rem]">
                  <p class="font-bold text-ink">{{ article.authorName || 'Tim Zenko' }}</p>
                  <p class="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-faint">
                    <span v-if="article.publishedAt">{{ formatIsoDateLong(article.publishedAt) }}</span>
                    <span v-if="article.publishedAt" aria-hidden="true">·</span>
                    <span>{{ article.readingMinutes }} menit baca</span>
                  </p>
                </div>
              </div>
            </header>

            <!-- Sampul. Lewat komponen yang sama dengan kartu di indeks,
                 jadi artikel tanpa gambar unggahan tetap punya sampul
                 bermerek alih-alih langsung melompat dari judul ke badan
                 teks — dan sampul yang sama mengiringi artikel itu di mana
                 pun ia muncul. Lebih rendah dari 16/9 di layar lebar: ini
                 pengiring artikel, bukan hero yang mendorong paragraf
                 pertama keluar layar. -->
            <MarketingArticleCover
              :article="article"
              eager
              size="page"
              class="mt-9 aspect-16/9 w-full rounded-[20px] md:aspect-[2.4/1]"
            />

            <!-- ==========================================================
                 Badan artikel

                 v-html: isinya sudah disanitasi server (zenko-api
                 internal/richtext) — batas kepercayaan yang sama dengan soal
                 tryout. Pembungkus overflow-x-auto supaya tabel lebar yang
                 menggulung adalah tabelnya, bukan halamannya.
                 ========================================================== -->
            <div class="prose-zenko mt-10 overflow-x-auto" v-html="content.html" />

            <!-- ==========================================================
                 Bagikan
                 ========================================================== -->
            <div class="mt-12 flex flex-wrap items-center gap-3 border-t border-hairline pt-7">
              <p class="mr-1 text-[0.86rem] font-bold tracking-[-0.02em]">Bagikan artikel ini</p>
              <a
                :href="whatsappShareUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-h-10 items-center gap-2 rounded-pill border border-hairline px-4 text-[0.84rem] font-semibold transition-colors duration-200 hover:border-primary/40 hover:text-primary"
              >
                <AppIcon name="whatsapp-logo" :size="16" />
                WhatsApp
              </a>
              <button
                type="button"
                class="inline-flex min-h-10 items-center gap-2 rounded-pill border border-hairline px-4 text-[0.84rem] font-semibold transition-colors duration-200 hover:border-primary/40 hover:text-primary"
                @click="copyLink"
              >
                <AppIcon :name="copied ? 'check' : 'link'" :size="16" />
                {{ copied ? 'Tautan disalin' : 'Salin tautan' }}
              </button>
            </div>

            <!-- ==========================================================
                 Ajakan ke katalog
                 ========================================================== -->
            <section
              class="panel-inset mt-10 rounded-[24px] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark px-7 py-10 md:px-10"
              aria-labelledby="ajakan-latihan"
            >
              <h2 id="ajakan-latihan" class="text-[clamp(1.3rem,2.4vw,1.8rem)] leading-[1.2] tracking-[-0.035em] text-white">
                Sudah paham teorinya. Sekarang ujinya.
              </h2>
              <p class="mt-3 max-w-[54ch] text-white/80">
                Kerjakan tryout dengan format dan waktu seperti ujian aslinya, lalu
                baca pembahasannya per soal.
              </p>
              <div class="mt-7 flex flex-wrap gap-3">
                <AppButton to="/paket" variant="light">Lihat paket tryout</AppButton>
                <NuxtLink
                  to="/artikel"
                  class="inline-flex min-h-11 items-center justify-center rounded-xs border border-white/40 px-6 font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                >
                  Artikel lainnya
                </NuxtLink>
              </div>
            </section>
          </article>

          <!-- ==============================================================
               Daftar isi + kontak. Satu pembungkus sticky supaya keduanya
               menempel bersamaan saat digulir.

               Seluruh kolom disembunyikan di bawah lg, bukan daftar isinya
               saja seperti di artikel Pusat Bantuan. Bedanya disengaja:
               pembaca panduan bisa tersangkut di tengah langkah dan butuh
               kanal bantuan saat itu juga, sedangkan pembaca artikel tidak —
               ajakan di akhir artikel dan footer sudah memuat kontaknya.
               ============================================================== -->
          <aside class="hidden lg:block">
            <div class="space-y-4 lg:sticky lg:top-24">
              <nav
                v-if="content.headings.length > 1"
                class="rounded-2xl border border-line bg-surface-alt p-6"
                aria-labelledby="daftar-isi"
              >
                <p id="daftar-isi" class="mb-4 text-[0.74rem] font-bold tracking-widest text-muted uppercase">
                  Di halaman ini
                </p>
                <ul class="space-y-3 text-[0.85rem]">
                  <li
                    v-for="heading in content.headings"
                    :key="heading.id"
                    :class="heading.level === 3 ? 'pl-3.5' : ''"
                  >
                    <a :href="`#${heading.id}`" class="text-muted transition-colors duration-200 hover:text-primary">
                      {{ heading.text }}
                    </a>
                  </li>
                </ul>
              </nav>

              <div class="rounded-2xl bg-ink p-6 text-white">
                <p class="font-bold tracking-[-0.02em]">Ada yang mau ditanyakan?</p>
                <p class="mt-1.5 text-[0.83rem] leading-[1.6] text-white/70">
                  Jam layanan tim Zenko: {{ SUPPORT_CONTACT.hours }}.
                </p>
                <a
                  :href="SUPPORT_CONTACT.whatsappUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-3.5 flex min-h-11 items-center gap-2 text-[0.86rem] font-semibold text-white hover:underline"
                >
                  <AppIcon name="whatsapp-logo" :size="16" class="shrink-0" />
                  WhatsApp {{ SUPPORT_CONTACT.phoneDisplay }}
                </a>
              </div>
            </div>
          </aside>
        </div>

        <!-- ==============================================================
             Baca juga
             ============================================================== -->
        <section v-if="related.length" class="mt-16 border-t border-hairline pt-12 md:mt-20" aria-labelledby="baca-juga">
          <h2 id="baca-juga" class="mb-7 text-[clamp(1.25rem,2.2vw,1.6rem)] leading-[1.2] tracking-[-0.035em]">
            Baca juga
          </h2>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <MarketingArticleCard v-for="item in related" :key="item.id" :article="item" />
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
