declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    admin: {
      title: string
      resources: import('../../types').AdminResource[]
    }
  }
}

export {}