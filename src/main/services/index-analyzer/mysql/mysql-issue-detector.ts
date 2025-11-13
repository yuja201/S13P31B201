import type { IndexIssue } from '../../../database/types'

interface IndexColumn {
  table_name: string
  column_name: string
  seq_in_index: number
  cardinality?: number | null
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
          suggestedSQL: `ALTER TABLE ${columns1[0].table_name} DROP INDEX ${indexName1};`
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
          suggestedSQL: `ALTER TABLE ${columns1[0].table_name} DROP INDEX ${indexName1};`
        })
      } else if (columnsStr1.startsWith(columnsStr2 + ',')) {
        issues.push({
          severity: 'recommended',
          category: 'redundant',
          description: `인덱스 '${indexName2}'는 '${indexName1}'에 의해 중복됩니다`,
          recommendation: `'${indexName2}' 삭제를 고려해보세요.`,
          relatedIndexName: indexName1,
          suggestedSQL: `ALTER TABLE ${columns2[0].table_name} DROP INDEX ${indexName2};`
        })
      }
    }
  }

  return issues
}

/**
 * 낮은 선택도 인덱스 탐지
 */
export function detectLowSelectivity(
  indexName: string,
  _tableName: string,
  columns: IndexColumn[],
  tableRows: number
): IndexIssue | null {
  // 복합 인덱스의 첫 번째 컬럼만 체크
  const firstColumn = columns.find((c) => c.seq_in_index === 1)
  if (!firstColumn || firstColumn.cardinality == null || tableRows === 0) {
    return null
  }

  const selectivity = (firstColumn.cardinality / tableRows) * 100

  if (selectivity < 5) {
    return {
      severity: 'critical',
      category: 'low_selectivity',
      description: `인덱스 '${indexName}'의 선택도가 매우 낮습니다 (${selectivity.toFixed(2)}%)`,
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
 * 외래키 인덱스 누락 탐지
 */
export function detectMissingFkIndexes(
  foreignKeys: Array<{
    table_name: string
    column_name: string
    constraint_name: string
    ordinal_position: number
  }>,
  indexes: Map<string, Map<string, IndexColumn[]>>
): IndexIssue[] {
  const issues: IndexIssue[] = []

  // 제약조건별로 FK 컬럼들을 그룹화
  const fkByConstraint = new Map<
    string,
    Array<{ table_name: string; column_name: string; ordinal_position: number }>
  >()

  for (const fk of foreignKeys) {
    const key = `${fk.table_name}.${fk.constraint_name}`
    if (!fkByConstraint.has(key)) {
      fkByConstraint.set(key, [])
    }
    fkByConstraint.get(key)!.push(fk)
  }

  // 각 제약조건별로 검사
  for (const [, fkColumns] of fkByConstraint) {
    const tablename = fkColumns[0].table_name
    const tableIndexes = indexes.get(tablename)
    if (!tableIndexes) continue

    // FK 컬럼을 ordinal_position 순으로 정렬
    const sortedFkColumns = [...fkColumns].sort((a, b) => a.ordinal_position - b.ordinal_position)
    const fkColumnNames = sortedFkColumns.map((col) => col.column_name)

    // 인덱스 prefix가 FK 컬럼 시퀀스를 모두 포함하는지 확인
    let hasIndex = false
    for (const [, columns] of tableIndexes) {
      const orderedColumns = [...columns].sort((a, b) => a.seq_in_index - b.seq_in_index)
      const indexColumnNames = orderedColumns.map((c) => c.column_name)

      // 인덱스의 prefix가 FK 컬럼 시퀀스와 일치하는지 확인
      if (fkColumnNames.every((fkCol, idx) => indexColumnNames[idx] === fkCol)) {
        hasIndex = true
        break
      }
    }

    if (!hasIndex) {
      const columnList = fkColumnNames.join(', ')
      const indexSuffix = fkColumnNames.join('_')
      issues.push({
        severity: 'critical',
        category: 'missing_fk_index',
        description: `외래키 컬럼 '${tablename}.${columnList}'에 인덱스가 없습니다.`,
        recommendation: `외래키 컬럼에 인덱스를 추가해보세요.`,
        impact: 'DELETE/UPDATE 시 참조 테이블 전체 스캔 발생 가능',
        suggestedSQL: `ALTER TABLE ${tablename} ADD INDEX idx_${tablename}_${indexSuffix} (${columnList});`
      })
    }
  }

  return issues
}

/**
 * 복합 인덱스 컬럼 순서 문제 탐지
 */
export function detectColumnOrderIssues(
  indexName: string,
  _tableName: string,
  columns: IndexColumn[],
  tableRows: number
): IndexIssue | null {
  // 복합 인덱스만 체크
  if (columns.length < 2) return null

  const firstColumn = columns.find((c) => c.seq_in_index === 1)
  if (!firstColumn || tableRows === 0) {
    return null
  }

  const cardinality = firstColumn.cardinality ?? 0
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
 * 과도하게 큰 인덱스 탐지
 */
export function detectOversizedIndexes(
  tableName: string,
  dataLength: number,
  indexLength: number
): IndexIssue | null {
  if (dataLength === 0 || indexLength === 0) return null

  const indexToDataRatio = (indexLength / dataLength) * 100

  if (indexLength > dataLength * 1.5) {
    return {
      severity: 'recommended',
      category: 'oversized',
      description: `테이블 '${tableName}'의 인덱스 크기가 데이터 크기보다 큽니다.`,
      recommendation: `불필요한 인덱스를 삭제하거나, 인덱스 prefix 길이를 줄이는 것을 고려해보세요.`,
      metrics: {
        sizeMB: parseFloat((indexLength / 1024 / 1024).toFixed(2))
      },
      impact: `인덱스 크기: ${(indexLength / 1024 / 1024).toFixed(2)}MB, 데이터 크기: ${(dataLength / 1024 / 1024).toFixed(2)}MB (${indexToDataRatio.toFixed(1)}%)`
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
  columnTypes: Map<string, { data_type: string; column_type: string }>
): IndexIssue[] {
  const issues: IndexIssue[] = []

  for (const col of columns) {
    const typeInfo = columnTypes.get(`${tableName}.${col.column_name}`)
    if (!typeInfo) continue

    const { data_type } = typeInfo

    // TEXT/BLOB 타입에 전체 인덱스
    if (
      ['TEXT', 'BLOB', 'MEDIUMTEXT', 'LONGTEXT', 'MEDIUMBLOB', 'LONGBLOB'].includes(
        data_type.toUpperCase()
      )
    ) {
      issues.push({
        severity: 'recommended',
        category: 'inappropriate_type',
        description: `인덱스 '${indexName}'가 대형 컬럼 타입(${data_type})에 적용되었습니다.`,
        recommendation: `prefix 인덱스를 사용하는 것을 고려해보세요.`,
        suggestedSQL: `ALTER TABLE ${tableName} DROP INDEX ${indexName}, ADD INDEX ${indexName} (${col.column_name}(255));`
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
  indexCount: number
): IndexIssue | null {
  // 100만 행 이상인데 PRIMARY만 있거나 인덱스가 없는 경우
  if (tableRows > 1000000 && indexCount <= 1) {
    return {
      severity: 'critical',
      category: 'underindexed_table',
      description: `대형 테이블 '${tableName}'에 인덱스가 부족합니다. (행: ${tableRows.toLocaleString()}, 인덱스: ${indexCount}개)`,
      recommendation: `자주 사용되는 WHERE, JOIN 조건의 컬럼에 인덱스를 추가해보세요.`,
      impact: '쿼리 성능 저하 가능성'
    }
  }

  // 50만 행 이상인데 인덱스가 2개 이하
  if (tableRows > 500000 && indexCount <= 2) {
    return {
      severity: 'recommended',
      category: 'underindexed_table',
      description: `대형 테이블 '${tableName}'에 인덱스가 적습니다. (행: ${tableRows.toLocaleString()}, 인덱스: ${indexCount}개)`,
      recommendation: `쿼리 패턴을 분석하고 필요한 인덱스를 추가하는 것을 고려해보세요.`
    }
  }

  return null
}
