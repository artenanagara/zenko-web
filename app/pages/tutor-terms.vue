<script setup lang="ts">
// English file name, Indonesian URL; `path` keeps circulating links alive.
// This is the formal Tutor Terms & Conditions a tutor agrees to — distinct
// from /jadi-tutor (become-tutor.vue), which stays the marketing/application
// page. The 70:30 split is the standard and the tutor's minimum share;
// special share schedules are governed by section 3 and applied by the API.
// Public marketing keeps communicating the standard 70:30 arrangement.
definePageMeta({ path: '/syarat-tutor' })

useSeoMeta({
  title: 'Syarat dan Ketentuan Tutor | Zenko',
  description:
    'Syarat dan Ketentuan Tutor Zenko: kelayakan, kurasi, kepemilikan konten, bagi hasil 70:30, pencairan, standar mutu, dan tanggung jawab tutor.',
  ogTitle: 'Syarat dan Ketentuan Tutor | Zenko',
  ogDescription:
    'Syarat dan Ketentuan Tutor Zenko: kelayakan, kurasi, kepemilikan konten, bagi hasil 70:30, pencairan, standar mutu, dan tanggung jawab tutor.',
  ...DEFAULT_OG,
  ogUrl: 'https://zenkoedu.id/syarat-tutor',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zenkoedu.id/syarat-tutor' }],
})
</script>

<template>
  <LegalDocument lead="Syarat" accent="Tutor" updated="21 September 2026">
    <p>
      Syarat dan Ketentuan Tutor ini (&ldquo;Syarat Tutor&rdquo;) mengatur
      hubungan antara Zenko dan setiap Tutor yang menerbitkan dan menjual
      Paket di Platform. Syarat Tutor merupakan pelengkap dari
      <NuxtLink to="/ketentuan-layanan">Ketentuan Layanan</NuxtLink> Zenko dan
      berlaku bersamaan dengannya. Dengan mengajukan atau melanjutkan sebagai
      Tutor, kamu menyatakan telah membaca, memahami, dan menyetujui Syarat
      Tutor ini.
    </p>
    <p>
      Halaman ini adalah dokumen syarat dan ketentuan. Jika kamu mencari
      halaman pendaftaran atau ingin mengetahui gambaran umum menjadi tutor,
      kunjungi <NuxtLink to="/jadi-tutor">Jadi Tutor</NuxtLink>.
    </p>

    <hr>

    <h2 id="kelayakan">1. Kelayakan dan Proses Pengajuan</h2>
    <p>
      Status Tutor tidak diberikan otomatis saat mendaftar akun. Setiap calon
      Tutor mengajukan permohonan yang berisi bidang keahlian, pengalaman, dan
      contoh atau rencana portofolio Paket. Tim Zenko meninjau setiap
      pengajuan untuk menilai kualitas, akurasi kisi-kisi, dan orisinalitas
      materi sebelum menyetujuinya.
    </p>
    <ul>
      <li>Pengalaman mengajar formal tidak wajib; kurasi mengutamakan mutu dan orisinalitas materi.</li>
      <li>Tidak ada biaya pendaftaran maupun biaya langganan bulanan untuk menjadi atau tetap menjadi Tutor.</li>
      <li>Zenko dapat meminta identitas, data rekening pencairan, atau informasi verifikasi lain yang wajar.</li>
      <li>Zenko dapat menolak, menunda, atau meminta perbaikan pengajuan yang belum memenuhi standar mutu.</li>
    </ul>
    <p>
      Persetujuan pengajuan tidak menjamin performa penjualan tertentu. Zenko
      dapat sewaktu-waktu memperbarui kriteria kurasi untuk menjaga mutu
      katalog, dengan pemberitahuan yang wajar untuk perubahan material.
    </p>

    <hr>

    <h2 id="kepemilikan-konten">2. Kepemilikan dan Lisensi Konten</h2>
    <p>
      Seluruh Konten Tutor &mdash; soal, pembahasan, materi, dan berkas lain
      yang kamu unggah &mdash; tetap menjadi milikmu atau pemegang haknya yang
      sah. Zenko tidak mengklaim kepemilikan atas Konten Tutor.
    </p>
    <p>
      Dengan menerbitkan Konten Tutor, kamu memberi Zenko lisensi
      non-eksklusif, berlaku selama Konten tersebut tersedia di Platform, dan
      bebas royalti untuk menyimpan, menampilkan, memproses, menjalankan
      penilaian otomatis (auto-grading) melalui sistem CBT, mencadangkan, dan
      mendistribusikan Konten kepada pembeli, serta menggunakannya secara
      wajar untuk mempromosikan Paket di dalam dan luar Platform.
    </p>
    <p>
      Kamu menjamin bahwa Konten Tutor merupakan karya asli atau digunakan
      berdasarkan izin yang sah untuk tujuan komersial, dan tidak melanggar
      hak cipta, merek, privasi, maupun hak pihak lain.
    </p>

    <hr>

    <h2 id="bagi-hasil">3. Bagi Hasil dan Biaya</h2>
    <p>
      Setiap penjualan Paket dibagi <strong>70% untuk Tutor</strong> dan
      <strong>30% untuk Zenko</strong>, dihitung dari harga yang benar-benar
      dibayar pembeli setelah diskon. Persentase ini adalah bagian standar dan
      <strong>bagian minimum Tutor</strong>: Zenko tidak akan menetapkan bagian
      Tutor di bawah 70% tanpa persetujuan tertulis dari Tutor. Tidak ada biaya
      pendaftaran maupun biaya langganan bulanan, dan kamu bebas menentukan
      serta menyesuaikan harga setiap Paketmu sendiri kapan saja melalui
      dashboard tutor.
    </p>
    <p>
      <strong>Bagi hasil khusus.</strong> Setelah kamu menerima versi Syarat
      Tutor yang memuat ketentuan ini, Zenko dapat memberikan bagian yang lebih
      tinggi dari bagian standar kepadamu, secara tetap atau untuk jangka waktu
      tertentu. Persentase, tanggal mulai, dan tanggal berakhirnya bila ada
      dipublikasikan melalui dashboard tutor. Zenko juga mengirim email sebagai
      pengingat. Pemberian tersebut merupakan insentif dari Zenko dan bagian
      dari pelaksanaan Syarat Tutor, bukan pengurangan atas bagian standar 70%.
      Ketentuan yang berlaku untuk bagi hasil khusus:
    </p>
    <ul>
      <li>Persentase yang berlaku untuk setiap penjualan adalah persentase yang aktif <strong>saat pembeli membuat pesanan</strong>, dan dicatat pada riwayat penjualanmu. Perubahan persentase tidak memengaruhi penjualan yang sudah terjadi.</li>
      <li>Bagi hasil khusus berjangka berakhir dengan sendirinya pada tanggal berakhir yang disampaikan sejak awal, lalu kembali ke bagian standar. Berakhirnya bagi hasil khusus pada tanggal tersebut <strong>bukan merupakan perubahan persentase</strong> sebagaimana dimaksud Bagian 9.</li>
      <li>Bagi hasil khusus yang <strong>belum mulai berlaku</strong> dapat diubah atau dibatalkan oleh Zenko sebelum tanggal mulainya.</li>
      <li>Bagi hasil khusus yang <strong>sedang berlaku</strong> tidak akan diturunkan atau diakhiri lebih cepat dari tanggal berakhirnya tanpa pemberitahuan sedikitnya 30 hari, sesuai Bagian 9.</li>
      <li>Riwayat pemberitahuan di dashboard merupakan catatan utama tanggal publikasi. Kegagalan email pengingat tidak menghapus pemberitahuan yang sudah tersedia di dashboard.</li>
      <li>Persentase bagi hasil khusus merupakan informasi komersial <strong>rahasia</strong>. Zenko membatasi akses kepada personel yang memerlukannya untuk operasi keuangan, audit, hukum, atau penanganan insiden. Kamu tidak mengumumkannya kepada publik atau Tutor lain, kecuali pengungkapan diwajibkan hukum, diperlukan untuk perpajakan, atau diberikan kepada penasihat profesional yang juga terikat kerahasiaan.</li>
    </ul>
    <p>
      Porsi milik Zenko digunakan untuk menutup biaya pemrosesan
      pembayaran otomatis melalui iPaymu, biaya server dan hosting sistem CBT
      engine, serta operasional Platform secara umum. Rincian lengkap
      mekanisme bagi hasil, termasuk pengecualian dan potongan karena refund
      atau chargeback, diatur pada Bagian 7 Ketentuan Layanan.
    </p>

    <hr>

    <h2 id="pencairan">4. Pencairan Penghasilan</h2>
    <p>
      Penghasilan dari setiap transaksi yang berhasil tercatat otomatis di
      dashboard tutor. Pencairan diproses sesuai jadwal dan ketentuan
      pencairan yang berlaku, yang dapat dilihat kapan saja di dashboard
      tutor &mdash; termasuk saldo minimum, estimasi waktu proses, dan status
      setiap permintaan pencairan.
    </p>
    <p>
      Refund, chargeback, transaksi yang terbukti tidak sah, atau kewajiban
      lain yang terkait dengan Paketmu dapat dikurangkan dari saldo yang
      belum dicairkan.
    </p>

    <hr>

    <h2 id="standar-mutu">5. Standar Mutu dan Konten yang Dilarang</h2>
    <p>Setiap Paket yang diterbitkan wajib memenuhi standar mutu berikut:</p>
    <ul>
      <li>Soal dan pembahasan disusun dengan cermat, dengan kunci jawaban yang benar dan konsisten;</li>
      <li>Deskripsi, jumlah soal, cakupan materi, dan klaim manfaat sesuai dengan isi Paket yang sebenarnya;</li>
      <li>Bahasa dan konten bersifat sopan, tidak menyinggung SARA, kekerasan, atau materi dewasa.</li>
    </ul>
    <p>Konten Tutor tidak boleh memuat atau berupa:</p>
    <ul>
      <li>Plagiarisme atau karya yang disalin dari pihak lain tanpa izin yang sah;</li>
      <li>Soal ujian resmi yang bocor, materi rahasia, atau bahan yang diperoleh secara melawan hukum;</li>
      <li>Kunci jawaban yang secara sistematis salah atau menyesatkan;</li>
      <li>Malware, tautan berbahaya, atau berkas yang mengganggu keamanan sistem;</li>
      <li>Konten yang melanggar hukum, diskriminatif, atau melanggar hak pihak lain.</li>
    </ul>
    <p>
      Zenko dapat menolak, menurunkan, atau meminta perbaikan Paket yang tidak
      memenuhi standar ini, sebagaimana diatur pada Bagian 4 Ketentuan Layanan.
    </p>

    <hr>

    <h2 id="pajak">6. Kewajiban Pajak</h2>
    <p>
      Tutor bertanggung jawab penuh atas kewajiban perpajakan pribadinya atas
      penghasilan yang diperoleh dari Zenko, sesuai peraturan perundang-undangan
      perpajakan Indonesia yang berlaku, kecuali Zenko diwajibkan melakukan
      pemotongan atau pelaporan pajak tertentu berdasarkan hukum.
    </p>

    <hr>

    <h2 id="penangguhan">7. Penangguhan dan Penghentian Status Tutor</h2>
    <p>
      Zenko dapat membatasi, menangguhkan, atau menghentikan status Tutor
      serta menahan pencairan yang terkait selama pemeriksaan, apabila
      terdapat pelanggaran Syarat Tutor, Ketentuan Layanan, kecurangan,
      pelanggaran hak pihak lain, atau risiko keamanan. Untuk pelanggaran yang
      dapat diperbaiki, Zenko akan berupaya memberikan pemberitahuan dan
      kesempatan perbaikan yang wajar; pelanggaran berat dapat ditindak
      segera.
    </p>
    <p>
      Penghentian status Tutor tidak menghapus kewajiban yang telah timbul,
      lisensi yang diperlukan untuk terus melayani pembeli yang sudah memiliki
      akses ke Paket sebelumnya, maupun catatan transaksi yang wajib disimpan.
    </p>

    <hr>

    <h2 id="sengketa">8. Penyelesaian Sengketa</h2>
    <p>
      Sengketa antara Tutor dan Zenko terkait Syarat Tutor ini diselesaikan
      dengan cara yang sama sebagaimana diatur pada Bagian 15 Ketentuan
      Layanan, yaitu diupayakan lebih dahulu melalui musyawarah, dengan
      domisili hukum di Pengadilan Negeri Klaten apabila diperlukan.
    </p>

    <hr>

    <h2 id="perubahan">9. Perubahan Syarat Tutor</h2>
    <p>
      Zenko dapat memperbarui Syarat Tutor ini dari waktu ke waktu. Tanggal
      pembaruan ditampilkan di bagian atas. Perubahan material &mdash;
      termasuk penurunan persentase bagi hasil yang sedang berlaku untukmu
      &mdash; akan diberitahukan sedikitnya 30 hari sebelum berlaku dan tidak
      berlaku surut terhadap transaksi yang sudah selesai, sebagaimana diatur
      pada Bagian 7 Ketentuan Layanan. Kenaikan persentase dapat berlaku segera.
      Berakhirnya bagi hasil khusus pada tanggal yang telah ditetapkan, serta
      pembatalan bagi hasil khusus yang belum mulai berlaku, diatur pada Bagian 3.
    </p>

    <hr>

    <h2 id="hubungi-kami">10. Hubungi Kami</h2>
    <p>Pertanyaan seputar status atau kewajiban Tutor dapat disampaikan ke:</p>
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
      <NuxtLink to="/ketentuan-layanan" class="font-semibold text-primary hover:underline">
        Ketentuan Layanan
      </NuxtLink>
      <NuxtLink to="/jadi-tutor" class="font-semibold text-primary hover:underline">
        Jadi Tutor
      </NuxtLink>
    </template>
  </LegalDocument>
</template>
