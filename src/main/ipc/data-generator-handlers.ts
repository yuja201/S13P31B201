import { ipcMain, BrowserWindow } from 'electron'
import { runDataGenerator } from '../services/data-generator/data-generator-service'
import { GenerateRequest } from '../services/data-generator/types'

/**
 * 더미데이터 생성
 */
ipcMain.handle('gen:dummy:bulk', async (event, payload: GenerateRequest) => {
  const mainWindow = BrowserWindow.fromWebContents(event.sender)
  const result = await runDataGenerator(payload, mainWindow!)
  return result
})
