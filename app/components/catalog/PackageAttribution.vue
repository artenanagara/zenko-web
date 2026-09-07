<script setup lang="ts">
import type { Author, PackageBimbel } from '#shared/types/catalog'

/**
 * Atribusi ganda satu paket: "oleh Tutor A · Bimbel X".
 *
 * Sebelum "Terbitkan sebagai", paket yang dijual bimbel tampil dengan nama
 * bimbel MENGGANTIKAN nama penulisnya. Sekarang keduanya ada, dan urutannya
 * disengaja: tutor lebih dulu, bimbel sebagai bendera di belakangnya.
 *
 * Nama tutor menaut ke profilnya. Nama bimbel sengaja TIDAK menaut ke mana
 * pun selama `/bimbel/:slug` belum ada — tautan mati lebih buruk daripada
 * teks biasa. Bobot visualnya juga dijaga setara teks tutor, bukan lozenge
 * yang berteriak: yang dijanjikan §6.2 adalah individu di bawah bendera
 * agency, bukan agency yang menelan individu.
 *
 * NuxtLink diimpor, tidak di-resolve lewat nama — auto-import tidak
 * mendaftarkan apa pun yang bisa ditemukan resolveComponent. Alasan yang sama
 * dengan PackageCard.
 */
import { NuxtLink } from '#components'

const props = withDefaults(
  defineProps<{
    author: Author
    /** Absen untuk paket pribadi tutor — mayoritas paket. */
    bimbel?: PackageBimbel
    /**
     * `card` untuk grid katalog (kecil, muted, di atas overlay stretched-link
     * kartu); `detail` untuk baris meta di header halaman paket.
     */
    variant?: 'card' | 'detail'
  }>(),
  { variant: 'card' },
)

/**
 * Tutor lama punya akun tapi belum punya username publik, dan paket seed milik
 * platform tidak punya keduanya — keduanya tampil sebagai teks tanpa tautan.
 */
const profilePath = computed(() => {
  const identifier = props.author.username || props.author.id
  return identifier ? `/tutor/${encodeURIComponent(identifier)}` : undefined
})

const isCard = computed(() => props.variant === 'card')
</script>

<template>
  <!-- min-w-0 di baris DAN di tiap anaknya: tanpa itu nama panjang memaksa
       lebar kartu melar dan merusak grid katalog, bukan terpotong. -->
  <div
    class="flex min-w-0 items-center gap-2"
    :class="isCard ? 'text-[0.88rem] text-muted' : 'text-[0.92rem] text-muted'"
  >
    <component
      :is="profilePath ? NuxtLink : 'span'"
      :to="profilePath"
      class="flex min-w-0 items-center gap-2"
      :class="[
        // z-1 mengangkat tautan tutor di atas ::after milik tautan judul yang
        // menyelimuti seluruh kartu; tanpa itu ia tidak bisa diklik.
        isCard ? 'relative z-1 py-2' : '-my-2 py-2 font-semibold text-ink',
        profilePath ? 'transition-colors duration-200 ease-smooth hover:text-primary hover:underline' : '',
      ]"
    >
      <img
        :src="author.avatarUrl"
        alt=""
        loading="lazy"
        class="shrink-0 rounded-full object-cover"
        :class="isCard ? 'h-6 w-6' : 'h-7 w-7'"
      >
      <span class="truncate">{{ author.name }}</span>
    </component>

    <template v-if="bimbel">
      <span class="shrink-0 opacity-60" aria-hidden="true">·</span>
      <!-- Batas 55% di kartu: tanpa itu nama bimbel yang panjang menyusut
           proporsional bersama nama tutor, dan tutornya — identitas yang
           justru dikembalikan oleh atribusi ganda — yang paling banyak
           terpotong. -->
      <span
        class="flex min-w-0 items-center gap-1.5"
        :class="isCard ? 'max-w-[55%]' : ''"
        :title="bimbel.name"
      >
        <AppIcon name="buildings" :size="isCard ? 14 : 16" class="shrink-0" />
        <!-- Tanpa ini pembaca layar hanya mendengar dua nama berurutan dan
             tidak punya cara tahu yang kedua adalah lembaga. -->
        <span class="sr-only">Bimbel penerbit:</span>
        <span class="truncate">{{ bimbel.name }}</span>
      </span>
    </template>
  </div>
</template>
