<script setup lang="ts">
/**
 * Simulasi admin — /dashboard/admin/products/:id/simulasikan?section=…
 *
 * Kembaran tipis dari halaman tutor; bedanya cuma `scope="admin"`, yang
 * menunjuk ke GET /admin/products/:id/preview — berlaku untuk produk siapa
 * pun, bukan cuma milik pemanggilnya.
 */
// English file name, Indonesian URL; `path` keeps circulating links alive.
definePageMeta({
  layout: 'tryout',
  middleware: 'auth',
  roles: ['admin'],
  path: '/dashboard/admin/products/:id()/simulasikan',
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
  <!-- :key — lihat catatan yang sama di halaman simulasi tutor. -->
  <TryoutSimulation
    :key="`${productId}--${sectionId}`"
    scope="admin"
    :product-id="productId"
    :section-id="sectionId"
    :back-to="`/dashboard/admin/products/${productId}`"
    back-label="Kembali ke tinjauan produk"
  />
</template>
