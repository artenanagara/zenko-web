<script setup lang="ts">
/**
 * Modal pernyataan hak cipta soal — muncul saat tutor menekan "Ajukan untuk
 * tayang" di langkah 5 TutorProductWizard, sebelum request submit benar-benar
 * dikirim ke server. Dua tombol saja: Batal, atau Setuju & ajukan.
 *
 * Isinya digulir di dalam modal sendiri. Selama modal terbuka, halaman di
 * belakangnya dikunci lewat `body.style.overflow` — pola kunci gulir yang
 * sama dengan menu mobile dan sheet navigator soal, dan yang membuat plugin
 * Lenis menghentikan pelembutan gulirnya (lihat plugins/lenis.client.ts).
 * `data-lenis-prevent` menjaga roda mouse di atas isi modal tetap menggulir
 * isi itu secara native, dan tidak "tembus" ke halaman saat mentok di bawah.
 *
 * Isi pernyataan diringkas dari Ketentuan Layanan Bagian 4 (kewajiban tutor)
 * dan Bagian 9 (hak kekayaan intelektual); tautan ke halaman itu ada di
 * bawah supaya versi lengkapnya tetap satu sumber.
 */
const props = defineProps<{
  /** Label tombol setuju, mis. "Setuju & ajukan" — dipakai apa adanya. */
  confirmLabel: string
  submitting: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

const open = defineModel<boolean>('open', { required: true })

const bodyRef = ref<HTMLElement | null>(null)

function lockPage(locked: boolean) {
  if (typeof document === 'undefined') return
  document.body.style.overflow = locked ? 'hidden' : ''
}

watch(open, async (isOpen) => {
  lockPage(isOpen)
  if (!isOpen) return
  await nextTick()
  if (bodyRef.value) bodyRef.value.scrollTop = 0
}, { immediate: true })

onBeforeUnmount(() => lockPage(false))

const canConfirm = computed(() => !props.submitting)
</script>

<template>
  <AppModal
    v-model="open"
    title="Pernyataan hak cipta soal"
    description="Baca sebelum mengajukan paket ini."
  >
    <div
      ref="bodyRef"
      data-lenis-prevent
      class="-mx-6 -my-6 max-h-[55vh] overflow-y-auto overscroll-contain px-6 py-6"
      tabindex="0"
    >
      <div class="grid gap-4 text-[0.88rem] leading-relaxed text-ink">
        <p>
          Dengan mengajukan paket ini untuk tayang, kamu menyatakan dan menjamin
          kepada Zenko bahwa:
        </p>

        <ol class="grid list-decimal gap-3 pl-5">
          <li>
            <strong class="font-semibold">Soal adalah karya asli.</strong>
            Seluruh soal, wacana, gambar, tabel, dan pembahasan dalam paket ini
            kamu buat sendiri, atau kamu gunakan berdasarkan izin sah dari
            pemegang haknya untuk tujuan komersial.
          </li>
          <li>
            <strong class="font-semibold">Tidak menyalin dari sumber lain.</strong>
            Soal tidak disalin dari buku, modul bimbel, situs web, aplikasi, atau
            paket tutor lain di Zenko tanpa izin. Mengubah sedikit kalimat atau
            angka dari soal berhak cipta milik orang lain tetap termasuk
            penyalinan.
          </li>
          <li>
            <strong class="font-semibold">Bukan soal bocoran atau materi rahasia.</strong>
            Paket tidak memuat naskah ujian resmi yang bocor atau bersifat
            rahasia (misalnya naskah asli UTBK, SKD CPNS, atau ujian sekolah)
            yang diperoleh secara melawan hukum. Soal bergaya atau setipe ujian
            resmi diperbolehkan selama kamu menyusunnya sendiri.
          </li>
          <li>
            <strong class="font-semibold">Aset pihak ketiga berizin.</strong>
            Gambar, grafik, kutipan teks, atau data yang bukan buatanmu memakai
            lisensi yang mengizinkan penggunaan komersial, dan sumbernya
            dicantumkan bila lisensinya mensyaratkan.
          </li>
          <li>
            <strong class="font-semibold">Kamu bertanggung jawab penuh.</strong>
            Segala klaim, tuntutan, atau kerugian pihak ketiga yang timbul dari
            konten paket ini menjadi tanggung jawabmu. Jika terbukti melanggar,
            Zenko dapat menurunkan paket dari katalog, menahan pencairan dana
            yang terkait, dan mencabut status tutor.
          </li>
          <li>
            <strong class="font-semibold">Hak cipta tetap milikmu.</strong>
            Dengan menayangkan paket, kamu memberi Zenko lisensi non-eksklusif
            dan bebas royalti untuk menyimpan, menampilkan, mendistribusikan
            konten kepada pembeli, serta mempromosikan paket selama paket
            tayang. Kepemilikan hak ciptanya tidak berpindah.
          </li>
          <li>
            <strong class="font-semibold">Deskripsi sesuai isi.</strong>
            Judul, deskripsi, jumlah soal, cakupan materi, dan klaim manfaat
            paket menggambarkan isinya dengan jujur.
          </li>
        </ol>

        <p class="text-muted">
          Pernyataan ini merangkum Bagian 4 dan 9
          <NuxtLink to="/ketentuan-layanan#kewajiban-tutor" target="_blank" class="font-semibold text-ink underline hover:no-underline">Ketentuan Layanan Zenko</NuxtLink>.
          Jika ada perbedaan, Ketentuan Layanan yang berlaku.
        </p>
      </div>
    </div>

    <template #footer="{ close }">
      <AppButton type="button" variant="outline" size="sm" :disabled="submitting" @click="close()">
        Batal
      </AppButton>
      <AppButton type="button" size="sm" :disabled="!canConfirm" @click="emit('confirm')">
        {{ submitting ? 'Mengajukan...' : confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>
