import { FakerRuleInput, AIRuleInput } from './../services/data-generator/types'
import { ipcMain } from 'electron'
import { createFakerRule } from '../services/faker-rule-service'
import { createAIRule } from '../services/creation-rule/ai-rule-service'
import { Rule } from '../database/types'

ipcMain.handle('db:rule:createFaker', async (_: unknown, data: FakerRuleInput): Promise<Rule> => {
  return createFakerRule(data)
})

ipcMain.handle('db:rule:createAI', async (_: unknown, data: AIRuleInput): Promise<Rule> => {
  return createAIRule(data)
})
