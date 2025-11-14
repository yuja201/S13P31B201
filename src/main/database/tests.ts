import { getDatabase } from './index'
import type {
  Test,
  TestInput,
  TestUpdate,
  TestSummary,
  DailyQueryStat,
  DailyIndexStat
} from './types'

/**
 * 전체 테스트 목록 조회 (프로젝트명 포함)
 */
export function getAllTests(): Test[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      t.id,
      t.project_id,
      p.name AS project_name,
      t.type,
      t.summary,
      t.result,
      t.response_time,
      t.index_ratio,
      t.created_at
    FROM tests t
    JOIN projects p ON t.project_id = p.id
    ORDER BY t.created_at DESC
  `)
  return stmt.all() as Test[]
}

/**
 * 테스트 단일 조회
 */
export function getTestById(id: number): Test | undefined {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      t.id,
      t.project_id,
      p.name AS project_name,
      t.type,
      t.summary,
      t.result,
      t.response_time,
      t.index_ratio,
      t.created_at
    FROM tests t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `)
  return stmt.get(id) as Test | undefined
}

/**
 * 새 테스트 생성
 */
export function createTest(data: TestInput): Test {
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const stmt = db.prepare(`
    INSERT INTO tests (project_id, type, summary, result, response_time, index_ratio, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    data.project_id,
    data.type,
    data.summary ?? null,
    data.result,
    data.response_time ?? null,
    data.index_ratio ?? null,
    now
  )

  return getTestById(result.lastInsertRowid as number)!
}

/**
 * 테스트 수정
 */
export function updateTest(data: TestUpdate): Test | undefined {
  const db = getDatabase()
  const updates: string[] = []
  const values: (string | number | null)[] = []

  if (data.project_id !== undefined) {
    updates.push('project_id = ?')
    values.push(data.project_id)
  }
  if (data.type !== undefined) {
    updates.push('type = ?')
    values.push(data.type)
  }
  if (data.summary !== undefined) {
    updates.push('summary = ?')
    values.push(data.summary)
  }
  if (data.result !== undefined) {
    updates.push('result = ?')
    values.push(data.result)
  }
  if (data.response_time !== undefined) {
    updates.push('response_time = ?')
    values.push(data.response_time)
  }
  if (data.index_ratio !== undefined) {
    updates.push('index_ratio = ?')
    values.push(data.index_ratio)
  }

  if (updates.length === 0) return getTestById(data.id)

  values.push(data.id)

  const stmt = db.prepare(`
    UPDATE tests
    SET ${updates.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...values)

  return getTestById(data.id)
}

/**
 * 테스트 삭제
 */
export function deleteTest(id: number): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM tests WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

/**
 * 최근 7일간 사용자 쿼리 테스트: 일별 평균 응답 시간
 */
export function getWeeklyQueryStats(): DailyQueryStat[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      date(t.created_at, 'unixepoch') AS date,
      AVG(t.response_time) AS avg_response_time
    FROM tests t
    WHERE t.type = 'QUERY'
      AND t.created_at >= strftime('%s', 'now', '-7 days')
    GROUP BY date
    ORDER BY date
  `)
  return stmt.all() as DailyQueryStat[]
}

/**
 * 최근 7일간 인덱스 테스트: 일별 평균 인덱스 사용율
 */
export function getWeeklyIndexStats(): DailyIndexStat[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      date(t.created_at, 'unixepoch') AS date,
      AVG(t.index_ratio) AS avg_index_ratio
    FROM tests t
    WHERE t.type = 'INDEX'
      AND t.created_at >= strftime('%s', 'now', '-7 days')
    GROUP BY date
    ORDER BY date
  `)
  return stmt.all() as DailyIndexStat[]
}

/**
 * 사용자 쿼리 테스트 전체 평균 응답
 */
export function getQuerySummary(): TestSummary {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      COUNT(*) AS count,
      AVG(response_time) AS avg_value
    FROM tests
    WHERE type = 'QUERY'
  `)
  return stmt.get() as TestSummary
}

/**
 * 인덱스 테스트 전체 평균 인덱스 사용율
 */
export function getIndexSummary(): TestSummary {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      COUNT(*) AS count,
      AVG(index_ratio) AS avg_value
    FROM tests
    WHERE type = 'INDEX'
  `)
  return stmt.get() as TestSummary
}

/**
 * 이번 주 총 테스트 수
 */
export function getThisWeekTestCount(): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT COUNT(*) AS count
    FROM tests
    WHERE created_at >= strftime('%s', 'now', 'weekday 1', '-0 days')
  `)

  const row = stmt.get() as { count: number }
  return row.count as number
}

/**
 * 지난주 대비 이번 주 증가율
 * (지난주=0이면 100%로 처리)
 */
export function getWeeklyGrowthRate(): number {
  const db = getDatabase()

  // 이번 주
  const thisWeekRow = db
    .prepare(
      `
    SELECT COUNT(*) AS count
    FROM tests
    WHERE created_at >= strftime('%s', 'now', 'weekday 1', '-0 days')
  `
    )
    .get() as { count: number }

  const thisWeek = thisWeekRow.count

  // 지난 주
  const lastWeekRow = db
    .prepare(
      `
    SELECT COUNT(*) AS count
    FROM tests
    WHERE created_at >= strftime('%s', 'now', 'weekday 1', '-7 days')
      AND created_at <  strftime('%s', 'now', 'weekday 1')
  `
    )
    .get() as { count: number }
  const lastWeek = lastWeekRow.count

  if (lastWeek === 0) {
    return thisWeek > 0 ? 100 : 0
  }

  return ((thisWeek - lastWeek) / lastWeek) * 100
}

export function insertIntoTests(data: TestInput): number {
  return createTest(data).id
}

/**
 * 사용자 쿼리: 평균 응답 시간 변화율
 */
export function getQueryWeeklyChangeRate(): number {
  const db = getDatabase()

  const thisWeek = (
    db
      .prepare(
        `
      SELECT AVG(response_time) AS avg_value
      FROM tests
      WHERE type = 'QUERY'
        AND created_at >= strftime('%s', 'now', 'weekday 1', '-0 days')
    `
      )
      .get() as { avg_value: number | null }
  ).avg_value

  const lastWeek = (
    db
      .prepare(
        `
      SELECT AVG(response_time) AS avg_value
      FROM tests
      WHERE type = 'QUERY'
        AND created_at >= strftime('%s', 'now', 'weekday 1', '-7 days')
        AND created_at <  strftime('%s', 'now', 'weekday 1')
    `
      )
      .get() as { avg_value: number | null }
  ).avg_value

  if (lastWeek === null || lastWeek === 0) return thisWeek ? 100 : 0
  return ((thisWeek! - lastWeek!) / lastWeek!) * 100
}

/**
 * 인덱스 테스트: 평균 인덱스 사용율 변화율
 */
export function getIndexWeeklyChangeRate(): number {
  const db = getDatabase()

  const thisWeek = (
    db
      .prepare(
        `
      SELECT AVG(index_ratio) AS avg_value
      FROM tests
      WHERE type = 'INDEX'
        AND created_at >= strftime('%s', 'now', 'weekday 1', '-0 days')
    `
      )
      .get() as { avg_value: number | null }
  ).avg_value

  const lastWeek = (
    db
      .prepare(
        `
      SELECT AVG(index_ratio) AS avg_value
      FROM tests
      WHERE type = 'INDEX'
        AND created_at >= strftime('%s', 'now', 'weekday 1', '-7 days')
        AND created_at <  strftime('%s', 'now', 'weekday 1')
    `
      )
      .get() as { avg_value: number | null }
  ).avg_value

  if (lastWeek === null || lastWeek === 0) return thisWeek ? 100 : 0
  return ((thisWeek! - lastWeek!) / lastWeek!) * 100
}

/**
 * 최근 7일간 총 테스트 개수
 */
export function getWeeklyTotalTestStats(): { date: string; count: number }[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      date(created_at, 'unixepoch') AS date,
      COUNT(*) AS count
    FROM tests
    WHERE created_at >= strftime('%s', 'now', '-7 days')
    GROUP BY date
    ORDER BY date
  `)
  return stmt.all() as { date: string; count: number }[]
}
