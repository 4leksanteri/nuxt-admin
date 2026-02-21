<template>
  <UModal
    v-model:open="open"
    :title="`Create ${pageTitle}`"
    :description="`Add a new ${pageTitle.toLowerCase()} to the database`"
  >
    <UButton
      label="Create"
      icon="i-lucide-plus"
    />

    <template #body>
      <UForm
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
            label="Create"
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
import { useRuntimeConfig, useToast, useRequestHeaders } from '#imports'
import { ref, reactive, computed } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AdminResource } from '../../types'

// ----- Props -----
const props = defineProps<{
  resourceName: string
}>()

// ----- Emits -----
const emit = defineEmits<{
  (e: 'created'): void
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

const state = reactive<Record<string, any>>(
  Object.fromEntries(
    (resource.value?.form?.fields ?? []).map(f => [
      f.key,
      f.type === 'boolean' ? false : ''
    ])
  )
)

// ----- Schema -----
// Build a zod schema from field config
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

  const endpoints = resource.value?.endpoints
  const base = resource.value?.endpoint
  const createEndpoint = endpoints?.create ?? {
    path: base!,
    method: 'POST' as const,
  }

  try {
    await $fetch(createEndpoint.path, {
      method: createEndpoint.method,
      body: event.data,
      headers: useRequestHeaders(['cookie']),
    })

    toast.add({
      title: `${pageTitle.value} created successfully`,
      color: 'success',
    })

    open.value = false
    emit('created')

    // Reset form
    for (const key of Object.keys(state)) {
      state[key] = resource.value?.form?.fields?.find(f => f.key === key)?.type === 'boolean'
        ? false
        : ''
    }
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
</script>