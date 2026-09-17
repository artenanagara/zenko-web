<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Pengguna Marketing | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })

interface MarketingUser { id: string, email: string, name: string, role: 'marketing' | 'editor', verified: boolean, createdAt: number }
const { public: config } = useRuntimeConfig()
const users = ref<MarketingUser[]>([])
const pending = ref(true)
const error = ref(false)
const email = ref('')
const role = ref<'marketing' | 'editor'>('marketing')
const saving = ref(false)

async function load() {
  pending.value = true; error.value = false
  try { users.value = await useApiFetch<MarketingUser[]>('/admin/marketing-users', { baseURL: config.apiBase, credentials: 'include' }) }
  catch { error.value = true }
  finally { pending.value = false }
}
async function save() {
  if (!email.value.trim()) return
  saving.value = true
  try { await useApiFetch('/admin/marketing-users', { baseURL: config.apiBase, credentials: 'include', method: 'POST', body: { email: email.value.trim(), role: role.value } }); email.value = ''; await load() }
  finally { saving.value = false }
}
onMounted(load)
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Pengguna marketing" description="Atur akun yang boleh masuk ke Marketing Hub sebagai marketing atau editor." />
    <DashboardPanel header="Tambah atau ubah akses">
      <form class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end" @submit.prevent="save">
        <AppField label="Email akun" name="marketing-user-email"><AppInput v-model="email" label="Email akun" type="email" placeholder="nama@zenkoedu.id" required /></AppField>
        <AppField label="Role" name="marketing-user-role"><AppSelect v-model="role" :options="[{ value: 'marketing', label: 'Marketing' }, { value: 'editor', label: 'Editor' }]" /></AppField>
        <AppButton type="submit" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan akses' }}</AppButton>
      </form>
    </DashboardPanel>
    <DashboardPanel header="Daftar pengguna">
      <DashboardSkeleton v-if="pending" :count="4" label="Memuat pengguna…" />
      <AppInlineMessage v-else-if="error" type="error">Daftar pengguna belum berhasil dimuat. <button class="font-semibold underline" @click="load">Coba lagi</button></AppInlineMessage>
      <AppEmptyState v-else-if="!users.length" title="Belum ada pengguna marketing" description="Tambahkan akun pertama di atas." />
      <div v-else class="overflow-x-auto"><table class="w-full min-w-[620px] text-left text-sm"><thead class="border-b border-hairline text-xs text-muted"><tr><th class="px-4 py-3">Pengguna</th><th class="px-4 py-3">Role</th><th class="px-4 py-3">Verifikasi</th><th class="px-4 py-3">Bergabung</th></tr></thead><tbody class="divide-y divide-hairline"><tr v-for="item in users" :key="item.id || item.email"><td class="px-4 py-4"><p class="font-semibold text-ink">{{ item.name || 'Tanpa nama' }}</p><p class="text-xs text-muted">{{ item.email }}</p></td><td class="px-4 py-4"><AppBadge>{{ item.role }}</AppBadge></td><td class="px-4 py-4 text-muted">{{ item.verified ? 'Terverifikasi' : 'Belum verifikasi' }}</td><td class="px-4 py-4 text-muted">{{ item.createdAt ? new Date(item.createdAt * 1000).toLocaleDateString('id-ID') : '—' }}</td></tr></tbody></table></div>
    </DashboardPanel>
  </div>
</template>
