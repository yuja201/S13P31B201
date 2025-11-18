import { getDatabase } from './index'
import type { DomainRow, DomainCategoryRow } from './types'

/**
 * logicalType에 따라 도메인 목록 조회
 */
export function getDomainsByLogicalType(logicalType: string): DomainCategoryRow[] {
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT 
      d.id,
      d.name,
      d.description,
      d.logical_type,
      d.category_id,
      d.locales,
      c.name AS category_name
    FROM domains d
    LEFT JOIN domain_categories c ON d.category_id = c.id
    WHERE d.logical_type = ?
    ORDER BY c.id, d.id
  `)

  const rows = stmt.all(logicalType) as DomainRow[]

  const parsed = rows.map((row) => ({
    ...row,
    locales: JSON.parse(row.locales)
  }))

  return groupByCategory(parsed)
}

/**
 * 모든 도메인 조회
 */
export function getAllDomains(): DomainCategoryRow[] {
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT 
      d.id,
      d.name,
      d.description,
      d.logical_type,
      d.category_id,
      d.locales,
      c.name AS category_name
    FROM domains d
    LEFT JOIN domain_categories c ON d.category_id = c.id
    ORDER BY c.id, d.id
  `)

  const rows = stmt.all() as DomainRow[]

  const parsed = rows.map((row) => ({
    ...row,
    locales: JSON.parse(row.locales)
  }))

  return groupByCategory(parsed)
}

/**
 * 내부 유틸 - category별로 그룹화
 */
function groupByCategory(rows: DomainRow[]): DomainCategoryRow[] {
  const grouped: Record<string, DomainCategoryRow> = {}

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
