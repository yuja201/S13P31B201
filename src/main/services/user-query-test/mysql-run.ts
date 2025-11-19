import mysql from 'mysql2/promise'
import type { ConnectionConfig } from './get-connection-config'

export async function runMySQLQueryMultiple(
  config: ConnectionConfig,
  query: string,
  count: number,
  timeout: number
): Promise<number[]> {
  const conn = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    connectTimeout: timeout * 1000
  })

  const times: number[] = []

  try {
    for (let i = 0; i < count; i++) {
      const start = performance.now()
      await conn.query({ sql: query, timeout: timeout * 1000 })
      const end = performance.now()
      times.push(Number((end - start).toFixed(2)))
    }
  } finally {
    await conn.end()
  }
  return times
}
