import type { Category, Package } from '#shared/types/catalog'
import type { ExamType } from '#shared/types/tutor-product'
import { CATEGORY_LANDINGS } from '../../../app/data/category-landing'
import { helpArticles } from '../../../app/data/help-center'
import { slugifyCategory } from '../../../app/utils/categorySlug'

/**
 * Dynamic sitemap entries for the catalogue: one per real package, fetched
 * live from zenko-api's public GET /packages so the sitemap never drifts
 * from what is actually purchasable.
 */
export default defineSitemapEventHandler(async () => {
  const { public: config } = useRuntimeConfig()

  const packages = await $fetch<Package[]>('/packages', {
    baseURL: config.apiBase,
  })
  const categories = await $fetch<Category[]>('/categories', {
    baseURL: config.apiBase,
  })
  const articles = await $fetch<{ slug: string, updatedAt: string }[]>('/articles', {
    baseURL: config.apiBase,
  })
  const examTypes = await $fetch<ExamType[]>('/exam-types', {
    baseURL: config.apiBase,
  })

  const tutorUsernames = [...new Set(
    packages
      .map(pkg => pkg.author.username.trim())
      .filter(Boolean),
  )]

  // Bimbel yang menerbitkan paket publik punya profil di /bimbel/:slug — halaman
  // yang juga dirujuk Product JSON-LD setiap paketnya.
  const bimbelSlugs = [...new Set(
    packages
      .filter(pkg => pkg.author.type === 'bimbel')
      .map(pkg => pkg.author.slug?.trim() ?? '')
      .filter(Boolean),
  )]

  return [
    ...packages.map(pkg => ({ loc: `/paket/${pkg.slug}` })),
    { loc: '/kategori' },
    ...categoryUrls(categories, examTypes),
    ...helpArticles.map(article => ({ loc: `/pusat-bantuan/${article.slug}` })),
    ...articles.map(article => ({ loc: `/artikel/${article.slug}`, lastmod: article.updatedAt })),
    ...tutorUsernames.map(username => ({ loc: `/tutor/${encodeURIComponent(username)}` })),
    ...bimbelSlugs.map(slug => ({ loc: `/bimbel/${encodeURIComponent(slug)}` })),
  ]
})

/**
 * Category landing pages, following the same index rule the pages set in
 * useCategoryLanding: a curated category (and every subcategory under it) is
 * always indexable, since its copy and format table stand on their own; any
 * other category or subcategory needs at least two live packages.
 */
function categoryUrls(categories: Category[], examTypes: ExamType[]) {
  const urls = new Set<string>()
  const live = new Map(categories.map(category => [category.slug, category]))

  for (const [slug, landing] of Object.entries(CATEGORY_LANDINGS)) {
    urls.add(`/kategori/${slug}`)
    const subs = new Set<string>([
      ...(live.get(slug)?.subcategories ?? []).map(sub => sub.slug),
      ...examTypes
        .filter(type => slugifyCategory(type.category) === slug && type.subcategory)
        .map(type => slugifyCategory(type.subcategory)),
      ...Object.entries(landing.subcategories ?? {})
        .filter(([, sub]) => sub.label)
        .map(([subSlug]) => subSlug),
    ])
    for (const sub of subs) urls.add(`/kategori/${slug}/${sub}`)
  }

  for (const category of categories) {
    if (CATEGORY_LANDINGS[category.slug] || category.count < 2) continue
    urls.add(`/kategori/${category.slug}`)
    for (const sub of category.subcategories ?? []) {
      if (sub.count >= 2) urls.add(`/kategori/${category.slug}/${sub.slug}`)
    }
  }

  return [...urls].map(loc => ({ loc }))
}
