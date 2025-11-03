import path from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { app, BrowserWindow } from 'electron'
import type { WorkerTask, WorkerResult, GenerationInput, GenerationResult } from '../types.js'
import { getDatabaseByProjectId } from '../../database/databases.js'
import { DBMS_ID_TO_KEY, type SupportedDBMS } from '../../utils/dbms-map.js'
import { createZipFromSqlFilesStreaming } from './zip-generator.js'

const MAX_PARALLEL = Math.max(1, Math.floor(os.cpus().length / 2))

/**
 * Generate SQL files for the specified tables using parallel worker processes and produce a ZIP containing the generated SQL files.
 *
 * @param payload - Generation input containing `projectId` and an array of tables to generate
 * @param mainWindow - Electron BrowserWindow used to emit progress updates (`data-generator:progress`)
 * @returns The generation result including `zipPath`, `successCount`, `failCount`, overall `success`, and `errors`
 * @throws Error with message '생성할 테이블이 없습니다.' if `tables` is empty
 * @throws Error with message `프로젝트 ${projectId}의 DB 연결 정보를 찾을 수 없습니다.` if the project database configuration is missing
 * @throws Error with message `지원하지 않는 DBMS ID: ${database.dbms_id}` if the project's DBMS is not supported
 */
export async function runDataGenerator(
  payload: GenerationInput,
  mainWindow: BrowserWindow
): Promise<GenerationResult> {
  await app.whenReady()

  const { projectId, tables } = payload
  if (!tables.length) throw new Error('생성할 테이블이 없습니다.')

  const database = getDatabaseByProjectId(projectId)
  if (!database) throw new Error(`프로젝트 ${projectId}의 DB 연결 정보를 찾을 수 없습니다.`)

  const dbTypeKey: SupportedDBMS | undefined = DBMS_ID_TO_KEY[database.dbms_id]
  if (!dbTypeKey) throw new Error(`지원하지 않는 DBMS ID: ${database.dbms_id}`)

  const queue = [...tables]
  const running = new Set<ReturnType<typeof spawn>>()
  const results: WorkerResult[] = []

  const startNext = async (): Promise<void> => {
    if (queue.length === 0) return
    const table = queue.shift()!
    const task: WorkerTask = { projectId, dbType: dbTypeKey, table }

    const workerPath = path.resolve(app.getAppPath(), 'out/main/worker-runner.js')
    const child = spawn('node', [workerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, TASK: JSON.stringify(task) }
    })
    running.add(child)

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      const text = data.toString().trim()
      if (text.startsWith('{') && text.endsWith('}')) {
        try {
          const msg = JSON.parse(text)
          if (msg.type) {
            mainWindow.webContents.send('data-generator:progress', msg)
          }
        } catch {
          // JSON이 아닌 일반 로그는 무시
        }
      }
      stdout += text + '\n'
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
      console.error('⚠️ worker stderr:', data.toString())
    })

    child.on('close', (code) => {
      running.delete(child)
      if (code === 0) {
        const result = JSON.parse(
          stdout.split('\n').filter((l) => l.startsWith('{') && l.includes('"success"'))[0]
        )
        results.push(result)
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

  // 병렬 실행 시작
  for (let i = 0; i < Math.min(MAX_PARALLEL, queue.length); i++) {
    startNext()
  }

  // 전체 완료 대기
  while (running.size > 0 || queue.length > 0) {
    await new Promise((res) => setTimeout(res, 300))
  }

  // 결과 요약 및 zip 생성
  const successResults = results.filter((r) => r.success)
  const failedResults = results.filter((r) => !r.success)

  const files = successResults.map((r) => ({ filename: r.tableName, path: r.sqlPath }))
  const zipPath = await createZipFromSqlFilesStreaming(files, projectId)

  mainWindow.webContents.send('data-generator:progress', {
    type: 'all-complete',
    successCount: successResults.length,
    failCount: failedResults.length
  })

  return {
    zipPath,
    successCount: successResults.length,
    failCount: failedResults.length,
    success: failedResults.length === 0,
    errors: failedResults.map((r) => `[${r.tableName}] ${r.error ?? 'Unknown error'}`)
  }
}