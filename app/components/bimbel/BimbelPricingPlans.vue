<script setup lang="ts">
/**
 * Harga langganan bimbel di halaman marketing publik.
 *
 * Angka di sini digandakan dari `docs/konsep-bimbel-agency.md` §4 dan dari
 * konstanta di zenko-api (`internal/handler/bimbel_billing.go`). Backend
 * memegang aturannya lewat endpoint quote, tapi quote hidup di
 * `/bimbel/:id/billing/quote` dan butuh bimbel yang sudah ada — pengunjung
 * anonim belum punya satu pun, jadi halaman ini tidak punya sumber lain selain
 * salinan ini. Di dalam dashboard, tidak satu angka pun disalin: halaman
 * langganan merender `/billing/plans` dan `/billing/quote`.
 *
 * TODO(tahap berikutnya): sediakan endpoint harga publik (mis.
 * `GET /bimbel-pricing`) lalu render dari sana, supaya salinan ini tidak bisa
 * lagi menyimpang dari harga sebenarnya.
 *
 * Yang sengaja TIDAK dicantumkan: bagi hasil per tingkat, halaman publik
 * bimbel, kode akses batch, dan analitik per-subtes. Keempatnya sempat
 * dirancang sebagai pembeda tingkat, tapi belum ada implementasinya —
 * dan tingkat langganan yang menjanjikan fitur fiktif adalah versi berbayar
 * dari kesalahan yang sama seperti tombol "Tahunan" yang tidak menghemat apa
 * pun (§4).
 */

/**
 * Empat dimensi yang benar-benar bisa ditegakkan server hari ini: kursi sudah
 * jadi dasar billing, pengajar dihitung dari anggota ber-role ≥ teacher, dan
 * bank soal dari produk milik bimbel.
 *
 * Harga tahunan ditulis sebagai angka tersendiri, bukan hasil kali harga
 * bulanan. Aturannya memang "12 bulan ditagih 10 bulan", jadi mengalikannya di
 * sini akan benar hari ini — tapi berkas ini sudah menyalin angka dari backend,
 * dan salinan yang ikut membawa rumusnya berarti dua hal yang bisa menyimpang,
 * bukan satu. Di dalam dashboard tidak satu pun dari keduanya disalin: harga
 * dan potongannya sama-sama datang dari endpoint quote.
 */
/** Berlaku sama di ketiga tingkat, jadi ditulis sekali lalu disebar. */
const SHARED_FEATURES = [
  'Kursi tambahan Rp3.000 / siswa / bulan',
  'Kelas, roster siswa, dan rekap hasil per paket',
  // Bagi hasil TIDAK berbeda per tingkat. Sempat dirancang begitu, tapi server
  // memakai satu angka untuk semua penjual (tutorSharePercent = 70), jadi
  // menuliskannya berbeda per tingkat berarti menjual pembeda yang tidak
  // ditegakkan siapa pun. Kalau suatu hari ia benar-benar bertingkat, baris ini
  // pindah ke masing-masing TIERS di bawah.
  'Bagi hasil 70% dari penjualan paket di marketplace',
] as const

const TIERS = [
  {
    plan: 'Kelas Dasar',
    monthly: 'Rp75.000',
    yearly: 'Rp750.000',
    features: ['25 kursi siswa termasuk', '3 pengajar', '10 paket bank soal privat'],
    badge: '',
  },
  {
    plan: 'Kelas Pro',
    monthly: 'Rp135.000',
    yearly: 'Rp1.350.000',
    features: ['50 kursi siswa termasuk', '10 pengajar', 'Bank soal privat tak terbatas'],
    badge: 'Paling dipilih',
  },
  {
    plan: 'Kelas Institusi',
    monthly: 'Rp375.000',
    yearly: 'Rp3.750.000',
    features: ['150 kursi siswa termasuk', 'Pengajar tak terbatas', 'Bank soal privat tak terbatas'],
    badge: '',
  },
] as const

function featuresFor(tier: typeof TIERS[number]): string[] {
  // Yang membedakan tingkat lebih dulu, yang sama di semua tingkat menyusul:
  // pembaca membandingkan tiga kolom baris per baris, dan baris yang identik di
  // ketiganya tidak membantu perbandingan itu — ia cuma menahan mata sebelum
  // sampai ke yang berbeda.
  return [...tier.features, ...SHARED_FEATURES]
}

/**
 * Periode yang sedang ditampilkan. Bulanan yang aktif saat halaman dibuka:
 * angka terkecil dulu, lalu tahunan sebagai penawaran — bukan sebaliknya, yang
 * akan membuat harga pertama yang dilihat pengunjung sepuluh kali lipat dari
 * yang ia kira.
 */
const period = ref<1 | 12>(1)

/** Selisih 12 bulan masa aktif dan 10 bulan yang ditagih, disalin dari §4. */
const FREE_MONTHS = 2

const priceNote = computed(() => (period.value === 12 ? 'per tahun' : 'per bulan'))
const priceFootnote = computed(() => (period.value === 12 ? 'Ditagih 10 bulan untuk 12 bulan' : ''))
</script>

<template>
  <div class="mx-auto grid max-w-220 gap-5">
    <!-- Tiga tingkat. Kartu, bukan tabel perbandingan: di 390px tabel empat
         kolom hanya bisa dibaca dengan menggulung ke samping, dan kolom yang
         terpotong justru kolom tingkat teratas. -->
    <div class="flex justify-center">
      <BimbelBillingToggle v-model="period">
        <template #note>
          <AppLozenge appearance="success">Gratis {{ FREE_MONTHS }} bulan</AppLozenge>
        </template>
      </BimbelBillingToggle>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <BimbelPlanCard
        v-for="tier in TIERS"
        :key="tier.plan"
        :name="tier.plan"
        price-lead="Mulai dari"
        :price="period === 12 ? tier.yearly : tier.monthly"
        :price-note="priceNote"
        :price-footnote="priceFootnote"
        :features="featuresFor(tier)"
        :badge="tier.badge"
        badge-tone="brand"
        action-to="/untuk-bimbel/daftar"
        action-label="Daftarkan bimbel"
        :action-variant="tier.badge ? 'primary' : 'light'"
      />
    </div>
  </div>
</template>
