import path from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { app, BrowserWindow } from 'electron'
import type { WorkerTask, WorkerResult, GenerateRequest, GenerationResult } from './types'
import { getDatabaseByProjectId } from '../../database/databases'
import { getDBMSById } from '../../database/dbms'
import { getRuleById } from '../../database/rules'
import { DBMS_ID_TO_KEY, type SupportedDBMS } from '../../utils/dbms-map'
import { createZipFromSqlFilesStreaming } from './zip-generator'
import { getFileCacheRoot } from '../../utils/cache-path'
import { fetchSchema } from '../../utils/schema-fetch'

const MAX_PARALLEL = Math.max(1, Math.floor(os.cpus().length / 2))

export async function runDataGenerator(
  payload: GenerateRequest,
  mainWindow: BrowserWindow
): Promise<GenerationResult> {
  await app.whenReady()

  const { projectId, tables, mode = 'SQL_FILE' } = payload
  if (!tables.length) {
    throw new Error('No tables provided for data generation.')
  }

  const database = getDatabaseByProjectId(projectId)
  if (!database) {
    throw new Error(`Database connection info not found for project ${projectId}.`)
  }

  const dbms = getDBMSById(database.dbms_id)
  if (!dbms) {
    throw new Error(`DBMS not found for id ${database.dbms_id}.`)
  }

  const dbTypeKey: SupportedDBMS | undefined = DBMS_ID_TO_KEY[database.dbms_id]
  if (!dbTypeKey) {
    throw new Error(`Unsupported DBMS id: ${database.dbms_id}`)
  }

  const schema = await fetchSchema(projectId)

  const ruleIds = new Set<number>()
  for (const table of tables) {
    for (const column of table.columns) {
      if (
        (column.dataSource === 'FAKER' || column.dataSource === 'AI') &&
        'ruleId' in column.metaData &&
        typeof (column.metaData as { ruleId?: unknown }).ruleId === 'number'
      ) {
        ruleIds.add((column.metaData as { ruleId: number }).ruleId)
      }
    }
  }

  const rules = Array.from(ruleIds)
    .map((id) => getRuleById(id))
    .filter((rule): rule is NonNullable<typeof rule> => Boolean(rule))
    .map((rule) => ({
      id: rule.id,
      domain_name: rule.domain_name,
      model_id: rule.model_id
    }))

  const databaseInfo = {
    id: database.id,
    dbms_name: dbms.name
  }

  const connectionInfo =
    mode === 'DIRECT_DB'
      ? {
          ...parseDatabaseUrl(database.url, dbTypeKey),
          username: database.username,
          password: database.password,
          database: database.database_name
        }
      : undefined

  const queue = [...tables]
  const running = new Set<ReturnType<typeof spawn>>()
  const results: WorkerResult[] = []
  const cacheRoot = getFileCacheRoot()

  const startNext = async (): Promise<void> => {
    if (queue.length === 0) return
    const table = queue.shift()!

    const task: WorkerTask = {
      projectId,
      dbType: dbTypeKey,
      table,
      schema,
      database: databaseInfo,
      rules,
      mode,
      connection: connectionInfo
    }

    const workerPath = path.resolve(app.getAppPath(), 'out/main/worker-runner.js')
    const child = spawn('node', [workerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        TASK: JSON.stringify(task),
        HERESDUMMY_CACHE_DIR: cacheRoot
      }
    })
    running.add(child)

    let stdout = ''
    let stdoutBuffer = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      const chunk = data.toString()
      process.stdout.write(chunk)
      stdout += chunk

      stdoutBuffer += chunk
      let newlineIndex: number
      while ((newlineIndex = stdoutBuffer.indexOf('\n')) !== -1) {
        const line = stdoutBuffer.slice(0, newlineIndex).trim()
        stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1)
        if (!line) continue

        if (line.startsWith('{') && line.endsWith('}')) {
          try {
            const msg = JSON.parse(line)
            if (msg.type) {
              mainWindow.webContents.send('data-generator:progress', msg)
            }
          } catch {
            // JSON 파싱 실패 시 무시 (불완전 청크일 가능성)
          }
        }
      }
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
      console.error('[worker] stderr:', data.toString())
    })

    child.on('close', (code) => {
      running.delete(child)
      if (code === 0) {
        const resultLine = stdout
          .split('\n')
          .find((line) => line.startsWith('{') && line.includes('"success"'))
        if (resultLine) {
          results.push(JSON.parse(resultLine))
        } else {
          results.push({
            success: false,
            tableName: table.tableName,
            sqlPath: '',
            error: 'Worker finished without returning a result payload.'
          })
        }
      } else {
        results.push({
          success: false,
          tableName: table.tableName,
          sqlPath: '',
          error: stderr || `Worker exited with code ${code}`
        })
      }
      startNext()
    })
  }

  for (let i = 0; i < Math.min(MAX_PARALLEL, queue.length); i++) {
    startNext()
  }

  while (running.size > 0 || queue.length > 0) {
    await new Promise((res) => setTimeout(res, 300))
  }

  const successResults = results.filter((r) => r.success)
  const failedResults = results.filter((r) => !r.success)

  const files = successResults.map((r) => ({ filename: r.tableName, path: r.sqlPath }))
  const zipPath = files.length > 0 ? await createZipFromSqlFilesStreaming(files, projectId) : null

  const executedTables = successResults.filter((r) => r.directInserted).map((r) => r.tableName)

  mainWindow.webContents.send('data-generator:progress', {
    type: 'all-complete',
    successCount: successResults.length,
    failCount: failedResults.length
  })

  const allErrors = failedResults.map((r) => `[${r.tableName}] ${r.error ?? 'Unknown error'}`)

  return {
    zipPath,
    successCount: successResults.length,
    failCount: failedResults.length,
    success: allErrors.length === 0,
    executedTables: executedTables.length ? executedTables : undefined,
    errors: allErrors.length ? allErrors : undefined
  }
}

function parseDatabaseUrl(rawUrl: string, dbType: SupportedDBMS): { host: string; port: number } {
  const [hostPart, portPart] = rawUrl.split(':')
  const defaultPort = dbType === 'mysql' ? 3306 : 5432
  const parsed = Number(portPart)
  return {
    host: hostPart || 'localhost',
    port: Number.isFinite(parsed) ? parsed : defaultPort
  }
}
