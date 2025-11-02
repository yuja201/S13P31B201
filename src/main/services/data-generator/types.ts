export type DataSourceType = 'FAKER' | 'AI' | 'FILE'
export type SqlDbType = 'MySQL' | 'PostgreSQL'

export interface ColumnMetaData {
  ruleId?: number // FAKER/AI 공통 규칙 ID
  columnIdx?: number // FILE일 때 사용
  filePath?: string // FILE일 때 사용
}

export interface ColumnConfig {
  columnName: string
  dataSource: DataSourceType
  metaData: ColumnMetaData
}

export interface TableConfig {
  tableName: string
  recordCnt: number
  columns: ColumnConfig[]
}

export interface GenerateRequest {
  projectId: number
  tables: TableConfig[]
}

export interface GenerateResult {
  tableName: string
  rows: string[]
}

export interface ColumnConstraint {
  notNull?: boolean
  unique?: boolean
  maxLength?: number
  numericRange?: { min?: number; max?: number }
  pattern?: string
  enumValues?: string[]
  referencedTable?: string
  referencedColumn?: string
}

export interface ColumnSchemaInfo {
  dbType: SqlDbType
  tableName: string
  columnName: string
  sqlType: string
  constraints: ColumnConstraint
  domainName?: string
}

export interface AIGenRequest {
  databaseId: number
  vendor: 'openai' | 'anthropic' | 'google'
  model: string
  count: number
  info: ColumnSchemaInfo
}

export interface AIGenResult {
  values: string[]
  diagnostics: {
    usedVendor: string
    retries: number
    fallbackUsed: number
    uniqueAdjusted: number
  }
}
