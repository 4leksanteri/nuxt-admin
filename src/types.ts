import type { H3Event } from 'h3'

// ---- Query ----
export interface AdminQueryMap {
  page?:   string
  limit?:  string
  sort?:   string
  order?:  string
  search?: string
}

// ---- Filters ----
export type AdminFilterType = 'text' | 'select' | 'daterange' | 'boolean'

export interface AdminFilterDateRange {
  key:   string
  label: string
  type:  'daterange'
  params: {
    from: string
    to:   string
  }
}

export interface AdminFilterBase {
  key:     string
  label:   string
  type:    Exclude<AdminFilterType, 'daterange'>
  param?:  string
  options?: string[]
}

export type AdminFilter = AdminFilterBase | AdminFilterDateRange

// ---- Columns ----
export type AdminColumnType = 'text' | 'date' | 'datetime' | 'badge' | 'boolean' | 'number'

export interface AdminColumn {
  key:       string
  label?:    string
  type?:     AdminColumnType
  sortable?: boolean
  badge?:    boolean
  sort?: {
    param: string
    asc:   string
    desc:  string
  }
}

// ---- Fields ----
export type AdminFieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'textarea'

export interface AdminField {
  key:       string
  label?:    string
  type?:     AdminFieldType
  options?:  string[]
  readonly?: boolean
  required?: boolean
}

// ---- Endpoints ----
export interface AdminEndpointConfig {
  path:   string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
}

export interface AdminEndpoints {
  list?:   AdminEndpointConfig
  show?:   AdminEndpointConfig
  create?: AdminEndpointConfig
  edit?:   AdminEndpointConfig
  delete?: AdminEndpointConfig
}

// ---- Response shape ----
export interface AdminResponseMap {
  dataKey?:    string  // default: 'data'
  totalKey?:   string  // default: 'total'
  errorKey?:   string  // default: 'errors'
  messageKey?: string  // default: 'message'
}

// ---- Messages ----
export interface AdminMessages {
  [statusCode: number]: string
}

// ---- Resource ----
export interface AdminResource {
  name:      string
  endpoint?: string
  endpoints?: AdminEndpoints
  query?:    AdminQueryMap
  filters?:  AdminFilter[]
  messages?: AdminMessages
  response?: AdminResponseMap

  table?: {
    columns: AdminColumn[]
  }

  form?: {
    fields: AdminField[]
  }
}

// ---- Auth ----
export interface AdminAuth {
  check:       (event: H3Event) => boolean | Promise<boolean>
  redirectTo?: string
}

// ---- Root config ----
export interface AdminConfig {
  auth:      AdminAuth
  resources: AdminResource[]
}