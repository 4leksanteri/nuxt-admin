import Database from 'better-sqlite3'
import { join } from 'pathe'

export default defineNitroPlugin(() => {
  const db = new Database(join(process.cwd(), 'playground.db'))

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as any
  
  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO users (name, email, role) VALUES (?, ?, ?)')
    insert.run('Alice Admin', 'alice@example.com', 'admin')
    insert.run('Bob User', 'bob@example.com', 'user')
    insert.run('Carol User', 'carol@example.com', 'user')
  }

  (globalThis as any).__db = db
})