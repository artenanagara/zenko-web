import type { Article } from '#shared/types/article'
import type { Category, Package } from '#shared/types/catalog'
import type { ExamType } from '#shared/types/tutor-product'
import type { ResolvedLanding } from '~/data/category-landing'
import { CATEGORY_LANDINGS, resolveLanding } from '~/data/category-landing'

const SITE = 'https://zenkoedu.id'

/** One chip in the "pilih jalurmu" row. */
export interface LandingPath {
  slug: string
  label: string
  count: number
  to: string
}

interface LandingData {
  landing: ResolvedLanding
  categoryLabel: string
  subcategory?: { slug: string, label: string, count: number }
  paths: LandingPath[]
  examTypes: ExamType[]
  count: number
  packages: Package[]
  packagesFailed: boolean
}

/**
 * Everything a category landing page (/kategori/:slug[/:subSlug]) renders:
 * the resolved copy, the live packages, the exam format from GET /exam-types,
 * related articles, and the SEO head.
 *
 * A category is found in GET /categories first (it has live packages), then in
 * CATEGORY_LANDINGS (curated, but nothing live yet), then among the exam types.
 * Curated pages render — and stay indexable — even with zero packages, because
 * their value is the copy and the format table; an uncurated category with
 * fewer than two packages is noindex, as before, so thin pages stay out of
 * search.
 *
 * Every composable is called before the single `await` at the end: after an
 * await inside a composable, Nuxt's instance is gone and useSeoMeta/useFetch
 * would run without it. The fetching itself lives in one useAsyncData handler
 * built on $fetch, which needs no instance.
 */
export async function useCategoryLanding(categorySlug: string, subcategorySlug?: string) {
  const { public: config } = useRuntimeConfig()
  const { data: publishedArticles } = usePublishedArticles()

  const request = useAsyncData<LandingData>(
    `category-landing:${categorySlug}:${subcategorySlug ?? ''}`,
    () => loadLanding(config.apiBase, categorySlug, subcategorySlug),
  )
  const { data } = request

  const path = subcategorySlug ? `/kategori/${categorySlug}/${subcategorySlug}` : `/kategori/${categorySlug}`
  const pageUrl = `${SITE}${path}`

  const breadcrumbs = computed(() => {
    const value = data.value
    if (!value) return []
    return [
      { label: 'Beranda', to: '/' },
      { label: 'Kategori', to: '/kategori' },
      ...(value.subcategory
        ? [{ label: value.categoryLabel, to: `/kategori/${categorySlug}` }, { label: value.subcategory.label }]
        : [{ label: value.categoryLabel }]),
    ]
  })

  const landing = () => data.value?.landing
  const shouldIndex = () => Boolean(data.value && (data.value.landing.curated || data.value.count >= 2))

  useSeoMeta({
    title: () => landing()?.title,
    description: () => landing()?.description,
    ogTitle: () => landing()?.title,
    ogDescription: () => landing()?.description,
    ...DEFAULT_OG,
    ogUrl: pageUrl,
    robots: () => shouldIndex() ? 'index,follow' : 'noindex,follow',
    twitterCard: 'summary_large_image',
  })

  useHead({
    link: [{ rel: 'canonical', href: pageUrl }],
    script: [{
      type: 'application/ld+json',
      innerHTML: computed(() => {
        const value = data.value
        if (!value) return '[]'
        return JSON.stringify([
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            'name': value.landing.title,
            'description': value.landing.description,
            'url': pageUrl,
            'inLanguage': 'id-ID',
            'isPartOf': { '@type': 'WebSite', 'name': 'Zenko', 'url': `${SITE}/` },
            'mainEntity': {
              '@type': 'ItemList',
              'numberOfItems': value.packages.length,
              'itemListElement': value.packages.map((item, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'name': item.title,
                'url': `${SITE}/paket/${item.slug}`,
              })),
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': breadcrumbs.value.map((crumb, index) => ({
              '@type': 'ListItem',
              'position': index + 1,
              'name': crumb.label,
              'item': 'to' in crumb && crumb.to ? `${SITE}${crumb.to}` : pageUrl,
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': value.landing.faqs.map(faq => ({
              '@type': 'Question',
              'name': faq.question,
              'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer },
            })),
          },
        ])
      }),
    }],
  })

  const articles = computed(() => data.value
    ? relatedArticles(publishedArticles.value, data.value.landing.articleKeywords)
    : [])

  await request

  if (request.error.value || !data.value) {
    const statusCode = request.error.value?.statusCode === 404 ? 404 : 500
    throw createError({
      statusCode,
      statusMessage: statusCode === 404 ? 'Kategori tidak ditemukan' : 'Halaman kategori belum berhasil dimuat',
      fatal: true,
    })
  }

  const value = data.value
  // The full, filterable catalogue for this facet (usePackageFilters reads
  // `kategori`/`subkategori` from the URL).
  const catalogLink = value.subcategory
    ? `/paket?kategori=${categorySlug}&subkategori=${value.subcategory.slug}`
    : `/paket?kategori=${categorySlug}`
  // Packages in an exam category are single products (bundles land in their
  // own "Bundel" category), so the top one always has a free sample.
  const sampleLink = value.packages[0] ? `/paket/${value.packages[0].slug}/coba` : null

  return {
    ...value,
    articles,
    catalogLink,
    sampleLink,
    breadcrumbs: breadcrumbs.value,
  }
}

async function loadLanding(apiBase: string, categorySlug: string, subcategorySlug?: string): Promise<LandingData> {
  const [categories, allExamTypes] = await Promise.all([
    $fetch<Category[]>('/categories', { baseURL: apiBase }),
    $fetch<ExamType[]>('/exam-types', { baseURL: apiBase }),
  ])

  const curated = CATEGORY_LANDINGS[categorySlug]
  const category = categories.find(item => item.slug === categorySlug)
  const categoryExamTypes = allExamTypes.filter(type => slugifyCategory(type.category) === categorySlug)
  const categoryLabel = category?.label ?? curated?.label ?? categoryExamTypes[0]?.category
  if (!categoryLabel) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan' })

  // Subcategories from every source, in API order first: live ones carry a
  // count; the exam types and curated entries add paths that exist but have
  // nothing live yet.
  const pathMap = new Map<string, { label: string, count: number }>()
  for (const sub of category?.subcategories ?? []) pathMap.set(sub.slug, { label: sub.label, count: sub.count })
  for (const type of categoryExamTypes) {
    if (!type.subcategory) continue
    const slug = slugifyCategory(type.subcategory)
    if (!pathMap.has(slug)) pathMap.set(slug, { label: type.subcategory, count: 0 })
  }
  for (const [slug, sub] of Object.entries(curated?.subcategories ?? {})) {
    if (sub.label && !pathMap.has(slug)) pathMap.set(slug, { label: sub.label, count: 0 })
  }
  const paths = [...pathMap.entries()].map(([slug, sub]) => ({
    slug,
    label: sub.label,
    count: sub.count,
    to: `/kategori/${categorySlug}/${slug}`,
  }))

  let subcategory: LandingData['subcategory']
  if (subcategorySlug) {
    const found = pathMap.get(subcategorySlug)
    if (!found) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan' })
    subcategory = { slug: subcategorySlug, ...found }
  }

  // A failed package list degrades to the grid's error state rather than
  // taking the whole landing page down with it.
  let packages: Package[] = []
  let packagesFailed = false
  try {
    packages = await $fetch<Package[]>('/packages', {
      baseURL: apiBase,
      query: { category: categoryLabel, subcategory: subcategory?.label, sort: 'featured', limit: 9 },
    })
  }
  catch {
    packagesFailed = true
  }

  return {
    landing: resolveLanding(categorySlug, categoryLabel, subcategory),
    categoryLabel,
    subcategory,
    paths,
    examTypes: subcategory
      ? categoryExamTypes.filter(type => slugifyCategory(type.subcategory) === subcategory.slug)
      : categoryExamTypes,
    count: subcategory?.count ?? category?.count ?? 0,
    packages,
    packagesFailed,
  }
}

/**
 * Up to three articles whose title, subtitle or category mentions one of the
 * keywords, newest first (the API already orders them). Whole-word match, so
 * "SD" does not match "SDM".
 */
function relatedArticles(articles: Article[], keywords: string[]): Article[] {
  const patterns = keywords
    .filter(Boolean)
    .map(word => new RegExp(`(^|[^\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'iu'))
  return articles
    .filter((article) => {
      const haystack = `${article.title} ${article.subtitle} ${article.categoryName}`
      return patterns.some(pattern => pattern.test(haystack))
    })
    .slice(0, 3)
}
