<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth', roles: ['admin'] })
useHead({ title: 'Pengaturan Admin | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
const { user, signOut } = useAuth()
async function logout() { await signOut(); await navigateTo('/masuk') }
</script>

<template>
  <div class="grid gap-6">
    <AppPageHeader title="Pengaturan" description="Identitas akun dan akses Dashboard Admin." />
    <DashboardPanel header="Akun admin">
      <div class="flex items-center gap-4">
        <BrandIcon class="h-12 w-12 shrink-0" />
        <div class="min-w-0">
          <p class="font-semibold text-ink">{{ user?.name || 'Administrator Zenko' }}</p>
          <p class="truncate text-sm text-muted">{{ user?.email }}</p>
          <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">{{ user?.role }}</p>
        </div>
      </div>
      <div class="mt-6 border-t border-hairline pt-4">
        <AppButton variant="outline" size="sm" @click="logout">Keluar</AppButton>
      </div>
    </DashboardPanel>
  </div>
</template>
