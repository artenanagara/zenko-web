<script setup lang="ts">
import type { Package } from '~~/types/catalog'

defineProps<{
  items: Package[]
  pending?: boolean
  error?: unknown
}>()
</script>

<template>
  <section class="pb-18 md:pb-22" aria-label="Daftar paket try out">
    <div class="container-page">
      <p v-if="error" class="rounded-lg bg-surface-sunken px-6 py-10 text-center text-muted">
        Gagal memuat paket. Pastikan zenko-api sedang berjalan.
      </p>

      <div v-else class="grid grid-cols-1 gap-6 min-[560px]:grid-cols-2 min-[901px]:grid-cols-3 min-[1025px]:grid-cols-4">
        <template v-if="pending">
          <div v-for="n in 8" :key="n" class="h-85 animate-pulse rounded-lg bg-surface-sunken" />
        </template>

        <PackageCard v-for="item in items" v-else :key="item.id" :item="item" />
      </div>

      <div
        class="mt-6 flex flex-col items-stretch gap-8 rounded-lg bg-surface-sunken p-5.5 text-center md:flex-row md:items-center md:justify-between md:rounded-pill md:py-4 md:pr-4 md:pl-6.5 md:text-left"
      >
        <p class="flex items-center justify-center gap-3 text-[0.94rem] text-muted md:justify-start md:text-base">
          <IconSeal class="h-6 w-6 shrink-0" />
          Semua paket dikurasi dari tutor terverifikasi dan diperbarui tiap hari.
        </p>
        <AppButton href="#" pill class="shrink-0">Jelajahi semua paket</AppButton>
      </div>
    </div>
  </section>
</template>
