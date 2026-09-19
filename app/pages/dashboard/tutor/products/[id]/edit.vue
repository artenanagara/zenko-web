<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  roles: ['tutor', 'admin'],
})

useHead({
  title: 'Edit Paket Soal | Zenko',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const route = useRoute()

/** :id dijamin string tunggal oleh bentuk path-nya. */
const productId = computed(() => String(route.params.id))
const leaderboardSummary = useTutorLeaderboardSummary(productId.value)
</script>

<template>
  <div class="grid gap-6">
    <DashboardPanel
      v-if="leaderboardSummary.data.value"
      title="Statistik leaderboard"
      description="Ringkasan peserta yang mengerjakan paket ini."
    >
      <div class="grid gap-3 sm:grid-cols-3">
        <AccountStat tone="primary" label="Peserta" :value="String(leaderboardSummary.data.value.participants)" />
        <AccountStat tone="star" label="Rata-rata skor" :value="leaderboardSummary.data.value.average.toFixed(1)" />
        <AccountStat tone="success" label="Skor tertinggi" :value="String(leaderboardSummary.data.value.highest)" />
      </div>
    </DashboardPanel>

    <!-- key: pindah antar produk harus me-reset seluruh state wizard. -->
    <TutorProductWizard :key="productId" :product-id="productId" />
  </div>
</template>
