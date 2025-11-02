import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import Piscina from 'piscina'
import type { WorkerTask, WorkerResult, GenerationInput } from '../types'
import { getDatabaseByProjectId } from '../../database/databases'
import { DBMS_ID_TO_KEY, type SupportedDBMS } from '../../utils/dbms-map.js'

// ESM 환경용 __dirname 복원
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 시스템 CPU 코어 개수 가져오기
const cpuCount = Math.max(os.cpus().length - 1, 1)
const isDev = process.env.NODE_ENV === 'development'

// 워커 풀 생성
export const workerPool = new Piscina({
  filename: isDev
    ? path.resolve(__dirname, './worker-runner.ts') // dev
    : path.resolve(__dirname, './worker-runner.js'), // build
  maxThreads: cpuCount
})

/**
 * 파일 생성 요청
 * - Piscina가 자동으로 워커 풀 관리 및 병렬 처리
 */
export async function runDataGenerator(
  payload: GenerationInput
): Promise<WorkerResult[] | WorkerResult> {
  const { projectId, tables } = payload

  if (!tables.length) {
    throw new Error('생성할 테이블이 없습니다.')
  }

  // DB 조회
  const database = getDatabaseByProjectId(projectId)
  if (!database) {
    throw new Error(`프로젝트 ${projectId}의 DB 연결 정보를 찾을 수 없습니다.`)
  }

  // id → 문자열 key 변환
  const dbTypeKey: SupportedDBMS | undefined = DBMS_ID_TO_KEY[database.dbms_id]
  if (!dbTypeKey) {
    throw new Error(`지원하지 않는 DBMS ID: ${database.dbms_id}`)
  }

  // 단일 테이블 처리
  if (tables.length === 1) {
    const task: WorkerTask = {
      projectId,
      dbType: dbTypeKey,
      table: tables[0]
    }
    const result = (await workerPool.run(task)) as WorkerResult
    return result
  }

  // 다중 테이블 병렬 처리
  const tasks: WorkerTask[] = tables.map((table) => ({
    projectId,
    dbType: dbTypeKey,
    table
  }))

  // Piscina 워커 풀 관리 및 큐 처리
  const results = await Promise.all(
    tasks.map((task) => workerPool.run(task) as Promise<WorkerResult>)
  )

  return results
}

/**
 * 워커 풀 상태 조회
 */
export function getWorkerPoolStatus(): {
  activeWorkers: number
  queueSize: number
  totalThreads: number
} {
  return {
    activeWorkers: workerPool.threads.length,
    queueSize: workerPool.queueSize,
    totalThreads: workerPool.options.maxThreads ?? 0
  }
}

/**
 * 워커 풀 정리 (앱 종료 시 호출)
 */
export async function closeWorkerPool(): Promise<void> {
  await workerPool.destroy()
}
