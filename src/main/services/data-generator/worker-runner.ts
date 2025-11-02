import fs from 'node:fs'
import path from 'node:path'
import type { WorkerTask, WorkerResult } from '../types'
import { DBMS_MAP } from '../../utils/dbms-map'
import { generateFakeBatches } from './faker-generator'

// TODO: 에러 시 전체 실패말고 개별 테이블만 실패처리

/**
 * Piscina 워커
 */
export default async function runWorker(task: WorkerTask): Promise<WorkerResult> {
  const { projectId, table, dbType } = task

  // SQL 파일 저장 디렉토리 생성
  const dir = path.join(process.cwd(), 'generated_sql')
  await fs.promises.mkdir(dir, { recursive: true })

  const sqlPath = path.join(dir, `${table.tableName}.sql`)
  await fs.promises.writeFile(sqlPath, `-- SQL for ${table.tableName}\n\n`, 'utf8')

  const { quote } = DBMS_MAP[dbType]

  const baseParams = {
    projectId,
    tableName: table.tableName,
    recordCnt: table.recordCnt
  }

  for (const col of table.columns) {
    const params = {
      ...baseParams,
      columnName: col.columnName,
      metaData: col.metaData
    }
    const buffers: string[] = []

    if (col.dataSource === 'FAKER') {
      // flush용 임시 버퍼

      for await (const batch of generateFakeBatches(params)) {
        let sqlBuffer = ''
        for (const value of batch) {
          const escaped = value.replace(/'/g, "''")
          sqlBuffer += `INSERT INTO ${quote}${table.tableName}${quote} (${quote}${col.columnName}${quote}) VALUES ('${escaped}');\n`
        }

        buffers.push(sqlBuffer)

        // 5개 batch마다 한 번씩 flush
        if (buffers.length >= 5) {
          await fs.promises.appendFile(sqlPath, buffers.join(''), 'utf8')
          buffers.length = 0
        }
      }

      // 남은 데이터 마지막 flush
      if (buffers.length > 0) {
        await fs.promises.appendFile(sqlPath, buffers.join(''), 'utf8')
      }
    }
    // TODO: 다른 생성 방식 추가
  }

  return { tableName: table.tableName, sqlPath, success: true }
}
