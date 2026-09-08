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
 */
const TIERS = [
  {
    plan: 'Langganan Dasar',
    price: 'Rp75.000',
    for: 'Satu program atau kelas pertama.',
    seats: '25 kursi siswa',
    teachers: '3 pengajar',
    products: '10 paket bank soal privat',
    highlight: false,
  },
  {
    plan: 'Langganan Pro',
    price: 'Rp135.000',
    for: 'Beberapa kelas dengan tim pengajar.',
    seats: '50 kursi siswa',
    teachers: '10 pengajar',
    products: 'Bank soal privat tak terbatas',
    highlight: true,
  },
  {
    plan: 'Langganan Institusi',
    price: 'Rp375.000',
    for: 'Lembaga dengan banyak angkatan.',
    seats: '150 kursi siswa',
    teachers: 'Pengajar tak terbatas',
    products: 'Bank soal privat tak terbatas',
    highlight: false,
  },
] as const

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
    <div class="grid gap-4 md:grid-cols-3">
      <div
        v-for="tier in TIERS"
        :key="tier.plan"
        class="flex flex-col rounded-[22px] border bg-surface p-6 shadow-xs"
        :class="tier.highlight ? 'border-primary/40 shadow-lift' : 'border-hairline'"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
            {{ tier.plan }}
          </p>
          <AppLozenge v-if="tier.highlight" appearance="new">Paling dipilih</AppLozenge>
        </div>

        <p class="mt-3 flex flex-wrap items-baseline gap-x-1.5">
          <b class="text-[1.9rem] leading-none font-extrabold tracking-tighter">{{ tier.price }}</b>
          <span class="text-[0.9rem] font-semibold text-muted">/ bulan</span>
        </p>
        <p class="mt-2 text-[0.9rem] leading-[1.6] text-muted">{{ tier.for }}</p>

        <ul class="mt-5 grid gap-2.5 border-t border-hairline pt-5 text-[0.92rem]">
          <li class="flex items-start gap-2.5">
            <AppIcon name="users-three" :size="17" class="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <span><b class="font-semibold">{{ tier.seats }}</b> sudah termasuk</span>
          </li>
          <li class="flex items-start gap-2.5">
            <AppIcon name="chalkboard-teacher" :size="17" class="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <span>{{ tier.teachers }}</span>
          </li>
          <li class="flex items-start gap-2.5">
            <AppIcon name="folder-lock" :size="17" class="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <span>{{ tier.products }}</span>
          </li>
        </ul>
      </div>
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

    <AppSectionMessage appearance="success" title="Bayar tahunan: 10 bulan untuk 12">
      Langganan 12 bulan ditagih 10 bulan, di semua tingkat — hemat sekitar 17%
      dibanding membayar bulanan.
    </AppSectionMessage>

    <AppSectionMessage appearance="discovery" title="Uji coba 14 hari, 50 kursi">
      Begitu pengajuanmu disetujui, ruang bimbel langsung aktif selama 14 hari
      dengan kemampuan Langganan Pro untuk 50 siswa. Tanpa kartu kredit dan
      tanpa tagihan di muka — cukup untuk menjalankan satu try out dengan
      angkatan yang sebenarnya.
    </AppSectionMessage>
  </div>
</template>
