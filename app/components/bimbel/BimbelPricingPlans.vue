<script setup lang="ts">
/**
 * Harga langganan bimbel di halaman marketing publik.
 *
 * Angka di sini digandakan dari konstanta di zenko-api
 * (`internal/handler/bimbel_billing.go`: seatPricePerMonth 3.000,
 * minSeatQuota 25, seatQuotaStep 5, maxSeatQuota 2.000,
 * maxSubscriptionMonths 12, trialDays 14, trialSeatQuota 50). Backend memegang
 * aturannya lewat endpoint quote, tapi quote hidup di
 * `/bimbel/:id/billing/quote` dan butuh bimbel yang sudah ada — pengunjung
 * anonim belum punya satu pun, jadi halaman ini tidak punya sumber lain selain
 * salinan ini.
 *
 * TODO(tahap berikutnya): sediakan endpoint harga publik (mis.
 * `GET /bimbel-pricing`) lalu render dari sana, supaya salinan ini tidak bisa
 * lagi menyimpang dari harga sebenarnya.
 *
 * TODO(tahap berikutnya): tabel tingkat langganan Dasar/Pro/Institusi
 * (docs/konsep-bimbel-agency.md §4) masuk di slot `#tiers` di bawah. Slot itu
 * sengaja dibiarkan kosong: `bimbel_subscriptions` belum menyimpan `plan` atau
 * `included_seats`, dan `subscriptionAmount` masih linear
 * (`seatQuota × 3000 × months`). Menampilkan tabel tingkatan sekarang berarti
 * menjual kemampuan dan harga yang belum bisa ditagih backend.
 */
const FACTS = [
  { icon: 'users-three', label: 'Kuota minimum', value: '25 siswa' },
  { icon: 'plus-circle', label: 'Kelipatan kuota', value: '5 siswa' },
  { icon: 'calendar-check', label: 'Masa tagihan', value: 'maksimal 12 bulan' },
] as const
</script>

<template>
  <div class="mx-auto grid max-w-220 gap-5">
    <!-- Kartu harga: satu angka, satu contoh perhitungan. -->
    <div class="grid gap-6 rounded-[26px] border border-hairline bg-surface p-6 shadow-xs md:grid-cols-[1.1fr_0.9fr] md:p-9">
      <div>
        <p class="text-[0.76rem] font-bold tracking-[0.12em] text-primary uppercase">
          Langganan per kursi
        </p>
        <p class="mt-3 flex flex-wrap items-baseline gap-x-2">
          <b class="text-[clamp(2.2rem,4vw,3rem)] leading-none font-extrabold tracking-tighter">Rp3.000</b>
          <span class="text-[1rem] font-semibold text-muted">/ siswa / bulan</span>
        </p>
        <p class="mt-4 leading-[1.7] text-muted">
          Tidak ada biaya pendaftaran dan tidak ada biaya kelas. Kamu membayar
          kuota kursi yang dipakai siswamu, dan tagihannya dibuat sendiri dari
          dashboard bimbel.
        </p>

        <ul class="mt-6 grid gap-3">
          <li v-for="fact in FACTS" :key="fact.label" class="flex items-center gap-3">
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
              <AppIcon :name="fact.icon" :size="18" />
            </span>
            <span class="text-[0.94rem]">
              <span class="text-muted">{{ fact.label }}:</span>
              <b class="ml-1 font-semibold">{{ fact.value }}</b>
            </span>
          </li>
        </ul>
      </div>

      <!-- Contoh perhitungan memakai kuota minimum, angka yang paling sering
           ditanyakan bimbel kecil. 25 × Rp3.000 = Rp75.000 per bulan. -->
      <div class="rounded-[20px] bg-surface-sunken p-6">
        <p class="text-[0.78rem] font-bold tracking-widest text-faint uppercase">
          Contoh tagihan
        </p>
        <dl class="mt-4 grid gap-3 text-[0.92rem]">
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-muted">Kuota kursi</dt>
            <dd class="font-semibold">25 siswa</dd>
          </div>
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-muted">Masa langganan</dt>
            <dd class="font-semibold">1 bulan</dd>
          </div>
          <div class="flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <dt class="font-semibold">Total</dt>
            <dd class="text-[1.15rem] font-extrabold tracking-[-0.03em] text-primary">Rp75.000</dd>
          </div>
        </dl>
        <p class="mt-4 text-[0.84rem] leading-[1.7] text-muted">
          Harga akhir selalu dihitung ulang oleh server saat tagihan dibuat, jadi
          yang kamu bayar sama dengan yang tertulis di invoice.
        </p>
      </div>
    </div>

    <!-- Tabel tingkat langganan masuk di sini. Lihat TODO di <script>. -->
    <slot name="tiers" />

    <AppSectionMessage appearance="discovery" title="Uji coba 14 hari, 50 kursi">
      Begitu pengajuanmu disetujui, ruang bimbel langsung aktif selama 14 hari
      untuk 50 siswa. Tanpa kartu kredit dan tanpa tagihan di muka — cukup untuk
      menjalankan satu try out dengan angkatan yang sebenarnya.
    </AppSectionMessage>
  </div>
</template>
