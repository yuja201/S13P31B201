import fs from 'node:fs'
import path from 'node:path'
import mysql from 'mysql2/promise'
import { Client as PgClient } from 'pg'
import type { WorkerTask, WorkerResult } from './types.js'
import { DBMS_MAP } from '../../utils/dbms-map.js'
import { generateFakeStream } from './faker-generator.js'
import { generateAIStream } from './ai-generator.js'
import {
  DataSourceType,
  type ColumnMetaData,
  FakerMetaData,
  AIMetaData,
  FileMetaData,
  FixedMetaData
} from './types.js'
import { createFileValueStream } from './file-generator.js'
import { generateFixedStream } from './fixed-generator.js'

// 컬럼별 스트림 생성 함수
function createColumnStream(
  col: {
    columnName: string
    dataSource: DataSourceType
    metaData?: ColumnMetaData
  },
  task: WorkerTask,
  recordCnt: number
): AsyncGenerator<string> {
  const { projectId, table, schema, database, rules } = task
  const { tableName } = table
  const dataSource = col.dataSource as DataSourceType

  switch (dataSource) {
    case 'FAKER': {
      if (!col.metaData || (col.metaData as FakerMetaData).ruleId == null) {
        throw new Error(
          `[Faker 메타데이터 오류] ${tableName}.${col.columnName} 컬럼의 Faker 규칙 설정이 올바르지 않습니다.`
        )
      }

      const meta = col.metaData as FakerMetaData
      const rule = rules.find((r) => r.id === meta.ruleId)
      if (!rule) {
        throw new Error(`Rule ${meta.ruleId} not found in worker task`)
      }

      return generateFakeStream({
        projectId,
        tableName,
        columnName: col.columnName,
        recordCnt,
        metaData: meta,
        domainName: rule.domain_name,
        schema
      })
    }

    case 'AI': {
      if (!col.metaData || (col.metaData as AIMetaData).ruleId == null) {
        throw new Error(
          `[AI 메타데이터 오류] ${tableName}.${col.columnName} 컬럼의 AI 규칙 설정이 올바르지 않습니다.`
        )
      }

      const meta = col.metaData as AIMetaData
      const rule = rules.find((r) => r.id === meta.ruleId)
      if (!rule) {
        throw new Error(`Rule ${meta.ruleId} not found in worker task`)
      }

      return generateAIStream({
        projectId,
        tableName,
        columnName: col.columnName,
        recordCnt,
        metaData: meta,
        schema,
        database,
        rule
      })
    }

    case 'FILE': {
      if (!col.metaData) {
        throw new Error(
          `[파일 메타데이터 오류] ${tableName}.${col.columnName} 컬럼의 파일 설정이 올바르지 않습니다.`
        )
      }
      const meta = col.metaData as FileMetaData
      return createFileValueStream(meta, recordCnt)
    }

    case 'FIXED': {
      if (!col.metaData || (col.metaData as FixedMetaData).fixedValue == null) {
        throw new Error(
          `[고정값 메타데이터 오류] ${tableName}.${col.columnName} 컬럼의 고정값 설정이 올바르지 않습니다.`
        )
      }

      const meta = col.metaData as FixedMetaData
      return generateFixedStream({
        fixedValue: meta.fixedValue,
        recordCnt
      })
    }

    default:
      throw new Error(`알 수 없는 데이터 소스: ${col.dataSource}`)
  }
}

// AI 컬럼과 non-AI 컬럼 분리
function separateColumnsByType(columns: { dataSource: DataSourceType }[]): {
  aiColumns: number[]
  nonAiColumns: number[]
} {
  const aiColumns: number[] = []
  const nonAiColumns: number[] = []

  columns.forEach((col, idx) => {
    if (col.dataSource === 'AI') {
      aiColumns.push(idx)
    } else {
      nonAiColumns.push(idx)
    }
  })

  return { aiColumns, nonAiColumns }
}

type DirectContext = {
  execute: (sql: string) => Promise<void>
  commit: () => Promise<void>
  rollback: () => Promise<void>
  close: () => Promise<void>
}

async function createDirectContext(
  dbType: keyof typeof DBMS_MAP,
  connection: NonNullable<WorkerTask['connection']>
): Promise<DirectContext> {
  if (dbType === 'mysql') {
    const client = await mysql.createConnection({
      host: connection.host,
      port: connection.port,
      user: connection.username,
      password: connection.password,
      database: connection.database
    })
    await client.beginTransaction()
    return {
      execute: async (sql: string) => {
        await client.query(sql)
      },
      commit: () => client.commit(),
      rollback: () => client.rollback(),
      close: () => client.end()
    }
  }

  const client = new PgClient({
    host: connection.host,
    port: connection.port,
    user: connection.username,
    password: connection.password,
    database: connection.database
  })
  await client.connect()
  await client.query('BEGIN')
  return {
    execute: async (sql: string) => {
      await client.query(sql)
    },
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
    close: () => client.end()
  }
}

async function runWorker(task: WorkerTask): Promise<WorkerResult> {
  const { table, dbType, mode, connection } = task
  const { tableName, recordCnt, columns } = table

  const outputDir = path.join(process.cwd(), 'generated_sql')
  await fs.promises.mkdir(outputDir, { recursive: true })

  const sqlPath = path.join(outputDir, `${tableName}.sql`)
  await fs.promises.writeFile(sqlPath, `-- SQL for ${tableName}\n\n`, 'utf8')

  const { quote } = DBMS_MAP[dbType]
  const columnNames = columns.map((c) => `${quote}${c.columnName}${quote}`).join(', ')
  const CHUNK_SIZE = 1000
  const LOG_INTERVAL = 100_000
  const MAX_AI_CONCURRENT = 2

  const directMode = mode === 'DIRECT_DB' && Boolean(connection)
  let directContext: DirectContext | null = null

  try {
    if (directMode && connection) {
      directContext = await createDirectContext(dbType, connection)
    }

    console.log(`[${tableName}] 시작: ${recordCnt.toLocaleString()}행, ${columns.length}컬럼`)
    const startTime = Date.now()
    let totalProcessed = 0
    const numChunks = Math.max(1, Math.ceil(recordCnt / CHUNK_SIZE))

    for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
      const chunkStart = chunkIdx * CHUNK_SIZE
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, recordCnt)
      const chunkSize = chunkEnd - chunkStart
      if (chunkSize <= 0) {
        continue
      }

      console.log(`\n[${tableName}] 청크 ${chunkIdx + 1}/${numChunks} 처리 중 (${chunkSize}행)`)
      const chunkStartTime = Date.now()

      const columnStreams = columns.map((col) => createColumnStream(col, task, chunkSize))
      const { aiColumns, nonAiColumns } = separateColumnsByType(columns)
      const chunkColumnValues: string[][] = new Array(columns.length)

      if (nonAiColumns.length > 0) {
        console.log(`[${tableName}] Non-AI 컬럼 동시 처리:`)
        const nonAiResults = await Promise.all(
          nonAiColumns.map(async (colIdx) => {
            const col = columns[colIdx]
            const stream = columnStreams[colIdx]
            const colStart = Date.now()
            console.log(`  ▶ [${col.columnName}] 처리 (${col.dataSource})`)

            const values: string[] = []
            for (let i = 0; i < chunkSize; i++) {
              const { value } = await stream.next()
              if (value !== undefined) {
                const escaped = String(value).replace(/'/g, "''")
                values.push(`'${escaped}'`)
              }
            }

            const colDuration = ((Date.now() - colStart) / 1000).toFixed(2)
            console.log(`  ? [${col.columnName}] 완료 (${colDuration}초)`)

            return { colIdx, values }
          })
        )

        nonAiResults.forEach(({ colIdx, values }) => {
          chunkColumnValues[colIdx] = values
        })
      }

      if (aiColumns.length > 0) {
        console.log(`[${tableName}] AI 컬럼 처리 (동시 ${MAX_AI_CONCURRENT}개):`)

        for (let i = 0; i < aiColumns.length; i += MAX_AI_CONCURRENT) {
          const batch = aiColumns.slice(i, i + MAX_AI_CONCURRENT)

          const batchResults = await Promise.all(
            batch.map(async (colIdx) => {
              const col = columns[colIdx]
              const stream = columnStreams[colIdx]
              const colStart = Date.now()
              console.log(`  ▶ [${col.columnName}] 처리 (${col.dataSource})`)

              const values: string[] = []
              for (let j = 0; j < chunkSize; j++) {
                const { value } = await stream.next()
                if (value !== undefined) {
                  const escaped = String(value).replace(/'/g, "''")
                  values.push(`'${escaped}'`)
                }
              }

              const colDuration = ((Date.now() - colStart) / 1000).toFixed(2)
              console.log(`  ? [${col.columnName}] 완료 (${colDuration}초)`)

              return { colIdx, values }
            })
          )

          batchResults.forEach(({ colIdx, values }) => {
            chunkColumnValues[colIdx] = values
          })

          if (i + MAX_AI_CONCURRENT < aiColumns.length) {
            console.log(`  ? 다음 AI 컬럼 대기 (1초)...`)
            await new Promise((res) => setTimeout(res, 1000))
          }
        }
      }

      const rows: string[] = []
      for (let rowIdx = 0; rowIdx < chunkSize; rowIdx++) {
        const rowValues = columns.map((_, colIdx) => {
          const columnValues = chunkColumnValues[colIdx]
          return columnValues?.[rowIdx] ?? 'NULL'
        })
        rows.push(`(${rowValues.join(', ')})`)
        totalProcessed++

        if (totalProcessed % LOG_INTERVAL === 0 || totalProcessed === recordCnt) {
          const progress = recordCnt === 0 ? 100 : Math.round((totalProcessed / recordCnt) * 100)
          process.stdout.write(
            JSON.stringify({
              type: 'row-progress',
              tableName,
              progress,
              currentRow: totalProcessed
            }) + '\n'
          )
        }
      }

      if (rows.length > 0) {
        const sql = `INSERT INTO ${quote}${tableName}${quote} (${columnNames}) VALUES\n${rows.join(',\n')};\n`
        if (directMode && directContext) {
          await directContext.execute(sql)
        }
        await fs.promises.appendFile(sqlPath, sql, 'utf8')
      }

      const chunkDuration = ((Date.now() - chunkStartTime) / 1000).toFixed(2)
      console.log(`\n[${tableName}] 청크 ${chunkIdx + 1} 완료 (${chunkDuration}초)`)

      await new Promise((res) => setTimeout(res, 100))

      if (chunkEnd === recordCnt) {
        columns.forEach((col) => {
          process.stdout.write(
            JSON.stringify({
              type: 'column-progress',
              tableName,
              columnName: col.columnName,
              progress: 100
            }) + '\n'
          )
        })
      }
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(
      `\n[${tableName}] 전체 완료 (${totalDuration}초, ${totalProcessed.toLocaleString()}행)`
    )

    if (directContext) {
      await directContext.commit()
      await directContext.close()
      directContext = null
    }

    process.stdout.write(
      JSON.stringify({
        type: 'table-complete',
        tableName
      }) + '\n'
    )

    const result: WorkerResult = {
      tableName,
      sqlPath,
      success: true,
      directInserted: directMode ? true : undefined
    }
    console.log(JSON.stringify(result))
    return result
  } catch (err) {
    if (directContext) {
      await directContext.rollback().catch(() => {})
      await directContext.close().catch(() => {})
      directContext = null
    }

    const result: WorkerResult = {
      tableName,
      sqlPath,
      success: false,
      error: (err as Error).message
    }
    console.error('worker-runner error:', err)
    console.log(JSON.stringify(result))
    return result
  }
}
async function main(): Promise<void> {
  const taskEnv = process.env.TASK
  if (!taskEnv) {
    console.error('TASK environment variable is missing.')
    process.exit(1)
  }

  const task = JSON.parse(taskEnv)
  const result = await runWorker(task)

  try {
    const fd = await fs.promises.open(result.sqlPath, 'r+')
    await fd.sync()
    await fd.close()
    console.log(`[FLUSH] ${result.tableName} flush complete`)
  } catch (e) {
    console.warn('fsync failed:', e)
  }

  await new Promise((res) => setTimeout(res, 500))

  process.exit(result.success ? 0 : 1)
}

main()
