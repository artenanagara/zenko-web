<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const toast = useToast()
const pending = ref(false)
const done = ref(false)
const error = ref('')
const token = computed(() => String(route.query.token ?? ''))
const role = computed(() => String(route.query.role ?? ''))
const roleLabel = computed(() => role.value === 'marketing' ? 'Marketing' : role.value === 'editor' ? 'Editor' : '')
useHead({ title: 'Terima undangan | Zenko', meta: [{ name: 'robots', content: 'noindex' }] })
async function accept() {
  if (!token.value || !roleLabel.value || pending.value) return
  pending.value = true; error.value = ''
  try {
    const { public: config } = useRuntimeConfig()
    await useApiFetch('/marketing/invitations/accept', { baseURL: config.apiBase, method: 'POST', body: { token: token.value, role: role.value } })
    done.value = true; toast.success('Akses Marketing Hub sudah aktif.')
  } catch (cause) { error.value = tutorApiMessage(cause, 'Undangan tidak dapat diterima.') }
  finally { pending.value = false }
}
</script>
<template><main class="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-5"><section class="w-full rounded-xl border border-line bg-surface p-6 shadow-xs"><h1 class="text-xl font-bold text-ink">Undangan Marketing Hub</h1><p class="mt-2 text-sm text-muted">Anda akan bergabung sebagai {{ roleLabel || 'anggota' }}.</p><AppInlineMessage v-if="error" class="mt-4" type="error">{{ error }}</AppInlineMessage><p v-else-if="done" class="mt-4 text-sm font-semibold text-success-ink">Akses aktif. Silakan buka dashboard Marketing Hub.</p><div class="mt-5"><AppButton v-if="!done" :loading="pending" :disabled="!token || !roleLabel" @click="accept">Terima undangan</AppButton><AppButton v-else to="/dashboard/marketing">Buka Marketing Hub</AppButton></div></section></main></template>
