<script setup lang="ts">
const checks = ['Tutor terverifikasi', 'Pembahasan lengkap', 'Soal sesuai kisi-kisi']

// One observer for the whole section: the three panels animate together as a
// single beat rather than firing three separate times while scrolling past.
const { target, ready, isInView } = useInView(0.2)
</script>

<template>
  <section
    id="cara-kerja"
    ref="target"
    class="dot-grid relative border-y border-hairline bg-surface-alt py-18 md:py-22"
    :class="[ready && 'anim-ready', isInView && 'is-inview']"
  >
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
              <!-- 260ms apart: wide enough to read as one-by-one, and the
                   check lands just after its label settles. -->
              <li
                v-for="(check, index) in checks"
                :key="check"
                class="anim-slide flex items-center gap-3 font-semibold tracking-[-0.01em]"
                :style="{ '--delay': `${120 + index * 260}ms` }"
              >
                <IconCheck
                  class="anim-draw h-[18px] w-[18px] shrink-0 stroke-primary"
                  :style="{ '--delay': `${280 + index * 260}ms` }"
                />
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
            <FeatureExamMock :active="isInView" />
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
              class="anim-item anim-sheen flex h-full min-h-[188px] w-full items-center justify-center rounded-[14px] bg-linear-160 from-[#3f7bf0] via-primary via-55% to-primary-dark shadow-[0_10px_24px_rgba(47,111,235,0.25)]"
              style="--delay: 120ms"
              aria-hidden="true"
            >
              <span class="anim-item font-serif text-[2.2rem] font-medium text-white italic" style="--delay: 420ms">
                Zenko
              </span>
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
