<script setup lang="ts">
import type { TutorProductSummary } from '#shared/types/tutor-product'
import type { Voucher, VoucherRequest } from '#shared/types/voucher'

/**
 * Create/edit form untuk voucher milik tutor sendiri. Satu body penuh dikirim
 * setiap submit (bukan patch parsial) — lihat VoucherRequest. Saat `locked`
 * (voucher sudah punya redemption paid), field selain Active dikunci di UI —
 * server mengunci hal yang sama secara independen di TutorUpdate, jadi ini
 * murni supaya tutor tidak salah kira sedang mengubah sesuatu yang sebenarnya
 * diabaikan server.
 */
const props = defineProps<{
  voucher: Voucher | null
  products: TutorProductSummary[]
  saving: boolean
  error: string
  locked: boolean
}>()

const emit = defineEmits<{ submit: [input: VoucherRequest, password: string] }>()
const open = defineModel<boolean>('open', { required: true })

const code = ref('')
const discountType = ref<'flat' | 'percent'>('flat')
const discountValue = ref<number | null>(null)
const maxDiscount = ref<number | null>(null)
const minOrderAmount = ref<number | null>(null)
const scope = ref<'all' | 'category' | 'products'>('all')
const scopeCategoriesText = ref('')
const scopeProductIds = ref<string[]>([])
const usageLimitTotal = ref<number | null>(null)
const usageLimitPerUser = ref<number | null>(1)
const startsAtInput = ref('')
const expiresAtInput = ref('')
const active = ref(true)
const internalNote = ref('')
const password = ref('')

function resetForm() {
  const v = props.voucher
  code.value = v?.code ?? ''
  discountType.value = v?.discountType ?? 'flat'
  discountValue.value = v?.discountValue ?? null
  maxDiscount.value = v?.maxDiscount ?? null
  minOrderAmount.value = v?.minOrderAmount || null
  scope.value = v?.scope ?? 'all'
  scopeCategoriesText.value = (v?.scopeCategories ?? []).join(', ')
  scopeProductIds.value = v?.scopeProductIds ?? []
  usageLimitTotal.value = v?.usageLimitTotal ?? null
  usageLimitPerUser.value = v?.usageLimitPerUser ?? 1
  startsAtInput.value = wibInputValue(v?.startsAt)
  expiresAtInput.value = wibInputValue(v?.expiresAt)
  active.value = v?.active ?? true
  internalNote.value = v?.internalNote ?? ''
  password.value = ''
}

watch(open, (isOpen) => { if (isOpen) resetForm() })

function applyFreePreset() {
  discountType.value = 'percent'
  discountValue.value = 100
  maxDiscount.value = null
}

const currentInput = computed<VoucherRequest>(() => ({
  code: code.value.trim(),
  discountType: discountType.value,
  discountValue: discountValue.value ?? 0,
  maxDiscount: maxDiscount.value || null,
  minOrderAmount: minOrderAmount.value ?? 0,
  scope: scope.value,
  scopeCategories: scope.value === 'category'
    ? scopeCategoriesText.value.split(',').map(s => s.trim()).filter(Boolean)
    : undefined,
  scopeProductIds: scope.value === 'products' ? scopeProductIds.value : undefined,
  usageLimitTotal: usageLimitTotal.value || null,
  usageLimitPerUser: usageLimitPerUser.value ?? 0,
  startsAt: parseWibInput(startsAtInput.value) ?? null,
  expiresAt: parseWibInput(expiresAtInput.value) ?? null,
  active: active.value,
  internalNote: internalNote.value.trim() || undefined,
}))

const isHighRisk = computed(() => isHighRiskVoucherInput(currentInput.value))

const canSubmit = computed(() => {
  if (props.saving) return false
  if (props.locked) return true
  if (!code.value.trim() || !discountValue.value) return false
  if (discountType.value === 'percent' && (discountValue.value <= 0 || discountValue.value > 100)) return false
  if (scope.value === 'category' && !scopeCategoriesText.value.trim()) return false
  if (scope.value === 'products' && scopeProductIds.value.length === 0) return false
  if (isHighRisk.value && !usageLimitTotal.value) return false
  if (isHighRisk.value && !password.value) return false
  return true
})

function submit() {
  if (!canSubmit.value) return
  emit('submit', currentInput.value, password.value)
}

function toggleProduct(id: string, checked: boolean) {
  scopeProductIds.value = checked
    ? [...scopeProductIds.value, id]
    : scopeProductIds.value.filter(existing => existing !== id)
}
</script>

<template>
  <AppModal
    v-model="open"
    :title="voucher ? `Ubah voucher ${voucher.code}` : 'Buat voucher baru'"
    description="Diskon dipotong dari harga paketmu sendiri dan ditanggung dari bagi hasilmu — bukan margin Zenko."
  >
    <form class="grid gap-5" @submit.prevent="submit">
      <AppInlineMessage v-if="locked" type="warning">
        Voucher ini sudah pernah dipakai untuk pembelian yang lunas, jadi nilainya terkunci. Kamu masih bisa
        menonaktifkan atau mengaktifkannya kembali.
      </AppInlineMessage>

      <div>
        <label for="voucher-code" :class="FIELD_LABEL_CLASS">Kode</label>
        <input
          id="voucher-code" v-model="code" type="text" placeholder="DISKON20" :disabled="locked"
          :class="[FIELD_CLASS, 'uppercase']" maxlength="32"
        >
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="voucher-discount-type" :class="FIELD_LABEL_CLASS">Tipe diskon</label>
          <select id="voucher-discount-type" v-model="discountType" :disabled="locked" :class="FIELD_CLASS">
            <option value="flat">Nominal tetap (Rp)</option>
            <option value="percent">Persentase (%)</option>
          </select>
        </div>
        <div>
          <label for="voucher-discount-value" :class="FIELD_LABEL_CLASS">
            {{ discountType === 'percent' ? 'Persentase' : 'Nominal' }}
          </label>
          <AppCurrencyField
            v-if="discountType === 'flat'"
            id="voucher-discount-value" v-model="discountValue" placeholder="20.000" :disabled="locked"
          />
          <input
            v-else id="voucher-discount-value" v-model.number="discountValue" type="number" min="1" max="100"
            placeholder="20" :disabled="locked" :class="FIELD_CLASS"
          >
        </div>
      </div>

      <button
        v-if="discountType !== 'percent' || discountValue !== 100"
        type="button" :disabled="locked"
        class="w-fit text-[0.82rem] font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        @click="applyFreePreset"
      >
        Gratiskan sepenuhnya (100%)
      </button>

      <div v-if="discountType === 'percent'">
        <label for="voucher-max-discount" :class="FIELD_LABEL_CLASS">Batas maksimum potongan (opsional)</label>
        <AppCurrencyField id="voucher-max-discount" v-model="maxDiscount" placeholder="Tanpa batas" :disabled="locked" />
      </div>

      <div>
        <label for="voucher-min-order" :class="FIELD_LABEL_CLASS">Syarat harga minimum (opsional)</label>
        <AppCurrencyField id="voucher-min-order" v-model="minOrderAmount" placeholder="Tanpa syarat" :disabled="locked" />
      </div>

      <div>
        <label for="voucher-scope" :class="FIELD_LABEL_CLASS">Berlaku untuk</label>
        <select id="voucher-scope" v-model="scope" :disabled="locked" :class="FIELD_CLASS">
          <option value="all">Semua paketku</option>
          <option value="category">Kategori tertentu</option>
          <option value="products">Paket tertentu</option>
        </select>
      </div>

      <div v-if="scope === 'category'">
        <label for="voucher-categories" :class="FIELD_LABEL_CLASS">Kategori (pisahkan dengan koma)</label>
        <input
          id="voucher-categories" v-model="scopeCategoriesText" type="text" placeholder="SNBT, UTBK"
          :disabled="locked" :class="FIELD_CLASS"
        >
      </div>

      <div v-if="scope === 'products'">
        <p :class="FIELD_LABEL_CLASS">Pilih paket</p>
        <p v-if="products.length === 0" class="text-[0.86rem] text-muted">
          Belum ada paket live yang bisa dipilih.
        </p>
        <div v-else class="grid max-h-48 gap-2 overflow-y-auto rounded-sm border border-line p-3">
          <label v-for="product in products" :key="product.id" class="flex items-center gap-2.5 text-[0.88rem]">
            <input
              type="checkbox" :disabled="locked" :checked="scopeProductIds.includes(product.id)"
              class="h-4 w-4 shrink-0 rounded-xs border-line"
              @change="toggleProduct(product.id, ($event.target as HTMLInputElement).checked)"
            >
            <span class="truncate">{{ product.title }}</span>
          </label>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="voucher-usage-total" :class="FIELD_LABEL_CLASS">Batas total pemakaian</label>
          <input
            id="voucher-usage-total" v-model.number="usageLimitTotal" type="number" min="1"
            :placeholder="isHighRisk ? 'Wajib diisi' : 'Tanpa batas'" :disabled="locked" :class="FIELD_CLASS"
          >
        </div>
        <div>
          <label for="voucher-usage-per-user" :class="FIELD_LABEL_CLASS">Batas per akun</label>
          <input
            id="voucher-usage-per-user" v-model.number="usageLimitPerUser" type="number" min="0"
            placeholder="1" :disabled="locked" :class="FIELD_CLASS"
          >
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <AppInput id="voucher-starts-at" v-model="startsAtInput" type="datetime-local" label="Mulai berlaku (WIB, opsional)" :disabled="locked" />
        <AppInput id="voucher-expires-at" v-model="expiresAtInput" type="datetime-local" label="Berakhir (WIB, opsional)" :disabled="locked" />
      </div>

      <label class="flex items-center gap-3">
        <AppSwitch v-model="active" aria-label="Voucher aktif" />
        <span class="text-[0.9rem] font-semibold">{{ active ? 'Aktif' : 'Nonaktif' }}</span>
      </label>

      <AppSectionMessage v-if="isHighRisk && !locked" appearance="warning">
        Potongan ini 80% atau lebih tanpa batas maksimum — wajib mengisi batas total pemakaian, dan kamu perlu
        memasukkan ulang kata sandi untuk konfirmasi.
      </AppSectionMessage>

      <div v-if="isHighRisk && !locked">
        <label for="voucher-step-up-password" :class="FIELD_LABEL_CLASS">Kata sandi akunmu</label>
        <input
          id="voucher-step-up-password" v-model="password" type="password" autocomplete="current-password"
          :class="FIELD_CLASS"
        >
      </div>

      <AppInlineMessage v-if="error" type="error">{{ error }}</AppInlineMessage>

      <AppButton type="submit" size="sm" :disabled="!canSubmit">
        {{ saving ? 'Menyimpan...' : voucher ? 'Simpan perubahan' : 'Buat voucher' }}
      </AppButton>
    </form>
  </AppModal>
</template>
