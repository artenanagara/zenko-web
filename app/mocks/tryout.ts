import type { OptionLabel, TryoutBlueprint, TryoutMode, TryoutQuestion, TryoutSection, TryoutTheme } from '#shared/types/tryout'
import { mockPackages } from '~/mocks/catalog'

/**
 * Question banks and section blueprints for the try out workspace.
 *
 * Every package's real catalogue numbers (120 soal, 100 menit, …) describe
 * the product listing, not a bank of hand-written items this fixture could
 * ever hold. Rather than pad the difference with repeated or generated
 * filler, each blueprint below is a shorter, fully authored "sesi latihan"
 * that runs the exact rules of its real system — sequential subtests, a
 * countdown per subtest, no going back — at a size someone can actually sit
 * through while testing the workspace.
 *
 * Scoring follows the two real Indonesian CBT models:
 * - objective items (TWK, TIU, TKD, …): one correct option worth `points`
 *   (5, same ceiling BKN uses), 0 otherwise.
 * - situational items (TKP, AKHLAK): every option scores 1–5, so there is no
 *   wrong answer, only a better one.
 */

const LABELS: OptionLabel[] = ['A', 'B', 'C', 'D', 'E']
let seq = 0

function objective(text: string, options: string[], correctIndex: number, points = 5): TryoutQuestion {
  return {
    id: `obj_${seq++}`,
    kind: 'objective',
    text,
    options: options.map((t, i) => ({ label: LABELS[i]!, text: t })),
    correct: LABELS[correctIndex]!,
    points,
  }
}

/** `scoreOrder` is read alongside `options`: same index, so option[0] scores scoreOrder[0]. */
function situational(text: string, options: string[], scoreOrder: number[]): TryoutQuestion {
  const scores = {} as Record<OptionLabel, number>
  options.forEach((_, i) => { scores[LABELS[i]!] = scoreOrder[i]! })
  return {
    id: `sit_${seq++}`,
    kind: 'situational',
    text,
    options: options.map((t, i) => ({ label: LABELS[i]!, text: t })),
    scores,
  }
}

// ---------------------------------------------------------------------------
// SKD/CPNS & Kedinasan — Tes Wawasan Kebangsaan
// ---------------------------------------------------------------------------
const TWK: TryoutQuestion[] = [
  objective(
    'Pengesahan Pancasila sebagai dasar negara termuat dalam Pembukaan UUD 1945 pada alinea ke berapa?',
    ['Kesatu', 'Kedua', 'Ketiga', 'Keempat', 'Tidak disebutkan secara eksplisit'],
    3,
  ),
  objective(
    'Pada lambang negara Garuda Pancasila, semboyan "Bhinneka Tunggal Ika" tertulis pada pita yang dicengkeram oleh...',
    ['Paruh burung Garuda', 'Kedua kaki burung Garuda', 'Sayap kanan', 'Sayap kiri', 'Ekor burung Garuda'],
    1,
  ),
  objective(
    'Nilai musyawarah untuk mufakat dalam pengambilan keputusan bersama merupakan pengamalan Pancasila sila ke...',
    ['Kedua', 'Ketiga', 'Keempat', 'Kelima', 'Pertama'],
    2,
  ),
  objective(
    'Sejak reformasi, UUD 1945 telah diamandemen sebanyak...',
    ['2 kali', '3 kali', '4 kali', '5 kali', 'Belum pernah diamandemen'],
    2,
  ),
  objective(
    'Lembaga negara yang berwenang mengubah dan menetapkan Undang-Undang Dasar adalah...',
    ['Dewan Perwakilan Rakyat', 'Majelis Permusyawaratan Rakyat', 'Mahkamah Agung', 'Mahkamah Konstitusi', 'Presiden'],
    1,
  ),
  objective(
    'Contoh sikap bela negara yang paling tepat dilakukan seorang pelajar dalam kehidupan sehari-hari adalah...',
    [
      'Ikut tawuran membela nama sekolah',
      'Belajar dengan tekun untuk memajukan bangsa',
      'Menolak pelajaran yang dianggap sulit',
      'Acuh terhadap kondisi lingkungan sekitar',
      'Hanya mengikuti upacara bendera saat diawasi guru',
    ],
    1,
  ),
]

// ---------------------------------------------------------------------------
// SKD/CPNS, Kedinasan & BUMN — Tes Intelegensi Umum / Tes Kemampuan Dasar
// (verbal, numerik, logika — sama polanya di kedua ujian, dipisah biar tak
// ada soal identik di satu sesi jika seseorang membeli paket dari dua
// kategori ini)
// ---------------------------------------------------------------------------
const TIU: TryoutQuestion[] = [
  objective('Sinonim kata "ELABORASI" adalah...', ['Ringkasan', 'Penjelasan rinci', 'Kesimpulan', 'Pengulangan', 'Penolakan'], 1),
  objective('Antonim kata "KONTRAKSI" adalah...', ['Penyusutan', 'Perlambatan', 'Ekspansi', 'Pemadatan', 'Pengetatan'], 2),
  objective('DOKTER : PASIEN = GURU : ...', ['Sekolah', 'Kelas', 'Murid', 'Kurikulum', 'Papan tulis'], 2),
  objective('Lanjutan deret angka: 2, 5, 10, 17, 26, ...', ['30', '33', '35', '37', '39'], 3),
  objective('Lanjutan deret angka: 3, 6, 12, 24, ...', ['30', '36', '42', '48', '60'], 3),
  objective(
    'Seorang pedagang membeli barang seharga Rp80.000 dan menjualnya dengan untung 25%. Harga jual barang tersebut adalah...',
    ['Rp90.000', 'Rp95.000', 'Rp100.000', 'Rp105.000', 'Rp110.000'],
    2,
  ),
  objective('60% dari 250 adalah...', ['120', '130', '140', '150', '160'], 3),
  objective(
    'Premis 1: Semua siswa yang rajin belajar lulus ujian. Premis 2: Andi tidak lulus ujian. Kesimpulan yang tepat adalah...',
    ['Andi rajin belajar', 'Andi tidak rajin belajar', 'Andi akan lulus tahun depan', 'Semua siswa lulus ujian', 'Tidak dapat disimpulkan'],
    1,
  ),
]

// ---------------------------------------------------------------------------
// SKD/CPNS & Kedinasan — Tes Karakteristik Pribadi
// A selalu skor 5 (paling proaktif/etis), menurun sampai E skor 1 — bukan
// berarti opsi terakhir "salah", di TKP tidak ada jawaban salah, hanya lebih
// atau kurang tepat dibanding situasi ideal.
// ---------------------------------------------------------------------------
const TKP: TryoutQuestion[] = [
  situational(
    'Atasan memberi tugas mendadak yang harus selesai hari ini, padahal Anda sudah punya janji pribadi. Sikap Anda?',
    [
      'Menyelesaikan tugas sebaik mungkin dan menjadwalkan ulang janji pribadi',
      'Mengerjakan tugas sambil sesekali mengeluh ke rekan kerja',
      'Mengerjakan seadanya agar cepat selesai lalu pergi tepat waktu',
      'Meminta rekan lain mengerjakan tugas tersebut untuk Anda',
      'Menolak tugas karena sudah ada janji lebih dulu',
    ],
    [5, 3, 2, 2, 1],
  ),
  situational(
    'Seorang warga datang mengeluh dengan nada tinggi karena pengurusan dokumennya lambat. Anda akan...',
    [
      'Mendengarkan keluhannya, menjelaskan prosesnya dengan tenang, dan membantu mempercepat sesuai prosedur',
      'Menjelaskan seadanya lalu meminta warga tersebut menunggu',
      'Membalas dengan nada yang sama karena merasa disalahkan',
      'Mengarahkan ke petugas lain agar tidak berurusan langsung',
      'Mengabaikan dan melanjutkan pekerjaan lain',
    ],
    [5, 3, 1, 2, 1],
  ),
  situational(
    'Tim Anda harus mengadopsi sistem kerja digital baru yang belum pernah dipakai sebelumnya. Respons Anda?',
    [
      'Mempelajarinya lebih dulu lalu membantu rekan yang kesulitan',
      'Menunggu pelatihan resmi sebelum mulai menggunakannya',
      'Menggunakan seperlunya sambil bertanya jika buntu',
      'Tetap memakai cara lama karena lebih terbiasa',
      'Menolak karena menambah beban kerja',
    ],
    [5, 3, 3, 2, 1],
  ),
  situational(
    'Anda satu tim dengan rekan dari latar belakang suku dan agama yang berbeda dan sedang ada gesekan pendapat. Anda...',
    [
      'Menjadi penengah dan mencari solusi yang menghormati semua pihak',
      'Memihak rekan yang sependapat dengan Anda',
      'Diam saja agar tidak ikut terlibat masalah',
      'Melaporkan langsung ke atasan tanpa mencoba menengahi',
      'Menghindari rekan yang berbeda pendapat setelahnya',
    ],
    [5, 1, 2, 3, 1],
  ),
  situational(
    'Anda menemukan kesalahan pada laporan yang sudah ditandatangani atasan sebelum dikirim ke instansi lain. Anda...',
    [
      'Segera melaporkan temuan tersebut kepada atasan agar dikoreksi sebelum dikirim',
      'Membiarkannya karena bukan tanggung jawab Anda',
      'Memperbaiki sendiri tanpa memberi tahu siapa pun',
      'Mengirim laporan apa adanya agar tidak terlambat',
      'Membahasnya dengan rekan kerja terlebih dahulu sebelum bertindak',
    ],
    [5, 1, 2, 1, 3],
  ),
  situational(
    'Beban kerja Anda menumpuk karena dua proyek berjalan bersamaan dengan tenggat yang berdekatan. Anda...',
    [
      'Menyusun prioritas berdasarkan urgensi dan berkoordinasi dengan atasan bila perlu penyesuaian',
      'Mengerjakan yang paling mudah lebih dulu tanpa mempertimbangkan tenggat',
      'Meminta perpanjangan waktu untuk semua pekerjaan',
      'Bekerja lembur tanpa menyusun rencana yang jelas',
      'Menyerahkan salah satu proyek ke rekan tanpa berkoordinasi',
    ],
    [5, 2, 2, 3, 1],
  ),
]

// ---------------------------------------------------------------------------
// SKB — Kompetensi Pedagogik & Kompetensi Bidang (formasi guru, generik)
// ---------------------------------------------------------------------------
const PEDAGOGIK: TryoutQuestion[] = [
  objective(
    'Penilaian yang dilakukan sepanjang proses pembelajaran untuk memantau perkembangan siswa disebut penilaian...',
    ['Sumatif', 'Formatif', 'Diagnostik', 'Selektif', 'Normatif'],
    1,
  ),
  objective(
    'Pendekatan pembelajaran yang menempatkan siswa aktif mencari dan mengonstruksi pengetahuannya sendiri disebut...',
    ['Behavioristik', 'Konstruktivistik', 'Humanistik murni', 'Esensialisme', 'Perenialisme'],
    1,
  ),
  objective(
    'Ranah kognitif tertinggi dalam Taksonomi Bloom revisi adalah...',
    ['Mengingat', 'Memahami', 'Menerapkan', 'Menganalisis', 'Mencipta'],
    4,
  ),
  objective(
    'Rencana Pelaksanaan Pembelajaran (RPP) sebaiknya disusun dengan mempertimbangkan hal berikut, kecuali...',
    ['Karakteristik peserta didik', 'Tujuan pembelajaran', 'Kondisi ruang guru', 'Alokasi waktu', 'Sumber belajar'],
    2,
  ),
  objective(
    'Ketika seorang siswa kesulitan memahami materi dengan metode ceramah, langkah paling tepat guru adalah...',
    [
      'Mengulang ceramah dengan volume lebih keras',
      'Memvariasikan metode sesuai gaya belajar siswa',
      'Membiarkan siswa mencari sendiri di luar kelas',
      'Menurunkan standar penilaian untuk siswa tersebut',
      'Memindahkan siswa ke kelas lain',
    ],
    1,
  ),
]

const KOMPETENSI_BIDANG: TryoutQuestion[] = [
  objective(
    'Kegiatan mengaitkan materi baru dengan pengalaman siswa sehari-hari termasuk prinsip pembelajaran...',
    ['Kontekstual', 'Abstrak', 'Hafalan', 'Satu arah', 'Tanpa media'],
    0,
  ),
  objective(
    'Media pembelajaran yang paling tepat untuk menjelaskan konsep yang bersifat abstrak dan berjenjang adalah...',
    ['Diagram atau bagan alur', 'Teks naratif panjang', 'Ceramah tanpa visual', 'Soal pilihan ganda', 'Catatan lisan'],
    0,
  ),
  objective(
    'Evaluasi pembelajaran yang mengukur pencapaian di akhir suatu program disebut penilaian...',
    ['Formatif', 'Sumatif', 'Diagnostik awal', 'Harian tanpa bobot', 'Observasi bebas'],
    1,
  ),
  objective(
    'Prinsip diferensiasi dalam pembelajaran berarti guru...',
    [
      'Memberi materi dan tugas yang sama persis untuk semua siswa',
      'Menyesuaikan proses, konten, atau produk belajar dengan kebutuhan siswa',
      'Hanya fokus pada siswa dengan nilai tertinggi',
      'Meniadakan penilaian individual',
      'Mengabaikan gaya belajar siswa',
    ],
    1,
  ),
  objective(
    'Umpan balik yang efektif bagi siswa sebaiknya bersifat...',
    ['Umum dan tidak spesifik', 'Spesifik, tepat waktu, dan membangun', 'Hanya berupa angka', 'Diberikan sebulan setelah tugas', 'Berupa kritik tanpa solusi'],
    1,
  ),
]

// ---------------------------------------------------------------------------
// BUMN — Tes Kemampuan Dasar, Core Values AKHLAK, Bahasa Inggris
// ---------------------------------------------------------------------------
const TKD_BUMN: TryoutQuestion[] = [
  objective('Sinonim kata "INOVATIF" adalah...', ['Kaku', 'Kreatif dan pembaru', 'Konservatif', 'Statis', 'Pasif'], 1),
  objective('MODAL : USAHA = BENIH : ...', ['Petani', 'Sawah', 'Tanaman', 'Pupuk', 'Panen'], 2),
  objective('Lanjutan deret: 1, 4, 9, 16, 25, ...', ['30', '32', '36', '40', '45'], 2),
  objective(
    'Sebuah perusahaan menargetkan produksi naik 20% dari 500 unit menjadi...',
    ['520 unit', '550 unit', '600 unit', '620 unit', '650 unit'],
    2,
  ),
  objective(
    'Jika semua pegawai teladan datang tepat waktu, dan Rina selalu datang tepat waktu, maka...',
    [
      'Rina pasti pegawai teladan',
      'Rina belum tentu pegawai teladan',
      'Semua pegawai adalah Rina',
      'Rina tidak mungkin pegawai teladan',
      'Pernyataan tidak berhubungan',
    ],
    1,
  ),
  objective('Antonim kata "SENTRALISASI" adalah...', ['Konsentrasi', 'Desentralisasi', 'Monopoli', 'Integrasi', 'Unifikasi'], 1),
]

const AKHLAK: TryoutQuestion[] = [
  situational(
    'Anda dipercaya memegang anggaran proyek. Di tengah jalan Anda menemukan celah untuk memakainya sedikit demi keperluan pribadi tanpa ketahuan. Sikap Anda?',
    [
      'Tetap menggunakan anggaran hanya sesuai peruntukannya dan melaporkan penggunaannya secara transparan',
      'Memakai sebagian kecil karena nanti juga akan dikembalikan',
      'Memakainya karena tidak ada yang mengawasi',
      'Meminjam dulu, dikembalikan setelah gajian',
      'Menggunakannya asal ada bukti palsu pendukung',
    ],
    [5, 2, 1, 2, 1],
  ),
  situational(
    'Perusahaan mengadopsi sistem kerja baru yang menuntut Anda mempelajari alat digital yang belum pernah Anda pakai. Anda...',
    [
      'Mempelajarinya secara mandiri dan proaktif agar kompetensi terus berkembang',
      'Menunggu training resmi tanpa mencoba lebih dulu',
      'Mengerjakan dengan cara lama sebisa mungkin',
      'Meminta rekan mengerjakan bagian yang memakai sistem baru',
      'Menolak menggunakan sistem tersebut',
    ],
    [5, 3, 2, 2, 1],
  ),
  situational(
    'Anda dan tim lintas divisi harus menyelesaikan proyek bersama, namun ada perbedaan cara kerja yang cukup mencolok. Anda...',
    [
      'Mengajak diskusi untuk menyelaraskan cara kerja demi tujuan bersama',
      'Mengikuti cara kerja divisi Anda sendiri saja',
      'Membiarkan konflik berlarut karena bukan urusan Anda',
      'Melapor ke atasan tanpa mencoba menyelesaikan bersama tim',
      'Menghindari kerja sama dengan divisi tersebut selanjutnya',
    ],
    [5, 2, 1, 3, 1],
  ),
  situational(
    'Perusahaan tempat Anda bekerja sedang menghadapi masa sulit dan meminta karyawan bersabar soal tunjangan. Sikap Anda?',
    [
      'Tetap bekerja profesional dan mendukung upaya perusahaan bangkit',
      'Mencari pekerjaan lain sambil tetap bekerja seadanya di sini',
      'Mengeluh terbuka ke rekan-rekan agar semua ikut kecewa',
      'Menurunkan performa kerja karena merasa dirugikan',
      'Segera resign tanpa pemberitahuan',
    ],
    [5, 2, 1, 1, 1],
  ),
  situational(
    'Rekan satu tim kesulitan menyelesaikan tugasnya dan berisiko membuat proyek tim terlambat. Anda...',
    [
      'Menawarkan bantuan sambil tetap menyelesaikan tugas Anda sendiri',
      'Mengerjakan seluruh tugas rekan tersebut agar cepat selesai',
      'Melaporkan kelambatannya ke atasan tanpa menawarkan bantuan',
      'Membiarkan karena itu bukan tanggung jawab Anda',
      'Mengkritiknya di depan tim lain',
    ],
    [5, 2, 2, 1, 1],
  ),
]

const ENG_BUMN: TryoutQuestion[] = [
  objective('Choose the correct sentence.', [
    'She don\'t like coffee.',
    'She doesn\'t likes coffee.',
    'She doesn\'t like coffee.',
    'She not like coffee.',
    'She isn\'t like coffee.',
  ], 2),
  objective('The word "ABUNDANT" is closest in meaning to...', ['Scarce', 'Plentiful', 'Fragile', 'Delayed', 'Silent'], 1),
  objective('Choose the correct form: "By the time we arrived, the meeting already ___."', ['starts', 'started', 'had started', 'has started', 'starting'], 2),
  objective('The opposite of "INCREASE" is...', ['Raise', 'Decrease', 'Expand', 'Boost', 'Grow'], 1),
  objective('Choose the correct preposition: "The report is due ___ Friday."', ['in', 'at', 'on', 'by', 'to'], 2),
]

// ---------------------------------------------------------------------------
// SNBT — Penalaran Umum, Literasi, Penalaran Matematika, Pengetahuan Kuantitatif
// ---------------------------------------------------------------------------
const PU: TryoutQuestion[] = [
  objective(
    'Semua pegawai yang disiplin selalu hadir tepat waktu. Sebagian pegawai bagian keuangan disiplin. Simpulan yang tepat adalah...',
    [
      'Semua pegawai bagian keuangan hadir tepat waktu',
      'Sebagian pegawai bagian keuangan hadir tepat waktu',
      'Tidak ada pegawai keuangan yang hadir tepat waktu',
      'Semua pegawai yang hadir tepat waktu ada di bagian keuangan',
      'Tidak dapat ditarik simpulan apa pun',
    ],
    1,
  ),
  objective(
    'Jika hujan turun maka jalan menjadi licin. Jalan tidak licin. Maka...',
    ['Hujan turun', 'Hujan tidak turun', 'Jalan basah', 'Tidak dapat disimpulkan', 'Hujan mungkin turun'],
    1,
  ),
  objective('KOMPOR : PANAS = KULKAS : ...', ['Listrik', 'Dingin', 'Makanan', 'Dapur', 'Es'], 1),
  objective(
    'Sebuah survei menunjukkan penjualan payung naik setiap kali curah hujan tinggi. Hubungan sebab akibat yang paling logis adalah...',
    [
      'Curah hujan tinggi menyebabkan penjualan payung naik',
      'Penjualan payung menyebabkan curah hujan naik',
      'Kedua hal sama sekali tidak berhubungan',
      'Curah hujan turun karena payung terjual banyak',
      'Data tersebut tidak valid untuk dianalisis',
    ],
    0,
  ),
  objective(
    'Manakah pola yang secara logis melanjutkan deret huruf: A, C, F, J, O, ...?',
    ['S', 'T', 'U', 'V', 'W'],
    2,
  ),
]

const LIT: TryoutQuestion[] = [
  objective(
    'Bacaan: "Penggunaan energi terbarukan di Indonesia meningkat 12% pada tahun terakhir, didorong oleh turunnya biaya panel surya." Gagasan utama paragraf tersebut adalah...',
    [
      'Biaya panel surya di Indonesia sangat mahal',
      'Peningkatan penggunaan energi terbarukan didorong turunnya biaya panel surya',
      'Indonesia tidak lagi menggunakan energi fosil',
      'Panel surya hanya digunakan di kota besar',
      'Energi terbarukan menurun setiap tahun',
    ],
    1,
  ),
  objective(
    'Kata "signifikan" pada kalimat "Kenaikan harga pangan berdampak signifikan terhadap daya beli masyarakat" paling dekat maknanya dengan...',
    ['Berarti', 'Tidak berarti', 'Sedikit', 'Sementara', 'Meragukan'],
    0,
  ),
  objective(
    'Read: "Despite the heavy rain, the marathon continued as scheduled." What can be inferred from the sentence?',
    [
      'The marathon was cancelled',
      'The organizers decided to proceed despite bad weather',
      'The rain stopped before the marathon',
      'The marathon was moved indoors',
      'No runners participated',
    ],
    1,
  ),
  objective(
    'Kalimat yang paling efektif dan sesuai kaidah adalah...',
    [
      'Bagi para peserta yang belum absen, harap segera absen.',
      'Para peserta yang belum absen harap segera absen.',
      'Kepada para peserta yang belum absen dipersilakan absen.',
      'Peserta-peserta yang belum melakukan absen segera absen ya.',
      'Untuk para peserta belum absen agar segera absen.',
    ],
    1,
  ),
  objective(
    'Choose the word that best completes: "The committee ___ the proposal after a lengthy discussion."',
    ['approve', 'approving', 'approved', 'approves', 'to approve'],
    2,
  ),
]

const PM: TryoutQuestion[] = [
  objective(
    'Sebuah toko memberi diskon 20% untuk barang seharga Rp150.000, lalu ditambah diskon member 10% dari harga setelah diskon pertama. Harga akhir barang tersebut adalah...',
    ['Rp105.000', 'Rp108.000', 'Rp110.000', 'Rp112.500', 'Rp120.000'],
    1,
  ),
  objective(
    'Kecepatan rata-rata sebuah kereta 80 km/jam. Waktu yang dibutuhkan untuk menempuh jarak 200 km adalah...',
    ['2 jam', '2,5 jam', '3 jam', '3,5 jam', '4 jam'],
    1,
  ),
  objective(
    'Perbandingan uang Andi dan Budi adalah 3:5. Jika total uang mereka Rp240.000, uang Budi adalah...',
    ['Rp90.000', 'Rp120.000', 'Rp135.000', 'Rp150.000', 'Rp160.000'],
    3,
  ),
  objective(
    'Sebuah tangki terisi 40% penuh. Jika ditambahkan 30 liter, tangki menjadi 70% penuh. Kapasitas total tangki tersebut adalah...',
    ['80 liter', '90 liter', '100 liter', '110 liter', '120 liter'],
    2,
  ),
  objective(
    'Rata-rata nilai 5 siswa adalah 78. Jika nilai satu siswa baru ditambahkan, rata-rata menjadi 80. Nilai siswa baru tersebut adalah...',
    ['84', '86', '88', '90', '92'],
    3,
  ),
]

const PK: TryoutQuestion[] = [
  objective('Hasil dari 3/4 + 2/5 adalah...', ['1 3/20', '1 1/5', '1 1/4', '19/20', '17/20'], 0),
  objective('Jika x + 7 = 15, maka nilai 3x adalah...', ['21', '24', '27', '30', '18'], 1),
  objective('Luas persegi panjang dengan panjang 12 cm dan lebar 7 cm adalah...', ['70 cm²', '76 cm²', '84 cm²', '90 cm²', '96 cm²'], 2),
  objective('Akar dari 169 adalah...', ['11', '12', '13', '14', '15'], 2),
  objective('Lanjutan deret: 100, 90, 81, 73, 66, ...', ['58', '59', '60', '61', '62'], 2),
]

// ---------------------------------------------------------------------------
// TKA — mata pelajaran Saintek & Soshum
// ---------------------------------------------------------------------------
const MTK: TryoutQuestion[] = [
  objective('Hasil dari 2x² - 3x + 1 = 0 memiliki akar-akar berjumlah...', ['-1,5', '1,5', '2', '-2', '3'], 1),
  objective('Nilai dari log 100 + log 10 adalah...', ['2', '3', '4', '5', '1'], 1),
  objective('Turunan pertama dari f(x) = 3x² + 2x adalah...', ['6x + 2', '3x + 2', '6x', 'x² + 2', '6x²'], 0),
  objective('Sebuah barisan aritmetika memiliki suku pertama 4 dan beda 3. Suku ke-10 adalah...', ['28', '30', '31', '33', '34'], 2),
  objective('Keliling lingkaran dengan jari-jari 7 cm (π = 22/7) adalah...', ['22 cm', '38,5 cm', '44 cm', '49 cm', '154 cm'], 2),
]

const FIS: TryoutQuestion[] = [
  objective('Satuan SI untuk gaya adalah...', ['Joule', 'Watt', 'Newton', 'Pascal', 'Ampere'], 2),
  objective('Sebuah benda bermassa 2 kg bergerak dengan percepatan 3 m/s². Gaya yang bekerja adalah...', ['3 N', '5 N', '6 N', '9 N', '12 N'], 2),
  objective('Hukum kekekalan energi menyatakan bahwa energi...', [
    'Selalu bertambah',
    'Selalu berkurang',
    'Tidak dapat diciptakan atau dimusnahkan, hanya berubah bentuk',
    'Hanya ada dalam bentuk energi kinetik',
    'Tidak dapat diukur',
  ], 2),
  objective('Cahaya merambat dalam bentuk...', ['Gelombang longitudinal', 'Gelombang transversal', 'Partikel padat', 'Arus listrik', 'Medan magnet statis'], 1),
  objective('Alat yang digunakan untuk mengukur kuat arus listrik adalah...', ['Voltmeter', 'Amperemeter', 'Barometer', 'Termometer', 'Manometer'], 1),
]

const KIM: TryoutQuestion[] = [
  objective('Rumus kimia untuk garam dapur adalah...', ['NaOH', 'NaCl', 'HCl', 'CaCO3', 'KCl'], 1),
  objective('Nomor atom suatu unsur menunjukkan jumlah...', ['Neutron', 'Proton', 'Elektron valensi', 'Isotop', 'Massa atom relatif'], 1),
  objective('Larutan dengan pH kurang dari 7 bersifat...', ['Basa', 'Netral', 'Asam', 'Garam', 'Non-elektrolit'], 2),
  objective('Reaksi eksoterm adalah reaksi yang...', ['Menyerap kalor dari lingkungan', 'Melepas kalor ke lingkungan', 'Tidak melibatkan energi', 'Hanya terjadi pada suhu rendah', 'Selalu bersifat reversibel'], 1),
  objective('Ikatan yang terbentuk karena serah terima elektron disebut ikatan...', ['Kovalen', 'Ionik', 'Logam', 'Hidrogen', 'Van der Waals'], 1),
]

const BIO: TryoutQuestion[] = [
  objective('Organel sel yang berperan sebagai tempat respirasi seluler adalah...', ['Ribosom', 'Mitokondria', 'Lisosom', 'Badan Golgi', 'Vakuola'], 1),
  objective('Proses fotosintesis pada tumbuhan menghasilkan...', ['Karbon dioksida dan air', 'Glukosa dan oksigen', 'Nitrogen dan air', 'Karbon dioksida dan glukosa', 'Oksigen dan nitrogen'], 1),
  objective('Pewarisan sifat golongan darah pada manusia mengikuti pola...', ['Dominan penuh', 'Kodominan', 'Resesif total', 'Terpaut kromosom Y', 'Tidak diwariskan'], 1),
  objective('Sistem organ yang bertanggung jawab mengedarkan darah ke seluruh tubuh adalah sistem...', ['Respirasi', 'Ekskresi', 'Sirkulasi', 'Pencernaan', 'Saraf'], 2),
  objective('Proses pembelahan sel yang menghasilkan sel anak dengan jumlah kromosom setengah dari induknya disebut...', ['Mitosis', 'Meiosis', 'Sitokinesis', 'Interfase', 'Amitosis'], 1),
]

const EKO: TryoutQuestion[] = [
  objective('Ilmu yang mempelajari cara individu dan masyarakat mengalokasikan sumber daya yang terbatas disebut...', ['Sosiologi', 'Ekonomi', 'Geografi', 'Antropologi', 'Politik'], 1),
  objective('Hukum permintaan menyatakan bahwa jika harga naik, maka jumlah barang yang diminta akan...', ['Naik', 'Turun', 'Tetap', 'Tidak menentu', 'Naik lalu turun'], 1),
  objective('Inflasi adalah kondisi di mana...', [
    'Harga barang secara umum turun terus-menerus',
    'Harga barang secara umum naik terus-menerus',
    'Nilai tukar mata uang menguat',
    'Jumlah uang beredar berkurang',
    'Produksi nasional menurun drastis',
  ], 1),
  objective('Badan usaha yang seluruh modalnya dimiliki oleh negara disebut...', ['Firma', 'CV', 'BUMN', 'Koperasi', 'PT swasta'], 2),
  objective('Pendapatan nasional yang dihitung berdasarkan nilai barang dan jasa yang dihasilkan warga negara disebut...', ['GDP', 'GNP', 'PDB', 'Inflasi', 'Neraca perdagangan'], 1),
]

const SEJ: TryoutQuestion[] = [
  objective('Proklamasi kemerdekaan Indonesia dibacakan pada tanggal...', ['16 Agustus 1945', '17 Agustus 1945', '18 Agustus 1945', '20 Mei 1945', '28 Oktober 1945'], 1),
  objective('Organisasi pergerakan nasional pertama di Indonesia yang bersifat modern adalah...', ['Sarekat Islam', 'Budi Utomo', 'Indische Partij', 'Perhimpunan Indonesia', 'PNI'], 1),
  objective('Perjanjian yang mengakui kedaulatan Indonesia secara penuh dari Belanda adalah...', ['Perjanjian Linggarjati', 'Perjanjian Renville', 'Konferensi Meja Bundar', 'Perjanjian Roem-Royen', 'Perjanjian Giyanti'], 2),
  objective('Sidang BPUPKI pertama membahas tentang...', ['Rancangan UUD', 'Dasar negara', 'Pembagian wilayah', 'Susunan kabinet', 'Sistem ekonomi'], 1),
  objective('Sistem tanam paksa yang diterapkan Belanda di Indonesia dikenal dengan istilah...', ['Landrent', 'Cultuurstelsel', 'Preangerstelsel', 'Contingenten', 'Verplichte leverantie'], 1),
]

const GEO: TryoutQuestion[] = [
  objective('Indonesia terletak di antara dua benua, yaitu...', ['Asia dan Afrika', 'Asia dan Australia', 'Afrika dan Australia', 'Asia dan Amerika', 'Australia dan Amerika'], 1),
  objective('Fenomena naiknya permukaan air laut akibat pemanasan global disebut...', ['Erosi', 'Abrasi', 'Kenaikan muka laut (sea level rise)', 'Sedimentasi', 'Subsidensi'], 2),
  objective('Jenis tanah yang subur akibat aktivitas vulkanik disebut tanah...', ['Gambut', 'Vulkanik', 'Laterit', 'Aluvial', 'Kapur'], 1),
  objective('Garis khayal yang membagi wilayah Indonesia menjadi bagian barat dan tengah disebut garis...', ['Wallace', 'Weber', 'Khatulistiwa', 'Bujur 0°', 'Lintang 0°'], 0),
  objective('Peta yang menggambarkan persebaran curah hujan suatu wilayah disebut peta...', ['Topografi', 'Tematik', 'Kadaster', 'Korografi', 'Navigasi'], 1),
]

const SOS: TryoutQuestion[] = [
  objective('Proses sosial yang mengarah pada persatuan dan kerja sama antarkelompok disebut...', ['Konflik', 'Asosiatif', 'Disosiatif', 'Kontravensi', 'Kompetisi'], 1),
  objective('Perubahan sosial yang terjadi secara cepat dan mendasar disebut...', ['Evolusi', 'Revolusi', 'Difusi', 'Akulturasi', 'Asimilasi'], 1),
  objective('Lembaga sosial yang paling utama membentuk kepribadian seseorang sejak lahir adalah...', ['Sekolah', 'Keluarga', 'Negara', 'Media massa', 'Tempat kerja'], 1),
  objective('Sikap menerima masuknya budaya asing tanpa menyaring disebut...', ['Etnosentrisme', 'Westernisasi tanpa filter', 'Xenosentrisme', 'Nasionalisme', 'Chauvinisme'], 1),
  objective('Stratifikasi sosial berdasarkan keturunan yang tertutup dan sulit berpindah disebut sistem...', ['Terbuka', 'Campuran', 'Tertutup (kasta)', 'Fungsional', 'Egaliter'], 2),
]

// ---------------------------------------------------------------------------
// Themes — labels only. Chrome colour is always Zenko's own brand blue
// (see TryoutHeader.vue); these just name the real system being practiced.
// ---------------------------------------------------------------------------
const THEME_CAT_BKN: TryoutTheme = {
  system: 'CAT BKN',
  agency: 'Badan Kepegawaian Negara',
  seal: 'BKN',
}

const THEME_BUMN: TryoutTheme = {
  system: 'CAT Rekrutmen Bersama BUMN',
  agency: 'Forum Human Capital Indonesia',
  seal: 'FHCI',
}

const THEME_SNBT: TryoutTheme = {
  system: 'CBT UTBK-SNBT',
  agency: 'Badan Pengelola Pengujian Pendidikan',
  seal: 'SNPMB',
}

const THEME_TKA: TryoutTheme = {
  system: 'CBT Tes Kemampuan Akademik',
  agency: 'Pusat Asesmen Pendidikan',
  seal: 'TKA',
}

const THEME_DEFAULT: TryoutTheme = {
  system: 'CBT Latihan Zenko',
  agency: 'Zenko',
  seal: 'ZK',
}

function section(id: string, code: string, title: string, minutes: number, bank: TryoutQuestion[]): TryoutSection {
  return { id, code, title, durationMinutes: minutes, questions: bank }
}

/**
 * Builds the section list, theme, and pacing mode for a package, from its
 * category and slug.
 *
 * `mode` is not a styling choice — it is what the real system actually does:
 * CAT BKN runs the whole SKD (110 soal) as one 100-minute sitting with free
 * navigation across TWK/TIU/TKP, confirmed by how BKN itself describes it
 * ("seluruh soal dikerjakan dalam satu sesi, bukan dibagi per subtes").
 * BUMN's CAT/CBT stage is reported the same way — one continuous sitting
 * mixing TKD, AKHLAK, and the rest. UTBK-SNBT and TKA are the opposite: each
 * subtest is its own timed, locked stage, which is why those two alone use
 * 'sequential'.
 */
function blueprintFor(slug: string, category: string): { theme: TryoutTheme, mode: TryoutMode, sections: TryoutSection[] } {
  switch (category) {
    case 'SKD/CPNS':
    case 'Kedinasan':
      return {
        theme: THEME_CAT_BKN,
        mode: 'flat',
        sections: [
          section('twk', 'TWK', 'Tes Wawasan Kebangsaan', 10, TWK),
          section('tiu', 'TIU', 'Tes Intelegensi Umum', 15, TIU),
          section('tkp', 'TKP', 'Tes Karakteristik Pribadi', 15, TKP),
        ],
      }

    case 'SKB':
      return {
        theme: THEME_CAT_BKN,
        mode: 'flat',
        sections: [
          section('pedagogik', 'PDG', 'Kompetensi Pedagogik', 12, PEDAGOGIK),
          section('bidang', 'BDG', 'Kompetensi Bidang', 12, KOMPETENSI_BIDANG),
        ],
      }

    case 'BUMN':
      return {
        theme: THEME_BUMN,
        mode: 'flat',
        sections: [
          section('tkd', 'TKD', 'Tes Kemampuan Dasar', 12, TKD_BUMN),
          section('akhlak', 'AKHLAK', 'Core Values AKHLAK', 10, AKHLAK),
          section('eng', 'ENG', 'Bahasa Inggris', 8, ENG_BUMN),
        ],
      }

    case 'SNBT':
      return {
        theme: THEME_SNBT,
        mode: 'sequential',
        sections: [
          section('pu', 'PU', 'Penalaran Umum', 10, PU),
          section('lit', 'LIT', 'Literasi Bahasa Indonesia & Inggris', 12, LIT),
          section('pm', 'PM', 'Penalaran Matematika', 10, PM),
          section('pk', 'PK', 'Pengetahuan Kuantitatif', 8, PK),
        ],
      }

    case 'TKA':
      if (slug === 'tka-soshum-prediksi-2026') {
        return {
          theme: THEME_TKA,
          mode: 'sequential',
          sections: [
            section('eko', 'EKO', 'Ekonomi', 10, EKO),
            section('sej', 'SEJ', 'Sejarah', 10, SEJ),
            section('geo', 'GEO', 'Geografi', 10, GEO),
            section('sos', 'SOS', 'Sosiologi', 10, SOS),
          ],
        }
      }
      // Default TKA blueprint is Saintek — matches the one Saintek package
      // this catalogue has today.
      return {
        theme: THEME_TKA,
        mode: 'sequential',
        sections: [
          section('mtk', 'MTK', 'Matematika', 10, MTK),
          section('fis', 'FIS', 'Fisika', 10, FIS),
          section('kim', 'KIM', 'Kimia', 10, KIM),
          section('bio', 'BIO', 'Biologi', 10, BIO),
        ],
      }

    default:
      return {
        theme: THEME_DEFAULT,
        mode: 'flat',
        sections: [section('latihan', 'TIU', 'Latihan Soal', 15, TIU)],
      }
  }
}

/** Returns the try out blueprint for an owned package's slug, or null if unknown. */
export function getTryoutBlueprint(slug: string): TryoutBlueprint | null {
  const pkg = mockPackages.find(item => item.slug === slug)
  if (!pkg) return null

  const { theme, mode, sections } = blueprintFor(slug, pkg.category)

  return { slug, title: pkg.title, theme, mode, sections }
}

/**
 * A five-question taste of a package for the public "Coba gratis 5 soal"
 * page — same items, same workspace, before any purchase.
 *
 * Questions are taken round-robin across the subtests, so the sample tastes
 * every one of them instead of being five questions from the first subtest.
 * Mode is forced to flat: locking subtests behind their own countdowns is
 * exam realism the real session keeps, but a five-question teaser only needs
 * the feel of the room, not its strictest rules. One minute per question.
 */
export function getSampleBlueprint(slug: string, limit = 5): TryoutBlueprint | null {
  const full = getTryoutBlueprint(slug)
  if (!full) return null

  const picked: TryoutQuestion[][] = full.sections.map(() => [])
  let total = 0
  for (let round = 0; total < limit; round++) {
    let added = false
    for (const [index, sec] of full.sections.entries()) {
      if (total >= limit) break
      const question = sec.questions[round]
      if (!question) continue
      picked[index]!.push(question)
      total++
      added = true
    }
    // Every bank exhausted before the limit — take what exists.
    if (!added) break
  }

  const sections = full.sections
    .map((sec, index) => ({ ...sec, durationMinutes: picked[index]!.length, questions: picked[index]! }))
    .filter(sec => sec.questions.length > 0)

  return { ...full, mode: 'flat', sections }
}
