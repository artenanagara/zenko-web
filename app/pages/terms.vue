<script setup lang="ts">
// English file name, Indonesian URL; `path` keeps circulating links alive.
definePageMeta({ path: '/ketentuan-layanan' })

useSeoMeta({
  title: 'Ketentuan Layanan | Zenko',
  description:
    'Ketentuan penggunaan Zenko mengenai akun, paket belajar, portal dan langganan bimbel, pembayaran, refund, tutor, pencairan, dan penyelesaian sengketa.',
  ogTitle: 'Ketentuan Layanan | Zenko',
  ogDescription:
    'Ketentuan penggunaan Zenko mengenai akun, paket belajar, portal dan langganan bimbel, pembayaran, refund, tutor, pencairan, dan penyelesaian sengketa.',
  ...DEFAULT_OG,
  ogUrl: 'https://zenkoedu.id/ketentuan-layanan',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/ketentuan-layanan' }],
})

const revenueShare = [
  {
    party: 'Tutor / pembuat paket',
    share: '70%',
    note: 'Menjadi saldo tutor setelah transaksi berstatus selesai dan melewati pemeriksaan yang diperlukan',
  },
  {
    party: 'Zenko',
    share: '30%',
    note: 'Mencakup biaya payment gateway, infrastruktur, layanan pelanggan, dan operasional Platform',
  },
]

const bimbelRevenueShare = [
  { plan: 'Dasar', bimbel: '70%', zenko: '30%' },
  { plan: 'Pro', bimbel: '75%', zenko: '25%' },
  { plan: 'Institusi', bimbel: '80%', zenko: '20%' },
]
</script>

<template>
  <LegalDocument lead="Ketentuan" accent="Layanan" updated="21 September 2026">
    <p>
      Ketentuan Layanan ini (&ldquo;Ketentuan&rdquo;) mengatur penggunaan Zenko,
      platform marketplace dan pengelolaan pembelajaran yang mempertemukan tutor,
      bimbingan belajar atau institusi pendidikan, dengan siswa, mahasiswa, dan calon ASN. Zenko dioperasikan oleh
      <strong>PT Zenko Edukasi Digital</strong>, sebuah perseroan terbatas yang
      berkedudukan di Klaten, Jawa Tengah, Indonesia (&ldquo;Zenko&rdquo;, &ldquo;kami&rdquo;).
    </p>
    <p>
      Dengan membuat akun, membeli atau menerbitkan paket, mendaftarkan atau mengelola
      bimbel, atau menggunakan layanan,
      Anda menyatakan telah membaca, memahami, dan menyetujui Ketentuan ini serta
      <NuxtLink to="/kebijakan-privasi">Kebijakan Privasi</NuxtLink>. Jika tidak
      setuju, jangan gunakan layanan Zenko.
    </p>

    <hr>

    <h2 id="definisi">1. Definisi</h2>
    <ul>
      <li><strong>Platform</strong> berarti situs, sistem, dan layanan Zenko.</li>
      <li><strong>Pengguna</strong> berarti setiap orang yang mengakses Platform.</li>
      <li><strong>Siswa</strong> berarti Pengguna yang membeli atau mengerjakan Paket.</li>
      <li><strong>Tutor</strong> berarti Pengguna yang disetujui untuk menerbitkan dan menjual Paket.</li>
      <li><strong>Bimbel</strong> berarti bimbingan belajar, lembaga, atau institusi pendidikan yang ruang kerjanya dikelola melalui Platform.</li>
      <li><strong>Pengelola Bimbel</strong> berarti pemilik atau anggota Bimbel yang diberi peran untuk mengelola langganan, anggota, kelas, Paket, atau laporan.</li>
      <li><strong>Anggota Bimbel</strong> berarti Pengguna yang bergabung sebagai siswa, pengajar, admin, atau pemilik pada satu ruang kerja Bimbel.</li>
      <li><strong>Paket</strong> berarti kumpulan soal, pembahasan, materi, atau layanan belajar yang ditawarkan melalui Platform.</li>
      <li><strong>Konten Tutor</strong> berarti seluruh materi yang dibuat atau diunggah Tutor.</li>
      <li><strong>Hari Kerja</strong> berarti Senin sampai Jumat selain hari libur nasional Indonesia.</li>
    </ul>

    <hr>

    <h2 id="akun">2. Kelayakan dan Akun</h2>
    <p>
      Zenko ditujukan bagi siswa, mahasiswa, calon ASN, dan pengguna pembelajaran
      lainnya. Pengguna berusia di bawah 18 tahun hanya boleh membuat akun,
      menggunakan layanan, atau melakukan pembelian dengan persetujuan dan pengawasan
      orang tua atau wali. Orang tua atau wali bertanggung jawab atas penggunaan akun
      dan transaksi pengguna anak yang berada di bawah tanggung jawabnya.
    </p>
    <p>Dengan membuat akun, Anda menyatakan bahwa:</p>
    <ul>
      <li>Informasi yang diberikan benar, akurat, dan akan diperbarui bila berubah;</li>
      <li>Anda cakap bertindak secara hukum atau telah memperoleh persetujuan orang tua/wali;</li>
      <li>Anda akan menjaga kerahasiaan kata sandi dan akses akun Google yang digunakan;</li>
      <li>Anda segera memberi tahu kami jika mengetahui akses tidak sah terhadap akun.</li>
    </ul>
    <p>
      Satu akun hanya boleh digunakan oleh satu orang. Anda tidak boleh menjual,
      memindahtangankan, atau membagikan akun kepada pihak lain.
    </p>
    <p>
      Jika Anda membuat atau mengelola ruang kerja atas nama Bimbel, Anda menyatakan
      memiliki kewenangan yang sah untuk mewakili Bimbel tersebut dan memasukkan data
      anggota ke Platform. Setiap anggota tetap harus menggunakan akun pribadinya sendiri.
    </p>

    <hr>

    <h2 id="layanan">3. Layanan dan Paket</h2>
    <p>
      Tutor bertanggung jawab atas ketepatan deskripsi dan mutu Konten Tutor. Zenko
      menyediakan sarana distribusi, transaksi, dan pembelajaran serta dapat melakukan
      kurasi atau moderasi, tetapi tidak menjamin kelulusan, nilai, hasil ujian, atau
      kesamaan Paket dengan soal ujian resmi.
    </p>
    <p>
      Fitur, jadwal, dan tampilan Platform dapat diperbarui dari waktu ke waktu. Kami
      akan berupaya menjaga layanan tetap tersedia, tetapi dapat melakukan pemeliharaan
      terjadwal atau darurat bila diperlukan.
    </p>

    <hr>

    <h2 id="kewajiban-tutor">4. Pendaftaran dan Kewajiban Tutor</h2>
    <p>
      Status Tutor diberikan setelah permohonan ditinjau. Kami dapat meminta identitas,
      portofolio, rekening pencairan, atau informasi lain yang wajar untuk verifikasi.
      Dengan menerbitkan Paket, Tutor menyatakan dan menjamin bahwa:
    </p>
    <ul>
      <li>Konten Tutor merupakan karya asli atau digunakan berdasarkan izin yang sah untuk tujuan komersial;</li>
      <li>Konten tidak melanggar hak cipta, merek, privasi, atau hak pihak lain;</li>
      <li>Deskripsi, harga, jumlah soal, cakupan, dan klaim manfaat sesuai keadaan sebenarnya;</li>
      <li>Konten tidak memuat soal ujian yang bocor, materi rahasia, malware, atau bahan yang diperoleh secara melawan hukum;</li>
      <li>Tutor akan memberikan penilaian manual atau dukungan yang dijanjikan dalam waktu yang wajar;</li>
      <li>Tutor memenuhi kewajiban pajak dan perizinan yang berlaku atas penghasilannya.</li>
    </ul>
    <p>
      Kami dapat menolak, menunda penerbitan, menurunkan, atau meminta perbaikan Paket
      yang melanggar Ketentuan, hukum, standar kualitas, atau berisiko merugikan pengguna.
    </p>

    <hr>

    <h2 id="pembelian">5. Harga, Pesanan, dan Pembayaran</h2>
    <ul>
      <li>Harga ditampilkan dalam Rupiah pada halaman Paket atau checkout.</li>
      <li>Potongan harga, pajak, atau biaya tambahan yang berlaku akan ditampilkan sebelum pembayaran diselesaikan.</li>
      <li>Pembayaran diproses oleh iPaymu dan kanal pembayaran yang tersedia pada saat transaksi.</li>
      <li>Pesanan dianggap berhasil setelah status pembayaran dikonfirmasi oleh sistem Zenko berdasarkan informasi dari iPaymu.</li>
      <li>Instruksi, batas waktu, dan biaya kanal pembayaran tertentu mengikuti ketentuan penyedia pembayaran.</li>
    </ul>
    <p>
      <strong>Penyerahan Paket.</strong> Paket adalah produk digital, sehingga tidak ada
      pengiriman fisik dan tidak dikenakan ongkos kirim. Akses aktif otomatis di akun
      pembeli segera setelah pembayaran dikonfirmasi, umumnya kurang dari 5 menit, dan
      dapat dibuka melalui menu Paketku. Bukti pembelian berupa invoice elektronik
      tersedia di Riwayat Pembelian. Jika akses belum aktif dalam 1&times;24 jam sejak
      pembayaran terkonfirmasi, hubungi kami melalui
      <NuxtLink to="/pusat-bantuan">Pusat Bantuan</NuxtLink>.
    </p>
    <p>
      Kami dapat membatalkan atau mengoreksi pesanan karena kesalahan harga yang nyata,
      dugaan penipuan, pembayaran tidak sah, atau kewajiban hukum. Jika dana telah
      diterima untuk pesanan yang dibatalkan oleh kami, dana yang menjadi hak pembeli
      akan dikembalikan sesuai Bagian 8.
    </p>

    <hr>

    <h2 id="akses-paket">6. Masa Akses Paket</h2>
    <p>
      Kecuali dinyatakan berbeda dengan jelas sebelum pembelian, Paket yang telah
      dibayar memiliki <strong>masa akses tanpa tanggal kedaluwarsa</strong> selama akun
      pembeli aktif dan Zenko tetap mengoperasikan Platform. Tutor yang berhenti menjual
      Paket tidak menghapus akses pembeli sebelumnya.
    </p>
    <p>
      Akses dapat dibatasi jika akun melanggar Ketentuan, Paket wajib diturunkan karena
      hukum atau hak pihak lain, atau Platform dihentikan karena keadaan di luar kendali
      yang wajar. Jika Paket harus dihapus permanen karena alasan yang bukan kesalahan
      pembeli, kami akan mengupayakan pemulihan akses, Paket pengganti yang sepadan,
      atau pengembalian dana yang wajar berdasarkan kondisi kasus.
    </p>

    <hr>

    <h2 id="pendapatan-tutor">7. Pembagian Pendapatan dan Pencairan Tutor</h2>
    <p>
      Pembagian dihitung dari harga Paket yang benar-benar dibayar setelah diskon.
      Kecuali disepakati lain secara tertulis, pembagiannya adalah:
    </p>

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

    <ul>
      <li>Tutor dapat mengajukan pencairan kapan saja setelah saldo tersedia mencapai minimal <strong>Rp100.000</strong>.</li>
      <li>Pencairan dikirim ke rekening terverifikasi dan umumnya diproses paling lambat 5 Hari Kerja setelah permintaan dan verifikasi selesai.</li>
      <li>Keterlambatan bank, data rekening yang salah, pemeriksaan keamanan, hari libur, atau gangguan pihak ketiga dapat menambah waktu pemrosesan.</li>
      <li>Refund, chargeback, transaksi tidak sah, atau kewajiban lain terkait Paket dapat dikurangkan dari saldo Tutor.</li>
      <li>Tutor bertanggung jawab atas pajaknya, kecuali Zenko diwajibkan melakukan pemotongan atau pelaporan berdasarkan hukum.</li>
    </ul>
    <p>
      Penurunan persentase pembagian yang sedang berlaku, atau perubahan minimum
      pencairan, akan diberitahukan sedikitnya 30 hari sebelum berlaku dan tidak
      diterapkan surut pada transaksi yang sudah selesai. Berakhirnya persentase
      khusus pada tanggal berakhir yang telah dipublikasikan sejak awal bukan
      merupakan perubahan persentase. Ketentuan rinci bagi hasil khusus Tutor
      diatur dalam <NuxtLink to="/syarat-tutor#bagi-hasil">Syarat Tutor</NuxtLink>.
    </p>

    <hr>

    <h2 id="refund">8. Pembatalan dan Pengembalian Dana</h2>
    <p>
      Ketentuan pembatalan dan pengembalian dana di bagian ini merupakan bagian
      dari Ketentuan Layanan. Ringkasan praktis cara mengajukan refund juga
      dapat dibaca di <NuxtLink to="/kebijakan-refund">Kebijakan Refund</NuxtLink>.
    </p>
    <p>
      Permohonan refund harus dikirim ke
      <a href="mailto:halo@zenkoedu.id">halo@zenkoedu.id</a> paling
      lambat <strong>7 hari kalender</strong> setelah pembayaran, disertai nomor pesanan,
      alasan, dan bukti pendukung. Refund dapat disetujui apabila:
    </p>
    <ul>
      <li>Terjadi pembayaran ganda untuk Paket dan akun yang sama;</li>
      <li>Pembayaran berhasil tetapi akses tidak diberikan dan masalah tidak terselesaikan dalam 3 Hari Kerja setelah dilaporkan;</li>
      <li>Isi Paket secara material berbeda dari deskripsi pada saat pembelian;</li>
      <li>Bagian utama Paket rusak atau tidak dapat digunakan dan tidak diperbaiki dalam waktu yang wajar;</li>
      <li>Paket dihapus karena terbukti melanggar hukum atau hak pihak lain.</li>
    </ul>
    <p>Refund umumnya tidak diberikan untuk:</p>
    <ul>
      <li>Perubahan pikiran, salah memilih Paket, atau ketidaksesuaian preferensi pribadi;</li>
      <li>Ketidaklulusan, nilai yang tidak sesuai harapan, atau klaim hasil ujian tertentu;</li>
      <li>Akun yang ditangguhkan karena pelanggaran Ketentuan;</li>
      <li>
        Permohonan setelah lebih dari 20% isi Paket telah dikerjakan, dilihat, atau
        diunduh, kecuali terdapat cacat material pada bagian utama Paket atau pembelian ganda.
      </li>
    </ul>
    <p>
      Refund dapat diberikan penuh atau proporsional sesuai bagian layanan yang gagal.
      Pembayaran ganda dan kegagalan akses total yang memenuhi syarat dikembalikan penuh.
      Dana dikembalikan ke metode pembayaran awal apabila didukung iPaymu; jika tidak,
      kami dapat meminta rekening atau dompet digital atas nama pembeli yang telah
      diverifikasi. Setelah disetujui, pemrosesan umumnya memerlukan 5&ndash;14 Hari Kerja,
      tidak termasuk keterlambatan bank atau penyedia pembayaran.
    </p>

    <hr>

    <h2 id="kekayaan-intelektual">9. Hak Kekayaan Intelektual</h2>
    <p>
      Konten Tutor tetap menjadi milik Tutor atau pemegang haknya. Dengan menerbitkan
      Konten Tutor, Tutor memberi Zenko lisensi non-eksklusif, berlaku selama diperlukan,
      bebas royalti, dan dapat disublisensikan kepada penyedia layanan teknis untuk
      menyimpan, menampilkan, memproses, mencadangkan, serta mendistribusikan konten
      kepada pembeli dan untuk mempromosikan Paket.
    </p>
    <p>
      Pembelian memberi Siswa lisensi pribadi, terbatas, dan tidak dapat dialihkan untuk
      mengakses Paket. Siswa tidak memperoleh kepemilikan hak cipta dan tidak boleh
      menyalin massal, merekam untuk distribusi, membagikan, menjual ulang, atau
      mengeksploitasi Paket di luar penggunaan belajar pribadi.
    </p>

    <hr>

    <h2 id="larangan">10. Perilaku yang Dilarang</h2>
    <p>Anda dilarang:</p>
    <ul>
      <li>Membagikan akun atau menyebarluaskan Konten berbayar tanpa izin;</li>
      <li>Menggunakan bot, scraper, atau otomasi untuk mengambil konten atau membebani sistem;</li>
      <li>Membobol, menguji tanpa izin, menghindari kontrol akses, atau mengganggu keamanan Platform;</li>
      <li>Melakukan transaksi fiktif, chargeback curang, manipulasi rating, atau ulasan palsu;</li>
      <li>Mengunggah konten melawan hukum, menyesatkan, berbahaya, diskriminatif, atau melanggar hak pihak lain;</li>
      <li>Menyamar sebagai orang, lembaga, atau pemegang kualifikasi lain.</li>
    </ul>

    <hr>

    <h2 id="penangguhan">11. Penangguhan dan Penutupan Akun</h2>
    <p>
      Kami dapat membatasi, menangguhkan, atau menutup akun serta menahan pencairan
      yang terkait selama pemeriksaan apabila terdapat pelanggaran, penipuan, risiko
      keamanan, sengketa, chargeback, atau perintah hukum. Untuk pelanggaran yang dapat
      diperbaiki, kami akan berupaya memberikan pemberitahuan dan kesempatan yang wajar.
      Pelanggaran berat dapat ditindak segera.
    </p>
    <p>
      Anda dapat meminta penutupan akun. Penutupan tidak menghapus kewajiban, lisensi
      yang diperlukan untuk melayani pembeli lama, catatan transaksi yang wajib disimpan,
      atau sengketa yang telah timbul.
    </p>

    <hr>

    <h2 id="tanggung-jawab">12. Jaminan dan Batasan Tanggung Jawab</h2>
    <p>
      Layanan disediakan dengan upaya yang wajar. Zenko tidak menjamin layanan selalu
      bebas gangguan, seluruh Konten Tutor bebas kesalahan, atau penggunaan Paket akan
      menghasilkan kelulusan maupun skor tertentu.
    </p>
    <p>
      Sepanjang diizinkan hukum, tanggung jawab Zenko atas kerugian langsung yang
      terbukti dari Paket tertentu dibatasi pada nilai yang dibayar untuk Paket tersebut.
      Batasan ini tidak berlaku apabila dilarang oleh hukum, termasuk terhadap hak
      konsumen yang tidak dapat dikesampingkan atau kerugian karena kesengajaan atau
      kelalaian berat Zenko.
    </p>

    <hr>

    <h2 id="keadaan-kahar">13. Keadaan Kahar</h2>
    <p>
      Para pihak tidak bertanggung jawab atas keterlambatan atau kegagalan yang secara
      langsung disebabkan keadaan di luar kendali wajar, seperti bencana, gangguan luas
      internet atau listrik, tindakan pemerintah, perang, kerusuhan, serangan siber
      berskala luas, atau kegagalan penyedia infrastruktur. Pihak terdampak tetap wajib
      melakukan upaya wajar untuk mengurangi dampaknya.
    </p>

    <hr>

    <h2 id="perubahan">14. Perubahan Ketentuan</h2>
    <p>
      Kami dapat memperbarui Ketentuan ini. Tanggal pembaruan dicantumkan di bagian atas.
      Perubahan material akan diberitahukan melalui email atau pemberitahuan yang mudah
      terlihat di Platform sebelum berlaku jika diwajibkan. Perubahan harga atau
      pembagian pendapatan tidak berlaku surut terhadap transaksi yang sudah selesai.
    </p>

    <hr>

    <h2 id="hukum">15. Hukum dan Penyelesaian Sengketa</h2>
    <p>
      Ketentuan ini tunduk pada hukum Republik Indonesia. Para pihak akan terlebih dahulu
      mengupayakan musyawarah selama 30 hari kalender sejak pemberitahuan tertulis.
      Pengguna tetap dapat menggunakan mekanisme pengaduan atau penyelesaian sengketa
      konsumen yang diberikan hukum. Jika sengketa tidak selesai dan tidak ada forum lain
      yang diwajibkan hukum, para pihak memilih domisili hukum di
      <strong>Pengadilan Negeri Klaten</strong>.
    </p>

    <hr>

    <h2 id="langganan-bimbel">16. Portal dan Langganan Bimbel</h2>

    <h3>a. Pendaftaran dan uji coba</h3>
    <p>
      Pengguna dapat mendaftarkan Bimbel dengan memberikan nama Bimbel, perkiraan
      jumlah siswa, kota jika diisi, dan persetujuan terhadap Ketentuan ini. Ruang kerja
      dibuat untuk uji coba <strong>7 hari</strong> dengan kapabilitas tingkat Pro dan
      kuota awal 25 kursi siswa. Informasi harga seluruh tingkat tersedia sebelum
      pendaftaran; uji coba tidak mewajibkan pembelian setelah berakhir.
    </p>

    <h3>b. Tingkat, periode, dan kursi</h3>
    <ul>
      <li>Harga, kuota, batas pengajar, fitur, periode, dan jumlah akhir yang berlaku ditampilkan pada penawaran dan ringkasan tagihan sebelum pesanan dibuat.</li>
      <li>Langganan tahunan memberi masa aktif 12 bulan dengan penagihan harga dasar setara 10 bulan. Perpanjangan yang dibayar lebih awal dimulai setelah masa aktif yang sedang berjalan berakhir.</li>
      <li>Hanya siswa berstatus aktif yang memakai kursi. Pengajar dan pengelola mengikuti batas peran atau pengajar pada tingkat yang dipilih.</li>
      <li>Kursi tambahan dibeli terpisah dalam kelipatan 5. Tarif saat ini Rp3.000 per kursi per bulan, dikalikan sisa bulan masa aktif yang dibulatkan ke atas, dan tidak memperoleh diskon tahunan.</li>
      <li>Kuota kursi baru bertambah setelah pembayaran diverifikasi. Kursi tambahan yang masih menunggu pembayaran tidak dapat digunakan dan ditampilkan terpisah dari kuota aktif.</li>
      <li>Kuota tidak dapat diturunkan sendiri melalui dashboard. Pengelola dapat menghubungi dukungan jika memerlukan penyesuaian khusus.</li>
    </ul>

    <h3>c. Pembayaran, berakhirnya langganan, dan akses data</h3>
    <p>
      Tagihan langganan dan kursi tambahan mengikuti instruksi pembayaran yang
      ditampilkan. Jika pembayaran memerlukan unggahan bukti dan pemeriksaan manual,
      perubahan tingkat, masa aktif, atau kuota baru berlaku setelah bukti disetujui.
      Zenko dapat menahan perubahan status otomatis selama bukti pembayaran yang sah
      masih dalam proses verifikasi.
    </p>
    <ul>
      <li>Selama status uji coba atau aktif, Bimbel dapat memakai fitur sesuai tingkat dan kuotanya.</li>
      <li>Setelah masa aktif berakhir, berlaku masa tenggang 3 hari. Selama masa tenggang, pembuatan materi atau aktivitas baru dibatasi, tetapi pengerjaan yang sedang berlangsung dapat diselesaikan.</li>
      <li>Setelah masa tenggang, ruang kerja ditangguhkan sampai langganan diperpanjang. Data lama, skor, rekap, dan riwayat tetap dapat dibaca sesuai hak akses.</li>
      <li>Zenko dapat mengirim pengingat menjelang akhir masa aktif melalui email atau pemberitahuan di Platform.</li>
    </ul>

    <h3>d. Anggota, Paket, dan penjualan marketplace</h3>
    <p>
      Pengelola Bimbel bertanggung jawab menetapkan peran, mengundang atau mengaktifkan
      anggota yang tepat, menjaga kerahasiaan kode bergabung, dan memastikan penggunaan
      data siswa serta materi pembelajaran memiliki dasar yang sah. Paket privat yang
      ditayangkan Bimbel dapat diakses seluruh siswa aktif Bimbel dan tidak ditampilkan
      di marketplace publik.
    </p>
    <p>
      Pemilik atau admin dapat mengajukan salinan Paket Bimbel untuk dijual di
      marketplace setelah melalui peninjauan Zenko. Bagian pendapatan Bimbel ditentukan
      oleh tingkat aktif pada saat transaksi dan disimpan sebagai bagian transaksi:
    </p>
    <div class="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th scope="col">Tingkat</th>
            <th scope="col">Bagian Bimbel</th>
            <th scope="col">Bagian Zenko</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in bimbelRevenueShare" :key="row.plan">
            <td>{{ row.plan }}</td>
            <td>{{ row.bimbel }}</td>
            <td>{{ row.zenko }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      Bagian Bimbel dihitung dari harga Paket yang benar-benar dibayar setelah diskon.
      Pembagian internal antara Bimbel dan tutor penulis menjadi tanggung jawab Bimbel.
      Refund, chargeback, dan transaksi tidak sah dapat dikurangkan dari saldo terkait
      sesuai Bagian 8. Berakhirnya langganan tidak mengubah persentase transaksi yang
      sudah selesai.
    </p>

    <hr>

    <h2 id="hubungi-kami">17. Hubungi Kami</h2>
    <p>Pertanyaan, pengaduan, atau pemberitahuan tertulis dapat disampaikan kepada:</p>
    <ul>
      <li><strong>Pengelola</strong>: PT Zenko Edukasi Digital</li>
      <li>
        <strong>Email</strong>:
        <a href="mailto:halo@zenkoedu.id">halo@zenkoedu.id</a>
      </li>
      <li>
        <strong>Telepon/WhatsApp</strong>:
        <a href="tel:+6288227663468">0882-2766-3468</a>
      </li>
      <li><strong>Alamat</strong>: Klaten, Jawa Tengah, Indonesia</li>
    </ul>

    <template #related>
      <NuxtLink to="/untuk-bimbel" class="font-semibold text-primary hover:underline">
        Untuk Bimbel
      </NuxtLink>
      <NuxtLink to="/kebijakan-privasi" class="font-semibold text-primary hover:underline">
        Kebijakan Privasi
      </NuxtLink>
      <NuxtLink to="/kebijakan-refund" class="font-semibold text-primary hover:underline">
        Kebijakan Refund
      </NuxtLink>
    </template>
  </LegalDocument>
</template>
