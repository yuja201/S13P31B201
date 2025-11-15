import { runPostgresExplainAnalyze } from './postgres-explain'
import { runMySQLExplainAnalyze } from './mysql-explain'
import { UserQueryAIGenerator } from './ai-generator'
import type { ConnectionConfig } from './get-connection-config'
import type { MySQLExplainResult, PostgresExplainResult, AIRecommendationItem } from '@shared/types'

export class UserQueryAIService {
  private readonly generator = new UserQueryAIGenerator()

  async generateRecommendation(params: {
    dbType: 'mysql' | 'postgres'
    connection: ConnectionConfig
    query: string
    modelId?: number | null
  }): Promise<{
    explain: MySQLExplainResult | PostgresExplainResult
    ai: AIRecommendationItem[]
  }> {
    const { dbType, connection, query, modelId } = params

    let explain: MySQLExplainResult | PostgresExplainResult

    if (dbType === 'postgres') {
      explain = await runPostgresExplainAnalyze(connection, query)
    } else {
      explain = await runMySQLExplainAnalyze(connection, query)
    }

    // result = parsed JSON (배열)
    const result = await this.generator.generate({
      query,
      explain,
      modelId
    })

    return {
      explain,
      ai: result
    }
  }
}
