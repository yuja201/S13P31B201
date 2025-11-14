import { Client as PgClient } from 'pg'
import type { ConnectionConfig } from './get-connection-config'
import type { PostgresExplainResult } from '../../../shared/types'

export async function runPostgresExplainAnalyze(
  config: ConnectionConfig,
  query: string
): Promise<PostgresExplainResult> {
  const client = new PgClient({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    statement_timeout: 30000
  })

  await client.connect()

  try {
    const sql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`
    const res = await client.query(sql)

    const plan = res.rows[0]['QUERY PLAN'][0]
    const root = plan['Plan']

    return {
      raw: [plan],
      planType: root['Node Type'],
      estimatedRows: root['Plan Rows'] ?? 0,
      actualRows: root['Actual Rows'] ?? 0,
      cost: {
        startup: root['Startup Cost'] ?? 0,
        total: root['Total Cost'] ?? 0
      }
    }
  } finally {
    await client.end()
  }
}
