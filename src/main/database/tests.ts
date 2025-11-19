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
      t.grade,
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
      t.grade,
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
    INSERT INTO tests (project_id, type, grade, summary, result, response_time, index_ratio, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    data.project_id,
    data.type,
    data.grade ?? null,
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
export function getWeeklyQueryStats(projectId: number): DailyQueryStat[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    WITH RECURSIVE last7(date) AS (
      SELECT date('now', 'localtime', '-6 days')
      UNION ALL
      SELECT date(date, '+1 day')
      FROM last7
      WHERE date < date('now', 'localtime')
    )
    SELECT
      last7.date AS date,
      COALESCE(AVG(t.response_time), 0) AS avg_response_time
    FROM last7
    LEFT JOIN tests t
      ON last7.date = date(t.created_at, 'unixepoch', 'localtime')
      AND t.type = 'QUERY'
      AND t.project_id = ?
    GROUP BY last7.date
    ORDER BY last7.date;
  `)
  return stmt.all(projectId) as DailyQueryStat[]
}

/**
 * 최근 7일간 인덱스 테스트: 일별 평균 인덱스 사용율
 */
export function getWeeklyIndexStats(projectId: number): DailyIndexStat[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    WITH RECURSIVE last7(date) AS (
      SELECT date('now', 'localtime', '-6 days')
      UNION ALL
      SELECT date(date, '+1 day')
      FROM last7
      WHERE date < date('now', 'localtime')
    )
    SELECT
      last7.date AS date,
      COALESCE(AVG(t.index_ratio), 0) AS avg_index_ratio
    FROM last7
    LEFT JOIN tests t
      ON last7.date = date(t.created_at, 'unixepoch', 'localtime')
      AND t.type = 'INDEX'
      AND t.project_id = ?
    GROUP BY last7.date
    ORDER BY last7.date;
  `)
  return stmt.all(projectId) as DailyIndexStat[]
}

/**
 * 사용자 쿼리 테스트 전체 평균 응답
 */
export function getQuerySummary(projectId: number): TestSummary {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      COUNT(*) AS count,
      COALESCE(AVG(response_time), 0) AS avg_value
    FROM tests
    WHERE type = 'QUERY'
      AND project_id = ?
  `)
  return stmt.get(projectId) as TestSummary
}

/**
 * 인덱스 테스트 전체 평균 인덱스 사용율
 */
export function getIndexSummary(projectId: number): TestSummary {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      COUNT(*) AS count,
      COALESCE(AVG(index_ratio), 0) AS avg_value
    FROM tests
    WHERE type = 'INDEX'
      AND project_id = ?
  `)
  return stmt.get(projectId) as TestSummary
}

/**
 * 이번 주 총 테스트 수
 */
export function getThisWeekTestCount(projectId: number): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT COUNT(*) AS count
    FROM tests
    WHERE project_id = ?
      AND created_at >= strftime('%s','now','localtime','weekday 1','-7 days')
  `)

  const row = stmt.get(projectId) as { count: number }
  return row.count
}

/**
 * 지난주 대비 이번 주 증가율
 * (지난주=0이면 100%로 처리)
 */
export function getWeeklyGrowthRate(projectId: number): number {
  const db = getDatabase()

  // 이번 주 (월요일 00:00 이후)
  const thisWeek = (
    db
      .prepare(
        `
      SELECT COUNT(*) AS count
      FROM tests
      WHERE project_id = ?
        AND created_at >= strftime('%s','now','localtime','weekday 1','-7 days')
    `
      )
      .get(projectId) as { count: number }
  ).count

  // 지난 주 (지난주 월요일 00:00 ~ 이번 주 월요일 00:00)
  const lastWeek = (
    db
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM tests
        WHERE project_id = ?
          AND created_at >= strftime('%s','now','localtime','weekday 1','-14 days')
          AND created_at <  strftime('%s','now','localtime','weekday 1','-7 days')
    `
      )
      .get(projectId) as { count: number }
  ).count

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
export function getQueryWeeklyChangeRate(projectId: number): number {
  const db = getDatabase()

  const thisWeek = (
    db
      .prepare(
        `
      SELECT AVG(response_time) AS avg_value
      FROM tests
      WHERE type = 'QUERY'
        AND project_id = ?
        AND created_at >= strftime('%s','now','localtime','weekday 1','-7 days')
    `
      )
      .get(projectId) as { avg_value: number | null }
  ).avg_value

  const lastWeek = (
    db
      .prepare(
        `
      SELECT AVG(response_time) AS avg_value
      FROM tests
      WHERE type = 'QUERY'
        AND project_id = ?
        AND created_at >= strftime('%s','now','localtime','weekday 1','-14 days')
        AND created_at <  strftime('%s','now','localtime','weekday 1','-7 days')
    `
      )
      .get(projectId) as { avg_value: number | null }
  ).avg_value

  if (lastWeek === null || lastWeek === 0) return thisWeek ? 100 : 0
  return ((thisWeek! - lastWeek!) / lastWeek!) * 100
}

/**
 * 인덱스 테스트: 평균 인덱스 사용율 변화율
 */
export function getIndexWeeklyChangeRate(projectId: number): number {
  const db = getDatabase()

  // 이번 주 평균 (월요일 00:00 이후)
  const thisWeek = (
    db
      .prepare(
        `
      SELECT AVG(index_ratio) AS avg_value
      FROM tests
      WHERE type = 'INDEX'
        AND project_id = ?
        AND created_at >= strftime('%s','now','localtime','weekday 1','-7 days')
    `
      )
      .get(projectId) as { avg_value: number | null }
  ).avg_value

  // 지난 주 평균 (지난 주 월요일 00:00 ~ 이번 주 월요일 00:00)
  const lastWeek = (
    db
      .prepare(
        `
      SELECT AVG(index_ratio) AS avg_value
      FROM tests
      WHERE type = 'INDEX'
        AND project_id = ?
        AND created_at >= strftime('%s','now','localtime','weekday 1','-14 days')
        AND created_at <  strftime('%s','now','localtime','weekday 1','-7 days')
    `
      )
      .get(projectId) as { avg_value: number | null }
  ).avg_value

  if (lastWeek === null || lastWeek === 0) return thisWeek ? 100 : 0
  return ((thisWeek! - lastWeek!) / lastWeek!) * 100
}

/**
 * 최근 7일간 총 테스트 개수
 */
export function getWeeklyTotalTestStats(projectId: number): { date: string; count: number }[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    WITH RECURSIVE last7(date) AS (
      SELECT date('now', 'localtime', '-6 days')
      UNION ALL
      SELECT date(date, '+1 day')
      FROM last7
      WHERE date < date('now', 'localtime')
    )
    SELECT
      last7.date AS date,
      COUNT(t.id) AS count
    FROM last7
    LEFT JOIN tests t
      ON last7.date = date(t.created_at, 'unixepoch', 'localtime')
      AND t.project_id = ?
    GROUP BY last7.date
    ORDER BY last7.date;
  `)
  return stmt.all(projectId) as { date: string; count: number }[]
}

/**
 * AI 개선 업데이트
 */
export function updateTestResult(id: number, result: string): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    UPDATE tests
    SET result = ?
    WHERE id = ?
  `)
  stmt.run(result, id)
}
