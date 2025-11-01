import { createAIGateway } from './ai/ai-factory'
import { AIGenRequest, AIGenResult, ColumnSchemaInfo } from './types'
import { getDomainGuideline } from './ai/domain-config'
import { buildAjvValidator, enforceUniqueness, parseValuesArray } from '../../utils/validators'

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
${info.dbType} 데이터베이스의 ${info.tableName} 테이블, ${info.columnName} 컬럼에 대해 ${count}개의 현실적이고 다양한 테스트 데이터를 생성해ra.

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
