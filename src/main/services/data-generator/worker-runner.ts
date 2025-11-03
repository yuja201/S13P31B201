import fs from 'node:fs'
import path from 'node:path'
import type { WorkerTask, WorkerResult } from '../types.js'
import { DBMS_MAP } from '../../utils/dbms-map.js'
import { generateFakeStream } from './faker-generator.js'

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
  let currentRow = 0

  try {
    // 컬럼별 스트림 준비
    const columnStreams = columns.map((col) =>
      generateFakeStream({
        projectId,
        tableName,
        columnName: col.columnName,
        recordCnt,
        metaData: col.metaData
      })
    )

    // 한 행(row)은 모든 컬럼 스트림에서 1개씩 받음
    for (let i = 0; i < recordCnt; i++) {
      const rowValues: string[] = []

      for (let j = 0; j < columns.length; j++) {
        const col = columns[j]
        const gen = columnStreams[j]
        const { value } = await gen.next()

        if (value === undefined) continue
        const escaped = String(value).replace(/'/g, "''")
        rowValues.push(`'${escaped}'`)

        // 마지막 행 도달 시 컬럼 완료 이벤트
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
      currentRow++

      // 1만 행마다 flush
      if (rows.length >= BATCH_SIZE || i === recordCnt - 1) {
        const sql = `INSERT INTO ${quote}${tableName}${quote} (${columnNames}) VALUES\n${rows.join(',\n')};\n`
        await fs.promises.appendFile(sqlPath, sql, 'utf8')
        rows = []
      }

      // 10만 행마다 진행률
      if (currentRow % LOG_INTERVAL === 0 || i === recordCnt - 1) {
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

    // flush 완료 후 약간 대기 (I/O 안정화)
    await new Promise((res) => setTimeout(res, 100))

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

  try {
    // (1) write 권한으로 열기
    const fd = await fs.promises.open(result.sqlPath, 'r+')

    // (2) 디스크 flush 강제
    await fd.sync()
    await fd.close()
    console.log(`[FLUSH] ${result.tableName} flush 완료`)
  } catch (e) {
    console.warn('⚠️ fsync 실패:', e)
  }

  // (3) flush 후 0.5초 대기 (Windows I/O 안정화)
  await new Promise((res) => setTimeout(res, 500))

  // (4) 이제 진짜 종료
  process.exit(result.success ? 0 : 1)
}

main()
