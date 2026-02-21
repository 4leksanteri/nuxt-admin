<template>
  <UDashboardPanel id="admin-index">

    <template #header>
      <UDashboardNavbar :title="config.public.admin.title ?? 'Admin'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Welcome -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-(--ui-text-highlighted)">
          Welcome back
        </h2>
        <p class="text-sm text-(--ui-text-muted) mt-1">
          Manage your resources below. Select a resource from the sidebar or the cards to get started.
        </p>
      </div>

      <!-- Resource cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="resource in config.public.admin.resources"
          :key="resource.name"
          :to="`/admin/${resource.name}`"
          class="block"
        >
        <UCard
            v-for="resource in config.public.admin.resources"
            :key="resource.name"
            :to="`/admin/${resource.name}`"
            variant="outline"
            class="hover:bg-(--ui-bg-elevated) transition cursor-pointer"
            >
            <div class="flex items-center gap-3 w-full">
                <div class="p-2 rounded-lg bg-(--ui-bg-inverted)/10 shrink-0">
                <UIcon name="i-lucide-database" class="w-5 h-5 text-(--ui-primary)" />
                </div>
                <div class="flex-1 min-w-0">
                <p class="font-semibold text-(--ui-text-highlighted) capitalize">
                    {{ resource.name }}
                </p>
                <p class="text-xs text-(--ui-text-muted) truncate">
                    {{ resource.endpoint }}
                </p>
                </div>
                <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4 text-(--ui-text-muted) shrink-0"
                />
            </div>
        </UCard>
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div
        v-if="!config.public.admin.resources?.length"
        class="flex flex-col items-center justify-center py-24 text-center"
      >
        <div class="p-4 rounded-full bg-(--ui-bg-elevated) mb-4">
          <UIcon name="i-lucide-layout-grid" class="w-8 h-8 text-(--ui-text-muted)" />
        </div>
        <h3 class="font-semibold text-(--ui-text-highlighted) mb-1">No resources configured</h3>
        <p class="text-sm text-(--ui-text-muted) max-w-sm">
          Add resources to your <code class="text-xs bg-(--ui-bg-elevated) px-1 py-0.5 rounded">nuxt.config.ts</code> to get started.
        </p>
        <UButton
          class="mt-4"
          color="neutral"
          variant="outline"
          icon="i-lucide-book-open"
          label="Read the docs"
          to="https://github.com/4leksanteri/nuxt-admin"
          target="_blank"
        />
      </div>
    </template>

  </UDashboardPanel>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import { useRuntimeConfig } from '#imports'

definePageMeta({ layout: 'admin' })

const config = useRuntimeConfig()
</script>