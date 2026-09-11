<script setup lang="ts">
/**
 * Satu baris menu pengaturan: ikon, judul, keterangan, dan aksi di kanan.
 * Dipakai tab Keamanan di /akun/profil supaya kata sandi, sesi, dan hapus akun
 * terbaca sebagai daftar pilihan — bukan tiga form panjang yang ditumpuk.
 * Susun beberapa baris dalam wadah `divide-y divide-hairline`.
 */
defineProps<{
  icon: string
  title: string
  description: string
  /** Merah untuk aksi yang merusak (hapus akun). */
  tone?: 'default' | 'danger'
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 first:pt-0 last:pb-0">
    <span
      aria-hidden="true"
      class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
      :class="tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-surface-alt text-muted'"
    >
      <AppIcon :name="icon" :size="20" />
    </span>
    <div class="min-w-0 flex-1 basis-48">
      <p class="font-semibold tracking-[-0.01em]" :class="tone === 'danger' ? 'text-danger' : 'text-ink'">
        {{ title }}
      </p>
      <p class="mt-0.5 text-[0.86rem] text-muted">{{ description }}</p>
    </div>
    <!-- ml-auto: saat baris terlipat di layar sempit, aksi menepi ke kanan
         alih-alih menggantung di bawah ikon. -->
    <div class="ml-auto shrink-0">
      <slot name="action" />
    </div>
  </div>
</template>
