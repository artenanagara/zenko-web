import type { Category, Package } from '#shared/types/catalog'
import { helpArticles } from '../../../app/data/help-center'

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
    ...categories
      .filter(category => category.count >= 2)
      .flatMap(category => [
        { loc: `/kategori/${category.slug}` },
        ...(category.subcategories ?? [])
          .filter(subcategory => subcategory.count >= 2)
          .map(subcategory => ({ loc: `/kategori/${category.slug}/${subcategory.slug}` })),
      ]),
    ...helpArticles.map(article => ({ loc: `/pusat-bantuan/${article.slug}` })),
    ...articles.map(article => ({ loc: `/artikel/${article.slug}`, lastmod: article.updatedAt })),
    ...tutorUsernames.map(username => ({ loc: `/tutor/${encodeURIComponent(username)}` })),
    ...bimbelSlugs.map(slug => ({ loc: `/bimbel/${encodeURIComponent(slug)}` })),
  ]
})
