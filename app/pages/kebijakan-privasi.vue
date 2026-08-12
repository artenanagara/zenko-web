<script setup lang="ts">
/**
 * Kebijakan Privasi.
 *
 * Placeholders wrapped in <span class="legal-todo"> must be filled before
 * this page goes live: tanggal berlaku, email kontak, alamat perusahaan.
 */
useHead({
  title: 'Kebijakan Privasi — Zenko',
  meta: [
    {
      name: 'description',
      content:
        'Bagaimana Zenko mengumpulkan, menggunakan, membagikan, dan melindungi data pribadi pengguna sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.',
    },
  ],
})

const sharing = [
  {
    party: 'Payment gateway (Midtrans/Xendit)',
    purpose: 'Memproses pembayaran dan pencairan dana ke tutor',
  },
  {
    party: 'Penyedia layanan cloud (mis. Cloudflare R2)',
    purpose: 'Penyimpanan file paket soal dan gambar jawaban secara aman',
  },
  {
    party: 'Tutor pembuat paket',
    purpose: 'Melihat jawaban siswa untuk keperluan penilaian manual (esai/upload gambar)',
  },
  {
    party: 'Otoritas hukum',
    purpose: 'Jika diwajibkan oleh hukum, perintah pengadilan, atau proses hukum lain yang sah',
  },
]
</script>

<template>
  <LegalDocument lead="Kebijakan" accent="Privasi">
    <p>
      Zenko (&ldquo;kami&rdquo;) mengelola platform marketplace persiapan ujian yang
      menghubungkan tutor/pembuat konten dengan siswa (SKD/CPNS, BUMN, SNBT, TKA,
      dan kategori lainnya). Kebijakan Privasi ini menjelaskan bagaimana kami
      mengumpulkan, menggunakan, membagikan, dan melindungi data pribadi Anda saat
      menggunakan situs dan layanan Zenko, sesuai dengan Undang-Undang No. 27 Tahun
      2022 tentang Pelindungan Data Pribadi (UU PDP).
    </p>
    <p>
      Dengan menggunakan Zenko, Anda menyetujui praktik yang dijelaskan dalam
      kebijakan ini.
    </p>

    <hr>

    <h2 id="informasi-yang-dikumpulkan">1. Informasi yang Kami Kumpulkan</h2>

    <h3>a. Informasi yang Anda berikan langsung</h3>
    <ul>
      <li>
        <strong>Data akun</strong>: nama lengkap, alamat email, nomor telepon, kata
        sandi (tersimpan terenkripsi)
      </li>
      <li>
        <strong>Data profil tutor</strong> (jika Anda mendaftar sebagai tutor/penjual):
        nama tampilan, foto profil, deskripsi/bio, informasi rekening bank untuk
        pencairan dana
      </li>
      <li>
        <strong>Konten yang diunggah</strong>: paket soal, jawaban esai, gambar jawaban
        yang diunggah siswa untuk penilaian
      </li>
      <li>
        <strong>Komunikasi</strong>: pesan yang Anda kirim ke tim dukungan Zenko,
        ulasan/rating yang Anda tulis
      </li>
    </ul>

    <h3>b. Informasi yang dikumpulkan otomatis</h3>
    <ul>
      <li>
        <strong>Data penggunaan</strong>: halaman yang dikunjungi, paket yang
        dilihat/dibeli, waktu pengerjaan soal, skor dan riwayat hasil ujian
      </li>
      <li>
        <strong>Data perangkat</strong>: jenis perangkat, sistem operasi, jenis browser,
        alamat IP
      </li>
      <li>
        <strong>Cookies dan teknologi serupa</strong>: untuk menjaga sesi login,
        mengingat preferensi, dan analitik penggunaan (lihat
        <a href="#cookies">Bagian 7</a>)
      </li>
    </ul>

    <h3>c. Informasi dari pihak ketiga</h3>
    <ul>
      <li>
        <strong>Data transaksi pembayaran</strong> dari payment gateway (mis.
        Midtrans/Xendit) — Zenko tidak menyimpan nomor kartu kredit/debit atau data
        rekening secara langsung; data tersebut diproses oleh mitra pembayaran yang
        telah tersertifikasi standar keamanan industri (PCI-DSS)
      </li>
    </ul>

    <hr>

    <h2 id="penggunaan-informasi">2. Bagaimana Kami Menggunakan Informasi Anda</h2>
    <p>Kami menggunakan data yang dikumpulkan untuk:</p>
    <ul>
      <li>Membuat dan mengelola akun Anda, termasuk verifikasi multi-peran (siswa/tutor/admin)</li>
      <li>Memproses transaksi pembelian paket try out dan pembagian pendapatan (revenue share) ke tutor</li>
      <li>
        Menampilkan, menilai, dan menyimpan hasil pengerjaan soal (termasuk penilaian
        manual oleh tutor untuk soal esai/upload gambar)
      </li>
      <li>Menampilkan rating, ulasan, dan statistik pembelian pada paket</li>
      <li>Mengirim notifikasi terkait transaksi, pembaruan paket, atau perubahan kebijakan</li>
      <li>Mencegah penyalahgunaan, kecurangan, dan pelanggaran terhadap Ketentuan Layanan</li>
      <li>Meningkatkan kualitas produk melalui analitik penggunaan agregat</li>
      <li>Mematuhi kewajiban hukum yang berlaku</li>
    </ul>

    <hr>

    <h2 id="pembagian-informasi">3. Bagaimana Kami Membagikan Informasi</h2>
    <p>
      Kami <strong>tidak menjual</strong> data pribadi Anda. Data hanya dibagikan dalam
      situasi berikut:
    </p>

    <div class="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th scope="col">Pihak</th>
            <th scope="col">Tujuan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in sharing" :key="row.party">
            <td>{{ row.party }}</td>
            <td>{{ row.purpose }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>
      Antar pengguna, hanya nama tampilan (bukan email/nomor telepon) yang terlihat
      publik pada profil tutor, ulasan, dan interaksi lain di platform.
    </p>

    <hr>

    <h2 id="keamanan-data">4. Keamanan Data</h2>
    <p>
      Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi data Anda,
      termasuk:
    </p>
    <ul>
      <li>Enkripsi kata sandi</li>
      <li>Koneksi terenkripsi (HTTPS/TLS) untuk seluruh transmisi data</li>
      <li>Signed URL untuk akses konten berbayar guna mencegah akses tidak sah</li>
      <li>Pembatasan akses internal berdasarkan peran (role-based access)</li>
    </ul>
    <p>
      Meskipun demikian, tidak ada sistem yang sepenuhnya aman. Kami mendorong Anda
      menjaga kerahasiaan kata sandi akun Anda.
    </p>

    <hr>

    <h2 id="retensi-data">5. Penyimpanan dan Retensi Data</h2>
    <p>
      Kami menyimpan data pribadi Anda selama akun Anda aktif, atau selama diperlukan
      untuk memenuhi tujuan yang dijelaskan dalam kebijakan ini (termasuk kewajiban
      hukum, pajak, dan akuntansi). Anda dapat meminta penghapusan akun sesuai
      <a href="#hak-anda">Bagian 6</a>.
    </p>

    <hr>

    <h2 id="hak-anda">6. Hak Anda sebagai Pemilik Data Pribadi</h2>
    <p>Sesuai UU PDP, Anda berhak untuk:</p>
    <ul>
      <li>Mengakses dan meminta salinan data pribadi Anda</li>
      <li>Memperbarui atau mengoreksi data yang tidak akurat</li>
      <li>
        Meminta penghapusan data pribadi Anda (dengan pengecualian data yang wajib
        disimpan untuk kepatuhan hukum, mis. riwayat transaksi)
      </li>
      <li>Menarik persetujuan pemrosesan data tertentu</li>
      <li>Mengajukan keberatan atas pemrosesan data untuk tujuan pemasaran</li>
    </ul>
    <p>
      Untuk menggunakan hak-hak ini, hubungi kami melalui kontak pada
      <a href="#hubungi-kami">Bagian 9</a>.
    </p>

    <hr>

    <h2 id="cookies">7. Cookies</h2>
    <p>Zenko menggunakan cookies untuk:</p>
    <ul>
      <li>Menjaga sesi login Anda tetap aktif</li>
      <li>Mengingat preferensi (mis. kategori yang sering dilihat)</li>
      <li>Analitik penggunaan agregat untuk peningkatan produk</li>
    </ul>
    <p>
      Anda dapat menonaktifkan cookies melalui pengaturan browser, namun beberapa
      fitur Zenko mungkin tidak berfungsi optimal tanpa cookies.
    </p>

    <hr>

    <h2 id="perubahan-kebijakan">8. Perubahan Kebijakan Privasi</h2>
    <p>
      Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan signifikan
      akan diinformasikan melalui email atau pemberitahuan di platform sebelum berlaku
      efektif.
    </p>

    <hr>

    <h2 id="hubungi-kami">9. Hubungi Kami</h2>
    <p>
      Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini atau ingin
      menggunakan hak Anda atas data pribadi, hubungi kami di:
    </p>
    <ul>
      <li><strong>Email</strong>: <span class="legal-todo">[email kontak Zenko]</span></li>
      <li><strong>Alamat</strong>: <span class="legal-todo">[alamat perusahaan]</span></li>
    </ul>

    <template #related>
      <NuxtLink to="/ketentuan-layanan" class="font-semibold text-primary hover:underline">
        Ketentuan Layanan
      </NuxtLink>
    </template>
  </LegalDocument>
</template>
