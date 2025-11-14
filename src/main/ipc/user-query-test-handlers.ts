import { ipcMain } from 'electron'
import { getConnectionConfig } from '../services/user-query-test/get-connection-config'
import { runPostgresExplainAnalyze } from '../services/user-query-test/postgres-explain'
import { runMySQLExplainAnalyze } from '../services/user-query-test/mysql-explain'
import { runPostgresQueryMultiple } from '../services/user-query-test/postgres-run'
import { runMySQLQueryMultiple } from '../services/user-query-test/mysql-run'
import { calculateLatencyStats } from '../services/user-query-test/stats'
import { insertIntoTests } from '../database/tests'

import type {
  ExplainResult,
  PostgresExplainResult,
  UserQueryTestResultJson
} from '../../shared/types'

// PostgreSQL 판별
function isPostgresExplain(result: ExplainResult): result is PostgresExplainResult {
  return (result as PostgresExplainResult).actualRows !== undefined
}

// warnings 생성
function generateWarnings(explain: ExplainResult): string[] {
  const warnings: string[] = []

  if (explain.planType === 'Seq Scan') {
    warnings.push('Full table scan detected.')
  }

  if (isPostgresExplain(explain)) {
    if (explain.estimatedRows > 0 && explain.actualRows > explain.estimatedRows * 5) {
      warnings.push('Actual rows significantly exceed estimate. Run ANALYZE to update statistics.')
    }

    if (explain.cost.total > 100000) {
      warnings.push('Query cost is extremely high. Consider optimizing indexes or conditions.')
    }
  }

  if (explain.planType === 'Index Scan' && explain.estimatedRows > 500000) {
    warnings.push(
      'Index Scan used, but a large number of rows were scanned. Check index selectivity.'
    )
  }

  return warnings
}

ipcMain.handle('userQueryTest:run', async (_, payload) => {
  const { projectId, query, runCount, timeout } = payload

  try {
    const config = await getConnectionConfig(projectId)

    let explainResult: ExplainResult
    let executionTimes: number[] = []

    if (config.dbType === 'MySQL') {
      explainResult = await runMySQLExplainAnalyze(config, query)
      executionTimes = await runMySQLQueryMultiple(config, query, runCount, timeout)
    } else {
      explainResult = await runPostgresExplainAnalyze(config, query)
      executionTimes = await runPostgresQueryMultiple(config, query, runCount, timeout)
    }

    const stats = calculateLatencyStats(executionTimes)
    const warnings = generateWarnings(explainResult)

    // SQLite 저장 JSON
    const resultJson: UserQueryTestResultJson = {
      query,
      runCount,
      timeout,
      dbms: config.dbType === 'MySQL' ? 'mysql' : 'postgresql',
      responseTimes: executionTimes,
      stats,
      explain: explainResult,
      warnings
    }

    const testId = insertIntoTests({
      project_id: projectId,
      type: 'QUERY',
      summary: query,
      result: JSON.stringify(resultJson),
      response_time: stats.avg,
      index_ratio: null
    })

    return { testId }
  } catch (error) {
    console.error('[userQueryTest:run] ERROR:', error)
    throw error
  }
})
