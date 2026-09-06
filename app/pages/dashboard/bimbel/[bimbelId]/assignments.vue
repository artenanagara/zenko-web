<script setup lang="ts">
import type { AssignmentPhase, AssignmentResults, AssignmentTargetKind } from '#shared/types/bimbel'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Penugasan Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const bimbelId = String(useRoute().params.bimbelId)
const assignments = useBimbelAssignments(bimbelId)
const classes = useBimbelClasses(bimbelId)
const members = useBimbelMembers(bimbelId)
const productsResource = useTutorProducts({ bimbelId })
const { data: memberships, refresh: refreshMemberships } = useBimbelMemberships()
const membership = computed(() => memberships.value.find(item => item.bimbelId === bimbelId))
const canTargetMembers = computed(() => membership.value?.role === 'owner' || membership.value?.role === 'admin')
const products = computed(() => productsResource.data.value.filter(item => item.visibility === 'bimbel' && item.status === 'live' && item.type === 'single'))
const students = computed(() => members.data.value.filter(item => item.role === 'student' && item.status === 'active'))
const toast = useToast()
const { confirm } = useConfirm()
const showForm = ref(false)
const saving = ref(false)
const busyId = ref('')
const results = ref<AssignmentResults | null>(null)
const resultsPending = ref(false)
function localValue(date: Date) { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 16) }
const start = new Date(Date.now() + 60 * 60 * 1000)
const end = new Date(Date.now() + 3 * 60 * 60 * 1000)
const form = reactive({ productId: '', title: '', targetKind: 'all' as AssignmentTargetKind, targetIds: [] as string[], opensAt: localValue(start), closesAt: localValue(end), maxAttempts: 1, reviewPolicy: 'after_close' as const })
const targetOptions = computed(() => form.targetKind === 'class' ? classes.data.value.map(item => ({ id: item.id, label: item.name, meta: `${item.memberCount} siswa` })) : students.value.map(item => ({ id: item.accountId, label: item.name, meta: item.email })))
onMounted(async () => { await refreshMemberships(); await Promise.all([assignments.refresh(), classes.refresh(), productsResource.refresh(), canTargetMembers.value ? members.refresh() : Promise.resolve()]) })
watch(() => form.targetKind, () => { form.targetIds = [] })
function toggleTarget(id: string) { form.targetIds = form.targetIds.includes(id) ? form.targetIds.filter(item => item !== id) : [...form.targetIds, id] }
async function createAssignment() { saving.value = true; try { await createBimbelAssignment(bimbelId, { ...form, opensAt: Math.floor(new Date(form.opensAt).getTime() / 1000), closesAt: Math.floor(new Date(form.closesAt).getTime() / 1000) }); showForm.value = false; await assignments.refresh(); toast.success('Draft penugasan dibuat.', 'Periksa jadwal dan sasaran, lalu publikasikan.') } catch (cause) { toast.error('Gagal membuat penugasan.', tutorApiMessage(cause, 'Periksa isian lalu coba lagi.')) } finally { saving.value = false } }
async function act(id: string, action: 'publish' | 'close' | 'delete') { if (action === 'close' && !await confirm({ title: 'Tutup penugasan sekarang?', description: 'Siswa tidak bisa memulai percobaan baru.', confirmLabel: 'Tutup tugas' })) return; busyId.value = id; try { if (action === 'publish') await publishBimbelAssignment(bimbelId, id); if (action === 'close') await closeBimbelAssignment(bimbelId, id); if (action === 'delete') await deleteBimbelAssignment(bimbelId, id); await assignments.refresh(); toast.success(action === 'publish' ? 'Penugasan dipublikasikan.' : action === 'close' ? 'Penugasan ditutup.' : 'Draft dihapus.') } catch (cause) { toast.error('Tindakan gagal.', tutorApiMessage(cause, 'Coba lagi.')) } finally { busyId.value = '' } }
async function openResults(id: string) { resultsPending.value = true; results.value = null; try { results.value = await getBimbelAssignmentResults(bimbelId, id) } catch (cause) { toast.error('Hasil belum bisa dimuat.', tutorApiMessage(cause, 'Coba lagi.')) } finally { resultsPending.value = false } }
const phaseLabel: Record<AssignmentPhase, string> = { draft: 'Draft', scheduled: 'Terjadwal', ongoing: 'Berlangsung', closed: 'Selesai' }
const formatDate = (value: number) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(value * 1000)
</script>
<template>
  <div class="grid gap-6">
    <AppPageHeader title="Penugasan" description="Tentukan paket, siswa yang menerima, waktu pengerjaan, dan jumlah percobaan."><template #actions><AppButton size="sm" :disabled="products.length === 0" @click="showForm = !showForm">Buat penugasan</AppButton></template></AppPageHeader>
    <AppSectionMessage v-if="products.length === 0 && !productsResource.pending.value" appearance="information" title="Belum ada paket siap tugas">Selesaikan lalu tayangkan satu paket privat dari Bank soal terlebih dahulu.</AppSectionMessage>
    <DashboardPanel v-if="showForm" title="Penugasan baru" description="Penugasan disimpan sebagai draft dan belum memberi akses sampai dipublikasikan.">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="createAssignment">
        <AppSelect v-model="form.productId" label="Paket soal" :options="products.map(item => ({ value: item.id, label: item.title }))" required />
        <AppInput v-model="form.title" label="Judul tugas" placeholder="Opsional, mengikuti judul paket" />
        <AppSelect v-model="form.targetKind" label="Diberikan kepada" :options="[{ value: 'all', label: 'Semua siswa aktif' }, { value: 'class', label: 'Kelas tertentu' }, ...(canTargetMembers ? [{ value: 'member', label: 'Siswa tertentu' }] : [])]" />
        <AppInput v-model.number="form.maxAttempts" type="number" min="1" max="10" label="Maksimal percobaan" />
        <AppInput v-model="form.opensAt" type="datetime-local" label="Mulai" required />
        <AppInput v-model="form.closesAt" type="datetime-local" label="Berakhir" required />
        <div v-if="form.targetKind !== 'all'" class="grid gap-2 md:col-span-2"><p class="text-sm font-semibold">Pilih {{ form.targetKind === 'class' ? 'kelas' : 'siswa' }}</p><div class="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3"><label v-for="item in targetOptions" :key="item.id" class="flex cursor-pointer gap-3 rounded-sm border border-hairline p-3"><input type="checkbox" :checked="form.targetIds.includes(item.id)" @change="toggleTarget(item.id)"><span><strong class="block text-sm">{{ item.label }}</strong><span class="text-xs text-muted">{{ item.meta }}</span></span></label></div></div>
        <div class="flex gap-2 md:col-span-2"><AppButton type="submit" :loading="saving">Simpan draft</AppButton><AppButton type="button" variant="secondary" @click="showForm = false">Batal</AppButton></div>
      </form>
    </DashboardPanel>
    <DashboardPanel title="Daftar penugasan"><DashboardSkeleton v-if="assignments.pending.value" :count="5" label="Memuat penugasan…" /><div v-else-if="assignments.data.value.length" class="grid gap-3"><article v-for="item in assignments.data.value" :key="item.id" class="flex flex-col gap-4 rounded-md border border-hairline p-4 lg:flex-row lg:items-center"><div class="min-w-0 flex-1"><div class="flex flex-wrap gap-2"><h2 class="font-semibold">{{ item.title }}</h2><DashboardBadge :tone="item.phase === 'ongoing' ? 'success' : item.phase === 'draft' ? 'warning' : 'neutral'">{{ phaseLabel[item.phase] }}</DashboardBadge></div><p class="mt-1 text-sm text-muted">{{ formatDate(item.opensAt) }}–{{ formatDate(item.closesAt) }} · {{ item.maxAttempts }}× percobaan</p></div><div class="flex flex-wrap gap-2"><AppButton v-if="item.status === 'draft'" size="sm" :loading="busyId === item.id" @click="act(item.id, 'publish')">Publikasikan</AppButton><AppButton v-if="item.status === 'draft'" size="sm" variant="ghost" @click="act(item.id, 'delete')">Hapus</AppButton><AppButton v-if="item.status === 'scheduled'" size="sm" variant="secondary" @click="openResults(item.id)">Lihat hasil</AppButton><AppButton v-if="item.status === 'scheduled'" size="sm" variant="ghost" :loading="busyId === item.id" @click="act(item.id, 'close')">Tutup</AppButton><AppButton v-if="item.status === 'closed'" size="sm" variant="secondary" @click="openResults(item.id)">Lihat hasil</AppButton></div></article></div><AppEmptyState v-else title="Belum ada penugasan" description="Pilih paket privat yang sudah siap, lalu tentukan siapa yang dapat mengerjakannya." /></DashboardPanel>
    <DashboardPanel v-if="resultsPending || results" title="Hasil kelompok"><DashboardSkeleton v-if="resultsPending" :count="4" label="Memuat hasil…" /><template v-else-if="results"><div class="grid gap-3 sm:grid-cols-4"><AccountStat tone="primary" label="Ditugaskan" :value="String(results.summary.assigned)" /><AccountStat tone="success" label="Sudah mengerjakan" :value="String(results.summary.submitted)" /><AccountStat tone="star" label="Rata-rata" :value="String(results.summary.average)" /><AccountStat tone="primary" label="Tertinggi" :value="String(results.summary.highest)" /></div><div class="mt-5 overflow-x-auto"><table class="w-full min-w-140 text-left text-sm"><thead class="border-b border-hairline text-xs text-muted uppercase"><tr><th class="p-3">Peringkat</th><th class="p-3">Siswa</th><th class="p-3">Status</th><th class="p-3 text-right">Skor</th></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="row in results.results" :key="row.accountId"><td class="p-3">{{ row.rank || '—' }}</td><td class="p-3 font-semibold">{{ row.name }}</td><td class="p-3">{{ row.status === 'selesai' ? 'Selesai' : 'Belum mengerjakan' }}</td><td class="p-3 text-right font-semibold">{{ row.status === 'selesai' ? row.score : '—' }}</td></tr></tbody></table></div></template></DashboardPanel>
  </div>
</template>
