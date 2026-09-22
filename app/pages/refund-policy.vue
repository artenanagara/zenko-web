<script setup lang="ts">
// English file name, Indonesian URL; `path` keeps circulating links alive.
definePageMeta({ path: '/kebijakan-refund' })

useSeoMeta({
  title: 'Kebijakan Refund | Zenko',
  description:
    'Kebijakan pengembalian dana Zenko untuk pembelian paket tryout: kapan refund berlaku, cara mengajukan, dan lama prosesnya.',
  ogTitle: 'Kebijakan Refund | Zenko',
  ogDescription:
    'Kebijakan pengembalian dana Zenko untuk pembelian paket tryout: kapan refund berlaku, cara mengajukan, dan lama prosesnya.',
  ...DEFAULT_OG,
  ogUrl: 'https://zenkoedu.id/kebijakan-refund',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/kebijakan-refund' }],
})
</script>

<template>
  <LegalDocument lead="Kebijakan" accent="Refund" updated="21 September 2026">
    <p>
      Kebijakan Refund ini menjelaskan kapan dan bagaimana kamu dapat
      mengajukan pengembalian dana atas pembelian paket tryout di Zenko.
      Kebijakan ini merupakan bagian dari
      <NuxtLink to="/ketentuan-layanan">Ketentuan Layanan</NuxtLink> Zenko dan
      dibaca bersama Bagian 8 (Pembatalan dan Pengembalian Dana) di dalamnya.
      Jika terdapat perbedaan, Ketentuan Layanan yang berlaku sebagai acuan utama.
    </p>

    <hr>

    <h2 id="kebijakan-umum">1. Kebijakan Umum</h2>
    <p>
      Paket tryout berbayar di Zenko memberikan akses digital secara instan
      begitu pembayaran berhasil dikonfirmasi. Karena akses diberikan langsung
      dan dapat langsung dikerjakan, pembelian pada dasarnya bersifat final
      setelah diakses dan tidak dapat dibatalkan hanya karena perubahan
      pikiran. Refund hanya dipertimbangkan untuk keadaan tertentu, yaitu:
    </p>
    <ul>
      <li>Pembayaran ganda (<em>double payment</em>) untuk paket dan akun yang sama;</li>
      <li>
        Kegagalan teknis di sisi Zenko yang membuat akses ke paket sama sekali
        tidak dapat diberikan, dan tidak terselesaikan dalam waktu yang wajar
        setelah dilaporkan;
      </li>
      <li>
        Isi paket secara material berbeda dari deskripsi yang ditampilkan pada
        saat pembelian.
      </li>
    </ul>
    <p>
      Di luar ketiga keadaan tersebut, permohonan refund umumnya tidak dapat
      disetujui — termasuk untuk salah memilih paket, ketidaklulusan atau nilai
      yang tidak sesuai harapan, maupun akun yang ditangguhkan karena
      pelanggaran Ketentuan Layanan. Rincian lengkap syarat dan pengecualian
      diatur pada Bagian 8 Ketentuan Layanan.
    </p>

    <hr>

    <h2 id="cara-mengajukan">2. Cara Mengajukan Refund</h2>
    <p>
      Kirim permohonan refund ke
      <a href="mailto:halo@zenkoedu.id">halo@zenkoedu.id</a>
      paling lambat <strong>7 hari kalender</strong> setelah pembayaran
      berhasil. Sertakan informasi berikut agar permohonan dapat ditinjau
      lebih cepat:
    </p>
    <ul>
      <li>Nomor invoice atau nomor pesanan;</li>
      <li>Email atau akun Zenko yang digunakan untuk membeli;</li>
      <li>Alasan pengajuan refund;</li>
      <li>Bukti pendukung yang relevan, misalnya tangkapan layar kegagalan akses.</li>
    </ul>

    <hr>

    <h2 id="peninjauan">3. Peninjauan dan Waktu Proses</h2>
    <p>
      Setiap permohonan ditinjau berdasarkan bukti yang disertakan dan status
      pesanan pada sistem Zenko. Untuk laporan kegagalan akses, kami akan
      terlebih dahulu berupaya memperbaikinya dalam <strong>3 Hari
      Kerja</strong> sejak dilaporkan, sebelum refund dipertimbangkan sebagai
      jalan keluar. Kami dapat meminta informasi tambahan untuk memverifikasi
      identitas pembeli dan keabsahan transaksi sebelum permohonan disetujui.
    </p>

    <hr>

    <h2 id="metode-pengembalian">4. Metode dan Waktu Pengembalian Dana</h2>
    <p>
      Refund yang disetujui dikembalikan ke kanal pembayaran asal melalui
      <strong>iPaymu</strong>, penyedia payment gateway Zenko, apabila kanal
      tersebut mendukung pengembalian dana. Jika tidak didukung, kami dapat
      meminta rekening bank atau dompet digital atas nama pembeli yang telah
      diverifikasi sebagai tujuan pengembalian dana.
    </p>
    <p>
      Setelah disetujui, pemrosesan umumnya memerlukan <strong>5&ndash;14 Hari
      Kerja</strong>, tidak termasuk keterlambatan dari bank atau penyedia
      pembayaran itu sendiri. Refund dapat diberikan penuh atau proporsional,
      sesuai bagian layanan yang benar-benar gagal diberikan.
    </p>

    <hr>

    <h2 id="pihak-terkait">5. Entitas dan Penyedia Pembayaran</h2>
    <p>
      Zenko dioperasikan oleh <strong>PT Zenko Edukasi Digital</strong>,
      sebuah perseroan terbatas yang berkedudukan di Klaten, Jawa Tengah,
      Indonesia. Pemrosesan pembayaran dan pengembalian dana pada Platform
      dilakukan melalui <strong>iPaymu</strong> sebagai penyedia payment
      gateway resmi Zenko.
    </p>

    <hr>

    <h2 id="hubungi-kami">6. Hubungi Kami</h2>
    <p>Pertanyaan seputar refund dapat disampaikan ke:</p>
    <ul>
      <li>
        <strong>Email</strong>:
        <a href="mailto:halo@zenkoedu.id">halo@zenkoedu.id</a>
      </li>
      <li>
        <strong>Telepon/WhatsApp</strong>:
        <a href="tel:+6288227663468">0882-2766-3468</a>
      </li>
    </ul>
    <p>
      Pertanyaan umum lain seputar Zenko dapat dilihat di
      <NuxtLink to="/pusat-bantuan">Pusat Bantuan</NuxtLink> atau
      <NuxtLink to="/faq">FAQ</NuxtLink>.
    </p>

    <template #related>
      <NuxtLink to="/ketentuan-layanan" class="font-semibold text-primary hover:underline">
        Ketentuan Layanan
      </NuxtLink>
      <NuxtLink to="/pusat-bantuan" class="font-semibold text-primary hover:underline">
        Pusat Bantuan
      </NuxtLink>
    </template>
  </LegalDocument>
</template>
