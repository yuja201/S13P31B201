import { DBMS_MAP } from '../utils/dbms-map'

/**
 * 공통
 */
export type DataSourceType = 'FAKER' | 'AI' | 'FILE'

export interface GenerateRequest {
  projectId: number
  tableName: string
  columnName: string
  recordCnt: number
  metaData: {
    ruleId: number
  }
}

export interface ColumnDefinition {
  columnName: string
  dataSource: DataSourceType
  metaData: {
    ruleId: number
    columnIdx?: number
    filePath?: string
  }
}

export interface TableInput {
  tableName: string
  recordCnt: number
  columns: ColumnDefinition[]
}

export interface GenerationInput {
  projectId: number
  tables: TableInput[]
}

export interface WorkerTask {
  projectId: number
  dbType: keyof typeof DBMS_MAP
  table: TableInput
}

export interface WorkerResult {
  tableName: string
  sqlPath: string
  success: boolean
  error?: string
}

/**
 * faker
 */
export interface fakerRuleInput {
  name: string
  domain: number
}
