import type { TableInfo, ColumnDetail } from '@renderer/views/CreateDummyView'
import type { TableGenerationConfig } from '@renderer/stores/generationStore'

export interface ValidationResult {
  isReady: boolean
  missingColumns: string[]
}

/**
 * NOT NULL 컬럼 중 다음 조건을 만족하면 생성 규칙 누락으로 판단:
 * - generationStore에 규칙 없음
 * - autoIncrement 아님
 * - default 값 없음
 */
export function validateTable(
  table: TableInfo,
  generationTables: Record<string, TableGenerationConfig>
): ValidationResult {
  const config = generationTables[table.name]
  const genCols = config?.columns ?? {}

  const missing = table.columnDetails.filter((col: ColumnDetail) => {
    const isRequired = col.constraints?.includes('NOT NULL')
    const hasRule = !!genCols[col.name]

    const hasAutoIncrement = col.constraints?.includes('AUTO INCREMENT')
    const hasDefault = col.constraints?.includes('DEFAULT')

    return isRequired && !hasRule && !hasAutoIncrement && !hasDefault
  })

  return {
    isReady: missing.length === 0,
    missingColumns: missing.map((c) => c.name)
  }
}
