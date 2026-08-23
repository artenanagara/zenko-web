<template>
  <div class="flex min-h-screen flex-col bg-surface">
    <header class="border-b border-hairline bg-surface">
      <div class="container-page flex h-20 items-center">
        <BrandMark
          to="/"
          img-class="h-10 w-auto object-contain"
          aria-label="Zenko — kembali ke beranda"
        />
      </div>
    </header>

    <div class="flex-1">
      <slot />
    </div>
  </div>
</template>
