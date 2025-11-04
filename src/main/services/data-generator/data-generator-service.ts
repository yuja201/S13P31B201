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
import { fetchSchema } from '../../utils/schema-fetch'

const MAX_PARALLEL = Math.max(1, Math.floor(os.cpus().length / 2))

export async function runDataGenerator(
  payload: GenerateRequest,
  mainWindow: BrowserWindow
): Promise<GenerationResult> {
  await app.whenReady()

  const { projectId, tables } = payload
  if (!tables.length) throw new Error('생성할 테이블이 없습니다.')

  // 1. Database 정보 조회
  const database = getDatabaseByProjectId(projectId)
  if (!database) throw new Error(`프로젝트 ${projectId}의 DB 연결 정보를 찾을 수 없습니다.`)

  // 2. DBMS 정보 조회
  const dbms = getDBMSById(database.dbms_id)
  if (!dbms) throw new Error(`DBMS not found: ${database.dbms_id}`)

  const dbTypeKey: SupportedDBMS | undefined = DBMS_ID_TO_KEY[database.dbms_id]
  if (!dbTypeKey) throw new Error(`지원하지 않는 DBMS ID: ${database.dbms_id}`)

  // 3. 스키마 정보 미리 조회 (모든 worker가 공유)
  const schema = await fetchSchema(projectId)

  // 4. 모든 테이블에서 사용되는 Rule들 미리 조회
  const ruleIds = new Set<number>()
  for (const table of tables) {
    for (const column of table.columns) {
      // 데이터 소스가 FAKER 또는 AI일 때만 ruleId 사용
      if (
        (column.dataSource === 'FAKER' || column.dataSource === 'AI') &&
        'ruleId' in column.metaData &&
        typeof column.metaData.ruleId === 'number'
      ) {
        ruleIds.add(column.metaData.ruleId)
      }
    }
  }

  const rules = Array.from(ruleIds)
    .map((id) => getRuleById(id))
    .filter((rule) => rule !== undefined)
    .map((rule) => ({
      id: rule!.id,
      domain_name: rule!.domain_name,
      model_id: rule!.model_id
    }))

  // 5. Database 정보 간소화
  const databaseInfo = {
    id: database.id,
    dbms_name: dbms.name
  }

  const queue = [...tables]
  const running = new Set<ReturnType<typeof spawn>>()
  const results: WorkerResult[] = []

  const startNext = async (): Promise<void> => {
    if (queue.length === 0) return
    const table = queue.shift()!

    // Worker Task 구성 (스키마, DB 정보, Rule 정보 포함)
    const task: WorkerTask = {
      projectId,
      dbType: dbTypeKey,
      table,
      schema,
      database: databaseInfo,
      rules
    }

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

      // 터미널에도 로그 출력
      process.stdout.write(text + '\n')

      // JSON 메시지면 progress 이벤트로 전송
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
