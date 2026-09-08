<script setup lang="ts">
/**
 * Kode QRIS statis Zenko beserta tombol simpannya.
 *
 * Dipisah dari ManualQrisCard supaya tagihan langganan bimbel memakai gambar,
 * ukuran, dan quiet zone yang persis sama — kalau dua permukaan menggambar QR
 * yang sama dengan dua cara, salah satunya cepat atau lambat berhenti terbaca
 * pemindai.
 */
</script>

<template>
  <div class="grid shrink-0 justify-items-center gap-3">
    <!-- Quiet zone diberikan lewat padding putih di sekeliling gambar, bukan
         di dalam file-nya, supaya kodenya tetap terbaca pemindai. -->
    <div class="rounded-sm bg-white p-4 shadow-xs">
      <img
        src="/pembayaran/qris-zenko.webp"
        alt="Kode QRIS Zenko Edukasi"
        width="458"
        height="458"
        class="h-48 w-48 object-contain sm:h-56 sm:w-56"
      >
    </div>
    <!-- Di bawah kodenya, karena inilah yang dilakukan orang saat membuka
         halaman ini dari HP: simpan gambarnya, lalu unggah di aplikasi
         banknya — kamera tidak bisa memindai layarnya sendiri. -->
    <a
      href="/pembayaran/qris-zenko-poster.jpg"
      download="QRIS-Zenko-Edukasi.jpg"
      class="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-hairline-strong bg-surface px-3.5 py-2 text-[0.84rem] font-semibold hover:bg-surface-sunken"
    >
      <AppIcon name="download-simple" :size="16" aria-hidden="true" />
      Simpan gambar QRIS
    </a>
  </div>
</template>
