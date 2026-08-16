<script setup lang="ts">
/**
 * Link groups are data rather than markup, so the columns stay symmetrical
 * and adding an entry cannot quietly break the layout.
 */
const columns = [
  {
    title: 'Jelajahi',
    links: [
      { label: 'Semua paket', to: '/paket' },
      { label: 'Cara kerja', to: '/#cara-kerja' },
      { label: 'Tentang kami', to: '/tentang' },
      { label: 'Jadi tutor', to: '/jadi-tutor' },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'Hubungi kami', to: 'mailto:halo@zenko.id' },
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
      <div class="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr] md:gap-8">
        <div class="max-w-80">
          <BrandMark img-class="h-11 w-auto object-contain" />

          <p class="mt-4 text-[0.94rem] leading-[1.7] text-muted">
            Marketplace try out terpercaya untuk persiapan SKD/CPNS, BUMN, SNBT,
            dan TKA. Beli per paket, tanpa langganan.
          </p>

          <p class="mt-5 flex items-center gap-2.5 text-[0.86rem] text-muted">
            <IconSeal class="h-5 w-5 shrink-0" />
            Semua tutor melewati kurasi
          </p>

          <ul class="mt-6 flex items-center gap-2">
            <li>
              <a
                href="https://www.instagram.com/zenkoedu.id"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Zenko di Instagram"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-200 ease-smooth hover:bg-surface hover:text-primary"
              >
                <IconInstagram class="h-[1.05rem] w-[1.05rem]" />
              </a>
            </li>
            <li>
              <a
                href="https://www.tiktok.com/@zenkoedu.id"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Zenko di TikTok"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-200 ease-smooth hover:bg-surface hover:text-primary"
              >
                <IconTiktok class="h-[1.05rem] w-[1.05rem]" />
              </a>
            </li>
          </ul>
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
