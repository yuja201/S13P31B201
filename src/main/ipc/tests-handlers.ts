import { ipcMain } from 'electron'
import { getTestById } from '../database/tests'

ipcMain.handle('tests:getById', (_, id: number) => {
  return getTestById(id)
})
