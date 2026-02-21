// playground/types/global.d.ts
import type Database from 'better-sqlite3'

declare global {
  var __db: Database.Database
}

export {}