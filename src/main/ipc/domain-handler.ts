import { ipcMain } from 'electron'
import { getAllDomains, getDomainsByLogicalType } from '../database/domain'

ipcMain.handle('domain:getAll', () => {
  return getAllDomains()
})

ipcMain.handle('domain:getByLogicalType', (_, logicalType: string) => {
  return getDomainsByLogicalType(logicalType)
})
