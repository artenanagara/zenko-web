<script setup lang="ts">
import type { TutorProductSummary } from '#shared/types/tutor-product'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Bank Soal Bimbel | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const route = useRoute()
const bimbelId = String(route.params.bimbelId)
const workspace = { bimbelId }
const { data: products, pending, error, refresh } = useTutorProducts(workspace)
const { data: memberships, refresh: refreshMemberships } = useBimbelMemberships()
const toast = useToast()
const { confirm } = useConfirm()
const busyId = ref('')
const problems = ref<string[]>([])
const membership = computed(() => memberships.value.find(item => item.bimbelId === bimbelId))
const canManageMarketplace = computed(() => membership.value?.role === 'owner' || membership.value?.role === 'admin')
onMounted(() => Promise.all([refresh(), refreshMemberships()]))

async function run(product: TutorProductSummary, action: 'publish' | 'marketplace' | 'archive' | 'delete') {
  problems.value = []
  if (action === 'delete' && !await confirm({ title: `Hapus "${product.title}"?`, description: 'Soal dan konfigurasi paket akan dihapus permanen.', confirmLabel: 'Hapus permanen' })) return
  busyId.value = product.id
  try {
    if (action === 'publish') await submitTutorProduct(product.id, workspace, 'bimbel')
    if (action === 'marketplace') await submitBimbelProductPublic(bimbelId, product.id)
    if (action === 'archive') await archiveTutorProduct(product.id, workspace)
    if (action === 'delete') await deleteTutorProduct(product.id, workspace)
    await refresh()
    toast.success(action === 'marketplace' ? 'Salinan marketplace diajukan.' : action === 'publish' ? 'Paket tayang untuk siswa bimbel.' : action === 'archive' ? 'Paket diarsipkan.' : 'Paket dihapus.')
  }
  catch (cause) {
    problems.value = tutorSubmitProblems(cause)
    toast.error('Tindakan belum berhasil.', tutorApiMessage(cause, 'Periksa paket lalu coba lagi.'))
  }
  finally { busyId.value = '' }
}
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Bank soal" description="Materi privat bimbel dan salinan yang diajukan ke marketplace Zenko.">
      <template #actions><AppButton :to="`/dashboard/bimbel/${bimbelId}/products/new`" size="sm">Buat paket</AppButton></template>
    </AppPageHeader>
    <AppSectionMessage v-if="problems.length" appearance="error" title="Paket belum siap"><ul class="list-disc pl-5"><li v-for="item in problems" :key="item">{{ item }}</li></ul></AppSectionMessage>
    <DashboardPanel>
      <DashboardSkeleton v-if="pending" :count="5" label="Memuat bank soal…" />
      <AppInlineMessage v-else-if="error" type="error">{{ error }}</AppInlineMessage>
      <div v-else-if="products.length" class="grid gap-3">
        <article v-for="product in products" :key="product.id" class="flex flex-col gap-4 rounded-md border border-hairline p-4 lg:flex-row lg:items-center">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2"><h2 class="font-semibold">{{ product.title }}</h2><DashboardBadge :tone="product.visibility === 'public' ? 'brand' : 'neutral'">{{ product.visibility === 'public' ? 'Marketplace' : 'Privat' }}</DashboardBadge><DashboardBadge :tone="PRODUCT_STATUS_TONE[product.status]">{{ PRODUCT_STATUS_LABEL[product.status] }}</DashboardBadge></div>
            <p class="mt-1 text-sm text-muted">{{ product.category }} · {{ product.questionCount }}/{{ product.questionTarget }} soal</p>
            <p v-if="product.rejectReason" class="mt-2 text-sm text-danger">{{ product.rejectReason }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton v-if="product.status === 'draft' || product.status === 'rejected' || product.status === 'live'" :to="`/dashboard/bimbel/${bimbelId}/products/${product.id}/edit`" size="sm" variant="secondary">Edit</AppButton>
            <AppButton v-if="product.visibility === 'bimbel' && (product.status === 'draft' || product.status === 'rejected')" size="sm" :loading="busyId === product.id" @click="run(product, 'publish')">Tayangkan</AppButton>
            <!-- Rekap hasil jadi route sendiri, menggantikan panel Hasil kelompok
                 yang dulu menempel pada penugasan. Hanya paket privat yang pernah
                 tayang yang bisa punya percobaan untuk direkap. -->
            <AppButton v-if="product.visibility === 'bimbel' && (product.status === 'live' || product.status === 'archived')" :to="`/dashboard/bimbel/${bimbelId}/products/${product.id}/hasil`" size="sm" variant="secondary">Lihat hasil</AppButton>
            <AppButton v-if="product.visibility === 'bimbel' && product.status === 'live' && canManageMarketplace" size="sm" variant="secondary" :loading="busyId === product.id" @click="run(product, 'marketplace')">Jual di marketplace</AppButton>
            <AppButton v-if="product.visibility === 'public' && (product.status === 'draft' || product.status === 'rejected') && canManageMarketplace" size="sm" :loading="busyId === product.id" @click="run(product, 'marketplace')">Ajukan ulang</AppButton>
            <AppButton v-if="product.status === 'live'" size="sm" variant="ghost" :loading="busyId === product.id" @click="run(product, 'archive')">Arsipkan</AppButton>
            <AppButton v-if="product.status !== 'live' && product.status !== 'review'" size="sm" variant="ghost" :loading="busyId === product.id" @click="run(product, 'delete')">Hapus</AppButton>
          </div>
        </article>
      </div>
      <AppEmptyState v-else title="Bank soal masih kosong" description="Buat paket pertama, isi soalnya, lalu bagikan ke siswa bimbel." action-label="Buat paket" @action="navigateTo(`/dashboard/bimbel/${bimbelId}/products/new`)" />
    </DashboardPanel>
  </div>
</template>
