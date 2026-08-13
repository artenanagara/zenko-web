<script setup lang="ts">
// Ikon brand Zenko: kotak biru gradien, "Z" panah naik + bar chart.
// Ukuran & shadow diatur lewat class dari pemakai (mis. "h-8 w-8").
</script>

<template>
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="zenko-brand-g" x1="48" y1="0" x2="48" y2="96" gradientUnits="userSpaceOnUse">
        <stop stop-color="#57ADFF" />
        <stop offset="1" stop-color="#1B6BE6" />
      </linearGradient>
    </defs>
    <rect width="96" height="96" rx="22" fill="url(#zenko-brand-g)" />
    <rect x="1" y="1" width="94" height="94" rx="21" stroke="rgba(255,255,255,0.22)" stroke-width="2" fill="none" />
    <path d="M23 30 H60 L26 68" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <path fill="#fff" d="M76 13 69 32 55 19z" />
    <g fill="#fff">
      <rect x="47" y="64" width="10" height="14" rx="3" />
      <rect x="60" y="56" width="10" height="22" rx="3" />
      <rect x="73" y="48" width="10" height="30" rx="3" />
    </g>
  </svg>
</template>
