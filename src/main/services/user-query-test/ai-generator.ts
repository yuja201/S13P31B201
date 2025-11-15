import type { MySQLExplainResult, PostgresExplainResult } from '@shared/types'
import type { AIResponse } from '@main/services/ai/ai-client'
import { resolveModel } from '@main/services/ai/model-map'
import { createAIGateway } from '@main/services/ai/ai-factory'
import type { AIRecommendationItem } from '@shared/types'

export interface UserQueryAIRequest {
  query: string
  explain: MySQLExplainResult | PostgresExplainResult
  modelId?: number | null
}

export interface UserQueryAIResult {
  text: string
}

function summarizeExplain(explain: MySQLExplainResult | PostgresExplainResult): string {
  const planType = explain.planType
  const estimatedRows = explain.estimatedRows
  const hasActualRows = 'actualRows' in explain
  const actualRows = hasActualRows ? explain.actualRows : undefined

  let costText = ''

  // PostgreSQL: cost = { startup, total }
  if (typeof explain.cost === 'object' && explain.cost !== null) {
    const pgCost = explain.cost as PostgresExplainResult['cost']
    costText = `startup=${pgCost.startup}, total=${pgCost.total}`
  } else {
    // MySQL: cost = number
    costText = String(explain.cost)
  }

  const parts: string[] = [`Plan Type: ${planType}`, `Estimated Rows: ${estimatedRows}`]

  if (actualRows !== undefined) {
    parts.push(`Actual Rows: ${actualRows}`)
  }

  if (costText) {
    parts.push(`Cost: ${costText}`)
  }

  return parts.join('\n')
}

function buildQueryImprovePrompt(
  query: string,
  explain: MySQLExplainResult | PostgresExplainResult
): string {
  const summary = summarizeExplain(explain)
  const rawPlan = JSON.stringify(explain.raw, null, 2)

  return `
  당신은 MySQL/PostgreSQL 쿼리 최적화 전문가입니다.
  아래 SQL과 실행 계획을 분석하여, 성능을 개선하기 위한 "개선 조치 카드 목록"을 JSON 배열로 출력하세요.

  반드시 아래 JSON 스키마만 출력하고, 다른 설명은 출력하지 마세요.

  [
    {
      "id": number,                          // 1부터 시작
      "type": "improve" | "index" | "rewrite", 
      // improve: 일반적인 개선 (필터, 조인, 조건 수정)
      // index: 필요한 인덱스 추천
      // rewrite: 쿼리 재작성 제안

      "title": string,                       // 개선 요약 한 문장
      "description": string,                 // 왜 필요한지, 실행 계획 근거 포함
      "suggestion": string,                  // 구체적 액션 (ex: WHERE 조건 변경, 조인 방식 변경)
      "exampleSQL": string | null,           // 수정된 SQL 예시 (있으면), 없으면 null
    }
  ]

  작성 규칙:
  1. 실행 계획의 estimatedRows, actualRows, cost 등을 근거로 설명하세요.
  2. 너무 추상적이면 안 되고, 개선 이유를 명확히 작성하세요.
  3. exampleSQL은 가능한 경우 제공하고, 불가능하면 null로 하세요.
  4. 반드시 JSON만 출력하세요.

  [SQL]
  ${query}

  [실행 계획 요약]
  ${summary}

  [실행 계획 RAW(JSON)]
  ${rawPlan}
  `.trim()
}

function extractJsonArray(text: string): string {
  // 첫 번째 '[' 위치
  const start = text.indexOf('[')
  // 마지막 ']' 위치
  const end = text.lastIndexOf(']')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI 응답에서 JSON 배열을 찾지 못했습니다.')
  }

  return text.substring(start, end + 1)
}

export class UserQueryAIGenerator {
  async generate(req: UserQueryAIRequest): Promise<AIRecommendationItem[]> {
    const { query, explain, modelId } = req
    const { vendor, model } = resolveModel(modelId ?? undefined)
    const gateway = createAIGateway(vendor)

    const prompt = buildQueryImprovePrompt(query, explain)

    const aiResp: AIResponse = await gateway.generate({
      model,
      prompt,
      temperature: 0.2
    })

    let jsonText = ''

    try {
      jsonText = extractJsonArray(aiResp.text) // JSON 부분만 추출
    } catch {
      console.error('JSON 추출 실패:', aiResp.text)
      throw new Error('AI 응답 JSON 추출 실패')
    }

    try {
      const parsed = JSON.parse(jsonText)
      return parsed
    } catch {
      console.error('JSON 파싱 실패:', jsonText)
      throw new Error('AI 응답 JSON 파싱 실패')
    }
  }
}
