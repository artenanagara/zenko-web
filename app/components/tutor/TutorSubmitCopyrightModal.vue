<script setup lang="ts">
/**
 * Modal pernyataan hak cipta soal — muncul saat tutor menekan "Ajukan untuk
 * tayang" di langkah 5 TutorProductWizard, sebelum request submit benar-benar
 * dikirim ke server.
 *
 * Tombol setuju baru aktif setelah isi pernyataan digulir sampai bawah:
 * dialog yang bisa langsung di-OK tanpa dibaca tidak ada gunanya sebagai
 * pernyataan. Kalau viewport cukup tinggi sehingga isinya muat tanpa perlu
 * digulir, gerbangnya langsung terbuka — ResizeObserver menjaga kasus ini
 * termasuk saat jendela di-resize selagi modal terbuka.
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
const reachedEnd = ref(false)

// Toleransi beberapa piksel: di layar dengan zoom/DPR pecahan, scrollTop +
// clientHeight bisa berhenti 0,5px di bawah scrollHeight dan tidak pernah
// benar-benar "sama".
const END_TOLERANCE_PX = 4

function checkScroll() {
  const el = bodyRef.value
  if (!el) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - END_TOLERANCE_PX) {
    reachedEnd.value = true
  }
}

let observer: ResizeObserver | null = null

watch(open, async (isOpen) => {
  reachedEnd.value = false
  observer?.disconnect()
  observer = null
  if (!isOpen) return
  await nextTick()
  const el = bodyRef.value
  if (!el) return
  el.scrollTop = 0
  checkScroll()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(checkScroll)
    observer.observe(el)
  }
}, { immediate: true })

onBeforeUnmount(() => observer?.disconnect())

const canConfirm = computed(() => reachedEnd.value && !props.submitting)

function scrollToEnd() {
  bodyRef.value?.scrollTo({ top: bodyRef.value.scrollHeight, behavior: 'smooth' })
}
</script>

<template>
  <AppModal
    v-model="open"
    title="Pernyataan hak cipta soal"
    description="Baca sampai selesai sebelum mengajukan paket ini."
  >
    <div
      ref="bodyRef"
      class="-mx-6 -my-6 max-h-[55vh] overflow-y-auto px-6 py-6"
      tabindex="0"
      @scroll.passive="checkScroll"
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
          <NuxtLink to="/terms#kewajiban-tutor" target="_blank" class="font-semibold text-ink underline hover:no-underline">Ketentuan Layanan Zenko</NuxtLink>.
          Jika ada perbedaan, Ketentuan Layanan yang berlaku.
        </p>
      </div>
    </div>

    <template #footer="{ close }">
      <!-- Footer AppModal adalah flex satu baris; di layar sempit hint gulir
           dan dua tombol tidak muat sebaris, jadi dibungkus sendiri agar hint
           naik ke barisnya sendiri di bawah sm. -->
      <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        <!-- Petunjuk gulir hanya tampil selagi gerbang masih tertutup, dan
             bisa diklik untuk melompat ke bawah. -->
        <button
          v-if="!reachedEnd"
          type="button"
          class="inline-flex items-center gap-1.5 text-[0.8rem] text-muted hover:text-ink sm:mr-auto"
          @click="scrollToEnd"
        >
          <AppIcon name="arrow-down" :size="14" aria-hidden="true" />
          Gulir sampai bawah untuk melanjutkan
        </button>
        <span v-else class="inline-flex items-center gap-1.5 text-[0.8rem] text-muted sm:mr-auto">
          <AppIcon name="check-circle" :size="14" weight="fill" class="text-success" aria-hidden="true" />
          Sudah dibaca
        </span>

        <div class="flex items-center justify-end gap-3">
          <AppButton type="button" variant="outline" size="sm" :disabled="submitting" @click="close()">
            Batal
          </AppButton>
          <AppButton type="button" size="sm" :disabled="!canConfirm" @click="emit('confirm')">
            {{ submitting ? 'Mengajukan...' : confirmLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>
