import { ipcMain } from 'electron'
import { analyzeIndexes } from '../services/index-analyzer/index-analyzer'

/**
 * 인덱스 분석 핸들러
 */
ipcMain.handle('index:analyze', async (_, databaseId: number) => {
  try {
    const result = await analyzeIndexes(databaseId)
    return { success: true, data: result }
  } catch (error) {
    console.error('Index analysis failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
})
