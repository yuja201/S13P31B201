import { getDatabase } from './index'
import type { Domain, DomainCategory } from './types'

/**
 * logicalType에 따라 도메인 목록 조회
 */
export function getDomainsByLogicalType(logicalType: string): DomainCategory[] {
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT 
      d.id,
      d.name,
      d.description,
      d.logical_type,
      d.category_id,
      c.name AS category_name
    FROM domains d
    LEFT JOIN domain_categories c ON d.category_id = c.id
    WHERE d.logical_type = ?
    ORDER BY c.id, d.id
  `)

  const rows = stmt.all(logicalType) as Domain[]

  return groupByCategory(rows)
}

/**
 * 모든 도메인 조회
 */
export function getAllDomains(): DomainCategory[] {
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT 
      d.id,
      d.name,
      d.description,
      d.logical_type,
      d.category_id,
      c.name AS category_name
    FROM domains d
    LEFT JOIN domain_categories c ON d.category_id = c.id
    ORDER BY c.id, d.id
  `)

  const rows = stmt.all() as Domain[]
  return groupByCategory(rows)
}

/**
 * 단일 도메인 조회
 */
export function getDomainById(domainId: number): Domain | undefined {
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT 
      d.id,
      d.name,
      d.description,
      d.logical_type,
      d.category_id,
      c.name AS category_name
    FROM domains d
    LEFT JOIN domain_categories c ON d.category_id = c.id
    WHERE d.id = ?
  `)

  return stmt.get(domainId) as Domain | undefined
}

/**
 * 내부 유틸 - category별로 그룹화
 */
function groupByCategory(rows: Domain[]): DomainCategory[] {
  const grouped: Record<string, DomainCategory> = {}

  for (const d of rows) {
    if (!grouped[d.category_name]) {
      grouped[d.category_name] = {
        category: d.category_name,
        items: []
      }
    }
    grouped[d.category_name].items.push(d)
  }

  return Object.values(grouped)
}
