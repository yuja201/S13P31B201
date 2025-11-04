import { ipcMain } from 'electron'
import { createFakerRule } from '../services/faker-rule-service'
import { fakerRuleInput } from '../services/types'
import { Rule } from '../database/types'

ipcMain.handle('db:rule:createFaker', async (_: unknown, data: fakerRuleInput): Promise<Rule> => {
  return createFakerRule(data)
})
