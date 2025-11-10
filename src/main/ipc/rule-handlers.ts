import { FakerRuleInput, AIRuleInput } from '@shared/types'
import { ipcMain } from 'electron'
import { createFakerRule } from '../services/faker-rule-service'
import { createAIRule } from '../services/creation-rule/ai-rule-service'
import { Rule } from '../database/types'
import { getRulesByLogicalType } from '../database/rules'

ipcMain.handle('db:rule:createFaker', async (_: unknown, data: FakerRuleInput): Promise<Rule> => {
  return createFakerRule(data)
})

ipcMain.handle('db:rule:createAI', async (_: unknown, data: AIRuleInput): Promise<Rule> => {
  return createAIRule(data)
})

ipcMain.handle('db:rule:getByLogicalType', (_, logicalType: string) => {
  return getRulesByLogicalType(logicalType)
})
