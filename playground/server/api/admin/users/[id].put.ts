import { useDb } from "~/server/utils/db"

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const db = useDb()

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  db.prepare(
    'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?'
  ).run(body.name, body.email, body.role ?? 'user', id)

  return { id: Number(id), ...body }
})