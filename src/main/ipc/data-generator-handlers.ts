import { ipcMain, BrowserWindow, dialog } from 'electron'
import { runDataGenerator } from '../services/data-generator/data-generator-service'
import { GenerateRequest } from '../services/data-generator/types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 더미데이터 생성
 */
ipcMain.handle('gen:dummy:bulk', async (event, payload: GenerateRequest) => {
  const mainWindow = BrowserWindow.fromWebContents(event.sender)
  const result = await runDataGenerator(payload, mainWindow!)
  return result
})

ipcMain.handle('gen:dummy:download', async (_event, zipPath: string) => {
  try {
    if (!fs.existsSync(zipPath)) {
      throw new Error('ZIP 파일을 찾을 수 없습니다.')
    }

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'ZIP 파일 저장 위치 선택',
      defaultPath: path.basename(zipPath),
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
    })

    if (canceled || !filePath) return { success: false, message: '사용자가 취소했습니다.' }

    fs.copyFileSync(zipPath, filePath)

    return { success: true, savedPath: filePath }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('[DOWNLOAD ERROR]', err.message)
      return { success: false, message: err.message }
    }
    console.error('[DOWNLOAD ERROR]', err)
    return { success: false, message: String(err) }
  }
})
