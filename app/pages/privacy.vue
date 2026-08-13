<script setup lang="ts">
// English file name, Indonesian URL; `path` keeps circulating links alive.
definePageMeta({ path: '/kebijakan-privasi' })

useHead({
  title: 'Kebijakan Privasi — Zenko',
  meta: [
    {
      name: 'description',
      content:
        'Kebijakan Privasi Zenko mengenai pengumpulan, penggunaan, penyimpanan, pembagian, dan pelindungan data pribadi pengguna.',
    },
  ],
})

const sharing = [
  {
    party: 'Biznet GioCloud dan penyedia infrastruktur pendukung',
    data: 'Data akun, konten, basis data, log teknis, dan cadangan data',
    purpose: 'Menjalankan, menyimpan, mengamankan, dan memulihkan layanan Zenko',
  },
  {
    party: 'Google',
    data: 'Nama, alamat email, foto profil, dan pengenal akun Google',
    purpose: 'Menyediakan pilihan masuk atau daftar menggunakan akun Google',
  },
  {
    party: 'Resend dan penyedia pengiriman email terkait',
    data: 'Nama, alamat email, serta isi dan status pengiriman pesan',
    purpose: 'Mengirim verifikasi akun, pemulihan kata sandi, dan pemberitahuan layanan',
  },
  {
    party: 'Midtrans dan mitra kanal pembayarannya',
    data: 'Identitas dan kontak yang diperlukan, nomor pesanan, nilai, metode, serta status transaksi',
    purpose: 'Memproses, memverifikasi, menangani pengembalian dana, dan mencegah penipuan pembayaran',
  },
  {
    party: 'Tutor terkait',
    data: 'Nama tampilan atau pengenal siswa, jawaban, unggahan, dan hasil yang relevan',
    purpose: 'Melakukan penilaian manual dan memberikan layanan paket yang dibeli siswa',
  },
  {
    party: 'Penasihat profesional dan otoritas yang berwenang',
    data: 'Data yang secara wajar diperlukan untuk tujuan terkait',
    purpose: 'Memenuhi kewajiban hukum, menyelesaikan sengketa, dan melindungi hak atau keamanan pihak terkait',
  },
]

const retention = [
  {
    category: 'Data akun dan profil',
    period:
      'Selama akun aktif. Setelah permintaan penghapusan yang sah, data dihapus atau dianonimkan paling lambat 90 hari, kecuali masih diperlukan untuk kewajiban hukum atau sengketa.',
  },
  {
    category: 'Data pembelian, pembayaran, pencairan, dan pembukuan',
    period:
      'Sampai 10 tahun sejak akhir tahun transaksi, atau lebih lama apabila diwajibkan oleh hukum atau diperlukan untuk sengketa yang masih berjalan.',
  },
  {
    category: 'Riwayat belajar, jawaban, dan hasil ujian',
    period:
      'Selama akun aktif dan diperlukan untuk memberikan akses paket. Data akan dihapus atau dianonimkan setelah akun ditutup, kecuali perlu dipertahankan untuk hak pengguna lain atau kewajiban hukum.',
  },
  {
    category: 'Tiket dukungan dan log keamanan',
    period:
      'Umumnya sampai 2 tahun sejak komunikasi atau kejadian terakhir, kecuali diperlukan lebih lama untuk investigasi, keamanan, atau sengketa.',
  },
  {
    category: 'Cadangan sistem',
    period:
      'Dihapus melalui siklus penimpaan cadangan paling lambat 90 hari setelah data dihapus dari sistem aktif, kecuali cadangan wajib dipertahankan karena insiden atau kewajiban hukum.',
  },
]
</script>

<template>
  <LegalDocument lead="Kebijakan" accent="Privasi" updated="14 Agustus 2026">
    <p>
      Kebijakan Privasi ini menjelaskan cara Zenko mengumpulkan, menggunakan,
      menyimpan, membagikan, dan melindungi data pribadi ketika Anda menggunakan
      situs dan layanan Zenko. Kebijakan ini disusun dengan mengacu pada
      Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi
      (&ldquo;UU PDP&rdquo;) dan peraturan lain yang berlaku di Indonesia.
    </p>
    <p>
      Kebijakan ini merupakan pemberitahuan mengenai pemrosesan data, bukan
      persetujuan menyeluruh. Jika suatu kegiatan memerlukan persetujuan Anda atau
      orang tua/wali, kami akan memintanya secara khusus.
    </p>

    <hr>

    <h2 id="pengendali-data">1. Pengendali Data Pribadi</h2>
    <p>
      Zenko dioperasikan sebagai usaha perorangan oleh
      <strong>Arttenna Dhyttya Nagara</strong>, berkedudukan di Klaten, Jawa Tengah,
      Indonesia. Dalam penyelenggaraan layanan Zenko, Arttenna Dhyttya Nagara
      bertindak sebagai Pengendali Data Pribadi.
    </p>

    <hr>

    <h2 id="data-yang-dikumpulkan">2. Data yang Kami Kumpulkan</h2>

    <h3>a. Data akun dan identitas</h3>
    <ul>
      <li>Nama lengkap atau nama tampilan, alamat email, dan nomor telepon;</li>
      <li>
        Kata sandi yang telah di-hash sehingga kami tidak menyimpan kata sandi asli
        dalam bentuk yang dapat dibaca;
      </li>
      <li>
        Jika Anda masuk melalui Google: nama, alamat email, foto profil, dan pengenal
        akun yang diberikan Google;
      </li>
      <li>Peran akun, status verifikasi, dan pengaturan akun.</li>
    </ul>

    <h3>b. Data tutor dan pencairan</h3>
    <ul>
      <li>Formulir pendaftaran tutor, biografi, foto profil, dan portofolio;</li>
      <li>
        Data rekening bank atau tujuan pencairan, nama pemilik rekening, serta data
        verifikasi lain yang diperlukan untuk memproses pembayaran kepada tutor;
      </li>
      <li>Paket soal, pembahasan, materi, dan konten lain yang diunggah tutor.</li>
    </ul>

    <h3>c. Data pembelajaran dan interaksi</h3>
    <ul>
      <li>Paket yang dilihat, dibeli, dan diakses;</li>
      <li>Jawaban, unggahan gambar, waktu pengerjaan, skor, dan riwayat hasil;</li>
      <li>Ulasan, rating, serta komunikasi dengan tutor atau tim dukungan.</li>
    </ul>

    <h3>d. Data transaksi</h3>
    <ul>
      <li>
        Nomor pesanan, paket yang dibeli, nilai transaksi, metode pembayaran, status,
        waktu, referensi gateway, refund, dan riwayat pencairan;
      </li>
      <li>
        Informasi terbatas yang diterima dari Midtrans, seperti jenis pembayaran,
        bank atau penerbit, dan nomor instrumen yang disamarkan. Zenko tidak menyimpan
        nomor kartu, PIN, CVV, atau kredensial rekening pembayaran secara lengkap.
      </li>
    </ul>

    <h3>e. Data teknis</h3>
    <ul>
      <li>Alamat IP, jenis browser dan perangkat, sistem operasi, serta waktu akses;</li>
      <li>Cookie sesi, log autentikasi, log permintaan, dan catatan kesalahan;</li>
      <li>Data keamanan yang diperlukan untuk mendeteksi penyalahgunaan atau penipuan.</li>
    </ul>

    <hr>

    <h2 id="sumber-data">3. Sumber Data</h2>
    <p>Kami memperoleh data pribadi:</p>
    <ul>
      <li>Langsung dari Anda ketika mendaftar, mengisi profil, membeli, belajar, atau menghubungi kami;</li>
      <li>Dari Google apabila Anda memilih autentikasi Google;</li>
      <li>Dari Midtrans dan kanal pembayaran terkait ketika Anda melakukan transaksi;</li>
      <li>Secara otomatis dari perangkat dan penggunaan layanan melalui cookie yang diperlukan dan log sistem.</li>
    </ul>

    <hr>

    <h2 id="tujuan-dasar-pemrosesan">4. Tujuan dan Dasar Pemrosesan</h2>
    <p>Kami memproses data pribadi untuk:</p>
    <ul>
      <li>
        <strong>Menjalankan kontrak</strong>: membuat akun, menyediakan autentikasi,
        memproses pesanan, memberi akses paket, menyimpan hasil belajar, menilai
        jawaban, dan mencairkan pendapatan tutor;
      </li>
      <li>
        <strong>Memenuhi kewajiban hukum</strong>: menyimpan catatan transaksi,
        pembukuan, perpajakan, menangani permintaan resmi, dan memenuhi kewajiban
        perlindungan konsumen;
      </li>
      <li>
        <strong>Kepentingan yang sah</strong>: menjaga keamanan, mencegah penipuan,
        menindak pelanggaran, mengatasi gangguan, dan meningkatkan layanan secara
        proporsional dengan tetap memperhatikan hak Anda;
      </li>
      <li>
        <strong>Persetujuan</strong>: untuk pemrosesan data anak, komunikasi pemasaran
        pilihan, atau kegiatan lain ketika persetujuan diwajibkan. Persetujuan dapat
        ditarik tanpa memengaruhi pemrosesan yang telah sah sebelumnya;
      </li>
      <li><strong>Pelindungan kepentingan vital</strong> apabila diperlukan dalam keadaan darurat.</li>
    </ul>

    <hr>

    <h2 id="pembagian-data">5. Penerima dan Pembagian Data</h2>
    <p>
      Kami <strong>tidak menjual</strong> data pribadi Anda. Kami hanya membagikan data
      yang diperlukan kepada pihak berikut untuk tujuan yang dijelaskan:
    </p>

    <div class="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th scope="col">Penerima</th>
            <th scope="col">Data yang Dibagikan</th>
            <th scope="col">Tujuan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in sharing" :key="row.party">
            <td>{{ row.party }}</td>
            <td>{{ row.data }}</td>
            <td>{{ row.purpose }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>
      Antar pengguna, informasi yang ditampilkan dibatasi pada data yang diperlukan
      untuk fungsi marketplace dan pembelajaran. Kami tidak menampilkan email, nomor
      telepon, atau data rekening secara publik.
    </p>

    <hr>

    <h2 id="transfer-data">6. Pemrosesan di Luar Indonesia</h2>
    <p>
      Sebagian penyedia layanan, termasuk Google, Resend, Midtrans, atau subprosesornya,
      dapat memproses data melalui infrastruktur di luar Indonesia. Jika terjadi
      transfer lintas negara, kami akan menerapkan persyaratan pelindungan data yang
      diwajibkan UU PDP, termasuk memastikan tingkat pelindungan yang memadai atau
      menggunakan dasar dan pengamanan lain yang sah.
    </p>

    <hr>

    <h2 id="keamanan-data">7. Keamanan dan Insiden Data</h2>
    <p>Kami menerapkan upaya teknis dan organisasi yang wajar, termasuk:</p>
    <ul>
      <li>Hash kata sandi dan perlindungan sesi autentikasi;</li>
      <li>Koneksi HTTPS/TLS untuk transmisi data;</li>
      <li>Pembatasan akses berdasarkan peran dan kebutuhan kerja;</li>
      <li>Pencatatan keamanan, pembatasan permintaan, pemutakhiran sistem, dan cadangan data.</li>
    </ul>
    <p>
      Tidak ada sistem yang sepenuhnya bebas risiko. Jika terjadi kegagalan pelindungan
      data yang wajib diberitahukan, kami akan memberi pemberitahuan tertulis kepada
      pihak yang diwajibkan paling lambat 3 x 24 jam sejak kami mengetahui kejadian,
      sesuai ketentuan UU PDP.
    </p>

    <hr>

    <h2 id="retensi-data">8. Retensi dan Penghapusan</h2>
    <p>
      Kami hanya menyimpan data selama diperlukan untuk tujuan pemrosesan, memenuhi
      kewajiban hukum, memberikan akses paket, atau menyelesaikan sengketa.
    </p>

    <div class="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th scope="col">Kategori</th>
            <th scope="col">Jangka Waktu</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in retention" :key="row.category">
            <td>{{ row.category }}</td>
            <td>{{ row.period }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <hr>

    <h2 id="hak-anda">9. Hak Anda</h2>
    <p>Sesuai ketentuan yang berlaku, Anda dapat meminta untuk:</p>
    <ul>
      <li>Mendapatkan informasi, akses, dan salinan data pribadi Anda;</li>
      <li>Melengkapi, memperbarui, atau memperbaiki data yang tidak akurat;</li>
      <li>Mengakhiri pemrosesan, menghapus, atau memusnahkan data;</li>
      <li>Menarik persetujuan atau mengajukan keberatan atas pemrosesan tertentu;</li>
      <li>Membatasi pemrosesan secara proporsional;</li>
      <li>
        Memperoleh atau memindahkan data dalam format yang lazim dibaca sistem,
        sepanjang berlaku dan layak secara teknis;
      </li>
      <li>Mengajukan pengaduan dan menuntut ganti rugi sesuai peraturan yang berlaku.</li>
    </ul>
    <p>
      Kirim permintaan ke kontak pada <a href="#hubungi-kami">Bagian 13</a>. Kami
      dapat meminta verifikasi identitas dan informasi tambahan agar data tidak
      diberikan kepada pihak yang tidak berhak. Sebagian permintaan dapat dibatasi
      jika data masih wajib disimpan atau pemrosesan diperlukan berdasarkan hukum.
    </p>

    <hr>

    <h2 id="data-anak">10. Data Anak</h2>
    <p>
      Zenko dapat digunakan oleh siswa, mahasiswa, dan calon ASN. Pengguna berusia di
      bawah 18 tahun hanya boleh menggunakan layanan dengan persetujuan dan pengawasan
      orang tua atau wali. Pemrosesan data pribadi anak dilakukan secara khusus dan
      harus berdasarkan persetujuan orang tua atau wali sesuai UU PDP.
    </p>
    <p>
      Orang tua atau wali dapat menghubungi kami untuk meminta akses, koreksi, atau
      penghapusan data anak yang berada di bawah tanggung jawabnya. Jika kami mengetahui
      data anak diproses tanpa persetujuan yang sah, kami akan mengambil langkah wajar
      untuk membatasi dan menghapusnya, kecuali penyimpanan diwajibkan oleh hukum.
    </p>

    <hr>

    <h2 id="cookies">11. Cookie</h2>
    <p>
      Zenko menggunakan cookie yang diperlukan untuk menjaga sesi login, keamanan,
      dan fungsi dasar situs. Menonaktifkan cookie tersebut dapat menyebabkan fitur
      akun tidak berfungsi. Jika kelak kami menggunakan cookie analitik atau pemasaran
      yang tidak mutlak diperlukan, kami akan memberikan informasi dan meminta pilihan
      Anda sebagaimana diwajibkan hukum.
    </p>

    <hr>

    <h2 id="perubahan-kebijakan">12. Perubahan Kebijakan</h2>
    <p>
      Kami dapat memperbarui kebijakan ini untuk mengikuti perubahan layanan atau
      hukum. Tanggal pembaruan ditampilkan di bagian atas. Perubahan material akan
      diberitahukan melalui email atau pemberitahuan yang mudah terlihat di Platform
      sebelum berlaku, jika diwajibkan.
    </p>

    <hr>

    <h2 id="hubungi-kami">13. Hubungi Kami</h2>
    <p>
      Untuk pertanyaan, pengaduan, atau penggunaan hak atas data pribadi, hubungi:
    </p>
    <ul>
      <li><strong>Pengelola</strong>: Arttenna Dhyttya Nagara (usaha perorangan)</li>
      <li>
        <strong>Email</strong>:
        <a href="mailto:artenanagara22@gmail.com">artenanagara22@gmail.com</a>
      </li>
      <li>
        <strong>Telepon/WhatsApp</strong>:
        <a href="tel:+628220840196">0822-0840-196</a>
      </li>
      <li><strong>Alamat</strong>: Klaten, Jawa Tengah, Indonesia</li>
    </ul>

    <template #related>
      <NuxtLink to="/ketentuan-layanan" class="font-semibold text-primary hover:underline">
        Ketentuan Layanan
      </NuxtLink>
    </template>
  </LegalDocument>
</template>
