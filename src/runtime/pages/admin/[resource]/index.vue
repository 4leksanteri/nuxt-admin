<template>
  <UDashboardPanel :id="`admin-${resource?.name}`">

    <template #header>
      <UDashboardNavbar :title="pageTitle">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <AdminCreateModal
            :resource-name="resourceName"
            @created="safeRefresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <template v-if="resource?.filters">
            <USelect
              v-for="filter in resource.filters"
              :key="filter.key"
              v-model="activeFilters[filter.key]"
              :items="filterOptions(filter)"
              :placeholder="filter.label"
              class="min-w-28"
            />
          </template>

          <UButton
            v-if="rowSelection && Object.keys(rowSelection).length"
            label="Delete"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
            @click="deleteSelected"
          >
            <template #trailing>
              <UKbd>{{ Object.keys(rowSelection).length }}</UKbd>
            </template>
          </UButton>
        </div>
      </div>

      <!-- Table -->
      <UTable
        ref="table"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="shrink-0"
        :data="items"
        :columns="tableColumns"
        :loading="status === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
        }"
      />

      <!-- Footer -->
      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ Object.keys(rowSelection).length || 0 }} of {{ total }} row(s) selected.
        </div>
        <UPagination
          :default-page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="total"
          @update:page="(p: number) => pagination.pageIndex = p - 1"
        />
      </div>
    </template>

  </UDashboardPanel>

  <AdminEditModal
    ref="editModal"
    :resource-name="resourceName"
    :record-id="editingId"
    @updated="safeRefresh()"
  />

  <!-- Delete confirmation -->
  <UModal
    v-model:open="deleteConfirm.open"
    title="Confirm deletion"
    :description="deleteConfirm.ids.length > 1
      ? `Are you sure you want to delete ${deleteConfirm.ids.length} records? This cannot be undone.`
      : 'Are you sure you want to delete this record? This cannot be undone.'"
    :ui="{ footer: 'justify-end' }"
  >
    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        @click="deleteConfirm.open = false"
      />
      <UButton
        label="Delete"
        color="error"
        :loading="deleteConfirm.loading"
        @click="confirmDelete"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import {
  definePageMeta,
  useAsyncData,
  useRequestHeaders,
  useTemplateRef,
  useRoute,
  useRuntimeConfig,
  useToast
} from '#imports'
import { computed, ref, reactive, watch, h, resolveComponent } from 'vue'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { AdminResource, AdminFilter, AdminColumn } from '../../../../types'

definePageMeta({ layout: 'admin' })

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const route = useRoute()
const config = useRuntimeConfig()
const toast = useToast()

const resourceName = computed(() => route.params.resource as string)

const resource = computed<AdminResource | undefined>(() =>
  config.public.admin.resources.find((r: AdminResource) => r.name === resourceName.value)
)

const pageTitle = computed(() =>
  resourceName.value.charAt(0).toUpperCase() + resourceName.value.slice(1)
)

const table = useTemplateRef('table')
const editModal = useTemplateRef('editModal')
const editingId = ref<string | number | null>(null)
const rowSelection = ref<Record<string, boolean>>({})
const search = ref('')
const activeFilters = ref<Record<string, any>>({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
})

const endpoint = computed(() => resource.value?.endpoint ?? null)

const queryParams = computed(() => {
  const qMap = resource.value?.query ?? {}
  const params: Record<string, any> = {
    [qMap.page  ?? 'page']:  pagination.value.pageIndex + 1,
    [qMap.limit ?? 'limit']: pagination.value.pageSize,
  }

  if (search.value) {
    params[qMap.search ?? 'search'] = search.value
  }

  if (resource.value?.filters) {
    for (const filter of resource.value.filters) {
      const val = activeFilters.value[filter.key]
      if (!val) continue

      if (filter.type === 'daterange' && 'params' in filter) {
        if (val.from) params[filter.params.from] = val.from
        if (val.to)   params[filter.params.to]   = val.to
      } else {
        const param = ('param' in filter ? filter.param : undefined) ?? filter.key
        params[param] = val
      }
    }
  }

  return params
})

const { data, status, refresh } = await useAsyncData(
  `admin-${resourceName.value}-list`,
  () => $fetch<any>(endpoint.value!, {
    params: queryParams.value,
    headers: useRequestHeaders(['cookie']),
  }),
  { server: true }
)

// Safe refresh guard — prevents infinite re-fetch loops
let isRefreshing = false
const safeRefresh = async () => {
  if (isRefreshing) return
  isRefreshing = true
  await refresh()
  isRefreshing = false
}

// Manually watch query params instead of useAsyncData watch option
watch(queryParams, () => safeRefresh(), { deep: true })

const responseDataKey = computed(() => resource.value?.response?.dataKey ?? 'data')
const responseTotalKey = computed(() => resource.value?.response?.totalKey ?? 'total')

const items = computed(() => data.value?.[responseDataKey.value] ?? data.value ?? [])
const total = computed(() => data.value?.[responseTotalKey.value] ?? items.value.length)

// Inferred columns typed to match AdminColumn shape
const inferredColumns = computed<AdminColumn[]>(() => {
  const first = items.value?.[0]
  if (!first) return []
  return Object.keys(first).map(key => ({ key, label: key }))
})

const tableColumns = computed<TableColumn<any>[]>(() => {
  const configuredColumns = resource.value?.table?.columns ?? inferredColumns.value

  return [
    {
      id: 'select',
      header: ({ table }: any) => h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all',
      }),
      cell: ({ row }: any) => h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row',
      }),
    },

    ...configuredColumns.map(col => ({
      accessorKey: col.key,
      header: col.label ?? col.key,
      cell: ({ row }: any) => {
        const value = row.original[col.key]

        if (col.badge || col.type === 'badge') {
          return h(UBadge, { variant: 'subtle', class: 'capitalize' }, () => value)
        }

        if (col.type === 'date' || col.type === 'datetime') {
          return new Date(value).toLocaleDateString('fi-FI')
        }

        if (col.type === 'boolean') {
          return h(UBadge, {
            variant: 'subtle',
            color: value ? 'success' : 'error',
          }, () => value ? 'Yes' : 'No')
        }

        return value ?? '-'
      },
    })),

    {
      id: 'actions',
      cell: ({ row }: any) => h(
        'div',
        { class: 'text-right' },
        h(UDropdownMenu, {
          content: { align: 'end' },
          items: [
            {
              label: 'Edit',
              icon: 'i-lucide-pencil',
              onSelect: () => {
                editingId.value = row.original.id
                editModal.value?.openModal(row.original.id)
              },
            },
            { type: 'separator' },
            {
              label: 'Delete',
              icon: 'i-lucide-trash',
              color: 'error',
              onSelect: () => promptDelete([row.original.id]),
            },
          ],
        }, () => h(UButton, {
          icon: 'i-lucide-ellipsis-vertical',
          color: 'neutral',
          variant: 'ghost',
          class: 'ml-auto',
        }))
      ),
    },
  ]
})

const filterOptions = (filter: AdminFilter) => {
  if ('options' in filter && filter.options) {
    return [
      { label: 'All', value: '' },
      ...filter.options.map(o => ({ label: o, value: o })),
    ]
  }
  return []
}

// ----- Delete confirmation -----
const deleteConfirm = reactive({
  open: false,
  loading: false,
  ids: [] as (string | number)[],
})

const promptDelete = (ids: (string | number)[]) => {
  deleteConfirm.ids = ids
  deleteConfirm.open = true
}

const confirmDelete = async () => {
  deleteConfirm.loading = true

  const endpoints = resource.value?.endpoints
  const base = resource.value?.endpoint
  const deleteEndpoint = endpoints?.delete ?? {
    path: `${base}/:id`,
    method: 'DELETE' as const,
  }

  try {
    await Promise.all(
      deleteConfirm.ids.map(id =>
        $fetch(deleteEndpoint.path.replace(':id', String(id)), {
          method: deleteEndpoint.method,
          headers: useRequestHeaders(['cookie']),
        })
      )
    )

    toast.add({ title: `Deleted ${deleteConfirm.ids.length > 1 ? `${deleteConfirm.ids.length} records` : 'record'} successfully`, color: 'success' })
    deleteConfirm.open = false
    rowSelection.value = {}
    await safeRefresh()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  } finally {
    deleteConfirm.loading = false
  }
}

const deleteSelected = () => {
  promptDelete(Object.keys(rowSelection.value))
}

watch([search, activeFilters], () => {
  pagination.value.pageIndex = 0
}, { deep: true })
</script>