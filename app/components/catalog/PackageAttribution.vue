<script setup lang="ts">
import type { Author } from '#shared/types/catalog'

/**
 * One public author per marketplace card. A tutor-owned package links to a
 * tutor profile; a package published by a bimbel links to its organisation
 * profile and uses the organisation logo.
 *
 * NuxtLink diimpor, tidak di-resolve lewat nama — auto-import tidak
 * mendaftarkan apa pun yang bisa ditemukan resolveComponent. Alasan yang sama
 * dengan PackageCard.
 */
import { NuxtLink } from '#components'

const props = withDefaults(
  defineProps<{
    author: Author
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
  if (props.author.type === 'bimbel' && props.author.slug) {
    return `/bimbel/${encodeURIComponent(props.author.slug)}`
  }
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
        width="28"
        height="28"
        loading="lazy"
        class="shrink-0 object-cover"
        :class="[
          author.type === 'bimbel' ? 'rounded-md' : 'rounded-full',
          isCard ? 'h-6 w-6' : 'h-7 w-7',
        ]"
      >
      <span class="truncate">{{ author.name }}</span>
    </component>
  </div>
</template>
