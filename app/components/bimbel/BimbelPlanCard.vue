<script setup lang="ts">
/**
 * Satu kartu tingkat langganan, dipakai bersama oleh halaman marketing publik
 * dan pemilih tingkat di dashboard bimbel.
 *
 * Bentuknya: blok abu-abu di atas yang memuat nama tingkat, harganya, satu
 * kalimat untuk siapa tingkat itu, dan satu aksi — lalu daftar isinya di bawah
 * blok itu, di atas latar kartu. Pembagian itu yang membuat kartunya bisa
 * dibaca dua kali: sekali menyapu harga dari kiri ke kanan, sekali lagi
 * membandingkan isi baris per baris.
 *
 * Murni presentasi. Tidak ada satu angka pun yang dihitung di sini — harga dan
 * catatannya datang sudah jadi dari pemanggilnya, yang di dashboard berarti
 * dari server. Kartu yang tahu cara mengalikan harga adalah tempat kedua harga
 * bisa berbeda dari invoice.
 */
withDefaults(defineProps<{
  /** Nama tingkat, mis. "Langganan Pro". */
  name: string
  /** Harga yang sudah diformat, atau kalimat pengganti seperti "Hubungi kami". */
  price: string
  /** Di atas harga, mis. "Mulai dari". Dilewati untuk harga yang bukan angka. */
  priceLead?: string
  /** Di bawah harga, mis. "per bulan". */
  priceNote?: string
  /** Satu baris di bawah harga untuk syarat periodenya. */
  priceFootnote?: string
  description: string
  features: string[]
  /** Pita di tepi atas kartu, mis. "Sisa 2 hari uji coba". */
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
    class="relative flex flex-col rounded-[22px] border bg-surface p-2 pb-6 transition-shadow duration-200"
    :class="selected ? 'border-primary shadow-lift' : 'border-hairline shadow-xs'"
  >
    <!-- Pita menumpang tepi atas kartu, bukan di dalam bloknya: di dalam ia
         mendorong seluruh isi kartu turun dan membuat kartu bertanda jadi lebih
         tinggi dari tetangganya, yang justru merusak perbandingan harga. -->
    <span
      v-if="badge"
      class="absolute -top-2.5 left-6 z-1 rounded-pill px-2.5 py-1 text-[0.7rem] font-bold"
      :class="badgeTone === 'brand' ? 'bg-primary-soft text-primary' : 'bg-warning-soft text-warning-ink'"
    >
      {{ badge }}
    </span>

    <div class="rounded-[16px] bg-surface-alt px-5 py-7 text-center">
      <p class="text-[0.74rem] font-bold tracking-[0.14em] text-muted uppercase">{{ name }}</p>

      <p v-if="priceLead" class="mt-4 text-[0.86rem] text-muted">{{ priceLead }}</p>
      <p
        class="font-extrabold tracking-[-0.04em] text-ink"
        :class="[priceLead ? 'mt-0.5' : 'mt-4', price.length > 12 ? 'text-[1.75rem] leading-tight' : 'text-[2.6rem] leading-none']"
      >
        {{ price }}
      </p>
      <p v-if="priceNote" class="mt-1.5 text-[0.86rem] text-muted">{{ priceNote }}</p>
      <p v-if="priceFootnote" class="mt-1 text-[0.78rem] font-semibold text-success-ink">{{ priceFootnote }}</p>

      <p class="mx-auto mt-5 max-w-64 text-[0.9rem] leading-[1.6] text-muted">{{ description }}</p>

      <AppButton
        v-if="actionTo"
        :to="actionTo"
        :variant="actionVariant"
        size="sm"
        class="mt-5"
      >
        {{ actionLabel }}
      </AppButton>
      <AppButton
        v-else
        :variant="actionVariant"
        size="sm"
        class="mt-5"
        :aria-pressed="selected"
        @click="$emit('action')"
      >
        <AppIcon v-if="selected" name="check" :size="15" aria-hidden="true" />
        {{ actionLabel }}
      </AppButton>
    </div>

    <ul class="mt-6 grid gap-3 px-4 text-[0.92rem]">
      <li v-for="feature in features" :key="feature" class="flex items-start gap-2.5">
        <span class="mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-success-soft text-success-ink">
          <AppIcon name="check" :size="12" aria-hidden="true" />
        </span>
        <span class="leading-[1.5]">{{ feature }}</span>
      </li>
    </ul>
  </div>
</template>
