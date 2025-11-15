import type { MySQLExplainResult, PostgresExplainResult } from '@shared/types'
import type { AIResponse } from '@main/services/ai/ai-client'
import { resolveModel } from '@main/services/ai/model-map'
import { createAIGateway } from '@main/services/ai/ai-factory'

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

  return [
    '당신은 MySQL/PostgreSQL 성능 최적화 전문가입니다.',
    '아래 SQL 쿼리와 실행 계획을 분석하고, 성능 개선을 위한 구체적인 조언을 한국어로 작성해주세요.\n',
    '[요구사항]',
    '1. 현재 쿼리의 성능 문제가 될 수 있는 부분을 짚어주세요.',
    '2. 인덱스 설계, 조인 방식, 필터링 조건 등에서 개선할 수 있는 점을 제안해주세요.',
    '3. 필요하다면 수정된 SQL 예시를 함께 제시해주세요.',
    '4. 너무 추상적으로 말하지 말고, 실행 계획과 쿼리 구조를 근거로 설명해주세요.\n',
    '[SQL 쿼리]',
    query,
    '\n[실행 계획 요약]',
    summary,
    '\n[실행 계획 RAW(JSON)]',
    rawPlan
  ].join('\n')
}

export class UserQueryAIGenerator {
  async generate(req: UserQueryAIRequest): Promise<UserQueryAIResult> {
    const { query, explain, modelId } = req
    const { vendor, model } = resolveModel(modelId ?? undefined)
    const gateway = createAIGateway(vendor)

    const prompt = buildQueryImprovePrompt(query, explain)

    const aiResp: AIResponse = await gateway.generate({
      model,
      prompt,
      temperature: 0.2
    })

    return { text: aiResp.text }
  }
}
