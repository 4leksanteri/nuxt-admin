import {
  defineNuxtModule,
  addComponentsDir,
  addLayout,
  createResolver
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import type { AdminConfig } from './types'

function hasModule(modules: NonNullable<any[]>, name: string) {
  return modules.some((m) => {
    if (typeof m === 'string') return m === name
    if (Array.isArray(m)) return m[0] === name
    return false
  })
}

export default defineNuxtModule<Partial<AdminConfig>>({
  meta: {
    name: 'nuxt-admin',
    configKey: 'admin',
    compatibility: {
      nuxt: '>=4.0.0',
    },
  },

  moduleDependencies: {
    '@nuxt/ui': {
      version: '>=4.4.0',
      
    }
  },

  async setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Load the css
    nuxt.options.css ||= []
    const uiCss = resolver.resolve('./runtime/assets/nuxt-admin-ui.css')
    if (!nuxt.options.css.includes(uiCss)) {
      nuxt.options.css.push(uiCss)
    }

    // Expose serializable config
    nuxt.options.runtimeConfig.public.admin = {
      title: 'Admin',
      resources: (_options.resources ?? []).map(r => ({
        name: r.name,
        table: r.table,
        form: r.form,
        filters: r.filters,
        messages: r.messages,
        query: r.query,
        endpoint: r.endpoint,
        endpoints: r.endpoints,
        response: r.response,
      }))
    }

    addLayout({ src: resolver.resolve('./runtime/layouts/admin.vue') }, 'admin')

    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      prefix: 'Admin',
      global: false,
    })

    nuxt.hook('pages:extend', (pages) => {
      pages.push(
        { name: 'admin', path: '/admin', file: resolver.resolve('./runtime/pages/admin/index.vue') },
        { name: 'admin-resource-list', path: '/admin/:resource', file: resolver.resolve('./runtime/pages/admin/[resource]/index.vue') }
      )
    })
  },
}) as NuxtModule