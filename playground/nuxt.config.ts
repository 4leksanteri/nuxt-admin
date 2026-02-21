export default defineNuxtConfig({
  modules: ['nuxt-admin'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  admin: {
    title: 'My Admin',
    resources: [
      {
        name: 'users',
        endpoint: '/api/admin/users',
        table: {
          columns: [
            { key: 'name',       label: 'Name',      sortable: true },
            { key: 'email',      label: 'Email'                    },
            { key: 'role',       label: 'Role'                     },
            { key: 'created_at', label: 'Created At', type: 'date'   },
          ]
        },
        form: {
          fields: [
            { key: 'name',  label: 'Name',  type: 'text',  required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'role',  label: 'Role',  type: 'select',
              options: ['admin', 'user'] },
          ]
        }
      }
    ]
  }
})
