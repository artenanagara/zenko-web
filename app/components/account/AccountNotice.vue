<!-- Catatan "data ini masih contoh" yang dipakai seluruh area akun. Satu
     komponen supaya gayanya seragam — sebelumnya tiap halaman menggayakan
     sendiri dan hasilnya tiga rupa berbeda untuk pesan yang sama. -->
<template>
  <p class="flex items-start gap-2.5 rounded-md border border-amber-200/70 bg-amber-50 px-4 py-3 text-[0.84rem] leading-relaxed text-amber-800">
    <IconAlert class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <span><slot /></span>
  </p>
</template>
