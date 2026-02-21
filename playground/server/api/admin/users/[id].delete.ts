import { useDb } from "~/server/utils/db"

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = useDb()

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id)

  return { success: true, id: Number(id) }
})