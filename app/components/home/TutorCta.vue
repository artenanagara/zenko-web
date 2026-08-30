<script setup lang="ts">
/** Decorative earnings mock with bar heights only and no real data. */
const chartBars = [34, 52, 44, 70, 58, 86, 100]

const recentSales = [
  { title: 'Simulasi SKD Kedinasan', detail: '2 paket terjual', amount: '+Rp298rb' },
  { title: 'TKA Matematika SMA', detail: '1 paket terjual', amount: '+Rp219rb' },
]
</script>

<template>
  <section class="py-18 md:py-22" aria-labelledby="tutor-cta-heading">
    <div class="container-page">
      <div
        class="panel-inset grid grid-cols-1 items-center gap-9 rounded-[24px] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark px-6 py-9 min-[901px]:grid-cols-[minmax(0,1fr)_minmax(0,420px)] min-[901px]:gap-12 min-[901px]:rounded-xl min-[901px]:px-15 min-[901px]:py-16"
      >
        <div>
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-white/75 uppercase">
            Peluang Tutor & Edukator
          </p>
          <h2
            id="tutor-cta-heading"
            class="max-w-[15ch] text-[clamp(2rem,3.4vw,3rem)] leading-[1.12] tracking-[-0.04em] text-white"
          >
            Bagikan materi terbaikmu
            <span class="text-accent mt-0.5 block text-white/95">di Zenko</span>
          </h2>
          <p class="mt-5 mb-8 max-w-[44ch] text-[1.02rem] text-white/80">
            Unggah paket soal buatanmu, atur harga secara bebas, dan dapatkan penghasilan dari setiap penjualan tanpa pusing urusan teknis.
          </p>
          <AppButton to="/jadi-tutor" variant="light" size="lg">Gabung Jadi Tutor</AppButton>
        </div>

        <div class="rounded-lg bg-surface p-5 shadow-[0_20px_44px_rgba(12,40,100,0.22)] md:p-7 md:pb-6" aria-hidden="true">
          <div class="flex items-center justify-between gap-3">
            <p class="text-[1.02rem] font-bold tracking-[-0.02em]">
              Contoh pendapatan <span class="font-medium text-muted">Agustus</span>
            </p>
            <span class="rounded-pill bg-success-soft px-3 py-1 text-[0.74rem] font-bold text-success-ink">+18%</span>
          </div>

          <p class="mt-3.5 text-[2rem] font-extrabold tracking-[-0.04em]">Rp4.250.000</p>

          <div class="mt-6 mb-1.5 flex h-21 items-end gap-2">
            <span
              v-for="(height, index) in chartBars"
              :key="index"
              class="flex-1 rounded-t-md rounded-b"
              :class="index === chartBars.length - 1 ? 'bg-linear-to-b from-[#5c93f5] to-primary' : 'bg-skeleton'"
              :style="{ height: `${height}%` }"
            />
          </div>

          <ul class="mt-5 grid gap-3.5 border-t border-line pt-5">
            <!-- min-w-0: sebagai grid item, <li> default-nya `min-width:auto`
                 dan menolak menyusut di bawah lebar min-content-nya, jadi di
                 320px baris ini menonjol keluar panel dan membuat seluruh
                 beranda bisa digeser ke samping. -->
            <li v-for="sale in recentSales" :key="sale.title" class="flex min-w-0 items-center gap-3">
              <span class="h-9 w-9 shrink-0 rounded-[10px] bg-primary-soft" />
              <span class="flex min-w-0 flex-1 flex-col">
                <b class="truncate text-[0.9rem] font-bold tracking-[-0.02em]">{{ sale.title }}</b>
                <i class="text-[0.78rem] text-muted not-italic">{{ sale.detail }}</i>
              </span>
              <em class="shrink-0 text-[0.86rem] font-bold text-success-ink not-italic">{{ sale.amount }}</em>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
