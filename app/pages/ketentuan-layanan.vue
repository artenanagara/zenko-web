<script setup lang="ts">
/**
 * Ketentuan Layanan.
 *
 * Placeholders wrapped in <span class="legal-todo"> must be filled before this
 * page goes live: tanggal berlaku, nama badan hukum, alamat, email kontak.
 */
useHead({
  title: 'Ketentuan Layanan — Zenko',
  meta: [
    {
      name: 'description',
      content:
        'Ketentuan penggunaan platform Zenko: akun, pembelian paket try out, hak dan kewajiban tutor, pengembalian dana, dan penyelesaian sengketa.',
    },
  ],
})

const revenueShare = [
  { party: 'Tutor / pembuat paket', share: '70%', note: 'Dibayarkan pada siklus pencairan berikutnya' },
  { party: 'Zenko', share: '30%', note: 'Mencakup biaya payment gateway, penyimpanan, dan operasional platform' },
]
</script>

<template>
  <LegalDocument lead="Ketentuan" accent="Layanan">
    <p>
      Ketentuan Layanan ini (&ldquo;Ketentuan&rdquo;) mengatur penggunaan situs dan
      layanan Zenko, sebuah platform marketplace yang mempertemukan tutor dan pembuat
      konten dengan siswa yang mempersiapkan ujian SKD/CPNS, BUMN, SNBT, TKA, dan
      kategori lainnya. Zenko dioperasikan oleh
      <span class="legal-todo">[nama badan hukum]</span>.
    </p>
    <p>
      Dengan membuat akun, membeli paket, atau menggunakan layanan Zenko dengan cara
      apa pun, kamu menyatakan telah membaca, memahami, dan terikat pada Ketentuan ini.
      Jika kamu tidak menyetujuinya, mohon tidak menggunakan layanan Zenko.
    </p>

    <hr>

    <h2 id="definisi">1. Definisi</h2>
    <ul>
      <li><strong>Platform</strong> — situs, aplikasi, dan layanan Zenko.</li>
      <li><strong>Pengguna</strong> — siapa pun yang mengakses Platform, baik memiliki akun maupun tidak.</li>
      <li><strong>Siswa</strong> — Pengguna yang membeli dan mengerjakan paket try out.</li>
      <li><strong>Tutor</strong> — Pengguna yang menerbitkan dan menjual paket di Platform.</li>
      <li><strong>Paket</strong> — kumpulan soal, pembahasan, dan materi pendukung yang dijual sebagai satu produk.</li>
      <li><strong>Konten Tutor</strong> — seluruh materi yang diunggah Tutor ke Platform.</li>
    </ul>

    <hr>

    <h2 id="akun">2. Akun Pengguna</h2>
    <p>
      Untuk membeli atau menjual paket, kamu perlu membuat akun. Dengan membuat akun,
      kamu menyatakan bahwa:
    </p>
    <ul>
      <li>Informasi yang kamu berikan benar, akurat, dan diperbarui bila berubah;</li>
      <li>Kamu berusia minimal 17 tahun, atau menggunakan Platform dengan persetujuan orang tua/wali;</li>
      <li>Kamu bertanggung jawab menjaga kerahasiaan kredensial akunmu, termasuk akun Google yang kamu gunakan untuk masuk;</li>
      <li>Seluruh aktivitas yang terjadi melalui akunmu menjadi tanggung jawabmu.</li>
    </ul>
    <p>
      Satu akun hanya boleh digunakan oleh satu orang. Membagikan akun kepada orang lain
      merupakan pelanggaran Ketentuan ini.
    </p>

    <hr>

    <h2 id="peran-tutor">3. Kewajiban Tutor</h2>
    <p>Dengan menerbitkan paket di Zenko, Tutor menyatakan dan menjamin bahwa:</p>
    <ul>
      <li>Konten Tutor merupakan karya asli, atau Tutor memiliki hak yang sah untuk menggunakannya secara komersial;</li>
      <li>Konten tidak melanggar hak cipta, merek, atau hak kekayaan intelektual pihak lain;</li>
      <li>Deskripsi paket — jumlah soal, cakupan materi, dan klaim lainnya — sesuai dengan isi sebenarnya;</li>
      <li>Konten tidak memuat soal ujian resmi yang bocor, materi rahasia negara, atau bahan yang diperoleh secara melanggar hukum.</li>
    </ul>
    <p>
      Zenko berhak menurunkan paket yang melanggar ketentuan di atas tanpa pemberitahuan
      terlebih dahulu, dan menahan pencairan dana yang berkaitan dengannya selama
      pemeriksaan berlangsung.
    </p>

    <hr>

    <h2 id="pembelian">4. Pembelian dan Pembayaran</h2>
    <p>
      Harga paket ditetapkan oleh Tutor dan ditampilkan dalam Rupiah, sudah termasuk
      pajak yang berlaku kecuali dinyatakan lain. Pembayaran diproses oleh mitra payment
      gateway; Zenko tidak menyimpan data kartu atau rekeningmu.
    </p>
    <p>
      Akses ke paket diberikan setelah pembayaran dikonfirmasi. Kecuali dinyatakan lain
      pada halaman paket, akses berlaku selamanya selama akunmu aktif dan paket masih
      tersedia di Platform.
    </p>

    <h3>Pembagian pendapatan</h3>
    <div class="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th scope="col">Pihak</th>
            <th scope="col">Bagian</th>
            <th scope="col">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in revenueShare" :key="row.party">
            <td>{{ row.party }}</td>
            <td>{{ row.share }}</td>
            <td>{{ row.note }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      Persentase di atas dapat berubah dengan pemberitahuan minimal 30 hari sebelum
      berlaku efektif. Perubahan tidak berlaku surut terhadap transaksi yang sudah terjadi.
    </p>

    <hr>

    <h2 id="pengembalian-dana">5. Pengembalian Dana</h2>
    <p>
      Kamu dapat mengajukan pengembalian dana dalam <strong>7 hari</strong> sejak
      pembelian apabila:
    </p>
    <ul>
      <li>Isi paket secara material tidak sesuai dengan deskripsinya;</li>
      <li>Paket tidak dapat diakses karena masalah teknis yang tidak kami selesaikan dalam waktu wajar;</li>
      <li>Terjadi pembelian ganda atas paket yang sama.</li>
    </ul>
    <p>
      Pengembalian dana dapat ditolak jika kamu telah mengerjakan lebih dari 30% soal
      dalam paket tersebut, atau jika terdapat indikasi penyalahgunaan kebijakan ini.
      Dana dikembalikan melalui metode pembayaran yang sama, dan waktu pemrosesan
      mengikuti kebijakan penyedia pembayaran.
    </p>

    <hr>

    <h2 id="lisensi">6. Lisensi dan Hak Kekayaan Intelektual</h2>
    <p>
      Konten Tutor tetap menjadi milik Tutor. Dengan menerbitkannya, Tutor memberikan
      Zenko lisensi non-eksklusif, berlaku di seluruh dunia, dan bebas royalti untuk
      menyimpan, menampilkan, dan mendistribusikan konten tersebut kepada Siswa
      sepanjang diperlukan untuk menjalankan layanan.
    </p>
    <p>
      Pembelian paket memberimu <strong>lisensi pribadi dan tidak dapat dialihkan</strong>
      untuk mengakses dan mengerjakan materi tersebut. Kamu tidak diperbolehkan
      mengunduh massal, menyalin, menyebarluaskan, menjual ulang, atau membagikan isi
      paket kepada pihak lain dalam bentuk apa pun.
    </p>

    <hr>

    <h2 id="larangan">7. Perilaku yang Dilarang</h2>
    <p>Saat menggunakan Zenko, kamu dilarang:</p>
    <ul>
      <li>Membagikan, menjual ulang, atau menyebarluaskan isi paket berbayar;</li>
      <li>Menggunakan bot, scraper, atau otomasi untuk mengakses atau menyalin konten;</li>
      <li>Berupaya membobol, membebani, atau mengganggu sistem dan keamanan Platform;</li>
      <li>Membuat ulasan palsu, memanipulasi rating, atau mengatur transaksi fiktif;</li>
      <li>Mengunggah konten yang melanggar hukum, menyesatkan, atau mengandung ujaran kebencian;</li>
      <li>Menyamar sebagai orang atau lembaga lain.</li>
    </ul>

    <hr>

    <h2 id="penghentian">8. Penangguhan dan Penghentian Akun</h2>
    <p>
      Kami dapat menangguhkan atau menghentikan akun yang melanggar Ketentuan ini. Untuk
      pelanggaran yang tidak berat, kami akan memberikan pemberitahuan dan kesempatan
      memperbaiki terlebih dahulu. Untuk pelanggaran berat — misalnya penyebaran konten
      berbayar atau penipuan — penghentian dapat dilakukan segera.
    </p>
    <p>
      Kamu dapat menutup akunmu kapan saja. Penutupan akun tidak menghapus kewajiban
      yang sudah timbul sebelumnya, dan tidak dengan sendirinya menimbulkan hak atas
      pengembalian dana.
    </p>

    <hr>

    <h2 id="tanggung-jawab">9. Batasan Tanggung Jawab</h2>
    <p>
      Zenko adalah penyedia platform, bukan penyusun Konten Tutor. Kami melakukan kurasi
      terhadap tutor, tetapi <strong>tidak menjamin</strong> hasil ujian tertentu,
      kelulusan, atau ketepatan prediksi soal.
    </p>
    <p>
      Sepanjang diizinkan hukum yang berlaku, tanggung jawab Zenko atas klaim apa pun
      yang timbul dari penggunaan layanan dibatasi maksimal sebesar jumlah yang kamu
      bayarkan untuk paket terkait dalam 6 bulan terakhir.
    </p>

    <hr>

    <h2 id="perubahan">10. Perubahan Ketentuan</h2>
    <p>
      Kami dapat memperbarui Ketentuan ini dari waktu ke waktu. Perubahan yang signifikan
      akan diinformasikan melalui email atau pemberitahuan di Platform sebelum berlaku
      efektif. Melanjutkan penggunaan layanan setelah perubahan berlaku berarti kamu
      menerima Ketentuan yang diperbarui.
    </p>

    <hr>

    <h2 id="hukum">11. Hukum yang Berlaku dan Penyelesaian Sengketa</h2>
    <p>
      Ketentuan ini tunduk pada hukum Republik Indonesia. Apabila timbul sengketa, para
      pihak sepakat mengutamakan penyelesaian secara musyawarah dalam waktu 30 hari
      sejak pemberitahuan tertulis. Jika tidak tercapai kesepakatan, sengketa
      diselesaikan melalui <span class="legal-todo">[forum penyelesaian sengketa]</span>.
    </p>

    <hr>

    <h2 id="hubungi-kami">12. Hubungi Kami</h2>
    <p>Pertanyaan mengenai Ketentuan ini dapat disampaikan ke:</p>
    <ul>
      <li><strong>Email</strong>: <span class="legal-todo">[email kontak Zenko]</span></li>
      <li><strong>Alamat</strong>: <span class="legal-todo">[alamat perusahaan]</span></li>
    </ul>

    <template #related>
      <NuxtLink to="/kebijakan-privasi" class="font-semibold text-primary hover:underline">
        Kebijakan Privasi
      </NuxtLink>
    </template>
  </LegalDocument>
</template>
