import { getDatabase } from './index'
import type { Rule, RuleInput, RuleUpdate } from './types'

/**
 * 전체 생성 규칙 조회
 */
export function getAllRules(): Rule[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM rules ORDER BY created_at DESC')
  return stmt.all() as Rule[]
}

/**
 * ID로 생성 규칙 조회
 */
export function getRuleById(id: number): Rule | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM rules WHERE id = ?')
  return stmt.get(id) as Rule | undefined
}

/**
 * 도메인으로 생성 규칙 목록 조회
 */
export function getRulesByDomain(domain: string): Rule[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM rules WHERE domain = ? ORDER BY created_at DESC')
  return stmt.all(domain) as Rule[]
}

/**
 * 새 생성 규칙 추가
 */
export function createRule(data: RuleInput): Rule {
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const stmt = db.prepare(`
    INSERT INTO rules (name, data_source, domain, model_id, prompt, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    data.name,
    data.data_source,
    data.domain,
    data.model_id ?? null,
    data.prompt ?? null,
    now,
    now
  )

  return getRuleById(result.lastInsertRowid as number)!
}

/**
 * 생성 규칙 수정
 */
export function updateRule(data: RuleUpdate): Rule | undefined {
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const updates: string[] = []
  const values: (string | number | null)[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }

  if (data.data_source !== undefined) {
    updates.push('data_source = ?')
    values.push(data.data_source)
  }

  if (data.domain !== undefined) {
    updates.push('domain = ?')
    values.push(data.domain)
  }

  if (data.model_id !== undefined) {
    updates.push('model_id = ?')
    values.push(data.model_id)
  }

  if (data.prompt !== undefined) {
    updates.push('prompt = ?')
    values.push(data.prompt)
  }

  if (updates.length === 0) {
    return getRuleById(data.id)
  }

  updates.push('updated_at = ?')
  values.push(now)
  values.push(data.id)

  const stmt = db.prepare(`
    UPDATE rules
    SET ${updates.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...values)

  return getRuleById(data.id)
}

/**
 * 생성 규칙 삭제
 */
export function deleteRule(id: number): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM rules WHERE id = ?')
  const result = stmt.run(id)

  return result.changes > 0
}
