<script setup lang="ts">
// English file name, Indonesian URL — the same convention faq.vue and
// about.vue follow. `/tka` is the query people actually type.
definePageMeta({ path: '/tka' })

/**
 * Halaman edukasi TKA. Dua pekerjaan sekaligus:
 *
 * 1. SEO — pencarian "TKA" memuncak Februari–April (SD/SMP) dan
 *    Agustus–Oktober (SMA). Halaman ini yang menangkapnya, bukan katalog.
 * 2. Kejujuran katalog — TKA sering disalahpahami sebagai "UTBK versi
 *    sekolah". Menjelaskan bentuk aslinya di sini membuat penamaan paket di
 *    /paket punya rujukan.
 *
 * Angka di halaman ini adalah blueprint resmi TKA 2026 dari Kemendikdasmen.
 * Sumber dan tingkat keyakinan tiap angka dicatat di
 * docs/plan-produk-tka-lengkap.md §12 — perbarui KEDUANYA bersamaan setiap
 * panduan resmi tahun baru terbit.
 */

const TITLE = 'Apa Itu TKA? Panduan Tes Kemampuan Akademik | Zenko'
const DESCRIPTION
  = 'Penjelasan lengkap Tes Kemampuan Akademik (TKA) Kemendikdasmen: mata pelajaran, '
    + 'jumlah soal, durasi, dan bentuk soal per jenjang SD, SMP, dan SMA/SMK — '
    + 'plus perannya di SPMB dan SNBP.'
const CANONICAL = 'https://zenkoedu.id/tka'

useSeoMeta({
  title: TITLE,
  description: DESCRIPTION,
  ogTitle: TITLE,
  ogDescription: DESCRIPTION,
  ogImage: 'https://zenkoedu.id/brand/zenko-lockup-horizontal-blue.png',
  ogUrl: CANONICAL,
  twitterCard: 'summary_large_image',
})

interface Paper {
  subject: string
  questions: string
  duration: string
}

interface Level {
  id: string
  title: string
  grade: string
  summary: string
  papers: Paper[]
  totals: string
  notes: string[]
}

const levels: Level[] = [
  {
    id: 'tka-sd',
    title: 'TKA SD / MI',
    grade: 'Kelas 6',
    summary:
      'Dua mata pelajaran, keduanya wajib, dikerjakan pada hari terpisah. Tidak ada mata pelajaran pilihan, '
      + 'dan tidak ada IPA maupun IPS — TKA SD mengukur literasi membaca dan numerasi.',
    papers: [
      { subject: 'Bahasa Indonesia (Literasi Membaca)', questions: '30 soal', duration: '75 menit' },
      { subject: 'Matematika (Numerasi)', questions: '30 soal', duration: '75 menit' },
    ],
    totals: '60 soal · 150 menit · 2 hari',
    notes: [
      'Dari 30 soal per mata pelajaran, 21 soal (70%) disusun pusat dan 9 soal (30%) disusun daerah — '
      + 'soal daerah biasanya memakai konteks lokal.',
      'Hasilnya jadi salah satu komponen SPMB untuk masuk SMP negeri.',
    ],
  },
  {
    id: 'tka-smp',
    title: 'TKA SMP / MTs',
    grade: 'Kelas 9',
    summary:
      'Bentuknya sama persis dengan TKA SD. Ini yang paling sering keliru: TKA SMP tidak menguji IPA, '
      + 'IPS, maupun Bahasa Inggris.',
    papers: [
      { subject: 'Bahasa Indonesia (Literasi Membaca)', questions: '30 soal', duration: '75 menit' },
      { subject: 'Matematika (Numerasi)', questions: '30 soal', duration: '75 menit' },
    ],
    totals: '60 soal · 150 menit · 2 hari',
    notes: [
      'Komposisi penyusun sama: 21 soal pusat + 9 soal daerah.',
      'Setengahnya — 15 dari 30 soal — adalah soal penguatan literasi/numerasi: berstimulus panjang, '
      + 'bukan soal hitung atau hafalan langsung.',
      'Dipakai sebagai komponen SPMB untuk masuk SMA/SMK negeri.',
    ],
  },
  {
    id: 'tka-sma',
    title: 'TKA SMA / MA / SMK',
    grade: 'Kelas 12',
    summary:
      'Tiga mata pelajaran wajib untuk semua peserta, ditambah dua mata pelajaran pilihan. '
      + 'Mulai 2026 hanya satu mata pelajaran per hari.',
    papers: [
      { subject: 'Bahasa Indonesia (Literasi Membaca)', questions: '30 soal', duration: '75 menit' },
      { subject: 'Bahasa Inggris', questions: '30 soal', duration: '75 menit' },
      { subject: 'Matematika (Numerasi)', questions: '25 soal', duration: '75 menit' },
      { subject: '2 mata pelajaran pilihan', questions: '25 soal / mapel', duration: '60 menit / mapel' },
    ],
    totals: '135 soal · 345 menit · 4 hari',
    notes: [
      'Matematika turun dari 30 soal (2025) menjadi 25 soal pada 2026, dengan durasi tetap 75 menit — '
      + 'jadi sekitar 3 menit per soal.',
      'Siswa SMA/MA memilih 2 mata pelajaran pilihan dari 19 opsi. Siswa SMK wajib mengambil '
      + '"Produk atau Projek Kreatif dan Kewirausahaan" sebagai pilihan pertama.',
    ],
  },
]

const electives = [
  { group: 'Lanjutan', items: ['Matematika Tingkat Lanjut', 'Bahasa Indonesia Tingkat Lanjut', 'Bahasa Inggris Tingkat Lanjut'] },
  { group: 'Sains', items: ['Fisika', 'Kimia', 'Biologi'] },
  { group: 'Sosial & Humaniora', items: ['Ekonomi', 'Sosiologi', 'Geografi', 'Sejarah', 'Antropologi', 'Pendidikan Pancasila'] },
  { group: 'Bahasa Asing', items: ['Bahasa Arab', 'Bahasa Jepang', 'Bahasa Korea', 'Bahasa Mandarin', 'Bahasa Prancis', 'Bahasa Jerman'] },
  { group: 'Vokasional', items: ['Produk atau Projek Kreatif dan Kewirausahaan'] },
]

const questionFormats = [
  {
    name: 'Pilihan ganda',
    detail: 'Satu jawaban benar dari 4 opsi (SD/SMP) atau 5 opsi (SMA).',
  },
  {
    name: 'Pilihan ganda kompleks — MCMA',
    detail: 'Lebih dari satu jawaban benar, dicentang. Penilaiannya bisa parsial.',
  },
  {
    name: 'Pilihan ganda kompleks — kategori',
    detail: 'Tabel pernyataan, setiap baris dinilai Benar atau Salah sendiri-sendiri.',
  },
  {
    name: 'Isian singkat',
    detail: 'Mengetik kata, frasa, angka, atau kalimat pendek — tidak bisa ditebak dari opsi.',
  },
]

const cognitiveLevels = [
  { code: 'L1', name: 'Pengetahuan & Pemahaman', detail: 'Mengenali konsep, istilah, dan fakta dasar.' },
  { code: 'L2', name: 'Aplikasi', detail: 'Menerapkan konsep atau prosedur pada situasi yang sudah dikenal.' },
  { code: 'L3', name: 'Penalaran', detail: 'Menganalisis grafik dan data, mengevaluasi klaim, memecahkan masalah non-rutin.' },
]

const faqs = [
  {
    question: 'Apa itu TKA?',
    answer:
      'TKA (Tes Kemampuan Akademik) adalah asesmen terstandar dari Kemendikdasmen yang melaporkan capaian '
      + 'akademik per individu murid. Berbeda dari Asesmen Nasional, yang mengukur mutu sekolah secara '
      + 'agregat, hasil TKA terbit atas nama siswa sebagai Sertifikat Hasil TKA (SHTKA).',
  },
  {
    question: 'Apa bedanya TKA dan SNBT/UTBK?',
    answer:
      'TKA adalah asesmen sekolah dari Kemendikdasmen; SNBT/UTBK adalah tes seleksi masuk PTN dari SNPMB. '
      + 'Materi, penyelenggara, dan waktunya berbeda. Nilai TKA dipakai di SNBP, bukan di SNBT.',
  },
  {
    question: 'Apakah nilai TKA dipakai untuk masuk PTN?',
    answer:
      'Di SNBP, ya — peserta SNBP wajib memiliki nilai TKA, yang berfungsi memvalidasi nilai rapor dari '
      + 'sekolah. Namun tidak semua PTN dan program studi mensyaratkannya dengan cara yang sama, jadi cek '
      + 'ketentuan kampus tujuanmu. Di SNBT, nilai TKA tidak dipakai.',
  },
  {
    question: 'Berapa bobot nilai TKA di SPMB?',
    answer:
      'Berbeda-beda per daerah, umumnya berkisar 25% sampai 50% dan digabung dengan nilai rapor. Banyak '
      + 'provinsi memakai komposisi rapor 60% dan TKA 40% untuk jalur prestasi akademik. Cek petunjuk '
      + 'teknis SPMB dinas pendidikan daerahmu untuk angka yang berlaku.',
  },
  {
    question: 'Bentuk soalnya seperti apa?',
    answer:
      'Pilihan ganda, pilihan ganda kompleks (model MCMA maupun model kategori/benar-salah), dan isian '
      + 'singkat. Hampir semuanya berstimulus — teks, tabel, grafik, atau infografik — dan diarahkan ke '
      + 'kemampuan berpikir tingkat tinggi, bukan hafalan.',
  },
  {
    question: 'Apakah TKA Saintek dan TKA Soshum itu ada?',
    answer:
      'Tidak. TKA tidak punya paket "Saintek" atau "Soshum": tidak ada siswa yang mengerjakan Matematika '
      + 'IPA, Fisika, Kimia, dan Biologi dalam satu sesi TKA. Yang ada adalah 2 mata pelajaran pilihan, '
      + 'masing-masing dikerjakan terpisah. Paket bernama "TKA Saintek" biasanya sebenarnya latihan ujian '
      + 'mandiri PTN.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
}

useHead({
  link: [{ rel: 'canonical', href: CANONICAL }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(faqJsonLd) }],
})
</script>

<template>
  <main>
    <!-- ==================================================================
         1. Hero
         ================================================================== -->
    <section class="container-page pt-3 md:pt-5">
      <div
        class="dot-grid dot-grid-hero hero-aurora relative overflow-hidden rounded-[26px] px-5 pt-12 pb-16 text-center md:rounded-xl md:px-10 md:pt-16 md:pb-20"
      >
        <div class="relative z-1 mx-auto max-w-160">
          <p class="mb-2 inline-block text-[0.76rem] font-bold tracking-widest text-primary uppercase">
            Panduan
          </p>
          <h1 class="text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.08] tracking-tighter">
            Apa itu TKA?
            <span class="text-accent mt-1 block">Tes Kemampuan Akademik</span>
          </h1>
          <p class="mx-auto mt-4 max-w-140 text-[1.02rem] text-muted">
            Asesmen terstandar dari Kemendikdasmen untuk kelas 6, 9, dan 12. Hasilnya
            ikut menentukan seleksi masuk SMP, SMA, dan perguruan tinggi negeri —
            berikut format resminya, jenjang per jenjang.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         2. Kenapa penting
         ================================================================== -->
    <section id="kenapa-penting" class="pt-18 md:pt-22" aria-labelledby="kenapa-penting-heading">
      <div class="container-page">
        <h2 id="kenapa-penting-heading" class="text-[1.6rem] font-bold tracking-[-0.03em] md:text-[2rem]">
          Kenapa TKA penting
        </h2>
        <p class="mt-3 max-w-160 text-muted">
          TKA bukan tes tambahan yang bisa diabaikan. Di tiga jenjang kelulusan, nilainya
          menempel langsung ke seleksi masuk sekolah atau kampus berikutnya.
        </p>

        <div class="mt-7 grid gap-4 md:grid-cols-3">
          <article class="rounded-lg border border-hairline bg-surface p-5">
            <p class="text-[0.76rem] font-bold tracking-widest text-primary uppercase">Kelas 6</p>
            <h3 class="mt-2 font-bold">Masuk SMP negeri</h3>
            <p class="mt-2 text-[0.92rem] leading-[1.7] text-muted">
              Nilai TKA jadi komponen SPMB bersama nilai rapor. Bobotnya berbeda per daerah,
              umumnya 25–50%.
            </p>
          </article>
          <article class="rounded-lg border border-hairline bg-surface p-5">
            <p class="text-[0.76rem] font-bold tracking-widest text-primary uppercase">Kelas 9</p>
            <h3 class="mt-2 font-bold">Masuk SMA / SMK negeri</h3>
            <p class="mt-2 text-[0.92rem] leading-[1.7] text-muted">
              Sama seperti jenjang SD. Banyak provinsi memakai komposisi rapor 60% dan
              TKA 40% untuk jalur prestasi akademik.
            </p>
          </article>
          <article class="rounded-lg border border-hairline bg-surface p-5">
            <p class="text-[0.76rem] font-bold tracking-widest text-primary uppercase">Kelas 12</p>
            <h3 class="mt-2 font-bold">SNBP ke PTN</h3>
            <p class="mt-2 text-[0.92rem] leading-[1.7] text-muted">
              Peserta SNBP wajib punya nilai TKA — fungsinya memvalidasi nilai rapor dari
              sekolah. Tidak dipakai di SNBT.
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         3. Format per jenjang
         ================================================================== -->
    <section
      v-for="level in levels"
      :id="level.id"
      :key="level.id"
      class="pt-14 md:pt-16"
      :aria-labelledby="`${level.id}-heading`"
    >
      <div class="container-page">
        <p class="text-[0.76rem] font-bold tracking-widest text-primary uppercase">{{ level.grade }}</p>
        <h2 :id="`${level.id}-heading`" class="mt-1 text-[1.6rem] font-bold tracking-[-0.03em] md:text-[2rem]">
          {{ level.title }}
        </h2>
        <p class="mt-3 max-w-160 text-muted">{{ level.summary }}</p>

        <!-- Tabel selalu punya pembungkus yang bisa digulung sendiri supaya
             halaman tidak ikut melar di layar sempit. -->
        <div class="mt-6 overflow-x-auto rounded-lg border border-hairline">
          <table class="w-full min-w-120 border-collapse bg-surface text-left">
            <thead>
              <tr class="border-b border-line bg-surface-alt/50">
                <th scope="col" class="px-5 py-3 text-[0.86rem] font-bold">Mata pelajaran</th>
                <th scope="col" class="px-5 py-3 text-[0.86rem] font-bold">Jumlah soal</th>
                <th scope="col" class="px-5 py-3 text-[0.86rem] font-bold">Durasi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="paper in level.papers" :key="paper.subject" class="border-b border-hairline last:border-0">
                <td class="px-5 py-3.5 font-semibold">{{ paper.subject }}</td>
                <td class="px-5 py-3.5 tabular-nums text-muted">{{ paper.questions }}</td>
                <td class="px-5 py-3.5 tabular-nums text-muted">{{ paper.duration }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t border-line bg-surface-alt/50">
                <td class="px-5 py-3 text-[0.88rem] font-bold" colspan="3">Total: {{ level.totals }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <ul class="mt-4 grid max-w-160 gap-2">
          <li v-for="note in level.notes" :key="note" class="flex items-start gap-2.5 text-[0.92rem] leading-[1.7] text-muted">
            <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            {{ note }}
          </li>
        </ul>
      </div>
    </section>

    <!-- ==================================================================
         4. Mata pelajaran pilihan SMA
         ================================================================== -->
    <section id="mapel-pilihan" class="pt-14 md:pt-16" aria-labelledby="mapel-pilihan-heading">
      <div class="container-page">
        <h2 id="mapel-pilihan-heading" class="text-[1.6rem] font-bold tracking-[-0.03em] md:text-[2rem]">
          19 mata pelajaran pilihan SMA/MA
        </h2>
        <p class="mt-3 max-w-160 text-muted">
          Siswa memilih dua. Masing-masing 25 soal dalam 60 menit, dikerjakan terpisah —
          bukan digabung jadi satu paket "Saintek" atau "Soshum".
        </p>

        <div class="mt-7 grid gap-4 min-[560px]:grid-cols-2 min-[901px]:grid-cols-3">
          <article v-for="group in electives" :key="group.group" class="rounded-lg border border-hairline bg-surface p-5">
            <h3 class="text-[0.76rem] font-bold tracking-widest text-primary uppercase">{{ group.group }}</h3>
            <ul class="mt-3 grid gap-1.5">
              <li v-for="item in group.items" :key="item" class="text-[0.92rem] text-muted">{{ item }}</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         5. Bentuk soal & level kognitif
         ================================================================== -->
    <section id="bentuk-soal" class="pt-14 md:pt-16" aria-labelledby="bentuk-soal-heading">
      <div class="container-page grid gap-10 min-[901px]:grid-cols-2">
        <div>
          <h2 id="bentuk-soal-heading" class="text-[1.6rem] font-bold tracking-[-0.03em] md:text-[2rem]">
            Bentuk soal
          </h2>
          <p class="mt-3 text-muted">
            Hampir semua soal berstimulus — teks, tabel, grafik, atau infografik — dan
            menuntut penalaran, bukan hafalan.
          </p>
          <dl class="mt-6 grid gap-4">
            <div v-for="format in questionFormats" :key="format.name" class="rounded-lg border border-hairline bg-surface p-4">
              <dt class="font-bold">{{ format.name }}</dt>
              <dd class="mt-1.5 text-[0.92rem] leading-[1.7] text-muted">{{ format.detail }}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 class="text-[1.6rem] font-bold tracking-[-0.03em] md:text-[2rem]">Level kognitif</h2>
          <p class="mt-3 text-muted">
            Setiap mata pelajaran dinilai pada tiga level. Rapor hasil TKA memecah
            penguasaanmu ke ketiganya, jadi kamu tahu bukan cuma berapa nilainya, tapi
            jenis berpikir mana yang masih lemah.
          </p>
          <dl class="mt-6 grid gap-4">
            <div v-for="level in cognitiveLevels" :key="level.code" class="rounded-lg border border-hairline bg-surface p-4">
              <dt class="flex items-center gap-2.5 font-bold">
                <span class="rounded-pill bg-primary-soft px-2.5 py-0.5 text-[0.78rem] font-bold text-primary">
                  {{ level.code }}
                </span>
                {{ level.name }}
              </dt>
              <dd class="mt-1.5 text-[0.92rem] leading-[1.7] text-muted">{{ level.detail }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         6. FAQ
         ================================================================== -->
    <section id="faq-tka" class="pt-14 md:pt-16" aria-labelledby="faq-tka-heading">
      <div class="container-page">
        <h2 id="faq-tka-heading" class="text-[1.6rem] font-bold tracking-[-0.03em] md:text-[2rem]">
          Pertanyaan yang sering muncul
        </h2>

        <div class="mt-7 grid max-w-180 gap-3">
          <details
            v-for="item in faqs"
            :key="item.question"
            name="faq-tka"
            class="group rounded-lg border border-hairline bg-surface px-5 py-4"
          >
            <summary class="flex cursor-pointer items-start justify-between gap-4 font-semibold">
              {{ item.question }}
              <AppIcon
                name="caret-down"
                :size="18"
                class="mt-0.5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <p class="mt-3 leading-[1.75] text-muted">{{ item.answer }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         7. Sumber & CTA
         ================================================================== -->
    <section class="pt-14 pb-4 md:pt-16" aria-labelledby="sumber-heading">
      <div class="container-page">
        <div class="rounded-lg border border-hairline bg-surface-alt/40 p-6 md:p-8">
          <h2 id="sumber-heading" class="text-[1.2rem] font-bold tracking-[-0.03em]">
            Sebelum kamu mendaftar
          </h2>
          <p class="mt-3 max-w-160 leading-[1.75] text-muted">
            Format TKA berubah antar tahun — jumlah soal Matematika SMA saja sudah turun dari
            30 ke 25 antara 2025 dan 2026. Angka di halaman ini mengikuti panduan resmi 2026.
            Untuk jadwal, pendaftaran, dan ketentuan terbaru, selalu cek
            <a
              href="https://tka.kemendikdasmen.go.id"
              target="_blank"
              rel="noopener noreferrer"
              class="font-semibold text-primary hover:underline"
            >tka.kemendikdasmen.go.id</a>
            dan pengumuman dari sekolahmu.
          </p>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <AppButton to="/paket?q=TKA" size="sm">Lihat paket latihan TKA</AppButton>
            <AppButton to="/faq" variant="outline" size="sm">FAQ Zenko</AppButton>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
