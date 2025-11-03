import { DBMS_MAP } from '../utils/dbms-map'

/**
 * 공통
 */
export type DataSourceType = 'FAKER' | 'AI' | 'FILE' | 'MANUAL'

export type FileMetaData = {
  kind: 'file'
  filePath: string
  fileType: 'csv' | 'json' | 'txt'
  fileColumn: string
  useHeaderRow: boolean
  columnIndex?: number
  lineSeparator?: string
  columnSeparator?: string
  encoding?: string
}

export type FakerMetaData = {
  kind: 'faker'
  ruleId: number
}

export type AIMetaData = {
  kind: 'ai'
  ruleId: number
}

export type ManualMetaData = {
  kind: 'manual'
  fixedValue: string
}

export type ColumnMetaData = FakerMetaData | AIMetaData | FileMetaData | ManualMetaData

export interface GenerateRequest {
  projectId: number
  tableName: string
  columnName: string
  recordCnt: number
  metaData: ColumnMetaData
}

export interface ColumnDefinition {
  columnName: string
  dataSource: DataSourceType
  metaData: ColumnMetaData
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

export interface GenerationResult {
  zipPath: string
  successCount: number
  failCount: number
  success: boolean
  errors?: string[]
}

/**
 * faker
 */
export interface fakerRuleInput {
  name: string
  domain: number
}
