<template>
  <UApp>
    <UDashboardGroup unit="rem">
      <UDashboardSidebar
        id="nuxt-admin"
        v-model:open="mobileOpen"
        collapsible
        resizable
        class="bg-elevated/25"
        :ui="{ footer: 'lg:border-t lg:border-default' }"
      >
        <!-- Header -->
        <template #header="{ collapsed }">
          <div
            class="flex items-center gap-2 px-2"
            :class="collapsed ? 'justify-center' : ''"
          >
            <UIcon name="i-lucide-shield" class="w-5 h-5 shrink-0 text-(--ui-primary)" />
            <span v-if="!collapsed" class="font-bold text-base truncate">
              {{ title }}
            </span>
          </div>
        </template>

        <!-- Navigation -->
        <template #default="{ collapsed }">
          <UNavigationMenu
            :collapsed="collapsed"
            :items="navItems"
            orientation="vertical"
            tooltip
            popover
          />
        </template>

      </UDashboardSidebar>

      <!-- Page content -->
      <slot />

    </UDashboardGroup>
  </UApp>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRuntimeConfig, useRoute, useHead } from '#imports'
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const mobileOpen = ref(false)
const config = useRuntimeConfig()

const title = computed(() => config.public.admin?.title ?? 'Admin')

// Dynamic page title based on current route
useHead({
  title: computed(() => {
    const parts = route.path.split('/').filter(Boolean)
    const resource = parts[1]
    if (!resource) return title.value
    return `${resource.charAt(0).toUpperCase() + resource.slice(1)} | ${title.value}`
  })
})

const navItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-home',
    to: '/admin',
    exact: true,
  },
  ...((config.public.admin?.resources ?? []) as any[]).map(r => ({
    label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
    icon: 'i-lucide-database',
    to: `/admin/${r.name}`,
  }))
])
</script>