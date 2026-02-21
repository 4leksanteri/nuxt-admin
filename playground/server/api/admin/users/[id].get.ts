import { useDb } from "~/server/utils/db"

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = useDb()

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return user
})