import { ipcMain } from 'electron'
import { getConnectionConfig } from '../services/user-query-test/get-connection-config'
import { runPostgresExplainAnalyze } from '../services/user-query-test/postgres-explain'
import { runMySQLExplainAnalyze } from '../services/user-query-test/mysql-explain'
import { runPostgresQueryMultiple } from '../services/user-query-test/postgres-run'
import { runMySQLQueryMultiple } from '../services/user-query-test/mysql-run'
import { calculateLatencyStats } from '../services/user-query-test/stats'
import { UserQueryAIService } from '../services/user-query-test/ai-service'
import { insertIntoTests, getTestById, updateTestResult } from '../database/tests'

import type {
  ExplainResult,
  PostgresExplainResult,
  UserQueryTestResultJson
} from '../../shared/types'

// --------------------------------------------------
// Payload 타입 정의
// --------------------------------------------------
interface UserQueryTestRunPayload {
  projectId: number
  query: string
  runCount: number
  timeout: number
}

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

const userQueryAIService = new UserQueryAIService()

// --------------------------------------------------
// IPC 핸들러
// --------------------------------------------------
ipcMain.handle('userQueryTest:run', async (_, payload: UserQueryTestRunPayload) => {
  const { projectId, query, runCount, timeout } = payload

  // 안전 범위 제한
  const safeRunCount = Math.min(Math.max(runCount, 1), 1000)
  const safeTimeout = Math.min(Math.max(timeout, 1), 300)

  try {
    const config = await getConnectionConfig(projectId)

    let explainResult: ExplainResult
    let executionTimes: number[] = []

    if (config.dbType === 'MySQL') {
      explainResult = await runMySQLExplainAnalyze(config, query)
      executionTimes = await runMySQLQueryMultiple(config, query, safeRunCount, safeTimeout)
    } else {
      explainResult = await runPostgresExplainAnalyze(config, query)
      executionTimes = await runPostgresQueryMultiple(config, query, safeRunCount, safeTimeout)
    }

    const stats = calculateLatencyStats(executionTimes)
    const warnings = generateWarnings(explainResult)

    const resultJson: UserQueryTestResultJson = {
      query,
      runCount: safeRunCount,
      timeout: safeTimeout,
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

ipcMain.handle('userQueryTest:AIGenerate', async (_event, payload) => {
  const { testId, projectId, query, modelId } = payload

  try {
    // 1) 프로젝트 DB 접속 정보
    const config = await getConnectionConfig(projectId)

    // 2) dbType 통일: mysql | postgres
    const dbType = config.dbType === 'MySQL' ? 'mysql' : 'postgres'

    // 3) 실행
    const result = await userQueryAIService.generateRecommendation({
      dbType,
      connection: config,
      query,
      modelId
    })

    // resultJson 업데이트
    const test = getTestById(testId)
    if (!test) throw new Error('Test not found')

    const parsed = JSON.parse(test.result)
    parsed.ai = result.ai // ai 필드 추가

    updateTestResult(testId, JSON.stringify(parsed))

    return result
  } catch (error) {
    console.error('[userQueryTest:AIGenerate] ERROR:', error)
    throw error
  }
})
