<script setup lang="ts">
// English file name, Indonesian URL — konvensi yang sama dengan
// become-tutor.vue (/jadi-tutor) dan packages/index.vue (/paket).
definePageMeta({ path: '/untuk-bimbel' })

/**
 * Landing marketing publik untuk pemilik bimbel.
 *
 * Sengaja tanpa `middleware: 'auth'` dan tanpa `noindex`: keputusan membeli di
 * sisi institusi dibuat oleh orang yang belum punya akun Zenko, jadi halaman
 * yang diiklankan header sebagai "Untuk Bimbel" harus bisa dibuka dan
 * diindeks tanpa akun. Formulir pengajuannya berdiri sendiri di
 * /untuk-bimbel/daftar, tempat login baru diminta.
 *
 * Semua klaim di halaman ini dibatasi pada yang benar-benar berjalan hari ini:
 * kelas, akses lewat keanggotaan, rekap hasil per paket, paket privat milik
 * bimbel, pengajuan paket ke katalog publik, kode bergabung, dan langganan
 * bertingkat dengan kursi terukur.
 * Yang belum ada — notifikasi email, impor CSV, bagi hasil bimbel ke tutor,
 * pembayaran otomatis — tidak disebut sebagai fitur.
 */
useSeoMeta({
  title: 'Zenko untuk Bimbel | Kelola Kelas dan Tryout Siswa',
  description:
    'Kelola siswa, kelas, dan bank soal tryout bimbelmu dalam satu tempat. Daftar tanpa menunggu persetujuan, coba 7 hari gratis, lalu mulai Rp75.000 per bulan sudah termasuk 25 kursi siswa.',
  ogTitle: 'Zenko untuk Bimbel | Kelola Kelas dan Tryout Siswa',
  ogDescription:
    'Kelola siswa, kelas, dan bank soal tryout bimbelmu dalam satu tempat. Daftar tanpa menunggu persetujuan, coba 7 hari gratis, lalu mulai Rp75.000 per bulan sudah termasuk 25 kursi siswa.',
  ogImage: 'https://zenkoedu.id/brand/zenko-lockup-horizontal-blue.png',
  ogUrl: 'https://zenkoedu.id/untuk-bimbel',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/untuk-bimbel' }],
})

const REGISTER_PATH = '/untuk-bimbel/daftar'

/** Empat kemampuan yang sudah berjalan di dashboard bimbel hari ini. */
const benefits = [
  {
    icon: 'users-three',
    title: 'Kelas dan roster siswa',
    description:
      'Kelompokkan siswa ke dalam kelas, lalu kelola siapa yang aktif dan siapa yang masih menunggu persetujuan.',
  },
  {
    icon: 'lock-simple-open',
    title: 'Akses terbuka selama jadi anggota',
    description:
      'Begitu siswa aktif di bimbelmu, seluruh bank soal privat bimbel bisa ia kerjakan kapan saja — tanpa perlu ditugaskan satu per satu.',
  },
  {
    icon: 'chart-bar',
    title: 'Hasil langsung terekap',
    description:
      'Tiap paket punya rekapnya sendiri: siapa saja yang sudah mengerjakan, skor terbaiknya, dan peringkatnya — tanpa merekap manual.',
  },
  {
    icon: 'folder-lock',
    title: 'Bank soal milik bimbelmu',
    description:
      'Pengajarmu menyusun paket atas nama bimbel dan hanya siswa bimbelmu yang bisa mengerjakannya. Paket privat tidak pernah muncul di katalog publik.',
  },
] as const

/** Empat langkah dari pengajuan sampai siswa pertama masuk. */
const steps = [
  {
    title: 'Daftarkan bimbelmu',
    description:
      'Isi formulir singkat: nama bimbel, kontak pengelola, dan perkiraan jumlah siswa.',
  },
  {
    title: 'Ruang bimbel langsung jadi',
    description:
      'Tidak ada antrean persetujuan. Begitu formulirnya terkirim, dashboard bimbelmu sudah bisa dibuka.',
  },
  {
    title: 'Undang siswamu',
    description:
      'Bagikan kode bergabung ke siswa, lalu aktifkan permintaan yang masuk dari dashboard.',
  },
  {
    title: 'Pilih kelas langganan',
    description:
      'Uji coba 7 hari untuk 25 siswa berjalan lebih dulu. Perpanjang dengan kelas dan kuota kursi yang kamu tentukan sendiri.',
  },
] as const

/**
 * Jawaban dibatasi pada perilaku yang bisa ditelusuri ke source: harga dan
 * kuota dari handler billing, kode bergabung dan undangan dari handler
 * keanggotaan, isolasi katalog dari filter visibility. Verifikasi pembayaran
 * yang masih manual disebut apa adanya — pemilik bimbel lebih baik tahu itu
 * sebelum mendaftar daripada menemukannya sendiri di tagihan pertama.
 */
const faqs = [
  {
    question: 'Berapa biaya berlangganan Zenko untuk bimbel?',
    answer:
      'Ada tiga tingkat: Kelas Dasar Rp75.000 per bulan sudah termasuk 25 kursi siswa, Kelas Pro Rp135.000 untuk 50 kursi, dan Kelas Institusi Rp375.000 untuk 150 kursi. Siswa di atas kursi yang sudah termasuk ditagih Rp3.000 per siswa per bulan di semua tingkat, dengan kelipatan kuota 5 kursi. Tidak ada biaya pendaftaran, dan satu tagihan bisa dibuat untuk maksimal 12 bulan sekaligus.',
  },
  {
    question: 'Apa untungnya membayar tahunan?',
    answer:
      'Langganan 12 bulan ditagih 10 bulan — hemat sekitar 17% dibanding membayar bulanan, dan berlaku di ketiga tingkat. Harganya tetap dihitung server saat tagihan dibuat, jadi yang kamu bayar sama dengan yang tertulis di invoice.',
  },
  {
    question: 'Apakah ada masa uji coba?',
    answer:
      'Ada. Begitu formulirnya terkirim, bimbelmu langsung mendapat 7 hari uji coba dengan kemampuan Kelas Pro untuk 25 siswa, tanpa biaya dan tanpa kartu kredit — cukup untuk menjalankan satu tryout dengan satu rombel yang sebenarnya.',
  },
  {
    question: 'Bagaimana cara membayar tagihannya?',
    answer:
      'Kamu membuat tagihan sendiri dari dashboard bimbel dengan memilih kuota kursi dan lama langganan. Saat ini pembayarannya diverifikasi manual oleh tim Zenko, dan langganan aktif setelah pembayaranmu kami terima.',
  },
  {
    question: 'Bagaimana siswa bergabung ke bimbel saya?',
    answer:
      'Ada dua jalan: bagikan kode bergabung bimbelmu, atau undang siswa lewat email akun Zenko yang sudah terdaftar. Keduanya masuk sebagai permintaan berstatus menunggu, dan hanya aktif setelah kamu menyetujuinya dari dashboard.',
  },
  {
    question: 'Apakah paket soal bimbel saya bisa dilihat orang lain?',
    answer:
      'Tidak. Paket yang dibuat atas nama bimbel bersifat privat dan tidak muncul di katalog, pencarian, maupun halaman paket publik Zenko. Yang bisa mengerjakannya hanya siswa yang tergabung di bimbelmu.',
  },
  {
    question: 'Bisakah bimbel saya menjual paketnya ke katalog Zenko?',
    answer:
      'Bisa. Paket yang sudah matang dapat diajukan ke katalog publik atas nama bimbelmu, dan tayang setelah lolos moderasi tim Zenko seperti paket tutor lainnya.',
  },
  {
    question: 'Berapa pengajar yang bisa saya libatkan?',
    answer:
      'Tergantung tingkat langganannya: Kelas Dasar sampai 3 pengajar, Kelas Pro sampai 10, dan Kelas Institusi tanpa batas. Pengajar dan admin tidak pernah dihitung sebagai kursi berlangganan — yang dihitung hanya siswa.',
  },
] as const

// Satu observer untuk section "Cara kerja"; tiap kartu lalu menjalankan
// --cycle sendiri.
//
// Section "Manfaat" sengaja tidak punya observer. Empat kartunya berisi
// kalimat yang menjelaskan produk, bukan yang memamerkannya, dan memunculkan
// mereka satu per satu membuat orang yang menggulung cepat membaca kartu yang
// masih setengah tampil — biaya yang tidak dibayar oleh apa pun.
const { target: stepRef, ready: stepReady, isInView: stepInView } = useInView(0.2)
void stepRef
</script>

<template>
  <main>
    <!-- ==================================================================
         1. Hero
         ================================================================== -->
    <section class="container-page pt-3 md:pt-5">
      <div
        class="dot-grid dot-grid-hero hero-aurora relative overflow-hidden rounded-[26px] px-5 pt-12 pb-16 md:rounded-xl md:px-10 md:pt-16 md:pb-20"
      >
        <div class="relative z-1 mx-auto max-w-190 text-center">
          <span
            class="mb-5 inline-flex items-center gap-2 rounded-pill border border-primary/20 bg-white/80 py-2 pr-4 pl-3 text-[0.82rem] font-semibold shadow-[0_2px_8px_rgba(47,111,235,0.06)] backdrop-blur-[6px]"
          >
            <span class="h-2 w-2 rounded-full bg-success shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" aria-hidden="true" />
            Uji coba 7 hari untuk 25 siswa
          </span>

          <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter">
            Ruang tryout
            <span class="text-accent mt-1 block">untuk bimbelmu sendiri</span>
          </h1>

          <p class="mx-auto mt-4 max-w-160 text-[1.02rem] text-muted">
            Kelola siswa, bagi mereka ke dalam kelas, dan buka bank soal tryout
            yang dinilai otomatis. Bimbelmu memakai mesin CBT yang sama dengan
            yang dipakai siswa Zenko, tanpa perlu membangun sistem sendiri.
          </p>

          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <AppButton :to="REGISTER_PATH" size="lg">Daftarkan bimbel</AppButton>
            <AppButton href="#harga" size="lg" variant="outline">Lihat harga</AppButton>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         2. Manfaat
         ================================================================== -->
    <section class="py-18 md:py-22" aria-labelledby="manfaat-bimbel-heading">
      <div class="container-page">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Yang kamu dapat
          </p>
          <h2 id="manfaat-bimbel-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Satu tempat untuk <span class="text-accent">seluruh latihan bimbelmu</span>
          </h2>
          <p class="mt-3.5 text-[1.02rem] text-muted">
            Bukan sekadar bank soal. Siswa, kelas, jadwal, dan hasilnya berada di
            ruang yang sama.
          </p>
        </div>

        <div class="mx-auto grid max-w-300 grid-cols-1 gap-5 rounded-4xl bg-surface-alt p-4 md:grid-cols-2 md:p-6">
          <article
            v-for="benefit in benefits"
            :key="benefit.title"
            class="flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift md:p-8"
          >
            <span
              class="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-linear-to-b from-primary-light to-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_rgba(47,111,235,0.22)]"
              aria-hidden="true"
            >
              <AppIcon :name="benefit.icon" :size="24" />
            </span>

            <h3 class="mt-6 mb-2.5 text-[1.28rem] font-bold tracking-[-0.03em]">
              {{ benefit.title }}
            </h3>
            <p class="leading-[1.62] text-muted">{{ benefit.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         3. Cara kerja
         ================================================================== -->
    <section
      ref="stepRef"
      class="py-18 md:py-22"
      :class="[stepReady && 'anim-ready', stepInView && 'is-inview']"
      aria-labelledby="cara-kerja-bimbel-heading"
    >
      <div class="container-page">
        <div class="mx-auto mb-12 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Cara kerja
          </p>
          <h2 id="cara-kerja-bimbel-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Empat langkah sampai <span class="text-accent">siswa pertama masuk</span>
          </h2>
        </div>

        <!-- Nomor langkah sengaja tidak beranimasi: itu isi, bukan hiasan,
             dan loop anim-* akan membuatnya hilang tiap siklus. -->
        <ol class="mx-auto grid max-w-300 gap-4 rounded-4xl bg-surface-alt p-4 md:grid-cols-2 md:p-6 xl:grid-cols-4">
          <li
            v-for="(step, index) in steps"
            :key="step.title"
            class="flex flex-col rounded-[26px] border border-hairline bg-surface p-6 shadow-xs"
          >
            <span
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-[13px] bg-linear-to-b from-primary-light to-primary font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_rgba(47,111,235,0.22)]"
              aria-hidden="true"
            >{{ index + 1 }}</span>
            <h3 class="mt-6 mb-2 text-[1.15rem] font-bold tracking-[-0.03em]">{{ step.title }}</h3>
            <p class="leading-[1.62] text-muted">{{ step.description }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- ==================================================================
         4. Harga
         ================================================================== -->
    <section id="harga" class="scroll-mt-24 border-t border-hairline py-18 md:py-22" aria-labelledby="harga-bimbel-heading">
      <div class="container-page">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Harga
          </p>
          <h2 id="harga-bimbel-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Tiga tingkat, <span class="text-accent">kursi tetap terukur</span>
          </h2>
          <p class="mt-3.5 text-[1.02rem] text-muted">
            Tiap tingkat sudah termasuk sejumlah kursi siswa, dan kelebihannya
            ditagih per siswa. Tanpa biaya pendaftaran — kamu memilih tingkat
            dan kuotanya sendiri saat membuat tagihan.
          </p>
        </div>

        <BimbelPricingPlans />
      </div>
    </section>

    <!-- ==================================================================
         5. FAQ

         Memakai <details> asli seperti /jadi-tutor: tetap bisa dibuka tanpa
         JavaScript dan sudah punya semantik expand/collapse untuk pembaca
         layar. AppAccordion milik design system disetel untuk kepadatan
         dashboard (text-xs), bukan untuk permukaan marketing.
         ================================================================== -->
    <section class="border-t border-hairline py-18 md:py-22" aria-labelledby="faq-bimbel-heading">
      <div class="container-page relative z-1">
        <div class="mx-auto mb-11 max-w-160 text-center">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            Pertanyaan umum
          </p>
          <h2 id="faq-bimbel-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Pertanyaan tentang <span class="text-accent">Zenko untuk bimbel</span>
          </h2>
        </div>

        <div class="mx-auto grid max-w-300 gap-3 rounded-4xl bg-surface-alt p-4 md:p-6">
          <details
            v-for="faq in faqs"
            :key="faq.question"
            name="faq-bimbel"
            class="group rounded-xl border border-hairline bg-surface px-5 py-4 shadow-xs transition-[box-shadow,border-color] duration-300 ease-smooth hover:shadow-lift open:shadow-lift md:px-6 md:py-5"
          >
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-4 font-bold tracking-[-0.02em] [&::-webkit-details-marker]:hidden"
            >
              {{ faq.question }}

              <span class="relative h-4 w-4 shrink-0" aria-hidden="true">
                <span class="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rounded-pill bg-primary" />
                <span
                  class="absolute top-0 left-1/2 h-4 w-0.5 -translate-x-1/2 rounded-pill bg-primary transition-[opacity,rotate] duration-300 ease-smooth group-open:rotate-90 group-open:opacity-0"
                />
              </span>
            </summary>

            <p class="mt-3 leading-[1.7] text-muted">{{ faq.answer }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         6. CTA penutup
         ================================================================== -->
    <section class="border-t border-hairline bg-surface-alt py-18 md:py-22" aria-labelledby="cta-bimbel-heading">
      <div class="container-page">
        <div class="mx-auto max-w-160 text-center">
          <h2 id="cta-bimbel-heading" class="text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.15] tracking-tighter">
            Mulai dari <span class="text-accent">uji coba 7 hari</span>
          </h2>
          <p class="mt-3.5 text-[1.02rem] text-muted">
            Daftarkan bimbelmu hari ini. Tanpa menunggu persetujuan — ruang
            bimbel langsung aktif untuk 25 siswa tanpa biaya.
          </p>
          <AppButton :to="REGISTER_PATH" size="lg" class="mt-8">Daftarkan bimbel</AppButton>
          <p class="mt-4 text-[0.86rem] text-muted">
            Sudah tergabung di sebuah bimbel?
            <NuxtLink to="/akun/bimbel" class="font-semibold text-primary hover:underline">
              Buka Bimbel saya
            </NuxtLink>
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
