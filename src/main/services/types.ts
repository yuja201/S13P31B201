/**
 * 공통
 */
export interface GenerateRequest {
  projectId: number
  tableName: string
  columnName: string
  recordCnt: number
  metaData: {
    ruleId: number
  }
}

/**
 * faker
 */
export interface fakerRuleInput {
  name: string
  domain: number
}
