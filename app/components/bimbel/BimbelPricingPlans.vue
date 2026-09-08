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
const TIERS = [
  {
    plan: 'Langganan Dasar',
    monthly: 'Rp75.000',
    yearly: 'Rp750.000',
    for: 'Satu program atau kelas pertama.',
    features: ['25 kursi siswa termasuk', '3 pengajar', '10 paket bank soal privat'],
    badge: '',
  },
  {
    plan: 'Langganan Pro',
    monthly: 'Rp135.000',
    yearly: 'Rp1.350.000',
    for: 'Beberapa kelas dengan tim pengajar.',
    features: ['50 kursi siswa termasuk', '10 pengajar', 'Bank soal privat tak terbatas'],
    badge: 'Paling dipilih',
  },
  {
    plan: 'Langganan Institusi',
    monthly: 'Rp375.000',
    yearly: 'Rp3.750.000',
    for: 'Lembaga dengan banyak angkatan.',
    features: ['150 kursi siswa termasuk', 'Pengajar tak terbatas', 'Bank soal privat tak terbatas'],
    badge: '',
  },
] as const

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

const FACTS = [
  { icon: 'users-three', label: 'Kursi tambahan', value: 'Rp3.000 / siswa / bulan' },
  { icon: 'plus-circle', label: 'Kelipatan kuota', value: '5 kursi' },
  { icon: 'calendar-check', label: 'Masa tagihan', value: 'maksimal 12 bulan' },
] as const
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
        :description="tier.for"
        :features="[...tier.features]"
        :badge="tier.badge"
        badge-tone="brand"
        action-to="/untuk-bimbel/daftar"
        action-label="Daftarkan bimbel"
        :action-variant="tier.badge ? 'primary' : 'light'"
      />
    </div>

    <!-- Dua aturan yang berlaku sama di ketiga tingkat, jadi tidak diulang di
         tiap kartu: kursi di atas kuota, dan potongan tahunan. -->
    <div class="grid gap-6 rounded-[26px] border border-hairline bg-surface p-6 md:grid-cols-[1.1fr_0.9fr] md:p-9">
      <div>
        <p class="text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
          Tumbuh melewati kuota
        </p>
        <p class="mt-3 leading-[1.7] text-muted">
          Siswa di atas kursi yang sudah termasuk ditagih
          <b class="font-semibold text-ink">Rp3.000 per siswa per bulan</b> di semua
          tingkat. Tidak ada biaya pendaftaran dan tidak ada biaya kelas —
          tagihannya kamu buat sendiri dari dashboard bimbel.
        </p>

        <ul class="mt-6 grid gap-3">
          <li v-for="fact in FACTS" :key="fact.label" class="flex items-center gap-3">
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
              <AppIcon :name="fact.icon" :size="18" aria-hidden="true" />
            </span>
            <span class="text-[0.94rem]">
              <span class="text-muted">{{ fact.label }}:</span>
              <b class="ml-1 font-semibold">{{ fact.value }}</b>
            </span>
          </li>
        </ul>
      </div>

      <!-- Contoh perhitungan memakai tingkat terkecil dengan kelebihan kursi,
           pertanyaan yang paling sering datang dari bimbel yang sedang tumbuh:
           Rp75.000 + 10 × Rp3.000 = Rp105.000 per bulan. -->
      <div class="rounded-[20px] bg-surface-sunken p-6">
        <p class="text-[0.78rem] font-bold tracking-widest text-faint uppercase">
          Contoh tagihan
        </p>
        <dl class="mt-4 grid gap-3 text-[0.92rem]">
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-muted">Langganan Dasar</dt>
            <dd class="font-semibold">Rp75.000</dd>
          </div>
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-muted">35 siswa (10 kursi tambahan)</dt>
            <dd class="font-semibold">Rp30.000</dd>
          </div>
          <div class="flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <dt class="font-semibold">Total per bulan</dt>
            <dd class="text-[1.15rem] font-extrabold tracking-[-0.03em] text-primary">Rp105.000</dd>
          </div>
        </dl>
        <p class="mt-4 text-[0.84rem] leading-[1.7] text-muted">
          Harga akhir selalu dihitung ulang oleh server saat tagihan dibuat, jadi
          yang kamu bayar sama dengan yang tertulis di invoice.
        </p>
      </div>
    </div>

    <AppSectionMessage appearance="discovery" title="Uji coba 14 hari, 50 kursi">
      Begitu pengajuanmu disetujui, ruang bimbel langsung aktif selama 14 hari
      dengan kemampuan Langganan Pro untuk 50 siswa. Tanpa kartu kredit dan
      tanpa tagihan di muka — cukup untuk menjalankan satu try out dengan
      angkatan yang sebenarnya.
    </AppSectionMessage>
  </div>
</template>
