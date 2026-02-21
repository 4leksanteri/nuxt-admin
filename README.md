# nuxt-admin

> Zero-config SSR admin panel module for Nuxt — powered by Nuxt UI.

[![npm version](https://img.shields.io/npm/v/nuxt-admin.svg)](https://www.npmjs.com/package/nuxt-admin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ⚡ **Zero config** — auto-generates list, create, edit and delete from a single endpoint
- 🔒 **SSR auth protection** — server-side middleware, API endpoints never exposed to the browser
- 🎨 **Nuxt UI** — built entirely on Nuxt UI Dashboard components
- 📋 **Column inference** — automatically infers table columns from your API response
- 🔍 **Search & filters** — configurable query param mapping to match any API
- ✅ **Zod validation** — auto-generated form validation from your field config
- 🗑️ **Bulk delete** — select and delete multiple records with confirmation
- 🌗 **Dark mode** — inherited from Nuxt UI

---

## Requirements

- Nuxt `>= 4.3.1`
- `@nuxt/ui` `>= 4.4.0`

---

## Installation

```bash
npm install nuxt-admin @nuxt/ui
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-admin'],
})
```

---

## Quick start

Add your resources to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-admin'],

  admin: {
    resources: [
      {
        name: 'users',
        endpoint: '/api/admin/users',
      },
    ],
  },
})
```

Then visit `/admin` — that's it.

---

## Configuration

### Top-level options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | `string` | `'Admin'` | Admin panel title shown in sidebar and browser tab |
| `resources` | `AdminResource[]` | `[]` | List of CRUD resources |

---

## Resources

### Zero config

Provide just a name and endpoint — everything else is inferred:

```ts
resources: [
  {
    name: 'users',
    endpoint: '/api/admin/users',
  },
]
```

This generates:
- `GET /api/admin/users` — list
- `GET /api/admin/users/:id` — show (for edit prefill)
- `POST /api/admin/users` — create
- `PUT /api/admin/users/:id` — edit
- `DELETE /api/admin/users/:id` — delete

### Full configuration

```ts
resources: [
  {
    name: 'users',
    endpoint: '/api/admin/users', // base endpoint (used as fallback)

    // Override specific endpoints
    endpoints: {
      list:   { path: '/api/admin/users',         method: 'GET'    },
      show:   { path: '/api/admin/users/:id',      method: 'GET'    },
      create: { path: '/api/admin/users',          method: 'POST'   },
      edit:   { path: '/api/admin/users/:id',      method: 'PATCH'  }, // use PATCH instead of PUT
      delete: { path: '/api/admin/users/:id',      method: 'DELETE' },
    },

    // Table columns
    table: {
      columns: [
        { key: 'name',       label: 'Name',    sortable: true },
        { key: 'status',     label: 'Status',  badge: true    },
        { key: 'created_at', label: 'Created', type: 'date'   },
      ],
    },

    // Create/edit form fields
    form: {
      fields: [
        { key: 'name',   label: 'Name',   type: 'text',   required: true },
        { key: 'email',  label: 'Email',  type: 'email',  required: true },
        { key: 'status', label: 'Status', type: 'select',
          options: ['active', 'suspended'] },
      ],
    },

    // Sidebar filters
    filters: [
      {
        key:     'status',
        label:   'Status',
        type:    'select',
        param:   'filter[status]', // exact query param sent to API
        options: ['active', 'suspended'],
      },
    ],

    // Custom query param names
    query: {
      page:   'page',
      limit:  'per_page',   // your API uses per_page instead of limit
      search: 'q',          // your API uses q instead of search
      sort:   'sort_by',
      order:  'sort_order',
    },

    // Custom error messages per status code
    messages: {
      404: 'User not found',
      403: 'You do not have permission to manage users',
    },

    // Custom response shape
    response: {
      dataKey:    'data',    // default
      totalKey:   'total',   // default
      errorKey:   'errors',  // default
      messageKey: 'message', // default
    },
  },
]
```

---

## Column types

| Type | Description |
|------|-------------|
| `text` | Plain text (default) |
| `date` | Formatted date |
| `datetime` | Formatted date and time |
| `badge` | Rendered as a `UBadge` |
| `boolean` | Green/red badge for true/false |
| `number` | Numeric value |

Setting `badge: true` on a column is equivalent to `type: 'badge'`.

---

## Field types

| Type | Component |
|------|-----------|
| `text` | `UInput` |
| `email` | `UInput type="email"` |
| `password` | `UInput type="password"` |
| `number` | `UInput type="number"` |
| `textarea` | `UTextarea` |
| `select` | `USelect` |
| `multiselect` | `USelectMenu multiple` |
| `boolean` | `UToggle` |
| `date` | `UInput type="date"` |
| `datetime` | `UInput type="datetime-local"` |

---

## Expected API response shape

By default the module expects:

```json
{
  "data": [...],
  "total": 100
}
```

Override with `response.dataKey` and `response.totalKey` if your API differs.

For validation errors (422), the module expects:

```json
{
  "message": "Validation failed",
  "errors": {
    "email": ["Email is required"]
  }
}
```

Override with `response.errorKey` and `response.messageKey`.

---

## License

MIT