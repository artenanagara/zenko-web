<script setup lang="ts">
/**
 * The demo environment's front door: the accounts a visitor can sign in with,
 * what each one is there to show, and the button that starts the whole thing
 * over.
 *
 * The account list is fetched rather than written here, so it can never drift
 * from what the API actually seeded. Outside demo mode the page says so and
 * offers nothing — the route stays mounted rather than 404-ing, because the
 * link is the kind of thing that ends up pasted into a chat.
 */
definePageMeta({ path: '/demo' })

const { enabled, info, pending, error, load, reset, resetting } = useDemo()

await load()

useSeoMeta({
  title: 'Akun Demo | Zenko',
  description: 'Akun demo Zenko beserta perannya masing-masing.',
  // A demo environment has nothing to gain from search traffic, and a demo
  // page ranking above the real product would be actively harmful.
  robots: 'noindex, nofollow',
})

const roleLabels: Record<string, string> = {
  student: 'Siswa',
  tutor: 'Tutor',
  admin: 'Admin',
}

const copied = ref('')

async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = value
    setTimeout(() => {
      if (copied.value === value) copied.value = ''
    }, 1500)
  }
  catch {
    // Clipboard access can be refused; the value is on screen either way.
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
    <div v-if="!enabled" class="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
      <h1 class="text-xl font-semibold text-slate-900">
        Halaman ini hanya untuk lingkungan demo
      </h1>
      <p class="mt-2 text-sm">
        Akun demo hanya tersedia di demo.zenkoedu.id. Di lingkungan ini, gunakan akun kamu sendiri.
      </p>
      <AppButton to="/" class="mt-5">
        Kembali ke beranda
      </AppButton>
    </div>

    <template v-else>
      <header>
        <p class="text-sm font-semibold text-blue-600">
          Lingkungan demo
        </p>
        <h1 class="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Akun untuk mencoba Zenko
        </h1>
        <p class="mt-3 text-sm leading-relaxed text-slate-600">
          Semua data di sini hanya milik perangkat ini. Apa pun yang kamu ubah — membeli paket,
          mengerjakan tryout, memoderasi produk — tidak terlihat oleh pengunjung lain, dan tidak
          memengaruhi data asli Zenko.
        </p>
      </header>

      <p v-if="error" class="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ error }}
      </p>

      <div v-if="pending" class="mt-8 text-sm text-slate-500">
        Memuat akun demo…
      </div>

      <template v-else-if="info">
        <section class="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h2 class="text-sm font-semibold text-blue-900">
            Kata sandi untuk semua akun
          </h2>
          <button
            type="button"
            class="mt-2 flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-mono text-sm text-slate-900 ring-1 ring-blue-200 transition hover:ring-blue-400"
            @click="copy(info.password)"
          >
            {{ info.password }}
            <AppIcon :name="copied === info.password ? 'check' : 'copy'" :size="16" />
          </button>
        </section>

        <section class="mt-6 space-y-3">
          <h2 class="text-sm font-semibold text-slate-900">
            Akun dan perannya
          </h2>
          <article
            v-for="account in info.accounts"
            :key="account.email"
            class="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="min-w-0">
                <button
                  type="button"
                  class="flex items-center gap-2 font-mono text-sm font-medium text-slate-900 hover:text-blue-700"
                  @click="copy(account.email)"
                >
                  {{ account.email }}
                  <AppIcon :name="copied === account.email ? 'check' : 'copy'" :size="15" />
                </button>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ account.name }}
                </p>
              </div>
              <span class="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {{ roleLabels[account.role] ?? account.role }}
              </span>
            </div>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              {{ account.note }}
            </p>
          </article>
        </section>

        <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 class="text-sm font-semibold text-slate-900">
            Bergabung ke bimbel lewat kode
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">
            Masuk sebagai siswa, lalu gunakan kode berikut untuk mengajukan diri sebagai anggota
            {{ info.bimbel }}. Pengajuannya akan muncul di roster bimbel untuk disetujui.
          </p>
          <button
            type="button"
            class="mt-3 flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm font-semibold text-white transition hover:bg-slate-700"
            @click="copy(info.joinCode)"
          >
            {{ info.joinCode }}
            <AppIcon :name="copied === info.joinCode ? 'check' : 'copy'" :size="16" />
          </button>
        </section>

        <section class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 class="text-sm font-semibold text-slate-900">
            Mulai ulang demo
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">
            Mengembalikan seluruh data di perangkat ini ke kondisi awal dan mengeluarkanmu dari
            akun. Tidak memengaruhi pengunjung lain.
          </p>
          <AppButton variant="outline" class="mt-4" :disabled="resetting" @click="reset">
            <AppIcon name="arrow-counter-clockwise" :size="16" class="mr-1.5" />
            {{ resetting ? 'Mengulang…' : 'Ulangi demo dari awal' }}
          </AppButton>
        </section>

        <p class="mt-6 text-xs text-slate-400">
          ID sandbox perangkat ini: <span class="font-mono">{{ info.sandboxId || '—' }}</span>
        </p>
      </template>
    </template>
  </div>
</template>
