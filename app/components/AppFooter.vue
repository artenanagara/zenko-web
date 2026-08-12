<template>
  <footer class="border-t border-line pt-[30px]">
    <div class="container-page flex flex-col items-start justify-between gap-5 pb-5 md:flex-row md:items-center">
      <div>
        <NuxtLink to="/" class="mb-2.5 inline-flex items-center gap-2.5 font-extrabold tracking-[-0.04em]" aria-label="Zenko home">
          <span
            class="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-linear-to-b from-primary-light to-primary text-[0.96rem] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_18px_rgba(47,111,235,0.2)]"
          >Z</span>
          <span class="text-xl">Zenko</span>
        </NuxtLink>
        <p class="text-muted">Marketplace try out terpercaya untuk persiapan ujianmu.</p>
      </div>

      <nav class="flex items-center gap-5 text-muted" aria-label="Tautan footer">
        <a href="#" class="transition-colors hover:text-ink">Tentang</a>
        <a href="#" class="transition-colors hover:text-ink">Kontak</a>
        <NuxtLink to="/kebijakan-privasi" class="transition-colors hover:text-ink">
          Kebijakan Privasi
        </NuxtLink>
      </nav>
    </div>

    <div class="container-page border-t border-line pt-[18px] pb-7">
      <p class="text-muted">© {{ new Date().getFullYear() }} Zenko. Semua hak dilindungi.</p>
    </div>
  </footer>
</template>
