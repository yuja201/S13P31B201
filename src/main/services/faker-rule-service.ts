import { createRule } from '../database/rules'
import type { Rule } from '../database/types'
import { FakerRuleInput } from '@shared/types'

const DATA_SOURCE = 'FAKER'

export function createFakerRule(data: FakerRuleInput): Rule {
  return createRule({ ...data, data_source: DATA_SOURCE, locale: data.locale })
}
