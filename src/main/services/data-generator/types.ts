import { DBMS_MAP } from '../../utils/dbms-map'

/**
 * 데이터 소스 타입
 */
export type DataSourceType = 'FAKER' | 'AI' | 'FILE' | 'MANUAL'
export type SqlDbType = 'MySQL' | 'PostgreSQL'

/**
 * 컬럼 설정 - 세부 메타데이터
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

/**
 * 통합 메타데이터 유니온
 */
export type ColumnMetaData = FakerMetaData | AIMetaData | FileMetaData | ManualMetaData

/**
 * dataSource ↔ metaData 타입을 강하게 연결
 * - 사용 시 dataSource에 따라 metaData의 타입이 자동 추론됨
 */
type MetaBySource = {
  FILE: FileMetaData
  FAKER: FakerMetaData
  AI: AIMetaData
  MANUAL: ManualMetaData
}

export type ColumnConfig =
  | { columnName: string; dataSource: 'FILE'; metaData: MetaBySource['FILE'] }
  | { columnName: string; dataSource: 'FAKER'; metaData: MetaBySource['FAKER'] }
  | { columnName: string; dataSource: 'AI'; metaData: MetaBySource['AI'] }
  | { columnName: string; dataSource: 'MANUAL'; metaData: MetaBySource['MANUAL'] }

/**
 * 테이블 설정
 */
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
  zipPath: string
  successCount: number
  failCount: number
  success: boolean
  errors?: string[]
}

/**
 * Worker 관련 타입
 */
export interface WorkerTask {
  projectId: number
  dbType: keyof typeof DBMS_MAP
  table: TableConfig
}

export interface WorkerResult {
  tableName: string
  sqlPath: string
  success: boolean
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
