import mysql from 'mysql2/promise'
import { Client as PgClient } from 'pg'
import type { IndexAnalysisSummary, IndexIssue, ConnectionConfig } from '../../database/types'
import { collectMySQLIndexStats } from './mysql/mysql-stats-collector'
import { collectPostgreSQLIndexStats } from './postgresql/pg-stats-collector'
import { getDatabaseById } from '../../database/databases'
import { getDBMSById } from '../../database/dbms'

async function getConnectionConfig(databaseId: number): Promise<ConnectionConfig> {
  const database = getDatabaseById(databaseId)
  if (!database) {
    throw new Error(`Database not found: ${databaseId}`)
  }

  const dbms = getDBMSById(database.dbms_id)
  if (!dbms) {
    throw new Error(`DBMS not found: ${database.dbms_id}`)
  }

  // URL 파싱
  let host: string
  let port: number

  // protocol://host:port 형식
  const fullUrlMatch = database.url.match(/^(?:mysql|postgresql):\/\/([^:]+):(\d+)$/)
  if (fullUrlMatch) {
    host = fullUrlMatch[1]
    port = parseInt(fullUrlMatch[2])
  } else {
    // host:port 형식
    const simpleUrlMatch = database.url.match(/^([^:]+):(\d+)$/)
    if (!simpleUrlMatch) {
      throw new Error(`Invalid database URL format: ${database.url}`)
    }
    host = simpleUrlMatch[1]
    port = parseInt(simpleUrlMatch[2])
  }

  return {
    dbType: dbms.name as 'MySQL' | 'PostgreSQL',
    host,
    port,
    username: database.username,
    password: database.password,
    database: database.database_name
  }
}

export async function analyzeIndexes(databaseId: number): Promise<IndexAnalysisSummary> {
  const config = await getConnectionConfig(databaseId)

  if (!config.database) {
    throw new Error('Database name is required for index analysis')
  }

  let results

  if (config.dbType === 'MySQL') {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      connectTimeout: 30000
    })

    try {
      results = await collectMySQLIndexStats(connection, config.database)
    } finally {
      await connection.end()
    }
  } else {
    const client = new PgClient({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      connectionTimeoutMillis: 30000
    })

    try {
      await client.connect()
      results = await collectPostgreSQLIndexStats(client, 'public')
    } finally {
      await client.end()
    }
  }

  // 통계 집계
  const issuesByCategory: Record<IndexIssue['category'], number> = {
    unused: 0,
    redundant: 0,
    low_selectivity: 0,
    missing_fk_index: 0,
    column_order: 0,
    oversized: 0,
    inappropriate_type: 0,
    underindexed_table: 0
  }

  const issuesBySeverity = {
    critical: 0,
    recommended: 0
  }

  let totalIssues = 0

  for (const index of results) {
    for (const issue of index.issues) {
      totalIssues++
      issuesByCategory[issue.category]++
      issuesBySeverity[issue.severity]++
    }
  }

  // 권장사항 생성
  const recommendations: string[] = []

  if (issuesByCategory.unused > 0) {
    recommendations.push(
      `${issuesByCategory.unused}개의 미사용 인덱스를 삭제하여 INSERT/UPDATE 성능을 향상시키세요.`
    )
  }

  if (issuesByCategory.redundant > 0) {
    recommendations.push(
      `${issuesByCategory.redundant}개의 중복 인덱스를 정리하여 저장 공간을 절약하세요.`
    )
  }

  if (issuesByCategory.missing_fk_index > 0) {
    recommendations.push(
      `${issuesByCategory.missing_fk_index}개의 외래키 컬럼에 인덱스를 추가하여 JOIN 성능을 향상시키세요.`
    )
  }

  return {
    databaseId,
    databaseName: config.database,
    dbmsType: config.dbType === 'MySQL' ? 'mysql' : 'postgresql',
    analyzedAt: Date.now(),
    totalIndexes: results.length,
    totalIssues,
    issuesByCategory,
    issuesBySeverity,
    indexes: results,
    statsAvailable:
      results.length > 0
        ? results[0].statsAvailable
        : {
            usageStats: false,
            sizeStats: false
          },
    recommendations
  }
}
