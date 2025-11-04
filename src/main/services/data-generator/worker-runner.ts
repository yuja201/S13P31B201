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
  AIMetaData,
  FakerMetaData,
  FileMetaData
} from './types.js'
import { createFileValueStream } from './file-generator.js'

function isFileMeta(meta: ColumnMetaData | undefined): meta is FileMetaData {
  return Boolean(meta && meta.kind === 'file')
}

function isAIMeta(meta: ColumnMetaData | undefined): meta is AIMetaData {
  return Boolean(meta && meta.kind === 'ai')
}

function isFakerMeta(meta: ColumnMetaData | undefined): meta is FakerMetaData {
  return Boolean(meta && meta.kind === 'faker')
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
  const { projectId, table, dbType, schema, database, rules, mode, connection } = task
  const { tableName, recordCnt, columns } = table

  const outputDir = path.join(process.cwd(), 'generated_sql')
  await fs.promises.mkdir(outputDir, { recursive: true })

  const sqlPath = path.join(outputDir, `${tableName}.sql`)
  await fs.promises.writeFile(sqlPath, `-- SQL for ${tableName}\n\n`, 'utf8')

  const { quote } = DBMS_MAP[dbType]
  const columnNames = columns.map((c) => `${quote}${c.columnName}${quote}`).join(', ')
  const BATCH_SIZE = 10_000
  const LOG_INTERVAL = 100_000

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
        }
        case 'MANUAL':
          throw new Error(`Manual data source is not implemented (${col.columnName}).`)
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
        }
      }

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
