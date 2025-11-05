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
        metaData: { ruleId: meta.ruleId },
        domainName: rule.domain_name
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
        metaData: { ruleId: meta.ruleId },
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
function isFileMeta(meta: ColumnMetaData | undefined): meta is FileMetaData {
  return Boolean(meta && meta.kind === 'file')
}

function isAIMeta(meta: ColumnMetaData | undefined): meta is AIMetaData {
  return Boolean(meta && meta.kind === 'ai')
}

function isFakerMeta(meta: ColumnMetaData | undefined): meta is FakerMetaData {
  return Boolean(meta && meta.kind === 'faker')
}
function isFixedMeta(meta: ColumnMetaData | undefined): meta is FixedMetaData {
  return Boolean(meta && meta.kind === 'fixed')
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
  const MAX_AI_CONCURRENT = 2 // AI 동시 호출 제한

  try {
    console.log(`[${tableName}] 시작: ${recordCnt.toLocaleString()}행 × ${columns.length}컬럼`)
    const startTime = Date.now()

    let totalProcessed = 0
    const numChunks = Math.ceil(recordCnt / CHUNK_SIZE)

    // 청크 단위로 처리
    for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
      const chunkStart = chunkIdx * CHUNK_SIZE
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, recordCnt)
      const chunkSize = chunkEnd - chunkStart

      console.log(`\n[${tableName}] 청크 ${chunkIdx + 1}/${numChunks} 처리 중 (${chunkSize}행)`)
      const chunkStartTime = Date.now()

      // 컬럼별 스트림 생성
      const columnStreams = columns.map((col) => createColumnStream(col, task, chunkSize))

      // AI 컬럼과 non-AI 컬럼 분리
      const { aiColumns, nonAiColumns } = separateColumnsByType(columns)

      console.log(
        `[${tableName}] AI 컬럼: ${aiColumns.length}개, Non-AI 컬럼: ${nonAiColumns.length}개`
      )

      // 결과 저장용 배열 (컬럼 순서 유지)
      const chunkColumnValues: string[][] = new Array(columns.length)

      // 1. Non-AI 컬럼 먼저 병렬 처리 (빠름)
      if (nonAiColumns.length > 0) {
        console.log(`[${tableName}] Non-AI 컬럼 생성 시작 (병렬):`)
        const nonAiResults = await Promise.all(
          nonAiColumns.map(async (colIdx) => {
            const col = columns[colIdx]
            const stream = columnStreams[colIdx]
            const colStart = Date.now()
            console.log(`  → [${col.columnName}] 시작 (${col.dataSource})`)

            const values: string[] = []
            for (let i = 0; i < chunkSize; i++) {
              const { value } = await stream.next()
              if (value !== undefined) {
                const escaped = String(value).replace(/'/g, "''")
                values.push(`'${escaped}'`)
              }
            }

            const colDuration = ((Date.now() - colStart) / 1000).toFixed(2)
            console.log(`  ✓ [${col.columnName}] 완료 (${colDuration}초)`)

            return { colIdx, values }
          })
        )

        nonAiResults.forEach(({ colIdx, values }) => {
          chunkColumnValues[colIdx] = values
        })
      }

      // 2. AI 컬럼을 제한된 동시성으로 처리
      if (aiColumns.length > 0) {
        console.log(`[${tableName}] AI 컬럼 생성 시작 (동시 ${MAX_AI_CONCURRENT}개):`)

        for (let i = 0; i < aiColumns.length; i += MAX_AI_CONCURRENT) {
          const batch = aiColumns.slice(i, i + MAX_AI_CONCURRENT)

          const batchResults = await Promise.all(
            batch.map(async (colIdx) => {
              const col = columns[colIdx]
              const stream = columnStreams[colIdx]
              const colStart = Date.now()
              console.log(`  → [${col.columnName}] 시작 (${col.dataSource})`)

              const values: string[] = []
              for (let j = 0; j < chunkSize; j++) {
                const { value } = await stream.next()
                if (value !== undefined) {
                  const escaped = String(value).replace(/'/g, "''")
                  values.push(`'${escaped}'`)
                }
              }

              const colDuration = ((Date.now() - colStart) / 1000).toFixed(2)
              console.log(`  ✓ [${col.columnName}] 완료 (${colDuration}초)`)

              return { colIdx, values }
            })
          )

          batchResults.forEach(({ colIdx, values }) => {
            chunkColumnValues[colIdx] = values
          })

          // AI 배치 간 대기 (rate limit 방지)
          if (i + MAX_AI_CONCURRENT < aiColumns.length) {
            console.log(`  ⏳ 다음 AI 배치 전 대기 (1초)...`)
            await new Promise((res) => setTimeout(res, 1000))
          }
        }
      }

      // 컬럼 완료 진행률 (마지막 청크에서만)
      if (chunkEnd === recordCnt) {
        columns.forEach((col) => {

  let rows: string[] = []
  let currentRow = 0
  const directMode = mode === 'DIRECT_DB' && Boolean(connection)
  let directContext: DirectContext | null = null

  try {
    if (directMode && connection) {
      directContext = await createDirectContext(dbType, connection)
    }

    const columnStreams = columns.map((col) => {
      const dataSource = col.dataSource as DataSourceType
      switch (dataSource) {
        case 'FAKER': {
          if (!isFakerMeta(col.metaData) || col.metaData.ruleId == null) {
            throw new Error(
              `Invalid faker metadata for ${tableName}.${col.columnName}: ruleId is required.`
            )
          }
          return generateFakeStream({
            projectId,
            tableName,
            columnName: col.columnName,
            recordCnt,
            metaData: { ruleId: col.metaData.ruleId }
          })
        }
        case 'AI': {
          if (!isAIMeta(col.metaData) || col.metaData.ruleId == null) {
            throw new Error(
              `Invalid AI metadata for ${tableName}.${col.columnName}: ruleId is required.`
            )
          }
          const rule = rules.find((r) => r.id === col.metaData.ruleId)
          if (!rule) {
            throw new Error(`Rule ${col.metaData.ruleId} not found for AI generation.`)
          }
          return generateAIStream({
            projectId,
            tableName,
            columnName: col.columnName,
            recordCnt,
            metaData: { ruleId: col.metaData.ruleId },
            schema,
            database,
            rule
          })
        }
        case 'FILE': {
          if (!isFileMeta(col.metaData)) {
            throw new Error(
              `File metadata is missing or invalid for ${tableName}.${col.columnName}.`
            )
          }
          return createFileValueStream(col.metaData, recordCnt)

        case 'FIXED':
          if (!isFixedMeta(col.metaData)) {
            throw new Error(
              `[고정값 메타데이터 오류] ${tableName}.${col.columnName} 컬럼의 고정값 설정이 올바르지 않습니다.`
            )
          }
          return generateFixedStream({
            fixedValue: col.metaData.fixedValue,
            recordCnt
          })

        default:
          throw new Error(`Unsupported data source: ${String(dataSource)}`)
      }
    })

    for (let i = 0; i < recordCnt; i++) {
      const rowValues: string[] = []

      for (let j = 0; j < columns.length; j++) {
        const col = columns[j]
        const generator = columnStreams[j]
        const { value } = await generator.next()

        if (value === undefined) continue
        const escaped = String(value).replace(/'/g, "''")
        rowValues.push(`'${escaped}'`)

        if (i === recordCnt - 1) {
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

      const chunkDuration = ((Date.now() - chunkStartTime) / 1000).toFixed(2)
      console.log(`\n[${tableName}] 청크 ${chunkIdx + 1} 완료 (${chunkDuration}초)`)

      // 청크 내 행 조합 및 즉시 디스크 쓰기
      const rows: string[] = []
      for (let i = 0; i < chunkSize; i++) {
        const rowValues = columns.map((_, j) => chunkColumnValues[j][i])
        rows.push(`(${rowValues.join(', ')})`)
        totalProcessed++

        // 진행률 로그
        if (totalProcessed % LOG_INTERVAL === 0 || totalProcessed === recordCnt) {
          const progress = Math.round((totalProcessed / recordCnt) * 100)
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

      // 청크 단위로 디스크에 flush
      const sql = `INSERT INTO ${quote}${tableName}${quote} (${columnNames}) VALUES\n${rows.join(',\n')};\n`
      await fs.promises.appendFile(sqlPath, sql, 'utf8')

      // 청크 간 대기 (메모리 정리)
      await new Promise((res) => setTimeout(res, 100))
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(
      `\n[${tableName}] 전체 완료 (${totalDuration}초, ${totalProcessed.toLocaleString()}행)`
    )
      rows.push(`(${rowValues.join(', ')})`)
      currentRow++

      if (rows.length >= BATCH_SIZE || i === recordCnt - 1) {
        const sql = `INSERT INTO ${quote}${tableName}${quote} (${columnNames}) VALUES\n${rows.join(',\n')};\n`
        if (directContext) {
          await directContext.execute(sql)
        }
        await fs.promises.appendFile(sqlPath, sql, 'utf8')
        rows = []
      }

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

    await new Promise((res) => setTimeout(res, 100))

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
