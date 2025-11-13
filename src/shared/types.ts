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

/**
 * 최근 7일간 사용자 쿼리 테스트 결과 (일 단위 평균 응답 시간)
 * - date: yyyy-mm-dd
 * - avg_response_time: 하루 동안 실행된 QUERY 테스트의 평균 응답(ms 단위)
 */
export interface DailyQueryStat {
  date: string
  avg_response_time: number | null
}

/**
 * 최근 7일간 인덱스 테스트 결과 (일 단위 평균 인덱스 사용률)
 * - date: yyyy-mm-dd
 * - avg_index_ratio: 하루 동안 실행된 INDEX 테스트의 평균 인덱스 사용율(%)
 */
export interface DailyIndexStat {
  date: string
  avg_index_ratio: number | null
}

/**
 * 테스트 요약 지표
 * - count: 테스트 총 실행 횟수
 * - avg_value: 평균 응답시간 또는 평균 인덱스 사용율
 *   (QUERY → 응답시간, INDEX → 사용율)
 */
export interface TestSummary {
  count: number
  avg_value: number | null
}

/**
 * 대시보드 상단 Summary + 그래프 카드에서 사용하는 전체 데이터 구조
 * - thisWeek: 이번 주 테스트 실행 횟수
 * - growthRate: 지난주 대비 증가율 (%)
 * - weeklyQueryStats: 최근 7일 사용자 쿼리 평균 응답 시간 목록
 * - weeklyIndexStats: 최근 7일 인덱스 평균 사용율 목록
 * - querySummary: 전체 QUERY 테스트 요약(총 횟수 + 평균 응답)
 * - indexSummary: 전체 INDEX 테스트 요약(총 횟수 + 평균 사용율)
 */
export interface DashboardData {
  thisWeek: number
  growthRate: number
  weeklyTotalStats: { date: string; count: number }[]
  weeklyQueryStats: DailyQueryStat[]
  weeklyIndexStats: DailyIndexStat[]
  querySummary: TestSummary
  indexSummary: TestSummary
  queryChangeRate: number
  indexChangeRate: number
}
