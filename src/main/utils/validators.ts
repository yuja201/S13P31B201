import Ajv, { ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'

/**
 * AJV 검증기 생성
 */
export function buildAjvValidator(schema: object): ValidateFunction {
  const ajv = new Ajv({ allErrors: true })
  addFormats(ajv)
  return ajv.compile(schema)
}

/**
 * 배열 값의 유일성 강제 (중복 제거 및 suffix 추가)
 */
export function enforceUniqueness(values: string[]): { adjusted: string[]; changed: number } {
  const seen = new Set<string>()
  let changed = 0
  const adjusted = values.map((v) => {
    let candidate = v
    let attempt = 0
    while (seen.has(candidate) && attempt < 10) {
      candidate = `${v}_${Math.random().toString(36).slice(2, 5)}`
      attempt += 1
    }
    if (seen.has(candidate)) {
      // 최후의 수단: 타임스탬프 추가
      candidate = `${v}_${Date.now()}_${Math.random().toString(36).slice(2, 3)}`
    }
    if (candidate !== v) changed += 1
    seen.add(candidate)
    return candidate
  })
  return { adjusted, changed }
}

/**
 * JSON 파싱 시도
 */
export function safeParse<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

/**
 * 값 배열 검증용 인터페이스
 */
export interface ParsedValues {
  values: string[]
}

/**
 * JSON 텍스트를 파싱하여 values 배열 추출
 */
export function parseValuesArray(text: string): ParsedValues | null {
  const obj = safeParse<Record<string, unknown>>(text)
  if (obj && Array.isArray(obj.values)) {
    return { values: obj.values.map(String) }
  }
  return null
}
