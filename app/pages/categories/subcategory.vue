<script setup lang="ts">
definePageMeta({
  // Moving between categories reuses this route record; keying by path
  // remounts the page so its setup (and data) runs for the new slug.
  key: route => route.path,
  path: '/kategori/:categorySlug()/:subcategorySlug()',
  // Same canonical-slug redirect as the category page, for both segments.
  middleware: [(to) => {
    const category = String(to.params.categorySlug)
    const subcategory = String(to.params.subcategorySlug)
    const canonical = [slugifyCategory(category), slugifyCategory(subcategory)]
    if (canonical[0] && canonical[1] && (canonical[0] !== category || canonical[1] !== subcategory)) {
      return navigateTo(
        { path: `/kategori/${canonical[0]}/${canonical[1]}`, query: to.query, hash: to.hash },
        { redirectCode: 301 },
      )
    }
  }],
})

const route = useRoute()
const page = await useCategoryLanding(String(route.params.categorySlug), String(route.params.subcategorySlug))
const { articles } = page
</script>

<template>
  <CategoryLanding
    :landing="page.landing"
    :subcategory="page.subcategory"
    :paths="page.paths"
    :exam-types="page.examTypes"
    :count="page.count"
    :packages="page.packages"
    :error="page.packagesFailed || undefined"
    :articles="articles"
    :catalog-link="page.catalogLink"
    :sample-link="page.sampleLink"
    :breadcrumbs="page.breadcrumbs"
  />
</template>
