<template>
  <UModal
    v-model:open="open"
    :title="`Edit ${pageTitle}`"
    :description="`Update this ${pageTitle.toLowerCase()}`"
  >
    <template #body>
      <div v-if="fetchStatus === 'pending'" class="flex justify-center py-8">
        <UIcon name="i-svg-spinners:180-ring-with-bg" class="w-6 h-6" />
      </div>

      <UForm
        v-else
        :state="state"
        :schema="schema"
        class="flex flex-col gap-4"
        @submit="onSubmit"
      >
        <template v-if="resource?.form?.fields?.length">
          <UFormField
            v-for="field in resource.form.fields"
            :key="field.key"
            :label="field.label ?? field.key"
            :name="field.key"
            :required="field.required"
          >
            <!-- Text / Email / Password / Number -->
            <UInput
              v-if="['text', 'email', 'password', 'number', undefined].includes(field.type)"
              v-model="state[field.key]"
              :type="field.type ?? 'text'"
              :placeholder="field.label ?? field.key"
              :readonly="field.readonly"
              class="w-full"
            />

            <!-- Textarea -->
            <UTextarea
              v-else-if="field.type === 'textarea'"
              v-model="state[field.key]"
              :placeholder="field.label ?? field.key"
              :readonly="field.readonly"
              autoresize
              class="w-full"
            />

            <!-- Select -->
            <USelect
              v-else-if="field.type === 'select'"
              v-model="state[field.key]"
              :items="(field.options ?? []).map(o => ({ label: o, value: o }))"
              :placeholder="`Select ${field.label ?? field.key}`"
              class="w-full"
            />

            <!-- Multiselect -->
            <USelectMenu
              v-else-if="field.type === 'multiselect'"
              v-model="state[field.key]"
              :items="(field.options ?? []).map(o => ({ label: o, value: o }))"
              :placeholder="`Select ${field.label ?? field.key}`"
              multiple
              class="w-full"
            />

            <!-- Boolean -->
            <UToggle
              v-else-if="field.type === 'boolean'"
              v-model="state[field.key]"
            />

            <!-- Date / Datetime -->
            <UInput
              v-else-if="field.type === 'date' || field.type === 'datetime'"
              v-model="state[field.key]"
              :type="field.type === 'datetime' ? 'datetime-local' : 'date'"
              class="w-full"
            />
          </UFormField>
        </template>

        <p v-else class="text-sm text-(--ui-text-muted)">
          No fields configured. Add <code>form.fields</code> to your resource config.
        </p>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            label="Save"
            color="primary"
            variant="solid"
            type="submit"
            :loading="loading"
            :disabled="!resource?.form?.fields?.length"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useToast, useRequestHeaders } from '#imports'
import { ref, reactive, computed, watch } from 'vue'
import { useRuntimeConfig } from '#imports'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AdminResource } from '../../types'

// ----- Props -----
const props = defineProps<{
  resourceName: string
  recordId: string | number | null
}>()

// ----- Emits -----
const emit = defineEmits<{
  (e: 'updated'): void
}>()

// ----- Config -----
const config = useRuntimeConfig()
const toast = useToast()

const resource = computed<AdminResource | undefined>(() =>
  config.public.admin.resources.find((r: AdminResource) => r.name === props.resourceName)
)

const pageTitle = computed(() =>
  props.resourceName.charAt(0).toUpperCase() + props.resourceName.slice(1)
)

// ----- State -----
const open = ref(false)
const loading = ref(false)
const fetchStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')

const state = reactive<Record<string, any>>({})

// ----- Expose open for parent -----
const openModal = async (id: string | number) => {
  open.value = true
  await fetchRecord(id)
}

defineExpose({ openModal })

// ----- Fetch existing record -----
const fetchRecord = async (id: string | number) => {
  fetchStatus.value = 'pending'

  const endpoints = resource.value?.endpoints
  const base = resource.value?.endpoint
  const showEndpoint = endpoints?.show ?? {
    path: `${base}/:id`,
    method: 'GET' as const,
  }

  try {
    const data = await $fetch<Record<string, any>>(
      showEndpoint.path.replace(':id', String(id)),
      {
        method: showEndpoint.method,
        headers: useRequestHeaders(['cookie']),
      }
    )

    // Prefill state with fetched data, only for configured fields
    const fields = resource.value?.form?.fields ?? []
    for (const field of fields) {
      state[field.key] = data[field.key] ?? (field.type === 'boolean' ? false : '')
    }

    fetchStatus.value = 'success'
  } catch {
    fetchStatus.value = 'error'
    toast.add({ title: 'Failed to load record', color: 'error' })
    open.value = false
  }
}

// ----- Schema -----
const schema = computed(() => {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of resource.value?.form?.fields ?? []) {
    let validator: z.ZodTypeAny

    switch (field.type) {
      case 'email':
        validator = z.string().email('Invalid email')
        break
      case 'number':
        validator = z.number()
        break
      case 'boolean':
        validator = z.boolean()
        break
      default:
        validator = z.string()
    }

    if (!field.required) {
      validator = validator.optional()
    } else if (field.type !== 'boolean' && field.type !== 'number') {
      validator = z.string().min(1, `${field.label ?? field.key} is required`)
    }

    shape[field.key] = validator
  }

  return z.object(shape)
})

// ----- Submit -----
const onSubmit = async (event: FormSubmitEvent<any>) => {
  if (loading.value) return
  loading.value = true

  const id = props.recordId
  const endpoints = resource.value?.endpoints
  const base = resource.value?.endpoint

  // Support both PUT and PATCH
  const editEndpoint = endpoints?.edit ?? {
    path: `${base}/:id`,
    method: 'PUT' as const,
  }

  try {
    await $fetch(editEndpoint.path.replace(':id', String(id)), {
      method: editEndpoint.method,
      body: event.data,
      headers: useRequestHeaders(['cookie']),
    })

    toast.add({
      title: `${pageTitle.value} updated successfully`,
      color: 'success',
    })

    open.value = false
    emit('updated')
  } catch (err: any) {
    const status = err?.response?.status
    const data = err?.response?._data

    if (status === 422) {
      toast.add({
        title: data?.message ?? 'Validation failed',
        color: 'error',
      })
      return
    }

    toast.add({
      title: 'Something went wrong',
      description: data?.message ?? err?.message,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

// Reset state when modal closes
watch(open, (val) => {
  if (!val) {
    fetchStatus.value = 'idle'
    Object.keys(state).forEach(key => delete state[key])
  }
})
</script>