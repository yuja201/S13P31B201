import type { Client } from 'pg'
import type { IndexAnalysisResult, IndexIssue } from '../../../database/types'
import {
  fetchIndexStatsWithUsage,
  fetchIndexDetails,
  fetchTableStats,
  fetchForeignKeys,
  fetchColumnStats
} from './pg-queries'
import {
  detectUnusedIndexes,
  detectLowSelectivity,
  detectColumnOrderIssues,
  detectRedundantIndexes,
  detectMissingFkIndexes,
  detectOversizedIndexes,
  detectUnderindexedTables
} from './pg-issue-detector'

export async function collectPostgreSQLIndexStats(
  client: Client,
  schemaName: string = 'public'
): Promise<IndexAnalysisResult[]> {
  // 1. 기본 데이터 수집
  const indexStats = await fetchIndexStatsWithUsage(client, schemaName)
  const indexDetails = await fetchIndexDetails(client, schemaName)
  const tableStats = await fetchTableStats(client, schemaName)
  const foreignKeys = await fetchForeignKeys(client, schemaName)
  const columnStats = await fetchColumnStats(client, schemaName)

  // 2. 데이터 구조화
  // 테이블별 통계 맵
  const tableStatsMap = new Map(tableStats.map((t) => [t.tablename, t]))
  // 인덱스별 통계 맵
  const indexStatsMap = new Map(indexStats.map((i) => [`${i.tablename}.${i.indexname}`, i]))

  interface IndexColumnWithDetails {
    schemaname: string
    tablename: string
    indexname: string
    column_name: string
    column_position: number
    is_unique: boolean
    is_primary: boolean
    index_type: string
  }

  // 테이블별 인덱스 그룹화
  const tableIndexesMap = new Map<string, Map<string, IndexColumnWithDetails[]>>()
  for (const row of indexDetails) {
    if (!tableIndexesMap.has(row.tablename)) {
      tableIndexesMap.set(row.tablename, new Map())
    }
    const tableIndexes = tableIndexesMap.get(row.tablename)!
    if (!tableIndexes.has(row.indexname)) {
      tableIndexes.set(row.indexname, [])
    }
    tableIndexes.get(row.indexname)!.push(row)
  }

  // 컬럼 통계 맵
  const columnStatsMap = new Map(
    columnStats.map((c) => [`${c.tablename}.${c.column_name}`, c.n_distinct])
  )

  // 3. 각 인덱스별 분석
  const results: IndexAnalysisResult[] = []

  for (const [tableName, indexes] of tableIndexesMap) {
    const tableStat = tableStatsMap.get(tableName)
    const tableRows = tableStat?.n_live_tup || 0

    // 테이블 레벨 이슈 탐지
    const totalIndexSize = Array.from(indexes.keys()).reduce((sum, indexName) => {
      const stat = indexStatsMap.get(`${tableName}.${indexName}`)
      const size = stat?.index_size_bytes ?? 0
      return sum + size
    }, 0)

    const oversizedIssue = tableStat
      ? detectOversizedIndexes(tableName, tableStat.table_size_bytes, totalIndexSize)
      : null

    const underindexedIssue = detectUnderindexedTables(
      tableName,
      tableRows,
      indexes.size,
      tableStat?.seq_scan || 0,
      tableStat?.idx_scan || 0
    )

    // 중복 인덱스 탐지
    const redundantIssues = detectRedundantIndexes(indexes)

    for (const [indexName, columns] of indexes) {
      const issues: IndexIssue[] = []

      // PK는 분석 제외
      if (columns[0]?.is_primary) continue

      // 인덱스 통계 가져오기
      const stat = indexStatsMap.get(`${tableName}.${indexName}`)
      const scanCount = stat?.idx_scan || 0
      const indexSizeBytes = stat?.index_size_bytes ?? 0

      // 미사용 인덱스 탐지
      const unusedIssue = detectUnusedIndexes(indexName, tableName, scanCount, indexSizeBytes)
      if (unusedIssue) issues.push(unusedIssue)

      // 낮은 선택도 탐지
      const firstColumn = columns.find((c) => c.column_position === 1)
      const nDistinct = firstColumn
        ? columnStatsMap.get(`${tableName}.${firstColumn.column_name}`)
        : undefined
      const selectivityIssue = detectLowSelectivity(
        indexName,
        tableName,
        columns,
        tableRows,
        nDistinct
      )
      if (selectivityIssue) issues.push(selectivityIssue)

      // 복합 인덱스 컬럼 순서 이슈
      const columnOrderIssue = detectColumnOrderIssues(
        indexName,
        tableName,
        columns,
        tableRows,
        nDistinct
      )
      if (columnOrderIssue) issues.push(columnOrderIssue)

      // 이 인덱스와 관련된 중복 이슈 찾기
      const relatedRedundantIssues = redundantIssues.filter((issue) =>
        issue.description.includes(indexName)
      )
      issues.push(...relatedRedundantIssues)

      // 테이블 레벨 이슈는 첫 번째 인덱스에만 추가
      if (Array.from(indexes.keys())[0] === indexName) {
        if (oversizedIssue) issues.push(oversizedIssue)
        if (underindexedIssue) issues.push(underindexedIssue)
      }

      results.push({
        indexName,
        tableName,
        schema: schemaName,
        columns: columns.map((c) => c.column_name),
        isUnique: columns[0]?.is_unique || false,
        isPrimary: columns[0]?.is_primary || false,
        indexType: columns[0]?.index_type || 'btree',
        issues,
        tableRows,
        scanCount: stat?.idx_scan,
        tuplesRead: stat?.idx_tup_read,
        tuplesFetched: stat?.idx_tup_fetch,
        indexSizeBytes: stat?.index_size_bytes,
        dbmsType: 'postgresql',
        statsAvailable: {
          usageStats: true,
          sizeStats: true
        }
      })
    }
  }

  // 4. FK 인덱스 누락 이슈
  const missingFkIssues = detectMissingFkIndexes(foreignKeys, tableIndexesMap)

  // FK 누락 이슈는 해당 테이블의 첫 번째 인덱스에 추가
  for (const issue of missingFkIssues) {
    const description = issue.description
    const match = description.match(/외래키 컬럼 '(.+?)\.(.+?)'/)
    if (match) {
      const tableName = match[1]
      const result = results.find((r) => r.tableName === tableName)
      if (result) {
        result.issues.push(issue)
      }
    }
  }

  return results
}
