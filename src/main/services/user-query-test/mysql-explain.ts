import mysql, { RowDataPacket } from 'mysql2/promise'
import type { ConnectionConfig } from './get-connection-config'
import type { MySQLExplainResult } from '../../../shared/types'

export async function runMySQLExplainAnalyze(
  config: ConnectionConfig,
  query: string
): Promise<MySQLExplainResult> {
  const conn = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database
  })

  try {
    const [rows] = await conn.query<RowDataPacket[]>(`EXPLAIN ANALYZE ${query}`)
    const lines = rows.map((r) => String(r['EXPLAIN']))

    let planType = 'Unknown'
    let estimatedRows = 0
    let cost = 0

    for (const line of lines) {
      if (line.includes('Table scan')) planType = 'Seq Scan'
      if (line.includes('Index lookup') || line.includes('Index range scan'))
        planType = 'Index Scan'

      const m1 = line.match(/rows=(\d+)/)
      if (m1) estimatedRows = Number(m1[1])

      const m2 = line.match(/cost=(\d+(\.\d+)?)/)
      if (m2) cost = Number(m2[1])
    }

    return {
      raw: lines,
      planType,
      estimatedRows,
      cost
    }
  } finally {
    await conn.end()
  }
}
