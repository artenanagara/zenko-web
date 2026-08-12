<script setup lang="ts">
/**
 * Link groups are data rather than markup, so the columns stay symmetrical
 * and adding an entry cannot quietly break the layout.
 */
const columns = [
  {
    title: 'Jelajahi',
    links: [
      { label: 'Semua paket', to: '/#paket' },
      { label: 'Cara kerja', to: '/#cara-kerja' },
      { label: 'SKD / CPNS', to: '/#paket' },
      { label: 'BUMN', to: '/#paket' },
      { label: 'SNBT', to: '/#paket' },
    ],
  },
  {
    title: 'Akun',
    links: [
      { label: 'Masuk', to: '/masuk' },
      { label: 'Daftar', to: '/daftar' },
      { label: 'Jual paket di Zenko', to: '/daftar' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Kebijakan Privasi', to: '/kebijakan-privasi' },
      { label: 'Ketentuan Layanan', to: '/ketentuan-layanan' },
    ],
  },
]

const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-hairline bg-surface-alt">
    <div class="container-page py-14 md:py-16">
      <div class="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-8">
        <div class="max-w-80">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 font-extrabold tracking-[-0.04em]"
            aria-label="Zenko home"
          >
            <span
              class="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-linear-to-b from-primary-light to-primary text-[0.96rem] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_18px_rgba(47,111,235,0.2)]"
            >Z</span>
            <span class="text-xl">Zenko</span>
          </NuxtLink>

          <p class="mt-4 text-[0.94rem] leading-[1.7] text-muted">
            Marketplace try out terpercaya untuk persiapan SKD/CPNS, BUMN, SNBT,
            dan TKA. Beli per paket, tanpa langganan.
          </p>

          <p class="mt-5 flex items-center gap-2.5 text-[0.86rem] text-muted">
            <IconSeal class="h-5 w-5 shrink-0" />
            Semua tutor melewati kurasi
          </p>
        </div>

        <nav v-for="column in columns" :key="column.title" :aria-label="column.title">
          <h2 class="text-[0.78rem] font-bold tracking-[0.12em] text-ink uppercase">
            {{ column.title }}
          </h2>
          <ul class="mt-4 grid gap-3">
            <li v-for="link in column.links" :key="link.label">
              <NuxtLink
                :to="link.to"
                class="text-[0.94rem] text-muted transition-colors hover:text-primary"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>

      <div
        class="mt-12 flex flex-col-reverse items-start justify-between gap-4 border-t border-hairline pt-7 text-[0.86rem] text-muted sm:flex-row sm:items-center"
      >
        <p>© {{ year }} Zenko. Semua hak dilindungi.</p>
        <p class="flex items-center gap-2">
          Dibuat di Indonesia
          <span aria-hidden="true">🇮🇩</span>
        </p>
      </div>
    </div>
  </footer>
</template>
