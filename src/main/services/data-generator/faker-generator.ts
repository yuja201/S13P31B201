import { faker, Faker } from '@faker-js/faker'
import type { GenerateRequest } from '../types'
import { getRuleById } from '../../database/rules'
import { fakerMapper } from '../../utils/faker-mapper'

// 제약조건 임시 타입
type ColumnConstraints = {
  min?: number
  max?: number
  length?: number
}

// 제약조건 임시 함수
declare const getColumnConstraints:
  | ((projectId: number, tableName: string, columnName: string) => ColumnConstraints | null)
  | undefined

// 배치 단위 스트리밍 생성기
export async function* generateFakeBatches({
  projectId,
  tableName,
  columnName,
  recordCnt,
  metaData
}: GenerateRequest): AsyncGenerator<string[], void, unknown> {
  // TODO: 제약조건 모듈 연결 예정
  const constraints: ColumnConstraints | null =
    typeof getColumnConstraints === 'function'
      ? getColumnConstraints(projectId, tableName, columnName)
      : null

  const ruleId = Number(metaData.ruleId)
  const rule = getRuleById(ruleId)
  if (!rule) throw new Error(`No rule found for ruleId=${ruleId}`)

  const fakerPath = fakerMapper[rule.domain_name]
  if (!fakerPath) throw new Error(`No faker mapping for domain: ${rule.domain_name}`)

  const [category, method] = fakerPath.split('.') as [keyof Faker, string]
  const fakerCategory = faker[category]
  const fn = (fakerCategory as Record<string, unknown>)[method]

  if (typeof fn !== 'function') throw new Error(`Invalid faker path: ${fakerPath}`)

  const BATCH_SIZE = 100_000

  const hasRange = constraints?.min !== undefined && constraints?.max !== undefined
  const hasLength = constraints?.length !== undefined
  const min = Number(constraints?.min)
  const max = Number(constraints?.max)
  const length = Number(constraints?.length)

  // 전체 recordCnt를 batch 단위로 나누어 생성
  for (let start = 0; start < recordCnt; start += BATCH_SIZE) {
    const limit = Math.min(BATCH_SIZE, recordCnt - start)
    const batch: string[] = []

    if (constraints && (hasRange || hasLength)) {
      for (let i = 0; i < limit; i++) {
        let value: unknown
        if (!isNaN(min) && !isNaN(max) && (method === 'int' || method === 'float')) {
          value = (fn as (opts: { min: number; max: number }) => number)({ min, max })
        } else if (!isNaN(length)) {
          const raw = String((fn as () => string)())
          value = raw.slice(0, length)
        } else {
          value = (fn as () => unknown)()
        }
        batch.push(String(value))
      }
    } else {
      for (let i = 0; i < limit; i++) {
        const value = (fn as () => unknown)()
        batch.push(String(value))
      }
    }

    yield batch

    // CPU 과부하 막기 위한 쉬는 시간
    if (start % (BATCH_SIZE * 2) === 0) {
      await new Promise((res) => setTimeout(res, 10))
    }
  }
}
