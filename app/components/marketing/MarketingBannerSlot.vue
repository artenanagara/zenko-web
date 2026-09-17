<script setup lang="ts">
interface Banner { id: string, slot: string, title: string, description: string, buttonLabel: string, targetUrl: string, desktopImageUrl: string, mobileImageUrl: string }
const props = defineProps<{ slot: 'hero' | 'top_bar' | 'sidebar' }>()
const { public: config } = useRuntimeConfig()
const banners = ref<Banner[]>([])
try { banners.value = await useApiFetch<Banner[]>('/banners', { baseURL: config.apiBase }) } catch { banners.value = [] }
const banner = computed(() => banners.value.find(item => item.slot === props.slot))
onMounted(() => { if (banner.value) useApiFetch(`/banners/${banner.value.id}/impression`, { baseURL: config.apiBase, method: 'POST' }).catch(() => {}) })
function clickBanner() { if (banner.value) useApiFetch(`/banners/${banner.value.id}/click`, { baseURL: config.apiBase, method: 'POST' }).catch(() => {}) }
</script>

<template>
  <section v-if="banner" class="container-page py-4" aria-label="Promosi">
    <a :href="banner.targetUrl || '#paket'" class="group relative block overflow-hidden rounded-lg bg-primary text-white" @click="clickBanner">
      <picture v-if="banner.desktopImageUrl || banner.mobileImageUrl"><source v-if="banner.mobileImageUrl" media="(max-width: 767px)" :srcset="banner.mobileImageUrl"><img :src="banner.desktopImageUrl || banner.mobileImageUrl" :alt="banner.title" class="absolute inset-0 h-full w-full object-cover opacity-70"></picture>
      <div class="relative grid gap-2 p-6 md:p-8"><h2 class="text-xl font-bold">{{ banner.title }}</h2><p v-if="banner.description" class="max-w-2xl text-sm text-white/80">{{ banner.description }}</p><span v-if="banner.buttonLabel" class="mt-2 w-fit rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary">{{ banner.buttonLabel }}</span></div>
    </a>
  </section>
</template>
