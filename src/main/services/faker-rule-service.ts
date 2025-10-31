import { createRule } from '../database/rules'
import type { Rule } from '../database/types'
import { fakerRuleInput } from './faker-types'

const DATA_SOURCE = 'faker'

export function createFakerRule(data: fakerRuleInput): Rule {
  return createRule({ ...data, data_source: DATA_SOURCE })
}
