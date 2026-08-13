<script setup lang="ts">
/**
 * Profil tutor saja. Rekening bank sengaja TIDAK diduplikasi di sini — itu
 * sudah dikelola di /dashboard/tutor/payouts (lihat docs/tutor-flow-contract.md
 * §6), karena rekening dibutuhkan tepat di tempat pencairan diajukan. Halaman
 * ini cuma menautkan ke sana.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Pengaturan — Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const { user } = useAuth()
</script>

<template>
  <div class="grid gap-6">
    <header>
      <h1 class="text-[1.6rem] font-bold tracking-[-0.04em]">Pengaturan</h1>
      <p class="mt-1.5 text-muted">Profil tutor yang tampil di halaman produkmu.</p>
    </header>

    <DashboardPanel title="Profil tutor" description="Nama dan foto ikut akun Google yang dipakai untuk masuk.">
      <div v-if="user" class="flex items-center gap-4">
        <img
          v-if="user.avatarUrl"
          :src="user.avatarUrl"
          alt=""
          referrerpolicy="no-referrer"
          class="h-14 w-14 shrink-0 rounded-full object-cover"
        >
        <span
          v-else
          aria-hidden="true"
          class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-alt text-[1.2rem] font-bold text-muted"
        >{{ user.name.trim().charAt(0).toUpperCase() || '?' }}</span>

        <div class="min-w-0">
          <p class="truncate font-semibold tracking-[-0.02em]">{{ user.name }}</p>
          <p class="mt-0.5 truncate text-[0.88rem] text-muted">{{ user.email }}</p>
        </div>
      </div>

      <p class="mt-5 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] text-amber-900">
        Bio singkat dan spesialisasi (mis. "SKD & SNBT") belum bisa diisi di sini — baru sebatas
        nama dan foto dari Google. Bagian ini menyusul.
      </p>
    </DashboardPanel>

    <DashboardPanel title="Rekening bank" description="Dipakai saat mengajukan pencairan.">
      <p class="text-[0.9rem] text-muted">
        Rekening bank dikelola langsung di halaman Pencairan, tepat di tempat kamu mengajukan
        penarikan saldo.
      </p>
      <NuxtLink
        to="/dashboard/tutor/payouts"
        class="mt-3 inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-primary transition-colors hover:text-primary-light"
      >
        Buka halaman Pencairan
        <span aria-hidden="true">→</span>
      </NuxtLink>
    </DashboardPanel>
  </div>
</template>
