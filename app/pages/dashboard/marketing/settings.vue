<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['marketing', 'editor'] })
useHead({ title: 'Pengaturan Marketing | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const { user, signOut } = useAuth()
interface MarketingUser { id: string, email: string, name: string, role: 'marketing' | 'editor', verified: boolean, createdAt: number }
const { public: config } = useRuntimeConfig()
const users = ref<MarketingUser[]>([])
const usersPending = ref(false)
const usersError = ref(false)
const email = ref('')
const role = ref<'marketing' | 'editor'>('editor')
const saving = ref(false)
const isMarketingLead = computed(() => user.value?.role === 'marketing')

const roleCards = [
  { role: 'marketing', title: 'Marketing', description: 'Mengelola seluruh Marketing Hub, konten, SEO, insight, pengguna, dan role.', tone: 'primary' },
  { role: 'editor', title: 'Editor', description: 'Membuat dan memelihara artikel, kategori, serta banner marketing.', tone: 'neutral' },
]

async function loadUsers() {
  if (!isMarketingLead.value) return
  usersPending.value = true
  usersError.value = false
  try {
    users.value = await useApiFetch<MarketingUser[]>('/marketing/users', { baseURL: config.apiBase, credentials: 'include' })
  } catch {
    usersError.value = true
  } finally {
    usersPending.value = false
  }
}

async function saveUser() {
  if (!email.value.trim()) return
  saving.value = true
  try {
    await useApiFetch('/marketing/users', { baseURL: config.apiBase, credentials: 'include', method: 'POST', body: { email: email.value.trim(), role: role.value } })
    email.value = ''
    await loadUsers()
  } finally {
    saving.value = false
  }
}

watch(() => user.value?.role, () => loadUsers(), { immediate: true })
async function logout() { await signOut(); await navigateTo('/masuk') }
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Pengaturan" description="Identitas akun dan akses Marketing Hub." />
    <DashboardPanel header="Akun yang sedang digunakan">
      <div class="flex items-center gap-4">
        <BrandIcon class="h-12 w-12 shrink-0" />
        <div class="min-w-0">
          <p class="font-semibold text-ink">{{ user?.name || 'Pengguna Zenko' }}</p>
          <p class="truncate text-sm text-muted">{{ user?.email }}</p>
          <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">{{ user?.role }}</p>
        </div>
      </div>
      <div class="mt-6 border-t border-hairline pt-4">
        <AppButton variant="outline" size="sm" @click="logout">Keluar</AppButton>
      </div>
    </DashboardPanel>

    <DashboardPanel header="Role Marketing Hub" description="Hak akses yang tersedia di dashboard marketing.">
      <div class="grid gap-3 md:grid-cols-2">
        <div v-for="item in roleCards" :key="item.role" class="rounded-card border border-hairline bg-surface-alt p-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold text-ink">{{ item.title }}</h2>
            <DashboardBadge :tone="item.tone === 'primary' ? 'brand' : 'neutral'">{{ item.role }}</DashboardBadge>
          </div>
          <p class="mt-2 text-sm leading-6 text-muted">{{ item.description }}</p>
        </div>
      </div>
    </DashboardPanel>

    <DashboardPanel v-if="isMarketingLead" header="Pengguna dan akses" description="Tambahkan akun ke Marketing Hub atau ubah aksesnya dengan memilih role yang sesuai.">
      <form class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end" @submit.prevent="saveUser">
        <AppInput id="marketing-settings-user-email" v-model="email" label="Email akun" type="email" placeholder="nama@zenkoedu.id" required />
        <AppSelect id="marketing-settings-user-role" v-model="role" label="Role" :options="[{ value: 'marketing', label: 'Marketing' }, { value: 'editor', label: 'Editor' }]" />
        <AppButton type="submit" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan akses' }}</AppButton>
      </form>

      <div class="mt-6 border-t border-hairline pt-5">
        <DashboardSkeleton v-if="usersPending" :count="3" label="Memuat pengguna…" />
        <AppInlineMessage v-else-if="usersError" type="error">Daftar pengguna belum berhasil dimuat. <button class="font-semibold underline" @click="loadUsers">Coba lagi</button></AppInlineMessage>
        <AppEmptyState v-else-if="!users.length" title="Belum ada pengguna marketing" description="Tambahkan akun pertama menggunakan formulir di atas." />
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[620px] text-left text-sm">
            <thead class="border-b border-hairline text-xs text-muted"><tr><th class="px-4 py-3">Pengguna</th><th class="px-4 py-3">Role</th><th class="px-4 py-3">Verifikasi</th><th class="px-4 py-3">Bergabung</th></tr></thead>
            <tbody class="divide-y divide-hairline"><tr v-for="item in users" :key="item.id || item.email"><td class="px-4 py-4"><p class="font-semibold text-ink">{{ item.name || 'Tanpa nama' }}</p><p class="text-xs text-muted">{{ item.email }}</p></td><td class="px-4 py-4"><DashboardBadge :tone="item.role === 'marketing' ? 'brand' : 'neutral'">{{ item.role }}</DashboardBadge></td><td class="px-4 py-4 text-muted">{{ item.verified ? 'Terverifikasi' : 'Belum verifikasi' }}</td><td class="px-4 py-4 text-muted">{{ item.createdAt ? new Date(item.createdAt * 1000).toLocaleDateString('id-ID') : '—' }}</td></tr></tbody>
          </table>
        </div>
      </div>
    </DashboardPanel>
    <AppInlineMessage v-else type="info">Pengelolaan pengguna dan role hanya tersedia untuk role Marketing.</AppInlineMessage>
  </div>
</template>
