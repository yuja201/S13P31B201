import { ipcMain, BrowserWindow } from 'electron'
import { getDatabasesByProjectId } from '../database/databases'
import { getDBMSById } from '../database/dbms'
import { getRuleById } from '../database/rules'
import { AIGenerator } from '../services/data-generator/ai-generator'
import { ColumnSchemaInfo } from '../services/data-generator/types'
import { resolveModel } from '../services/data-generator/ai/model-map'
import { runDataGenerator } from '../services/data-generator/data-generator-service'
import type { GenerationInput, ColumnMetaData } from '../services/types'

interface GenerateRequest {
  projectId: number
  tables: {
    tableName: string
    recordCnt: number
    columns: {
      columnName: string
      dataSource: 'AI' | 'FAKER' | 'FILE'
      metaData?: ColumnMetaData
    }[]
  }[]
}

ipcMain.handle('gen:ai:bulk', async (_e, payload: GenerateRequest) => {
  const { projectId, tables } = payload

  // 프로젝트 ID 기반으로 DBMS 종류 조회
  const databases = getDatabasesByProjectId(projectId)
  if (!databases.length) throw new Error(`No database found for projectId ${projectId}`)

  const database = databases[0]
  const dbms = getDBMSById(database.dbms_id)
  if (!dbms) throw new Error(`No DBMS found for id ${database.dbms_id}`)

  const dbType = dbms.name as 'MySQL' | 'PostgreSQL'

  // 결과 누적
  const results: Record<string, Record<string, string[]>> = {}

  // 테이블 순회
  for (const table of tables) {
    const { tableName, recordCnt, columns } = table
    const aiColumns = columns.filter((col) => col.dataSource === 'AI')

    if (aiColumns.length === 0) continue

    results[tableName] = {}

    // AI 칼럼별 생성
    for (const col of aiColumns) {
      const ruleId = extractRuleId(col.metaData)
      if (!ruleId) continue

      // DB rules 테이블에서 프롬프트/도메인 가져오기
      const rule = getRuleById(ruleId)
      if (!rule) continue

      const { vendor, model } = resolveModel(rule.model_id)

      const info: ColumnSchemaInfo = {
        dbType,
        tableName,
        columnName: col.columnName,
        sqlType: 'VARCHAR(255)', // TODO: 스키마 fetch 결과 연동
        domainName: rule.domain_name,
        constraints: {
          notNull: true,
          unique: false
        }
      }

      const generator = new AIGenerator()

      const genResult = await generator.generate({
        databaseId: database.id,
        vendor,
        model,
        count: recordCnt,
        info
      })

      results[tableName][col.columnName] = genResult.values
    }
  }

  return results
})

/**
 * 더미데이터 생성
 */
ipcMain.handle('gen:dummy:bulk', async (event, payload: GenerationInput) => {
  const mainWindow = BrowserWindow.fromWebContents(event.sender)
  const result = await runDataGenerator(payload, mainWindow!)
  return result
})

function extractRuleId(meta?: ColumnMetaData): number | undefined {
  if (!meta) return undefined
  if ((meta.kind === 'ai' || meta.kind === 'faker') && typeof meta.ruleId === 'number') {
    return meta.ruleId
  }
  return undefined
}
