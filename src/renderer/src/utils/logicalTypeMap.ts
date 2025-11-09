/**
 * DBMS별 실제 컬럼 타입 → 논리 타입(logical_type) 매핑
 */
export const GLOBAL_TYPE_MAP = {
  mysql: {
    int: 'number',
    bigint: 'number',
    smallint: 'number',
    tinyint: 'number',
    decimal: 'number',
    float: 'number',
    double: 'number',

    char: 'string',
    varchar: 'string',
    text: 'string',
    longtext: 'string',

    date: 'date',
    datetime: 'date',
    timestamp: 'date',

    boolean: 'boolean',
    bit: 'boolean'
  },
  postgresql: {
    integer: 'number',
    smallint: 'number',
    bigint: 'number',
    real: 'number',
    numeric: 'number',
    double: 'number',

    varchar: 'string',
    char: 'string',
    text: 'string',

    date: 'date',
    timestamp: 'date',
    timestamptz: 'date',

    bool: 'boolean'
  }
} as const

/**
 * 컬럼 타입을 논리 타입(logical_type)으로 변환
 * - 괄호 제거 (예: varchar(255) → varchar)
 * - 대소문자 통일
 * - unsigned, zerofill, varying 같은 수식어 제거
 */
export function mapColumnToLogicalType(dbms: string, columnType: string): string {
  if (!columnType) return 'string'

  // 기본 정제: 소문자 + 괄호 제거 + 공백 제거
  let normalized = columnType.toLowerCase().trim()
  normalized = normalized.split('(')[0] // 괄호 앞부분만
  normalized = normalized.replace(/unsigned|zerofill|varying/g, '').trim()

  const map = GLOBAL_TYPE_MAP[dbms.toLowerCase() as keyof typeof GLOBAL_TYPE_MAP]
  const logicalType = map?.[normalized]

  if (!logicalType) {
    console.warn(`[TypeMap] Unknown column type "${columnType}" → 기본값 'string' 적용`)
  }

  return logicalType ?? 'string'
}
