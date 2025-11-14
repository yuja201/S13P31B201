import { DBMS_MAP } from '../main/utils/dbms-map'
import { Table } from '../main/database/types'

/**
 * 데이터 소스 타입
 */
export type DataSourceType = 'FAKER' | 'AI' | 'FILE' | 'FIXED' | 'REFERENCE'
export type SqlDbType = 'MySQL' | 'PostgreSQL'

/**
 * 컬럼 메타데이터
 */
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
  ruleId: number
  ensureUnique?: boolean
}

export type AIMetaData = {
  ruleId: number
  ensureUnique?: boolean
}

export type FixedMetaData = {
  fixedValue: string
}
export type ReferenceMetaData = {
  kind: 'reference'
  refTable: string
  refColumn: string
  ensureUnique?: boolean
}

export type ColumnMetaData =
  | FakerMetaData
  | AIMetaData
  | FileMetaData
  | FixedMetaData
  | ReferenceMetaData

export interface ColumnConfig {
  columnName: string
  dataSource: DataSourceType
  metaData: ColumnMetaData
  isNullable: boolean
}

/**
 * 테이블 설정
 */
export type GenerationMode = 'SQL_FILE' | 'DIRECT_DB'

export interface TableConfig {
  tableName: string
  recordCnt: number
  columns: ColumnConfig[]
}

/**
 * 전체 데이터 생성 요청
 * - 프로젝트 단위로 여러 테이블을 한 번에 생성할 때 사용
 */
export interface GenerateRequest {
  projectId: number
  tables: TableConfig[]
  mode?: GenerationMode
  skipInvalidRows?: boolean
}

/**
 * 테이블 단위 생성 결과
 */
export interface GenerateResult {
  tableName: string
  rows: string[]
}

/**
 * 여러 테이블 생성 후 최종 결과
 */
export interface GenerationResult {
  zipPath: string | null
  successCount: number
  failCount: number
  success: boolean
  executedTables?: string[]
  errors?: string[]
}

/**
 * Worker 관련 타입
 */
export interface WorkerTask {
  projectId: number
  dbType: keyof typeof DBMS_MAP
  table: TableConfig
  schema: Table[]
  database: {
    id: number
    dbms_name: string
  }
  rules: Array<{
    id: number
    domain_name: string
    model_id: number | null
  }>
  mode?: GenerationMode
  connection?: {
    host: string
    port: number
    username: string
    password: string
    database: string
  }
  skipInvalidRows?: boolean
}

export interface WorkerResult {
  tableName: string
  sqlPath: string
  success: boolean
  directInserted?: boolean
  error?: string
}

/**
 * 컬럼 제약조건
 */
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

/**
 * 컬럼 스키마 정보
 */
export interface ColumnSchemaInfo {
  dbType: SqlDbType
  tableName: string
  columnName: string
  sqlType: string
  constraints: ColumnConstraint
  domainName?: string
}

/**
 * AI 생성 요청
 */
export interface AIGenRequest {
  databaseId: number
  vendor: 'openai' | 'anthropic' | 'google'
  model: string
  count: number
  info: ColumnSchemaInfo
}

/**
 * AI 생성 결과
 */
export interface AIGenResult {
  values: string[]
  diagnostics: {
    usedVendor: string
    retries: number
    fallbackUsed: number
    uniqueAdjusted: number
  }
}

/**
 * Faker 규칙 입력
 */
export interface FakerRuleInput {
  name: string
  domain: number
}

/**
 * AI 규칙 입력
 */
export interface AIRuleInput {
  name: string
  domain: number
  model_id: number
  token: string
  prompt?: string
}
