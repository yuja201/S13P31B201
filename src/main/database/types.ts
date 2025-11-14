export interface DBMS {
  id: number
  name: string
  created_at: number
  updated_at: number
}

export interface Project {
  id: number
  name: string
  description: string
  created_at: number
  updated_at: number
}

export interface Database {
  id: number
  project_id: number
  dbms_id: number
  url: string
  username: string
  password: string
  database_name: string
  created_at: number
  updated_at: number
  connected_at: number
}

export interface ConnectionConfig {
  dbType: 'MySQL' | 'PostgreSQL'
  host: string
  port: number
  username: string
  password: string
  database?: string
}

export interface Rule {
  id: number
  name: string
  data_source: string
  domain_id: number
  domain_name: string
  category_name: string
  model_id: number | null
  prompt: string | null
  created_at: number
  updated_at: number
}

// 새로운 레코드 생성을 위한 Input types (id와 timestamp 제외)
export interface DBMSInput {
  name: string
}

export interface ProjectInput {
  name: string
  description: string
}

export interface DatabaseInput {
  project_id: number
  dbms_id: number
  url: string
  username: string
  password: string
  database_name: string
}

export interface RuleInput {
  name: string
  data_source: string
  domain: number
  model_id?: number | null
  prompt?: string | null
}

// 레코드 업데이트 (id 제외 모두 선택)
export interface DBMSUpdate {
  id: number
  name?: string
}

export interface ProjectUpdate {
  id: number
  name?: string
  description?: string
}

export interface DatabaseUpdate {
  id: number
  project_id?: number
  dbms_id?: number
  url?: string
  username?: string
  password?: string
  database_name?: string
  connected_at?: number
}

export interface RuleUpdate {
  id: number
  name?: string
  data_source?: string
  domain?: number
  model_id?: number | null
  prompt?: string | null
}

// 스키마 관련
export interface Column {
  name: string
  type: string
  comment?: string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  notNull?: boolean
  unique?: boolean
  check?: string
  autoIncrement?: boolean
  default?: string
  enum?: string[]
  domain?: string
  maxLength?: number
  numericPrecision?: number
  numericScale?: number
  minValue?: number
  maxValue?: number
}

export interface ForeignKey {
  column_name: string
  referenced_table: string
  referenced_column: string
  on_delete?: string
  on_update?: string
  constraint_name?: string
}

export interface Index {
  index_name: string
  columns: string[]
  is_unique: boolean
  is_primary: boolean
  index_type?: string
}

export interface Table {
  name: string
  rowCount: number
  comment?: string
  columns: Column[]
  foreignKeys?: ForeignKey[]
  indexes?: Index[]
}

export interface DatabaseSchema {
  tables: Table[]
  fetchedAt: number
}

// 도메인 관련
export interface DomainCategory {
  category: string
  items: Domain[]
}

export interface Domain {
  id: number
  name: string
  description: string
  logical_type: string
  category_id: number
  category_name: string
}

// 인덱스 분석 관련
export interface IndexIssue {
  severity: 'critical' | 'recommended'
  category:
    | 'unused' // 미사용 인덱스
    | 'redundant' // 중복 인덱스
    | 'low_selectivity' // 낮은 선택도
    | 'missing_fk_index' // FK 인덱스 누락
    | 'column_order' // 복합 인덱스 컬럼 순서 문제
    | 'oversized' // 과도하게 큰 인덱스
    | 'inappropriate_type' // 부적절한 컬럼 타입에 인덱스
    | 'underindexed_table' // 대형 테이블에 인덱스 부족

  description: string
  recommendation: string
  impact?: string

  // 측정값
  metrics?: {
    selectivity?: number // 선택도(0-100%)
    scanCount?: number // 스캔 횟수
    sizeMB?: number // 크기(MB)
  }

  // 관련 정보
  relatedIndexName?: string // 중복 인덱스의 경우
  suggestedSQL?: string // 실행 가능한 SQL
}

export interface IndexAnalysisResult {
  // 기본 정보
  indexName: string
  tableName: string
  schema: string
  columns: string[]
  isUnique: boolean
  isPrimary: boolean
  indexType: string // btree, hash, gin, gist(PostgreSQL) / BTREE, HASH(MySQL)

  // 탐지된 이슈들
  issues: IndexIssue[]

  // 공통 통계
  cardinality?: number // 고유값 개수 추정치
  selectivity?: number // 선택도(0-100%)
  tableRows?: number // 테이블 행 수

  // PostgreSQL 통계
  scanCount?: number // idx_scan - 인덱스 스캔 횟수
  tuplesRead?: number // idx_tup_read - 읽은 튜플 수
  tuplesFetched?: number // idx_tup_fetch - 가져온 튜플 수
  indexSizeBytes?: number // pg_relation_size - 개별 인덱스 크기
  bloatRatio?: number // Bloat 비율(0-100%)

  // MySQL 통계
  tableIndexSizeBytes?: number // INDEX_LENGTH - 테이블 전체 인덱스 크기

  // 메타 정보
  dbmsType: 'mysql' | 'postgresql'
  statsAvailable: {
    usageStats: boolean // PostgreSQL: true, MySQL: false
    sizeStats: boolean // PostgreSQL: true(개별), MySQL: true(테이블 전체)
  }
}

export interface IndexAnalysisSummary {
  databaseId: number
  databaseName: string
  dbmsType: 'mysql' | 'postgresql'
  analyzedAt: number

  // 전체 통계
  totalIndexes: number
  totalIssues: number
  issuesByCategory: Record<IndexIssue['category'], number>
  issuesBySeverity: {
    critical: number
    recommended: number
  }

  // 개별 인덱스 분석 결과
  indexes: IndexAnalysisResult[]

  // 기능 가용성
  statsAvailable: {
    usageStats: boolean
    sizeStats: boolean
  }

  // 권장사항
  recommendations?: string[]
}

export interface Test {
  id: number
  project_id: number
  project_name: string
  type: 'QUERY' | 'INDEX'
  summary: string | null
  result: string
  response_time: number | null
  index_ratio: number | null
  created_at: number
}

export interface TestInput {
  project_id: number
  type: 'QUERY' | 'INDEX'
  summary?: string | null
  result: string
  response_time?: number | null
  index_ratio?: number | null
}

export interface TestUpdate {
  id: number
  project_id?: number
  type?: 'QUERY' | 'INDEX'
  summary?: string | null
  result?: string
  response_time?: number | null
  index_ratio?: number | null
}

export interface DailyQueryStat {
  date: string // YYYY-MM-DD
  avg_response_time: number | null
}

export interface DailyIndexStat {
  date: string // YYYY-MM-DD
  avg_index_ratio: number | null
}

export interface TestSummary {
  count: number
  avg_value: number | null
}
