<script setup lang="ts">
/**
 * Satu kartu tingkat langganan, dipakai bersama oleh halaman marketing publik
 * dan pemilih tingkat di dashboard bimbel.
 *
 * Bentuknya: blok abu-abu di atas yang memuat nama tingkat dan harganya, lalu
 * daftar isinya, lalu aksinya di paling bawah. Urutan itu yang membuat kartunya
 * bisa dibaca dua kali: sekali menyapu harga dari kiri ke kanan, sekali lagi
 * membandingkan isi baris per baris — dan tombolnya baru ditemui setelah
 * keduanya selesai dibaca, yang memang urutan orang memutuskan.
 *
 * Murni presentasi. Tidak ada satu angka pun yang dihitung di sini — harga dan
 * catatannya datang sudah jadi dari pemanggilnya, yang di dashboard berarti
 * dari server. Kartu yang tahu cara mengalikan harga adalah tempat kedua harga
 * bisa berbeda dari invoice.
 */
withDefaults(defineProps<{
  /** Nama tingkat, mis. "Kelas Pro". */
  name: string
  /** Harga yang sudah diformat, atau kalimat pengganti seperti "Hubungi kami". */
  price: string
  /** Di atas harga, mis. "Mulai dari". Dilewati untuk harga yang bukan angka. */
  priceLead?: string
  /** Di bawah harga, mis. "per bulan". */
  priceNote?: string
  /** Satu baris di bawah harga untuk syarat periodenya. */
  priceFootnote?: string
  features: string[]
  /**
   * Pita di atas nama tingkat, mis. "Paling dipilih" atau "Sisa 2 hari uji
   * coba". Di dalam blok, bukan menumpang tepi kartu: pita yang menggantung di
   * tepi terbaca sebagai stiker yang ditempelkan pada kartu, sementara yang di
   * dalam terbaca sebagai keterangan tingkatnya sendiri — dan keterangan itulah
   * yang dimaksud.
   */
  badge?: string
  /**
   * Warna pita. `warning` untuk yang menyebut waktu yang sedang habis,
   * `brand` untuk yang sekadar menandai — dua hal yang tidak boleh terbaca
   * sama, karena yang satu meminta tindakan dan yang lain tidak.
   */
  badgeTone?: 'warning' | 'brand'
  /** Kartu yang sedang dipilih — cincin, bukan sekadar warna tombolnya. */
  selected?: boolean
  actionLabel: string
  /** Diisi kalau aksinya berpindah halaman; kalau kosong ia memancarkan `action`. */
  actionTo?: string
  /**
   * `light` untuk aksi yang tidak dipilih: tombolnya duduk di atas blok
   * abu-abu, dan `outline` — yang latarnya transparan dengan garis setipis
   * `border-line` — hampir tak terbedakan dari bloknya sendiri di sana.
   */
  actionVariant?: 'primary' | 'light' | 'secondary'
}>(), {
  priceLead: '',
  priceNote: '',
  priceFootnote: '',
  badge: '',
  badgeTone: 'warning',
  selected: false,
  actionTo: '',
  actionVariant: 'primary',
})

defineEmits<{ action: [] }>()
</script>

<template>
  <div
    class="@container flex flex-col rounded-[22px] border bg-surface p-2.5 pb-6 transition-shadow duration-200"
    :class="selected ? 'border-primary shadow-lift' : 'border-hairline shadow-xs'"
  >
    <div class="rounded-[16px] bg-surface-alt px-4 py-8 text-center">
      <!-- Barisnya selalu ada, berisi atau tidak. Kartu bertanda yang tumbuh
           sendirian akan menggeser daftar centangnya ke bawah, dan tiga daftar
           yang tidak sebaris justru merusak perbandingan yang jadi alasan
           daftar itu ada. -->
      <div class="mb-3 flex min-h-7 items-center justify-center">
        <p
          v-if="badge"
          class="rounded-pill px-2.5 py-1 text-[0.7rem] font-bold"
          :class="badgeTone === 'brand' ? 'bg-primary-soft text-primary' : 'bg-warning-soft text-warning-ink'"
        >
          {{ badge }}
        </p>
      </div>

      <p class="text-[0.74rem] font-bold tracking-[0.14em] text-muted uppercase">{{ name }}</p>

      <p v-if="priceLead" class="mt-4 text-[0.86rem] text-muted">{{ priceLead }}</p>
      <!-- Ukurannya mengikuti lebar kartunya, bukan jumlah karakter harganya.
           Dulu ia berpindah ke ukuran kecil setelah 12 karakter, dan
           "Rp3.750.000" — harga tahunan tingkat teratas — berhenti tepat di
           bawah ambang itu: sebelas karakter pada ukuran penuh, di kartu yang
           tidak cukup lebar untuk memuatnya. Clamp terhadap `cqi` tidak bisa
           salah menghitung panjang karena ia tidak menghitungnya sama sekali;
           ia cuma tidak pernah lebih besar dari ruang yang ada. -->
      <p
        class="text-[clamp(1.45rem,11cqi,2.6rem)] leading-none font-extrabold tracking-[-0.04em] whitespace-nowrap text-ink tabular-nums"
        :class="priceLead ? 'mt-0.5' : 'mt-4'"
      >
        {{ price }}
      </p>
      <p v-if="priceNote" class="mt-1.5 text-[0.86rem] text-muted">{{ priceNote }}</p>
      <p v-if="priceFootnote" class="mt-1 text-[0.78rem] font-semibold text-success-ink">{{ priceFootnote }}</p>
    </div>

    <ul class="mt-6 grid gap-3 px-4 text-[0.92rem]">
      <li v-for="feature in features" :key="feature" class="flex items-start gap-2.5">
        <span class="mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-success-soft text-success-ink">
          <AppIcon name="check" :size="12" aria-hidden="true" />
        </span>
        <span class="leading-[1.5]">{{ feature }}</span>
      </li>
    </ul>

    <!-- Aksi di kaki kartu, dan `mt-auto` supaya ia sejajar antarkartu meski
         daftar isinya berbeda panjang — tiga tombol yang tidak sebaris membuat
         kartu terpendek terlihat seperti pilihan yang belum selesai. -->
    <div class="mt-auto px-4 pt-6">
      <AppButton
        v-if="actionTo"
        :to="actionTo"
        :variant="actionVariant"
        size="sm"
        class="w-full"
      >
        {{ actionLabel }}
      </AppButton>
      <AppButton
        v-else
        :variant="actionVariant"
        size="sm"
        class="w-full"
        :aria-pressed="selected"
        @click="$emit('action')"
      >
        <AppIcon v-if="selected" name="check" :size="15" aria-hidden="true" />
        {{ actionLabel }}
      </AppButton>
    </div>
  </div>
</template>
