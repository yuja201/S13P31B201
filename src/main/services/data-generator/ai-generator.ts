import { createAIGateway } from '@main/services/ai/ai-factory'
import {
  AIGenRequest,
  AIGenResult,
  ColumnSchemaInfo,
  SqlDbType,
  AIMetaData,
  ColumnConstraint
} from '@shared/types'
import { getDomainGuideline } from './domain-config'
import { buildAjvValidator, enforceUniqueness, parseValuesArray } from '../../utils/validators'
import { resolveModel } from '../ai/model-map'
import type { Column as SchemaColumn, Table } from '../../database/types'

/**
 * AI 스트림 생성 요청 파라미터
 */
export interface AIStreamGenerateRequest {
  projectId: number
  tableName: string
  columnName: string
  recordCnt: number
  metaData: AIMetaData
  schema: Table[]
  database: {
    id: number
    dbms_name: string
  }
  rule: {
    id: number
    domain_name: string
    model_id: number | null
  }
}

/**
 * JSON Schema + Prompt 생성
 */
function buildJsonSchemaForValues(info: ColumnSchemaInfo, count: number): Record<string, unknown> {
  const item: Record<string, unknown> = { type: 'string' }
  if (info.constraints.pattern) item.pattern = info.constraints.pattern
  if (info.constraints.enumValues) item.enum = info.constraints.enumValues
  if (typeof info.constraints.maxLength === 'number') item.maxLength = info.constraints.maxLength

  return {
    type: 'object',
    additionalProperties: false,
    required: ['values'],
    properties: {
      values: {
        type: 'array',
        minItems: count,
        maxItems: count,
        items: item
      }
    }
  }
}

function humanizeConstraints(info: ColumnSchemaInfo): string {
  const c = info.constraints
  const lines: string[] = []

  // SQL 타입
  lines.push(`SQL 타입: ${info.sqlType}`)

  // 기본 제약조건
  if (c.notNull) lines.push('NULL 금지')
  if (c.unique) lines.push('모든 값은 유일해야 함')

  // 길이/범위 제약
  if (typeof c.maxLength === 'number') lines.push(`최대 길이: ${c.maxLength}자`)
  if (c.numericRange) {
    if (c.numericRange.min !== undefined && c.numericRange.max !== undefined) {
      lines.push(`숫자 범위: ${c.numericRange.min} ~ ${c.numericRange.max}`)
    } else if (c.numericRange.min !== undefined) {
      lines.push(`최소값: ${c.numericRange.min}`)
    } else if (c.numericRange.max !== undefined) {
      lines.push(`최대값: ${c.numericRange.max}`)
    }
  }

  // 패턴/열거형
  if (c.pattern) lines.push(`정규식 패턴: ${c.pattern}`)
  if (c.enumValues?.length) lines.push(`허용된 값: ${c.enumValues.join(', ')}`)

  // 외래키
  if (c.referencedTable && c.referencedColumn) {
    lines.push(`참조: ${c.referencedTable}.${c.referencedColumn}`)
  }

  return lines.map((l) => `- ${l}`).join('\n')
}

function buildDomainGuidance(domainName?: string): string {
  if (!domainName) return ''

  const guideline = getDomainGuideline(domainName)
  if (!guideline) return `도메인: ${domainName}`

  const parts: string[] = []
  parts.push(`도메인: ${guideline.title} (${guideline.description})`)

  if (guideline.format) {
    parts.push(`형식: ${guideline.format}`)
  }

  if (guideline.constraints && guideline.constraints.length > 0) {
    parts.push(`규칙: ${guideline.constraints.join(', ')}`)
  }

  if (guideline.examples && guideline.examples.length > 0) {
    const exampleStr = guideline.examples
      .slice(0, 5)
      .map((ex) => `"${ex}"`)
      .join(', ')
    parts.push(`예시: ${exampleStr}`)
  }

  return parts.join('\n')
}

function buildPrompt(info: ColumnSchemaInfo, count: number): string {
  const domainGuidance = buildDomainGuidance(info.domainName)

  return `너는 데이터베이스 테스트 데이터 생성 엔진이다.
${info.dbType} 데이터베이스의 ${info.tableName} 테이블, ${info.columnName} 컬럼에 대해 ${count}개의 현실적이고 다양한 테스트 데이터를 생성해라.

${domainGuidance}

제약조건:
${humanizeConstraints(info)}

중요 지침:
- 생성된 데이터는 실제 운영 환경에서 사용될 법한 현실적인 값이어야 함
- 각 값은 서로 다르고 다양해야 함 (단순 반복 금지)
- 제약조건을 모두 충족해야 함
- 도메인 예시를 참고하되, 정확히 같은 값은 피할 것

출력 형식 (JSON만 허용):
{"values": ["값1","값2","값3",...]}`
}

/**
 * Fallback 생성
 */
function fallbackValues(domainName: string | undefined, count: number): string[] {
  const arr: string[] = []
  const guideline = domainName ? getDomainGuideline(domainName) : null

  // 도메인 가이드라인 기반 fallback
  if (guideline?.examples && guideline.examples.length > 0) {
    for (let i = 0; i < count; i += 1) {
      const baseExample = guideline.examples[i % guideline.examples.length]
      arr.push(`${baseExample}_${i + 1}`)
    }
    return arr
  }

  // 기존 fallback 로직
  if (domainName?.includes('이메일')) {
    for (let i = 0; i < count; i += 1) arr.push(`user${i + 1}@example.com`)
    return arr
  }
  if (domainName?.includes('전화')) {
    for (let i = 0; i < count; i += 1)
      arr.push(
        `010-${(1000 + i).toString().padStart(4, '0')}-${(9000 - i).toString().padStart(4, '0')}`
      )
    return arr
  }

  // 완전 기본 fallback
  for (let i = 0; i < count; i += 1) {
    arr.push(`data_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`)
  }
  return arr
}

/**
 * SQL 타입에서 제약조건 추출
 */
function extractConstraintsFromSqlType(
  sqlType: string,
  columnData: SchemaColumn
): ColumnConstraint {
  const constraints: {
    notNull?: boolean
    unique?: boolean
    maxLength?: number
    numericRange?: { min?: number; max?: number }
    enumValues?: string[]
  } = {
    notNull: columnData.notNull || false,
    unique: columnData.unique || false
  }

  // VARCHAR(255) → maxLength: 255
  const varcharMatch = sqlType.match(/VARCHAR\((\d+)\)/i)
  if (varcharMatch) {
    constraints.maxLength = parseInt(varcharMatch[1], 10)
  }

  // CHAR(10) → maxLength: 10
  const charMatch = sqlType.match(/CHAR\((\d+)\)/i)
  if (charMatch) {
    constraints.maxLength = parseInt(charMatch[1], 10)
  }

  // INT, DECIMAL 등 숫자 타입
  if (/INT|DECIMAL|NUMERIC|FLOAT|DOUBLE/i.test(sqlType)) {
    constraints.numericRange = {}
    // CHECK 제약조건에서 범위 추출 가능
    if (columnData.check) {
      const checkStr = columnData.check
      const minMatch = checkStr.match(/>=?\s*(\d+)/)
      const maxMatch = checkStr.match(/<=?\s*(\d+)/)
      if (minMatch) constraints.numericRange.min = parseInt(minMatch[1], 10)
      if (maxMatch) constraints.numericRange.max = parseInt(maxMatch[1], 10)
    }
  }

  // ENUM
  if (columnData.enum && Array.isArray(columnData.enum)) {
    constraints.enumValues = columnData.enum
  }

  return constraints
}

/**
 * AI 스트리밍 생성기 (1행씩 yield)
 * - 배치 단위로 AI 생성 후, 한 행씩 yield
 * - Worker에서 for-await-of로 순회하면서 바로 파일에 씀
 */
export async function* generateAIStream({
  tableName,
  columnName,
  recordCnt,
  schema,
  database,
  rule,
  metaData
}: AIStreamGenerateRequest): AsyncGenerator<string, void, unknown> {
  // 1. 전달받은 데이터 사용 (DB 조회 없음)
  const dbType: SqlDbType = database.dbms_name as SqlDbType

  // 2. Schema에서 테이블/컬럼 찾기
  const table = schema.find((t) => t.name === tableName)
  const column = table?.columns?.find((c) => c.name === columnName)

  if (!column) {
    console.warn(`Column ${tableName}.${columnName} not found in schema, using defaults`)
  }

  // 3. 제약조건 구성
  const sqlType = column?.type || 'VARCHAR(255)'
  const constraints = column
    ? extractConstraintsFromSqlType(sqlType, column)
    : {
        notNull: true,
        maxLength: 255
      }

  // 4. 외래키 정보 추가
  if (table?.foreignKeys) {
    const fk = table.foreignKeys.find((fk) => fk.column_name === columnName)
    if (fk) {
      constraints.referencedTable = fk.referenced_table
      constraints.referencedColumn = fk.referenced_column
    }
  }

  // 5. ColumnSchemaInfo 구성
  const info: ColumnSchemaInfo = {
    dbType,
    tableName,
    columnName,
    sqlType,
    constraints: {
      ...constraints,
      unique: metaData.ensureUnique || constraints.unique
    },
    domainName: rule.domain_name
  }

  // 6. AI vendor/model 결정
  const { vendor, model } = rule.model_id
    ? resolveModel(rule.model_id)
    : { vendor: 'openai', model: 'gpt-4.1-mini' }

  const typedVendor = vendor as 'openai' | 'anthropic' | 'google'

  // 7. AI 생성은 배치 단위로 처리
  const BATCH_SIZE = 1000
  const batches = Math.ceil(recordCnt / BATCH_SIZE)

  const generator = new AIGenerator()

  for (let batchIdx = 0; batchIdx < batches; batchIdx++) {
    const start = batchIdx * BATCH_SIZE
    const end = Math.min(start + BATCH_SIZE, recordCnt)
    const batchCount = end - start

    try {
      // 배치 단위로 AI 생성
      const result = await generator.generate({
        databaseId: database.id,
        vendor: typedVendor,
        model,
        count: batchCount,
        info
      })

      // 생성된 값들을 하나씩 yield
      for (const value of result.values) {
        yield value
      }

      // 배치 간 잠깐 쉬기 (API rate limit 대응)
      if (batchIdx < batches - 1) {
        await new Promise((res) => setTimeout(res, 100))
      }
    } catch (error) {
      console.error(`AI 생성 실패 (batch ${batchIdx + 1}/${batches}):`, error)

      // 실패 시 fallback 사용
      const fallback = fallbackValues(info.domainName, batchCount)
      for (const value of fallback) {
        yield value
      }
    }
  }
}

/**
 * 메인 서비스 클래스
 */
export class AIGenerator {
  async generate(req: AIGenRequest): Promise<AIGenResult> {
    const { vendor, model, count, info } = req
    const ai = createAIGateway(vendor)
    const schema = buildJsonSchemaForValues(info, count)
    const prompt = buildPrompt(info, count)
    const validate = buildAjvValidator(schema)

    let retries = 0
    let fallbackUsed = 0

    // 첫 번째 시도
    const aiResp = await ai.generate({ model, prompt, temperature: 0.2, schema })
    const parsed = parseValuesArray(aiResp.text)

    let values = parsed?.values ?? []

    // 검증 실패 시 재시도
    if (!validate({ values })) {
      retries += 1
      const retry = await ai.generate({ model, prompt, temperature: 0.3, schema })
      const retryParsed = parseValuesArray(retry.text)
      if (retryParsed && validate({ values: retryParsed.values })) {
        values = retryParsed.values
      }
    }

    // 개수 부족 시 fallback 추가
    if (values.length < count) {
      const fb = fallbackValues(info.domainName, count - values.length)
      values = values.concat(fb)
      fallbackUsed += fb.length
    }

    // 개수 초과 시 자르기
    if (values.length > count) {
      values = values.slice(0, count)
    }

    // unique 제약조건 적용
    let uniqueAdjusted = 0
    if (info.constraints.unique) {
      const r = enforceUniqueness(values)
      values = r.adjusted
      uniqueAdjusted = r.changed
    }

    return {
      values,
      diagnostics: {
        usedVendor: vendor,
        retries,
        fallbackUsed,
        uniqueAdjusted
      }
    }
  }
}
