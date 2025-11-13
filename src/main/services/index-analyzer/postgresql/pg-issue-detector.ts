import type { IndexIssue } from '../../../database/types'

interface IndexColumn {
  column_name: string
  column_position: number
  index_type?: string
}

/**
 * 미사용 인덱스 탐지
 */
export function detectUnusedIndexes(
  indexName: string,
  _tableName: string,
  scanCount: number,
  indexSizeBytes: number
): IndexIssue | null {
  if (scanCount === 0 && indexSizeBytes > 0) {
    const sizeMB = indexSizeBytes / 1024 / 1024
    return {
      severity: 'critical',
      category: 'unused',
      description: `인덱스 '${indexName}'가 한 번도 사용되지 않았습니다.`,
      recommendation: `삭제를 고려해보세요. (${sizeMB.toFixed(2)}MB 절약 가능)`,
      impact: '미사용 인덱스는 INSERT/UPDATE 성능을 저하시키고 저장 공간을 낭비합니다.',
      metrics: {
        scanCount: 0,
        sizeMB: parseFloat(sizeMB.toFixed(2)),
        potentialSavingsMB: parseFloat(sizeMB.toFixed(2))
      },
      suggestedSQL: `DROP INDEX IF EXISTS ${indexName};`
    }
  }

  return null
}

/**
 * 인덱스 bloat 탐지
 */
export function detectIndexBloat(
  indexName: string,
  _tableName: string,
  bloatRatio: number,
  indexSizeBytes: number
): IndexIssue | null {
  if (bloatRatio > 30) {
    const sizeMB = indexSizeBytes / 1024 / 1024
    const bloatMB = (sizeMB * bloatRatio) / 100

    return {
      severity: bloatRatio > 50 ? 'critical' : 'recommended',
      category: 'bloated',
      description: `인덱스 '${indexName}'에 bloat가 ${bloatRatio.toFixed(1)}% 발생했습니다.`,
      recommendation: `REINDEX를 실행하여 bloat를 제거하세요.`,
      impact: `약 ${bloatMB.toFixed(2)}MB의 공간 낭비`,
      metrics: {
        bloatRatio: parseFloat(bloatRatio.toFixed(2)),
        sizeMB: parseFloat(sizeMB.toFixed(2)),
        potentialSavingsMB: parseFloat(bloatMB.toFixed(2))
      },
      suggestedSQL: `REINDEX INDEX ${indexName};`
    }
  }

  return null
}

/**
 * 낮은 선택도 인덱스 탐지
 */
export function detectLowSelectivity(
  indexName: string,
  _tableName: string,
  columns: IndexColumn[],
  tableRows: number,
  nDistinct?: number | null
): IndexIssue | null {
  if (tableRows === 0) return null

  // 복합 인덱스의 첫 번째 컬럼만 체크
  const firstColumn = columns.find((c) => c.column_position === 1)
  if (!firstColumn) return null

  // n_distinct가 없다면 사용 불가
  if (!nDistinct) return null

  // n_distinct가 음수면 비율(예: -0.5 = 50% unique), 양수면 절대값
  const cardinality = nDistinct < 0 ? Math.abs(nDistinct) * tableRows : nDistinct

  const selectivity = (cardinality / tableRows) * 100

  if (selectivity < 5) {
    return {
      severity: 'critical',
      category: 'low_selectivity',
      description: `인덱스 '${indexName}'의 선택도가 매우 낮습니다. (${selectivity.toFixed(2)}%)`,
      recommendation:
        selectivity < 1
          ? `이 인덱스는 효과가 거의 없을 수 있습니다. 삭제를 고려하거나 복합 인덱스로 변경해보세요.`
          : `선택도를 높이기 위해 다른 컬럼과 복합 인덱스로 변경을 고려해보세요.`,
      metrics: {
        selectivity: parseFloat(selectivity.toFixed(2))
      }
    }
  } else if (selectivity < 20) {
    return {
      severity: 'recommended',
      category: 'low_selectivity',
      description: `인덱스 '${indexName}'의 선택도가 낮습니다. (${selectivity.toFixed(2)}%)`,
      recommendation: `쿼리 패턴을 확인하고, 필요시 다른 컬럼과 복합 인덱스로 변경을 고려해보세요.`,
      metrics: {
        selectivity: parseFloat(selectivity.toFixed(2))
      }
    }
  }

  return null
}

/**
 * 복합 인덱스 컬럼 순서 문제 탐지
 */
export function detectColumnOrderIssues(
  indexName: string,
  _tableName: string,
  columns: IndexColumn[],
  tableRows: number,
  nDistinct?: number | null
): IndexIssue | null {
  // 복합 인덱스만 체크
  if (columns.length < 2) return null

  const firstColumn = columns.find((c) => c.column_position === 1)
  if (!firstColumn || !nDistinct || tableRows === 0) {
    return null
  }

  // n_distinct로 선택도 계산
  const cardinality = nDistinct < 0 ? Math.abs(nDistinct) * tableRows : nDistinct
  const firstSelectivity = (cardinality / tableRows) * 100

  // 첫 번째 컬럼의 선택도가 낮으면 경고
  if (firstSelectivity < 20) {
    const columnNames = columns.map((c) => c.column_name).join(', ')
    return {
      severity: 'recommended',
      category: 'column_order',
      description: `복합 인덱스 '${indexName}'의 첫 번째 컬럼 선택도가 낮습니다. (${firstSelectivity.toFixed(2)}%)`,
      recommendation: `선택도가 높은 컬럼을 앞쪽에 배치하면 성능이 향상될 수 있습니다.`,
      impact: `현재 컬럼 순서: ${columnNames}`,
      metrics: {
        selectivity: parseFloat(firstSelectivity.toFixed(2))
      }
    }
  }

  return null
}

/**
 * 중복 인덱스 탐지
 */
export function detectRedundantIndexes(indexes: Map<string, IndexColumn[]>): IndexIssue[] {
  const issues: IndexIssue[] = []
  const indexArray = Array.from(indexes.entries())

  for (let i = 0; i < indexArray.length; i++) {
    const [indexName1, columns1] = indexArray[i]
    const columnsStr1 = columns1.map((c) => c.column_name).join(',')

    for (let j = i + 1; j < indexArray.length; j++) {
      const [indexName2, columns2] = indexArray[j]
      const columnsStr2 = columns2.map((c) => c.column_name).join(',')

      // 완전 중복 (동일한 컬럼 순서)
      if (columnsStr1 === columnsStr2) {
        issues.push({
          severity: 'critical',
          category: 'redundant',
          description: `인덱스 '${indexName1}'와 '${indexName2}'가 완전히 동일합니다.`,
          recommendation: `UNIQUE 또는 PRIMARY가 아닌 인덱스 삭제를 추천해요.`,
          relatedIndexName: indexName2,
          suggestedSQL: `DROP INDEX IF EXISTS ${indexName1};`
        })
      }
      // 부분 중복 (한 인덱스가 다른 인덱스의 prefix)
      else if (columnsStr2.startsWith(columnsStr1 + ',')) {
        issues.push({
          severity: 'recommended',
          category: 'redundant',
          description: `인덱스 '${indexName1}'는 '${indexName2}'에 의해 중복됩니다.`,
          recommendation: `'${indexName1}' 삭제를 고려해보세요.`,
          relatedIndexName: indexName2,
          suggestedSQL: `DROP INDEX IF EXISTS ${indexName1};`
        })
      } else if (columnsStr1.startsWith(columnsStr2 + ',')) {
        issues.push({
          severity: 'recommended',
          category: 'redundant',
          description: `인덱스 '${indexName2}'는 '${indexName1}'에 의해 중복됩니다`,
          recommendation: `'${indexName2}' 삭제를 고려해보세요.`,
          relatedIndexName: indexName1,
          suggestedSQL: `DROP INDEX IF EXISTS ${indexName2};`
        })
      }
    }
  }

  return issues
}

/**
 * 외래키 인덱스 누락 탐지
 */
export function detectMissingFkIndexes(
  foreignKeys: Array<{ tablename: string; column_name: string; constraint_name: string }>,
  indexes: Map<string, Map<string, IndexColumn[]>>
): IndexIssue[] {
  const issues: IndexIssue[] = []

  for (const fk of foreignKeys) {
    const tableIndexes = indexes.get(fk.tablename)
    if (!tableIndexes) continue

    // FK 컬럼이 어떤 인덱스의 첫 번째 컬럼으로 포함되어 있는지 확인
    let hasIndex = false
    for (const [, columns] of tableIndexes) {
      const firstColumn = columns.find((c) => c.column_position === 1)
      if (firstColumn && firstColumn.column_name === fk.column_name) {
        hasIndex = true
        break
      }
    }

    if (!hasIndex) {
      issues.push({
        severity: 'critical',
        category: 'missing_fk_index',
        description: `외래키 컬럼 '${fk.tablename}.${fk.column_name}'에 인덱스가 없습니다.`,
        recommendation: `외래키 컬럼에 인덱스를 추가해보세요.`,
        impact: 'DELETE/UPDATE 시 참조 테이블 전체 스캔 발생 가능',
        suggestedSQL: `CREATE INDEX idx_${fk.tablename}_${fk.column_name} ON ${fk.tablename} (${fk.column_name});`
      })
    }
  }

  return issues
}

/**
 * 과도하게 큰 인덱스 탐지
 */
export function detectOversizedIndexes(
  tableName: string,
  tableSizeBytes: number,
  totalIndexSizeBytes: number
): IndexIssue | null {
  if (tableSizeBytes === 0 || totalIndexSizeBytes === 0) return null

  const indexToDataRatio = (totalIndexSizeBytes / tableSizeBytes) * 100

  if (totalIndexSizeBytes > tableSizeBytes * 1.5) {
    return {
      severity: 'recommended',
      category: 'oversized',
      description: `테이블 '${tableName}'의 인덱스 크기가 테이블 크기보다 큽니다.`,
      recommendation: `불필요한 인덱스를 삭제하거나, 인덱스 bloat를 확인해보세요.`,
      metrics: {
        sizeMB: parseFloat((totalIndexSizeBytes / 1024 / 1024).toFixed(2))
      },
      impact: `인덱스 크기: ${(totalIndexSizeBytes / 1024 / 1024).toFixed(2)}MB, 테이블 크기: ${(tableSizeBytes / 1024 / 1024).toFixed(2)}MB (${indexToDataRatio.toFixed(1)}%)`
    }
  }

  return null
}

/**
 * 부적절한 컬럼 타입에 인덱스 탐지
 */
export function detectInappropriateTypeIndexes(
  indexName: string,
  tableName: string,
  columns: IndexColumn[],
  columnTypes: Map<string, { data_type: string; udt_name: string }>
): IndexIssue[] {
  const issues: IndexIssue[] = []

  for (const col of columns) {
    const typeInfo = columnTypes.get(`${tableName}.${col.column_name}`)
    if (!typeInfo) continue

    const { data_type } = typeInfo

    // TEXT 타입에 B-tree 인덱스
    if (data_type === 'text' && col.index_type === 'btree') {
      issues.push({
        severity: 'recommended',
        category: 'inappropriate_type',
        description: `인덱스 '${indexName}'가 TEXT 타입에 B-tree를 사용합니다.`,
        recommendation: `GIN 또는 GiST 인덱스를 도입을 고려해보세요.`,
        suggestedSQL: `CREATE INDEX ${indexName}_gin ON ${tableName} USING GIN (to_tsvector('english', ${col.column_name}));`
      })
    }
  }

  return issues
}

/**
 * 대형 테이블 인덱스 부족 탐지
 */
export function detectUnderindexedTables(
  tableName: string,
  tableRows: number,
  indexCount: number,
  seqScan: number,
  idxScan: number
): IndexIssue | null {
  // 100만 행 이상인데 PRIMARY만 있거나 인덱스가 없는 경우
  if (tableRows > 1000000 && indexCount <= 1) {
    return {
      severity: 'critical',
      category: 'underindexed_table',
      description: `대형 테이블 '${tableName}'에 인덱스가 부족합니다. (행: ${tableRows.toLocaleString()}, 인덱스: ${indexCount}개)`,
      recommendation: `자주 사용되는 WHERE, JOIN 조건의 컬럼에 인덱스를 추가해보세요.`,
      impact: `Sequential Scan: ${seqScan.toLocaleString()}회, Index Scan: ${idxScan.toLocaleString()}회`
    }
  }

  // Sequential scan이 Index scan보다 훨씬 많은 경우
  if (tableRows > 100000 && seqScan > idxScan * 2) {
    return {
      severity: 'recommended',
      category: 'underindexed_table',
      description: `테이블 '${tableName}'에서 Sequential Scan이 많이 발생합니다.`,
      recommendation: `자주 조회되는 컬럼에 인덱스 추가를 고려헤보세요.`,
      impact: `Sequential Scan: ${seqScan.toLocaleString()}회, Index Scan: ${idxScan.toLocaleString()}회`
    }
  }

  return null
}
