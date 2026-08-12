<script setup lang="ts">
const checks = ['Tutor terverifikasi', 'Pembahasan lengkap', 'Soal sesuai kisi-kisi']
</script>

<template>
  <section id="cara-kerja" class="dot-grid relative border-y border-hairline bg-surface-alt py-18 md:py-22">
    <div class="container-page relative z-1">
      <div class="mx-auto mb-11 max-w-[640px] text-center">
        <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
          Kenapa pilih Zenko
        </p>
        <h2 class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-[-0.05em]">
          <span class="text-accent">Belajar</span> lebih terarah, lebih siap
        </h2>
        <p class="mt-3.5 text-[1.02rem] text-muted">
          Semua yang kamu butuhkan untuk latihan serius — tanpa langganan mahal
          dan tanpa komitmen panjang.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 min-[901px]:grid-cols-3">
        <article class="flex flex-col rounded-[26px] bg-surface p-6 pb-[34px] shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift">
          <div class="mb-[30px] flex min-h-[240px] items-center justify-center rounded-[20px] bg-surface-sunken p-[26px]">
            <ul class="grid gap-4">
              <li v-for="check in checks" :key="check" class="flex items-center gap-3 font-semibold tracking-[-0.01em]">
                <IconCheck class="h-[18px] w-[18px] shrink-0 stroke-primary" />
                {{ check }}
              </li>
            </ul>
          </div>
          <h3 class="mb-3 text-[1.45rem] font-bold tracking-[-0.03em]">Pilih paketmu</h3>
          <p class="leading-[1.62] text-muted">
            Bandingkan paket dari puluhan tutor terkurasi, lalu ambil yang paling
            sesuai dengan target dan gaya belajarmu.
          </p>
        </article>

        <article class="flex flex-col rounded-[26px] bg-surface p-6 pb-[34px] shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift">
          <div class="mb-[30px] flex min-h-[240px] items-center justify-center rounded-[20px] bg-surface-sunken p-[26px]">
            <!-- Decorative "exam screen" mock -->
            <div class="w-full max-w-[260px] rounded-[14px] bg-surface p-5 shadow-[0_6px_18px_rgba(15,23,42,0.07)]" aria-hidden="true">
              <div class="flex items-center justify-between gap-3">
                <span class="block h-2.5 w-3/5 rounded-pill bg-skeleton" />
                <span class="shrink-0 rounded-pill bg-primary-soft px-[11px] py-[5px] text-[0.72rem] font-bold text-primary">45:00</span>
              </div>
              <span class="mt-4 block h-2.5 w-2/5 rounded-pill bg-skeleton" />
              <div class="mt-7 flex items-center justify-between gap-3">
                <span class="block h-2.5 w-[30%] rounded-pill bg-skeleton" />
                <span class="h-5 w-5 rounded-full bg-skeleton" />
              </div>
            </div>
          </div>
          <h3 class="mb-3 text-[1.45rem] font-bold tracking-[-0.03em]">Kerjakan simulasi</h3>
          <p class="leading-[1.62] text-muted">
            Latihan dengan timer dan tampilan mirip ujian asli, jadi kamu terbiasa
            sebelum menghadapi hari sesungguhnya.
          </p>
        </article>

        <article class="flex flex-col rounded-[26px] bg-surface p-6 pb-[34px] shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift">
          <div class="mb-[30px] flex min-h-[240px] items-center justify-center rounded-[20px] bg-surface-sunken p-[26px]">
            <div
              class="flex h-full min-h-[188px] w-full items-center justify-center rounded-[14px] bg-linear-160 from-[#3f7bf0] via-primary via-55% to-primary-dark shadow-[0_10px_24px_rgba(47,111,235,0.25)]"
              aria-hidden="true"
            >
              <span class="font-serif text-[2.2rem] font-medium text-white italic">Zenko</span>
            </div>
          </div>
          <h3 class="mb-3 text-[1.45rem] font-bold tracking-[-0.03em]">Lihat hasilmu</h3>
          <p class="leading-[1.62] text-muted">
            Dapat skor, peringkat, dan pembahasan langsung setelah selesai — lengkap
            dengan materi yang perlu kamu perbaiki.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
