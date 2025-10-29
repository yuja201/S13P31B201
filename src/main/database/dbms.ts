import { getDatabase } from './index'
import type { DBMS, DBMSInput, DBMSUpdate } from './types'

/**
 * 전체 DBMS 조회
 */
export function getAllDBMS(): DBMS[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM dbmses ORDER BY id')
  return stmt.all() as DBMS[]
}

/**
 * ID로 DBMS 조회
 */
export function getDBMSById(id: number): DBMS | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM dbmses WHERE id = ?')
  return stmt.get(id) as DBMS | undefined
}

/**
 * 새 DBMS 추가
 */
export function createDBMS(data: DBMSInput): DBMS {
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const stmt = db.prepare(`
    INSERT INTO dbmses (name, created_at, updated_at)
    VALUES (?, ?, ?)
  `)

  const result = stmt.run(data.name, now, now)

  return getDBMSById(result.lastInsertRowid as number)!
}

/**
 * DBMS 수정
 */
export function updateDBMS(data: DBMSUpdate): DBMS | undefined {
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const updates: string[] = []
  const values: (string | number)[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }

  if (updates.length === 0) {
    return getDBMSById(data.id)
  }

  updates.push('updated_at = ?')
  values.push(now)
  values.push(data.id)

  const stmt = db.prepare(`
    UPDATE dbmses
    SET ${updates.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...values)

  return getDBMSById(data.id)
}

/**
 * DBMS 삭제
 */
export function deleteDBMS(id: number): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM dbmses WHERE id = ?')
  const result = stmt.run(id)

  return result.changes > 0
}
