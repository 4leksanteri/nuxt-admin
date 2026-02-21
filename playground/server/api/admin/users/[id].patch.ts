import { useDb } from "~/server/utils/db"

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const db = useDb()

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
  if (!existing) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  // Merge existing with partial body
  const merged = { ...existing, ...body }

  db.prepare(
    'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?'
  ).run(merged.name, merged.email, merged.role, id)

  return { id: Number(id), ...merged }
})