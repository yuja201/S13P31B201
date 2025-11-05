import { faker, Faker } from '@faker-js/faker'
import { fakerMapper } from '../../utils/faker-mapper'
import type { FakerMetaData } from './types'
import type { Table, Column as SchemaColumn } from '../../database/types'

/**
 * Faker 생성 요청 파라미터
 */
export interface FakerGenerateRequest {
  projectId: number
  tableName: string
  columnName: string
  recordCnt: number
  metaData: Pick<FakerMetaData, 'ruleId'>
  domainName: string
  schema: Table[]
}

/**
 * 숫자 범위 및 문자열 길이 제약 추출
 */
function extractSimpleConstraints(
  sqlType: string,
  columnData: SchemaColumn
): {
  min?: number
  max?: number
  maxLength?: number
} {
  const constraints: { min?: number; max?: number; maxLength?: number } = {}

  // VARCHAR(255), CHAR(20) 등 문자열 길이 제한
  const lengthMatch = sqlType.match(/\((\d+)\)/)
  if (lengthMatch) {
    constraints.maxLength = parseInt(lengthMatch[1], 10)
  }

  // CHECK (age >= 0 AND age <= 120)
  if (columnData.check) {
    const checkStr = columnData.check
    const minMatch = checkStr.match(/>=?\s*(-?\d+(\.\d+)?)/)
    const maxMatch = checkStr.match(/<=?\s*(-?\d+(\.\d+)?)/)
    if (minMatch) constraints.min = Number(minMatch[1])
    if (maxMatch) constraints.max = Number(maxMatch[1])
  }

  return constraints
}

/**
 * faker 스트리밍 생성기
 * - CHECK 제약조건(min/max)과 문자열 길이(maxLength)만 고려
 */
export async function* generateFakeStream({
  tableName,
  columnName,
  recordCnt,
  schema,
  domainName
}: FakerGenerateRequest): AsyncGenerator<string, void, unknown> {
  // 스키마에서 테이블/컬럼 찾기
  const table = schema.find((t) => t.name === tableName)
  const column = table?.columns.find((c) => c.name === columnName)

  const sqlType = column?.type ?? 'VARCHAR(255)'
  const { min, max, maxLength } = column ? extractSimpleConstraints(sqlType, column) : {}

  // faker 경로 매핑
  const fakerPath = fakerMapper[domainName]
  if (!fakerPath) {
    throw new Error(`❌ No faker mapping for domain: ${domainName}`)
  }

  const [category, method] = fakerPath.split('.') as [keyof Faker, string]
  const fakerCategory = faker[category]
  const fn = (fakerCategory as Record<string, unknown>)[method]

  if (typeof fn !== 'function') {
    throw new Error(`❌ Invalid faker path: ${fakerPath}`)
  }

  // 데이터 생성 루프
  for (let i = 0; i < recordCnt; i++) {
    let value: string

    // 숫자 범위 제약 적용
    if (
      typeof min === 'number' &&
      typeof max === 'number' &&
      /INT|DECIMAL|NUMERIC|FLOAT|DOUBLE/i.test(sqlType)
    ) {
      value = String(
        (fn as (opts: { min: number; max: number }) => number)({
          min,
          max
        })
      )
    }
    // 문자열 길이 제약 적용
    else if (typeof maxLength === 'number') {
      const raw = String((fn as () => string)())
      value = raw.slice(0, maxLength)
    }
    // 제약조건 없음
    else {
      value = String((fn as () => string | number)())
    }

    yield value

    // 대규모 생성 시 잠깐 쉬기 (성능 안정화)
    if (i > 0 && i % 100_000 === 0) {
      await new Promise((res) => setTimeout(res, 10))
    }
  }
}
