<script setup lang="ts">
/**
 * Paket yang terbuka lewat keanggotaan bimbel.
 *
 * Halaman ini dulu "Tugas bimbel": daftar penugasan bertenggat dengan fase dan
 * batas percobaan. Penugasan dihapus — keanggotaan aktif yang memberi akses —
 * jadi tidak ada lagi jadwal maupun kuota percobaan untuk ditampilkan, dan
 * "Kerjakan" tidak pernah perlu dikunci.
 */
definePageMeta({ path: '/akun/paket-bimbel', layout: 'account', middleware: 'auth' })
useHead({ title: 'Paket Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

const { data: packages, pending, error, refresh } = useMyBimbelPackages()
onMounted(refresh)
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader
      title="Paket bimbel"
      description="Bank soal dari bimbel tempatmu tergabung. Paket ini terbuka selama keanggotaanmu masih aktif."
    />

    <DashboardPanel>
      <DashboardSkeleton v-if="pending" :count="4" label="Memuat paket bimbel…" />

      <AccountError v-else-if="error" @retry="refresh">{{ error }}</AccountError>

      <div v-else-if="packages.length" class="grid gap-3">
        <article
          v-for="item in packages"
          :key="`${item.bimbelId}-${item.productId}`"
          class="flex flex-col gap-4 rounded-md border border-hairline p-4 sm:flex-row sm:items-center"
        >
          <div class="min-w-0 flex-1">
            <h2 class="font-semibold">{{ item.title }}</h2>
            <p class="mt-1 text-sm text-muted">{{ item.bimbelName }} · {{ item.category }}</p>
            <p class="mt-1 text-xs text-muted">
              {{ item.attemptsUsed }}× dikerjakan
              <template v-if="item.bestScore >= 0"> · Skor terbaik {{ item.bestScore }}</template>
              <template v-else> · Belum pernah dikerjakan</template>
            </p>
          </div>

          <AppButton :to="`/akun/paket/${item.packageSlug}`" size="sm" class="shrink-0">Kerjakan</AppButton>
        </article>
      </div>

      <AppEmptyState
        v-else
        title="Belum ada paket bimbel"
        description="Bank soal bimbel muncul di sini setelah keanggotaanmu aktif. Gabung dengan kode dari pengelola bimbelmu."
        action-label="Buka Bimbel saya"
        @action="navigateTo('/akun/bimbel')"
      />
    </DashboardPanel>
  </div>
</template>
