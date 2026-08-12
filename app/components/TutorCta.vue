<script setup lang="ts">
/** Decorative earnings mock — bar heights only, no real data. */
const chartBars = [34, 52, 44, 70, 58, 86, 100]

const recentSales = [
  { title: 'Prediksi BUMN 2026', detail: '2 paket terjual', amount: '+Rp298rb' },
  { title: 'SNBT Master Class', detail: '1 paket terjual', amount: '+Rp219rb' },
]
</script>

<template>
  <section class="py-18 md:py-22" aria-labelledby="tutor-cta-heading">
    <div class="container-page">
      <div
        class="panel-inset grid grid-cols-1 items-center gap-9 rounded-[24px] bg-linear-160 from-[#4176ee] via-primary via-52% to-primary-dark px-[22px] py-[34px] min-[901px]:grid-cols-[minmax(0,1fr)_minmax(0,420px)] min-[901px]:gap-12 min-[901px]:rounded-xl min-[901px]:px-15 min-[901px]:py-[62px]"
      >
        <div>
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-white/75 uppercase">
            Bagi tutor &amp; creator
          </p>
          <h2
            id="tutor-cta-heading"
            class="max-w-[15ch] text-[clamp(2rem,3.4vw,3rem)] leading-[1.12] tracking-[-0.04em] text-white"
          >
            Mulai jual paket try out
            <span class="text-accent mt-0.5 block text-white/95">dan raih pendapatan lebih</span>
          </h2>
          <p class="mt-5 mb-[30px] max-w-[44ch] text-[1.02rem] text-white/80">
            Upload paketmu, tentukan harga sendiri, dan jangkau ribuan siswa yang
            sedang bersiap menghadapi ujian.
          </p>
          <AppButton href="#" variant="light" size="lg" pill>Mulai jual paket</AppButton>
        </div>

        <div class="rounded-lg bg-surface p-5 pb-[18px] shadow-[0_20px_44px_rgba(12,40,100,0.22)] md:p-[26px] md:pb-[22px]" aria-hidden="true">
          <div class="flex items-center justify-between gap-3">
            <p class="text-[1.02rem] font-bold tracking-[-0.02em]">
              Pendapatan <span class="font-medium text-muted">Agustus</span>
            </p>
            <span class="rounded-pill bg-success-soft px-[11px] py-[5px] text-[0.74rem] font-bold text-success-ink">+18%</span>
          </div>

          <p class="mt-3.5 text-[2rem] font-extrabold tracking-[-0.04em]">Rp4.250.000</p>

          <div class="mt-[22px] mb-1.5 flex h-[84px] items-end gap-2">
            <span
              v-for="(height, index) in chartBars"
              :key="index"
              class="flex-1 rounded-t-md rounded-b"
              :class="index === chartBars.length - 1 ? 'bg-linear-to-b from-[#5c93f5] to-primary' : 'bg-skeleton'"
              :style="{ height: `${height}%` }"
            />
          </div>

          <ul class="mt-[18px] grid gap-3.5 border-t border-line pt-[18px]">
            <li v-for="sale in recentSales" :key="sale.title" class="flex items-center gap-3">
              <span class="h-[34px] w-[34px] shrink-0 rounded-[10px] bg-primary-soft" />
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
