<script setup lang="ts">
const { isVisible, accept, rejectOptional } = useCookieConsent()
</script>

<template>
  <Transition
    enter-active-class="transition-[opacity,transform] duration-200 ease-smooth"
    enter-from-class="translate-y-3 opacity-0"
    leave-active-class="transition-[opacity,transform] duration-150 ease-smooth"
    leave-to-class="translate-y-3 opacity-0"
  >
    <!--
      z-30 menaruhnya di atas isi halaman biasa tetapi di bawah setiap
      permukaan yang menuntut perhatian penuh: backdrop dan laci di z-40,
      modal di z-50, toast di z-60.

      Dulu ia di z-[70], lapisan tertinggi di seluruh aplikasi. Di layar
      ponsel banner ini menempati sepertiga bawah layar, tepat di tempat
      modal menaruh tombolnya — sehingga "Buat tagihan" pada ringkasan
      langganan dan "Kirim konfirmasi" pada bukti transfer masih terlihat
      dan tampak aktif, tetapi setiap ketukan di atasnya ditangkap banner
      yang menutupinya. Pengunjung baru dari HP tidak bisa menyelesaikan
      alurnya sampai ia menjawab cookies lebih dulu, tanpa satu pun petunjuk
      bahwa itulah yang menghalangi.

      Persetujuan cookies tidak kehilangan apa pun karena mengalah: ia tetap
      menunggu di sana setelah modalnya ditutup.
    -->
    <aside
      v-if="isVisible"
      class="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-3xl rounded-md border border-hairline bg-surface p-4 shadow-float sm:inset-x-5 sm:p-5"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div class="min-w-0">
          <h2 id="cookie-consent-title" class="text-base font-semibold tracking-[-0.02em]">
            Kami menggunakan cookies
          </h2>
          <p id="cookie-consent-description" class="mt-1.5 max-w-2xl text-[0.88rem] leading-6 text-muted">
            Cookies wajib membantu Zenko menjaga login dan keamanan akun. Pilih apakah kami boleh menyimpan cookies opsional untuk mengingat preferensi di perangkat ini.
          </p>
          <NuxtLink
            to="/kebijakan-privasi"
            class="mt-2 inline-flex text-[0.82rem] font-semibold text-primary underline decoration-primary/30 underline-offset-3 hover:decoration-primary"
          >
            Pelajari kebijakan privasi
          </NuxtLink>
        </div>

        <div class="flex shrink-0 flex-col gap-2 sm:min-w-44 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-xs border border-line px-4 text-[0.88rem] font-semibold text-muted transition-colors duration-200 ease-smooth hover:border-ink/30 hover:bg-surface-alt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="rejectOptional"
          >
            Tolak opsional
          </button>
          <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-xs bg-primary px-4 text-[0.88rem] font-semibold text-white shadow-xs transition-[background,box-shadow] duration-200 ease-smooth hover:bg-primary-dark hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="accept"
          >
            Terima semua
          </button>
        </div>
      </div>
    </aside>
  </Transition>
</template>
