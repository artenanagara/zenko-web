<script setup lang="ts">
const checks = ['Tutor terverifikasi', 'Pembahasan lengkap', 'Soal sesuai kisi-kisi']

// One observer starts all three panels, but each card carries its own --cycle
// (4s / 6s / 8s) so the loops drift apart instead of pulsing in unison.
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
      <div class="mx-auto mb-11 max-w-160 text-center">
        <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
          Cara belajar di Zenko
        </p>
        <h2 class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
          Latihan try out yang <span class="text-accent">lebih terarah</span>
        </h2>
        <p class="mt-3.5 text-[1.02rem] text-muted">
          Pilih paket yang sesuai, kerjakan simulasi ujian, lalu pelajari hasil
          dan pembahasannya dalam satu alur.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 min-[901px]:grid-cols-3">
        <article
          style="--cycle: 4s"
          class="flex flex-col rounded-[26px] bg-surface p-6 pb-9 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift"
        >
          <div class="mb-8 flex min-h-60 items-center justify-center rounded-[20px] bg-surface-sunken p-7">
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
                  class="anim-draw h-5 w-5 shrink-0 text-primary"
                  :style="{ '--delay': `${280 + index * 260}ms` }"
                />
                {{ check }}
              </li>
            </ul>
          </div>
          <h3 class="mb-3 text-[1.45rem] font-bold tracking-[-0.03em]">Pilih paket try out yang pas</h3>
          <p class="leading-[1.62] text-muted">
            Temukan paket soal dari tutor terpercaya yang sesuai dengan target seleksi, tingkat pemahaman, dan gaya belajarmu.
          </p>
        </article>

        <article
          style="--cycle: 6s"
          class="flex flex-col rounded-[26px] bg-surface p-6 pb-9 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift"
        >
          <div class="mb-8 flex min-h-60 items-center justify-center rounded-[20px] bg-surface-sunken p-7">
            <FeatureExamMock :active="isInView" />
          </div>
          <h3 class="mb-3 text-[1.45rem] font-bold tracking-[-0.03em]">Simulasi ujian mirip aslinya</h3>
          <p class="leading-[1.62] text-muted">
            Latihan dengan sistem CBT, batasan waktu, dan format soal yang menyerupai ujian resmi agar kamu makin tenang dan siap.
          </p>
        </article>

        <article
          style="--cycle: 8s"
          class="flex flex-col rounded-[26px] bg-surface p-6 pb-9 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift"
        >
          <div class="mb-8 flex min-h-60 items-center justify-center rounded-[20px] bg-surface-sunken p-7">
            <div
              class="anim-item anim-sheen flex h-full min-h-47 w-full items-center justify-center rounded-[14px] bg-linear-160 from-[#3f7bf0] via-primary via-55% to-primary-dark shadow-[0_10px_24px_rgba(47,111,235,0.25)]"
              style="--delay: 120ms"
              aria-hidden="true"
            >
              <span class="anim-item font-serif text-[2.2rem] font-medium text-white italic" style="--delay: 420ms">
                Zenko
              </span>
            </div>
          </div>
          <h3 class="mb-3 text-[1.45rem] font-bold tracking-[-0.03em]">Evaluasi & pembahasan tuntas</h3>
          <p class="leading-[1.62] text-muted">
            Dapatkan analisis skor per subtes serta pembahasan rinci di setiap soal agar kamu tahu materi mana yang perlu ditingkatkan.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
