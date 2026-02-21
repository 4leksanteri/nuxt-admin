import { useDb } from "~/server/utils/db"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDb()

  const result = db.prepare(
    'INSERT INTO users (name, email, role) VALUES (?, ?, ?)'
  ).run(body.name, body.email, body.role ?? 'user')

  return {
    id: result.lastInsertRowid,
    ...body,
  }
})