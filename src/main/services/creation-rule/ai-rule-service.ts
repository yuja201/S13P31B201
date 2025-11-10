import { createRule } from '../../database/rules'
import type { Rule } from '../../database/types'
import { AIRuleInput } from '@shared/types'

const DATA_SOURCE = 'AI'

export function createAIRule(data: AIRuleInput): Rule {
  return createRule({ ...data, data_source: DATA_SOURCE })
}
