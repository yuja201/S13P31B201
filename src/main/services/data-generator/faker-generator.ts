import { faker, Faker } from '@faker-js/faker'
import { fakerMapper } from '../../utils/faker-mapper'
import type { FakerMetaData } from './types'

// 제약조건 임시 타입
type ColumnConstraints = {
  min?: number
  max?: number
  length?: number
}

// 제약조건 임시 함수 (나중에 DB 제약조건 연결)
declare const getColumnConstraints:
  | ((projectId: number, tableName: string, columnName: string) => ColumnConstraints | null)
  | undefined

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
}

/**
 * faker 스트리밍 생성기 (1행씩 yield)
 * - 한 번에 하나씩 생성 → 메모리 부담 없음
 * - Worker에서 for-await-of로 순회하면서 바로 파일에 씀
 */
export async function* generateFakeStream({
  projectId,
  tableName,
  columnName,
  recordCnt,
  domainName
}: FakerGenerateRequest): AsyncGenerator<string, void, unknown> {
  // --- 제약조건 로딩 (예: min, max, length 등)
  const constraints: ColumnConstraints | null =
    typeof getColumnConstraints === 'function'
      ? getColumnConstraints(projectId, tableName, columnName)
      : null

  // domain_name으로 faker 매핑 찾기
  const fakerPath = fakerMapper[domainName]
  if (!fakerPath) throw new Error(`❌ No faker mapping for domain: ${domainName}`)

  const [category, method] = fakerPath.split('.') as [keyof Faker, string]
  const fakerCategory = faker[category]
  const fn = (fakerCategory as Record<string, unknown>)[method]

  if (typeof fn !== 'function') throw new Error(`❌ Invalid faker path: ${fakerPath}`)

  // --- 제약조건 파싱
  const hasRange = constraints?.min !== undefined && constraints?.max !== undefined
  const hasLength = constraints?.length !== undefined
  const min = Number(constraints?.min)
  const max = Number(constraints?.max)
  const length = Number(constraints?.length)

  // --- 메인 루프: recordCnt만큼 한 개씩 생성
  for (let i = 0; i < recordCnt; i++) {
    let value: unknown

    if (constraints && (hasRange || hasLength)) {
      if (!isNaN(min) && !isNaN(max) && (method === 'int' || method === 'float')) {
        value = (fn as (opts: { min: number; max: number }) => number)({ min, max })
      } else if (!isNaN(length)) {
        const raw = String((fn as () => string)())
        value = raw.slice(0, length)
      } else {
        value = (fn as () => unknown)()
      }
    } else {
      value = (fn as () => unknown)()
    }

    // faker가 만든 값 하나를 즉시 내보냄
    yield String(value)

    // CPU 부하 완화용 잠깐의 쉬는 시간 (10만 단위)
    if (i > 0 && i % 100_000 === 0) {
      await new Promise((res) => setTimeout(res, 10))
    }
  }
}

/**
 * 단일 값 생성용 헬퍼 (기존 호환)
 * - 단일 테스트용 API에서 사용됨
 */
export async function generateFakeValue(params: FakerGenerateRequest): Promise<string> {
  const gen = generateFakeStream({ ...params, recordCnt: 1 })
  const { value } = await gen.next()
  return value ?? ''
}
