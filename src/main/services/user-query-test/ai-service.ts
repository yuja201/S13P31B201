import { runPostgresExplainAnalyze } from './postgres-explain'
import { runMySQLExplainAnalyze } from './mysql-explain'
import { UserQueryAIGenerator } from './ai-generator'
import type { ConnectionConfig } from './get-connection-config'
import type { MySQLExplainResult, PostgresExplainResult } from '@shared/types'

export class UserQueryAIService {
  private readonly generator = new UserQueryAIGenerator()

  async generateRecommendation(params: {
    dbType: 'mysql' | 'postgres'
    connection: ConnectionConfig
    query: string
    modelId?: number | null
  }): Promise<{
    explain: MySQLExplainResult | PostgresExplainResult
    ai: string
  }> {
    const { dbType, connection, query, modelId } = params

    let explain: MySQLExplainResult | PostgresExplainResult

    // 1) 실행 계획 실행
    if (dbType === 'postgres') {
      explain = await runPostgresExplainAnalyze(connection, query)
    } else {
      explain = await runMySQLExplainAnalyze(connection, query)
    }

    // 2) AI 호출
    const result = await this.generator.generate({
      query,
      explain,
      modelId
    })

    return {
      explain,
      ai: result.text
    }
  }
}
