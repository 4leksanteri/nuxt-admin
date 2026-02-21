import { useDb } from "~/server/utils/db"

export default defineEventHandler(() => {
  const db = useDb()

  const data = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
  const total = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count

  return { data, total }
})