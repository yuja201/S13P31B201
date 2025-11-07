import { ipcMain } from 'electron'
import { getAllDomains, getDomainsByLogicalType } from '../database/domain'

ipcMain.handle('domain:getAll', () => {
  return getAllDomains()
})

ipcMain.handle('domain:getByType', (_, logicalType: string) => {
  return getDomainsByLogicalType(logicalType)
})
