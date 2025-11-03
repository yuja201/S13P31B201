import fs from 'node:fs'
import path from 'node:path'
import type { WorkerTask, WorkerResult } from '../types.js'
import { DBMS_MAP } from '../../utils/dbms-map.js'
import { generateFakeValue } from './faker-generator.js'

async function runWorker(task: WorkerTask): Promise<WorkerResult> {
  const { projectId, table, dbType } = task
  const { tableName, recordCnt, columns } = table

  const dir = path.join(process.cwd(), 'generated_sql')
  await fs.promises.mkdir(dir, { recursive: true })

  const sqlPath = path.join(dir, `${tableName}.sql`)
  await fs.promises.writeFile(sqlPath, `-- SQL for ${tableName}\n\n`, 'utf8')

  const { quote } = DBMS_MAP[dbType]
  const columnNames = columns.map((c) => `${quote}${c.columnName}${quote}`).join(', ')
  const BATCH_SIZE = 10_000
  const LOG_INTERVAL = 100_000
  let rows: string[] = []

  try {
    for (let i = 0; i < recordCnt; i++) {
      const rowValues: string[] = []

      // 컬럼 생성 루프
      for (let j = 0; j < columns.length; j++) {
        const col = columns[j]
        let value = ''

        if (col.dataSource === 'FAKER') {
          const result = await generateFakeValue({
            projectId,
            tableName,
            columnName: col.columnName,
            recordCnt,
            metaData: col.metaData
          })
          value = String(result ?? '')
        }

        const escaped = value.replace(/'/g, "''")
        rowValues.push(`'${escaped}'`)

        // 컬럼 단위 진행률 (프론트로 전달)
        if (i === recordCnt - 1) {
          process.stdout.write(
            JSON.stringify({
              type: 'column-progress',
              tableName,
              columnName: col.columnName,
              progress: 100
            }) + '\n'
          )
        }
      }

      rows.push(`(${rowValues.join(', ')})`)

      if (rows.length >= BATCH_SIZE || i === recordCnt - 1) {
        const sql = `INSERT INTO ${quote}${tableName}${quote} (${columnNames}) VALUES\n${rows.join(',\n')};\n`
        await fs.promises.appendFile(sqlPath, sql, 'utf8')
        rows = []
      }

      // 10만 행마다 로그 전송
      if ((i + 1) % LOG_INTERVAL === 0 || i === recordCnt - 1) {
        const progress = Math.round(((i + 1) / recordCnt) * 100)
        process.stdout.write(
          JSON.stringify({
            type: 'row-progress',
            tableName,
            progress,
            currentRow: i + 1
          }) + '\n'
        )
      }
    }

    await new Promise((res) => setTimeout(res, 100))

    // 테이블 완성 이벤트
    process.stdout.write(
      JSON.stringify({
        type: 'table-complete',
        tableName
      }) + '\n'
    )
    const result: WorkerResult = { tableName, sqlPath, success: true }
    console.log(JSON.stringify(result))
    return result
  } catch (err) {
    const result: WorkerResult = {
      tableName,
      sqlPath,
      success: false,
      error: (err as Error).message
    }
    console.error('❌ worker-runner error:', err)
    console.log(JSON.stringify(result))
    return result
  }
}

async function main(): Promise<void> {
  const taskEnv = process.env.TASK
  if (!taskEnv) {
    console.error('❌ TASK 환경변수가 없습니다.')
    process.exit(1)
  }

  const task = JSON.parse(taskEnv)
  const result = await runWorker(task)
  process.exit(result.success ? 0 : 1)
}

main()
