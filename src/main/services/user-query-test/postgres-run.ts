import { Client as PgClient } from 'pg'
import type { ConnectionConfig } from './get-connection-config'

export async function runPostgresQueryMultiple(
  config: ConnectionConfig,
  query: string,
  count: number,
  timeout: number
): Promise<number[]> {
  const client = new PgClient({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    statement_timeout: timeout * 1000
  })

  await client.connect()
  const times: number[] = []

  try {
    for (let i = 0; i < count; i++) {
      const start = performance.now()
      await client.query(query)
      const end = performance.now()
      times.push(Number((end - start).toFixed(2)))
    }
  } finally {
    await client.end()
  }
  return times
}
