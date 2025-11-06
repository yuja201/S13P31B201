import { getDatabase } from './index'
import type { Project, ProjectInput, ProjectUpdate } from './types'

/**
 * 전체 프로젝트 조회
 */
export function getAllProjects(): Project[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC')
  return stmt.all() as Project[]
}

/**
 * ID로 프로젝트 조회
 */
export function getProjectById(id: number): Project | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?')
  return stmt.get(id) as Project | undefined
}

/**
 * 새 프로젝트 생성
 */
export function createProject(data: ProjectInput): Project {
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const stmt = db.prepare(`
    INSERT INTO projects (name, description, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `)

  const result = stmt.run(data.name, data.description, now, now)

  return getProjectById(result.lastInsertRowid as number)!
}

/**
 * 프로젝트 수정
 */
export function updateProject(data: ProjectUpdate): Project | undefined {
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const updates: string[] = []
  const values: (string | number)[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }

  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description)
  }

  if (updates.length === 0) {
    return getProjectById(data.id)
  }

  updates.push('updated_at = ?')
  values.push(now)
  values.push(data.id)

  const stmt = db.prepare(`
    UPDATE projects
    SET ${updates.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...values)

  return getProjectById(data.id)
}

/**
 * 프로젝트 수정 시간 갱신
 */
export function updateProjectUpdatedAt(id: number): Project | undefined {
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const stmt = db.prepare(`
    UPDATE projects
    SET updated_at = ?
    WHERE id = ?
  `)

  stmt.run(now, id)

  return getProjectById(id)
}

/**
 * 프로젝트 삭제
 */
export function deleteProject(id: number): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?')
  const result = stmt.run(id)

  return result.changes > 0
}
