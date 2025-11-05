import { getDatabase } from './index'
import type { Database as DatabaseType, DatabaseInput, DatabaseUpdate } from './types'
import { encrypt, decrypt } from '../utils/encryption'

/**
 * 전체 데이터베이스 조회
 */
export function getAllDatabases(): DatabaseType[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM databases ORDER BY created_at DESC')
  const databases = stmt.all() as DatabaseType[]

  // 비밀번호 복호화
  return databases.map((database) => ({
    ...database,
    password: decrypt(database.password)
  }))
}

/**
 * ID로 데이터베이스 조회
 */
export function getDatabaseById(id: number): DatabaseType | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM databases WHERE id = ?')
  const database = stmt.get(id) as DatabaseType | undefined

  // 비밀번호 복호화
  if (database) {
    return {
      ...database,
      password: decrypt(database.password)
    }
  }
  return undefined
}

/**
 * 프로젝트 ID로 데이터베이스 목록 조회
 */
export function getDatabasesByProjectId(projectId: number): DatabaseType[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM databases WHERE project_id = ? ORDER BY created_at DESC')
  const databases = stmt.all(projectId) as DatabaseType[]

  // 비밀번호 복호화
  return databases.map((database) => ({
    ...database,
    password: decrypt(database.password)
  }))
}

/**
 * 프로젝트 ID로 데이터베이스 조회
 */
export function getDatabaseByProjectId(projectId: number): DatabaseType | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM databases WHERE project_id = ? LIMIT 1')
  const database = stmt.get(projectId) as DatabaseType | undefined

  if (!database) return undefined

  // 비밀번호 복호화
  return {
    ...database,
    password: decrypt(database.password)
  }
}

/**
 * 새 데이터베이스 추가
 */
export function createDatabase(data: DatabaseInput): DatabaseType {
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  // 비밀번호 암호화
  const encryptedPassword = encrypt(data.password)

  const stmt = db.prepare(`
    INSERT INTO databases (project_id, dbms_id, url, username, password, database_name, created_at, updated_at, connected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    data.project_id,
    data.dbms_id,
    data.url,
    data.username,
    encryptedPassword,
    data.database_name,
    now,
    now,
    now
  )

  return getDatabaseById(result.lastInsertRowid as number)!
}

/**
 * 데이터베이스 수정
 */
export function updateDatabase(data: DatabaseUpdate): DatabaseType | undefined {
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const updates: string[] = []
  const values: (string | number)[] = []

  if (data.project_id !== undefined) {
    updates.push('project_id = ?')
    values.push(data.project_id)
  }

  if (data.dbms_id !== undefined) {
    updates.push('dbms_id = ?')
    values.push(data.dbms_id)
  }

  if (data.url !== undefined) {
    updates.push('url = ?')
    values.push(data.url)
  }

  if (data.username !== undefined) {
    updates.push('username = ?')
    values.push(data.username)
  }

  if (data.password !== undefined) {
    updates.push('password = ?')
    // 비밀번호 암호화
    values.push(encrypt(data.password))
  }

  if (data.database_name !== undefined) {
    updates.push('database_name = ?')
    values.push(data.database_name)
  }

  if (data.connected_at !== undefined) {
    updates.push('connected_at = ?')
    values.push(data.connected_at)
  }

  if (updates.length === 0) {
    return getDatabaseById(data.id)
  }

  updates.push('updated_at = ?')
  values.push(now)
  values.push(data.id)

  const stmt = db.prepare(`
    UPDATE databases
    SET ${updates.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...values)

  return getDatabaseById(data.id)
}

/**
 * 데이터베이스 삭제
 */
export function deleteDatabase(id: number): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM databases WHERE id = ?')
  const result = stmt.run(id)

  return result.changes > 0
}

/**
 * 데이터베이스 연결 시간 업데이트
 */
export function updateDatabaseConnectedAt(id: number): DatabaseType | undefined {
  const now = Math.floor(Date.now() / 1000)
  return updateDatabase({ id, connected_at: now })
}
