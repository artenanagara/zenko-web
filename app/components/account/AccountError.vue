<!-- The account area's shared "load failed, try again" panel. One component so
     every page's error state reads the same and offers the same way out — a
     retry that re-runs the fetch, not a dead end. -->
<script setup lang="ts">
defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    role="alert"
    class="grid justify-items-center gap-3 rounded-lg border border-amber-200/70 bg-amber-50 px-6 py-10 text-center"
  >
    <span class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
      <IconAlert class="h-5 w-5" aria-hidden="true" />
    </span>
    <p class="font-bold tracking-[-0.02em] text-amber-900">Gagal memuat data</p>
    <p class="max-w-sm text-[0.9rem] text-amber-800">
      <slot>Data belum berhasil dimuat. Periksa koneksimu, lalu coba lagi.</slot>
    </p>
    <AppButton size="sm" class="mt-2" @click="$emit('retry')">Coba lagi</AppButton>
  </div>
</template>
