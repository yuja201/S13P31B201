import { createRule } from '../database/rules'
import type { Rule } from '../database/types'
import { FakerRuleInput } from './data-generator/types'

const DATA_SOURCE = 'faker'

export function createFakerRule(data: FakerRuleInput): Rule {
  return createRule({ ...data, data_source: DATA_SOURCE })
}
