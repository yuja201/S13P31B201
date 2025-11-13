import type { Connection } from 'mysql2/promise'
import type { IndexAnalysisResult, IndexIssue } from '../../../database/types'
import {
  fetchIndexBasicInfo,
  fetchTableStats,
  fetchForeignKeys,
  fetchColumnTypes
} from './mysql-queries'
import {
  detectRedundantIndexes,
  detectLowSelectivity,
  detectMissingFkIndexes,
  detectColumnOrderIssues,
  detectOversizedIndexes,
  detectInappropriateTypeIndexes,
  detectUnderindexedTables
} from './mysql-issue-detector'

export async function collectMySQLIndexStats(
  connection: Connection,
  databaseName: string
): Promise<IndexAnalysisResult[]> {
  // 1. 기본 데이터 수집
  const indexRows = await fetchIndexBasicInfo(connection, databaseName)
  const tableStats = await fetchTableStats(connection, databaseName)
  const foreignKeys = await fetchForeignKeys(connection, databaseName)
  const columnTypes = await fetchColumnTypes(connection, databaseName)

  // 2. 데이터 구조화
  // 테이블별 통계 맵
  const tableStatsMap = new Map(tableStats.map((t) => [t.table_name, t]))

  interface IndexColumnWithStats {
    table_name: string
    index_name: string
    column_name: string
    seq_in_index: number
    non_unique: number
    index_type: string
    cardinality: number | null
  }

  // 테이블별 인덱스 그룹화
  const tableIndexesMap = new Map<string, Map<string, IndexColumnWithStats[]>>()
  for (const row of indexRows) {
    if (!tableIndexesMap.has(row.table_name)) {
      tableIndexesMap.set(row.table_name, new Map())
    }
    const tableIndexes = tableIndexesMap.get(row.table_name)!
    if (!tableIndexes.has(row.index_name)) {
      tableIndexes.set(row.index_name, [])
    }
    tableIndexes.get(row.index_name)!.push(row)
  }

  // 컬럼 타입 맵
  const columnTypeMap = new Map(columnTypes.map((c) => [`${c.table_name}.${c.column_name}`, c]))

  // 3. 각 인덱스별 분석
  const results: IndexAnalysisResult[] = []

  for (const [tableName, indexes] of tableIndexesMap) {
    const tableStat = tableStatsMap.get(tableName)
    const tableRows = tableStat?.table_rows || 0

    // 테이블 레벨 이슈 탐지
    const oversizedIssue = tableStat
      ? detectOversizedIndexes(tableName, tableStat.data_length, tableStat.index_length)
      : null

    const underindexedIssue = detectUnderindexedTables(tableName, tableRows, indexes.size)

    // 중복 인덱스 탐지
    const redundantIssues = detectRedundantIndexes(indexes)

    for (const [indexName, columns] of indexes) {
      const firstColumn = columns[0]
      const issues: IndexIssue[] = []

      // PK는 분석 제외
      if (indexName === 'PRIMARY') continue

      // 선택도 이슈
      const selectivityIssue = detectLowSelectivity(indexName, tableName, columns, tableRows)
      if (selectivityIssue) issues.push(selectivityIssue)

      // 복합 인덱스 컬럼 순서 이슈
      const columnOrderIssue = detectColumnOrderIssues(indexName, tableName, columns, tableRows)
      if (columnOrderIssue) issues.push(columnOrderIssue)

      // 부적절한 타입 이슈
      const typeIssues = detectInappropriateTypeIndexes(
        indexName,
        tableName,
        columns,
        columnTypeMap
      )
      issues.push(...typeIssues)

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

      // 선택도 계산
      const cardinality = firstColumn.cardinality || 0
      const selectivity = tableRows > 0 ? (cardinality / tableRows) * 100 : 0

      results.push({
        indexName,
        tableName,
        schema: databaseName,
        columns: columns.map((c) => c.column_name),
        isUnique: firstColumn.non_unique === 0,
        isPrimary: indexName === 'PRIMARY',
        indexType: firstColumn.index_type,
        issues,
        cardinality,
        selectivity: parseFloat(selectivity.toFixed(2)),
        tableRows,
        tableIndexSizeBytes: tableStat?.index_length,
        dbmsType: 'mysql',
        statsAvailable: {
          usageStats: false,
          sizeStats: true,
          bloatStats: false
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
