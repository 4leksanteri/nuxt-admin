import type Database from 'better-sqlite3'

export const useDb = () => (globalThis as any).__db as Database.Database