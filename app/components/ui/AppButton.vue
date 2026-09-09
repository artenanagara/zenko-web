<script setup lang="ts">
/**
 * Renders as <a> when `href` is set, otherwise <button>.
 * Variants map to the three button treatments in the design.
 *
 * NuxtLink is imported rather than looked up with resolveComponent: auto-import
 * registers nothing for resolveComponent to find, so the lookup fails and the
 * button renders as an inert <NuxtLink> element with no href.
 */
import { NuxtLink } from '#components'

withDefaults(
  defineProps<{
    /** Internal route — renders a NuxtLink. */
    to?: string
    /** External or placeholder URL — renders a plain anchor. */
    href?: string
    variant?: 'primary' | 'secondary' | 'light' | 'outline' | 'ghost' | 'danger'
    /** 'xs' is for cramped spots — toolbar popovers — not general UI. */
    size?: 'xs' | 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

// Lebar batas ada di sini, warnanya tidak. `border-transparent` dulu ikut di
// baris ini, dan itu diam-diam melumpuhkan setiap variant yang mencoba memberi
// warna: keduanya menulis `border-color`, dan yang menang ditentukan urutan
// aturan di stylesheet hasil Tailwind — bukan urutan kelas di sini. Yang menang
// ternyata `border-transparent`, jadi `outline` dan `light` sama-sama tampil
// tanpa batas sama sekali dan terbaca sebagai teks biasa.
//
// Sekarang tiap variant menyebut warnanya sendiri, tepat satu kali, termasuk
// `ghost` yang memang transparan.
const base =
  'inline-flex items-center justify-center gap-2 border font-semibold transition-[transform,box-shadow,background] duration-200 ease-smooth hover:-translate-y-px focus-visible:-translate-y-px cursor-pointer'

const variants = {
  primary:
    'bg-linear-to-b from-primary-light to-primary border-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(47,111,235,0.25)] hover:from-[#5c93f5] hover:to-[#3878f0] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_8px_18px_rgba(47,111,235,0.18)]',
  secondary:
    'bg-ink border-ink text-white shadow-xs hover:bg-[#27272e] hover:border-[#27272e]',
  // Tombol putih. Batasnya yang memisahkannya dari latar, bukan bayangan.
  //
  // Bayangan sebesar itu hanya masuk akal di atas satu jenis latar — bidang
  // gelap, tempat variant ini lahir. Di atas panel abu-abu terang seperti kartu
  // harga, ia terbaca sebagai kartu yang mengambang alih-alih tombol, dan
  // pemakainya mulai menambal sendiri (`class="... shadow-none"` di
  // TryoutSimulation). Batas sudah cukup memisahkan di kedua latar: pada bidang
  // gelap kontras putih-di-atas-gelap yang bekerja, pada bidang terang batasnya.
  light:
    'bg-surface border-hairline-strong text-primary font-bold hover:bg-[#f4f7ff] hover:border-primary/40',
  // Tombol putih berbatas abu. Latarnya solid, bukan transparan: di atas
  // bidang berwarna — hero bergradien, kartu abu-abu — transparan membuat
  // latar itu menembus tombolnya, sehingga yang terbaca bukan tombol
  // melainkan garis kotak di atas gradien. Batas abu sudah memisahkannya dari
  // bidang putih, dan latar putihnya memisahkannya dari bidang berwarna.
  outline:
    'bg-surface border-line text-ink hover:bg-surface-alt hover:border-primary/40 hover:text-primary',
  ghost:
    'bg-transparent border-transparent text-muted hover:text-ink hover:bg-surface-alt',
  danger:
    'bg-danger border-danger text-white shadow-xs hover:bg-danger-ink',
}

const sizes = {
  xs: 'min-h-8 px-3 text-[0.8rem]',
  sm: 'min-h-10 px-4',
  md: 'min-h-12 px-7',
  lg: 'min-h-13 px-8',
}
</script>

<template>
  <component
    :is="to ? NuxtLink : href ? 'a' : 'button'"
    :to="to"
    :href="href"
    :type="to || href ? undefined : type"
    :class="[base, variants[variant], sizes[size], 'rounded-xs']"
  >
    <slot />
  </component>
</template>
