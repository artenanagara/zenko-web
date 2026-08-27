<script setup lang="ts">
/**
 * Simulasi tutor — /dashboard/tutor/products/:id/simulasikan?section=…
 *
 * Rute penuh, bukan modal: TryoutHeader dipasang `fixed inset-x-0 top-0` dan
 * ruang ujiannya mengasumsikan satu viewport utuh, jadi menaruhnya di dalam
 * dialog akan menabrak kerangka dashboard.
 *
 * Setipis mungkin, sama seperti [id]/edit.vue terhadap TutorProductWizard:
 * semua isinya ada di TryoutSimulation.vue, yang dipakai bersama halaman
 * admin — cuma `scope`-nya yang berbeda (endpoint /tutor vs /admin).
 */
// English file name, Indonesian URL; `path` keeps circulating links alive.
definePageMeta({
  layout: 'tryout',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
  path: '/dashboard/tutor/products/:id()/simulasikan',
})

useHead({
  title: 'Simulasi Produk | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const route = useRoute()
const productId = computed(() => String(route.params.id ?? ''))
const sectionId = computed(() => String(route.query.section ?? ''))
</script>

<template>
  <!-- :key memaksa remount kalau ?section= berganti tanpa meninggalkan rute
       ini: sesi dan pengambilan datanya sama-sama dikunci sekali saat setup. -->
  <TryoutSimulation
    :key="`${productId}--${sectionId}`"
    scope="tutor"
    :product-id="productId"
    :section-id="sectionId"
    :back-to="`/dashboard/tutor/products/${productId}/edit?langkah=4`"
    back-label="Kembali ke produk"
  />
</template>
