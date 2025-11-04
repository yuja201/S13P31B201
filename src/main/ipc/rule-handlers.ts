import { FakerRuleInput } from './../services/data-generator/types'
import { ipcMain } from 'electron'
import { createFakerRule } from '../services/faker-rule-service'
import { Rule } from '../database/types'

ipcMain.handle('db:rule:createFaker', async (_: unknown, data: FakerRuleInput): Promise<Rule> => {
  return createFakerRule(data)
})
