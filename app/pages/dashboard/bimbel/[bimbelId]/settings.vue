<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Pengaturan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const bimbelId = String(useRoute().params.bimbelId)
const bimbel = useBimbelDetail(bimbelId)
const form = reactive({ name: '', city: '', description: '', logoUrl: '' })
const saving = ref(false)
const rotating = ref(false)
const toast = useToast()
onMounted(bimbel.refresh)
watch(() => bimbel.data.value, (value) => { if (value) Object.assign(form, { name: value.name, city: value.city ?? '', description: value.description ?? '', logoUrl: value.logoUrl ?? '' }) })
async function save() { saving.value = true; try { bimbel.data.value = await updateBimbel(bimbelId, form); toast.success('Profil bimbel disimpan.') } catch (cause) { toast.error('Gagal menyimpan profil.', tutorApiMessage(cause, 'Coba lagi.')) } finally { saving.value = false } }
async function rotate() { rotating.value = true; try { bimbel.data.value = await rotateBimbelJoinCode(bimbelId); toast.success('Kode bergabung diperbarui.', 'Kode lama tidak dapat dipakai lagi.') } catch (cause) { toast.error('Gagal membuat kode baru.', tutorApiMessage(cause, 'Coba lagi.')) } finally { rotating.value = false } }
</script>
<template>
  <div class="grid gap-6"><AppPageHeader title="Pengaturan bimbel" description="Profil organisasi dan kode yang dipakai siswa untuk meminta bergabung." />
    <DashboardPanel title="Profil bimbel"><DashboardSkeleton v-if="bimbel.pending.value" :count="4" label="Memuat profil…" /><form v-else class="grid max-w-3xl gap-4 md:grid-cols-2" @submit.prevent="save"><AppInput v-model="form.name" label="Nama bimbel" required /><AppInput v-model="form.city" label="Kota" /><AppInput v-model="form.logoUrl" class="md:col-span-2" label="URL logo" type="url" /><AppTextarea v-model="form.description" class="md:col-span-2" label="Deskripsi" /><div class="md:col-span-2"><AppButton type="submit" :loading="saving">Simpan perubahan</AppButton></div></form></DashboardPanel>
    <DashboardPanel title="Kode bergabung" description="Bagikan kode ini kepada siswa. Setiap permintaan tetap harus disetujui admin bimbel."><div class="flex flex-wrap items-center gap-4"><code class="rounded-md bg-primary-soft px-5 py-3 text-xl font-bold tracking-[0.18em] text-primary">{{ bimbel.data.value?.joinCode || '—' }}</code><AppButton variant="secondary" :loading="rotating" @click="rotate">Buat kode baru</AppButton></div><p class="mt-3 text-sm text-muted">Membuat kode baru langsung menonaktifkan kode lama, tetapi tidak mengeluarkan siswa yang sudah aktif.</p></DashboardPanel>
  </div>
</template>
