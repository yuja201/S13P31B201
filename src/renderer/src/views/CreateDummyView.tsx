import React, { useEffect, useState, useMemo } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import DBTableList from '@renderer/components/DBTableList'
import DBTableDetail from '@renderer/components/DBTableDetail'
import { useSchemaStore } from '@renderer/stores/schemaStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import type { Table, Column } from '@main/database/types'
import { useNavigate, useParams } from 'react-router-dom'
import { useGenerationStore } from '@renderer/stores/generationStore'
import { validateTable } from '@renderer/utils/validateTable'
import type { TableGenerationConfig } from '@renderer/stores/generationStore'

// 컬럼 상세 정보 타입
export type ColumnDetail = {
  name: string
  type: string
  constraints: string[]
  generation: string
  setting: string
  defaultValue: string | null
  checkConstraint: string | null
  enumList: string[] | null
}

// 테이블 전체 정보 타입
export type TableInfo = {
  id: string
  name: string
  columns: number
  rows: number
  columnDetails: ColumnDetail[]
}

const convertColumn = (col: Column): ColumnDetail => {
  const constraints: string[] = []
  if (col.isPrimaryKey) constraints.push('PK')
  if (col.isForeignKey) constraints.push('FK')
  if (col.notNull) constraints.push('NOT NULL')
  if (col.unique) constraints.push('UNIQUE')
  if (col.autoIncrement) constraints.push('AUTO INCREMENT')
  if (col.default) constraints.push('DEFAULT')
  if (col.check) constraints.push('CHECK')
  if (col.enum) constraints.push('ENUM')
  if (col.domain) constraints.push('DOMAIN')

  let generation = ''
  let setting = ''

  if (col.autoIncrement) {
    generation = 'Auto Increment'
    setting = '자동 증가'
  } else if (col.default) {
    generation = '고정값'
    setting = col.default
  } else if (col.isForeignKey) {
    generation = '참조'
    setting = '테이블.컬럼'
  }

  return {
    name: col.name,
    type: col.type,
    constraints,
    generation,
    setting,
    defaultValue: col.default || null,
    checkConstraint: col.check || null,
    enumList: col.enum || null
  }
}

const CreateDummyView: React.FC = () => {
  const title = '더미데이터 생성'
  const description =
    '테이블을 선택하고 컬럼별 데이터 생성 방식을 설정하세요.\nAI, Faker.js, 파일 업로드, 직접 입력 중 원하는 방식으로 데이터를 생성하세요.'

  const selectedProject = useProjectStore((state) => state.selectedProject)
  const isLoading = useSchemaStore((state) => state.isLoading)
  const error = useSchemaStore((state) => state.error)
  const schemasMap = useSchemaStore((state) => state.schemas)

  const tables: TableInfo[] = useMemo(() => {
    const currentDatabaseId = selectedProject?.database?.id
    const schema = currentDatabaseId ? schemasMap.get(currentDatabaseId) : null
    const rawTables = schema?.tables || []

    return rawTables.map(
      (table: Table): TableInfo => ({
        id: table.name,
        name: table.name,
        columns: table.columns.length,
        rows: table.rowCount || 0,
        columnDetails: table.columns.map((col) => convertColumn(col))
      })
    )
  }, [schemasMap, selectedProject])

  const [focusedTable, setFocusedTable] = useState<TableInfo | null>(null)
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()

  const setColumnRule = useGenerationStore((s) => s.setColumnRule)
  const [isInitialized, setIsInitialized] = useState(false)
  const generationTables = useGenerationStore((s) => s.tables)

  const selectedTables = useGenerationStore((s) => s.selectedTables)
  const setSelectedTables = useGenerationStore((s) => s.setSelectedTables)

  useEffect(() => {
    if (!isInitialized && tables.length > 0) {
      tables.forEach((table) => {
        table.columnDetails.forEach((col) => {
          if (col.generation === '고정값') {
            setColumnRule(table.name, col.name, {
              columnName: col.name,
              dataSource: 'FIXED',
              metaData: { fixedValue: col.setting }
            })
          }
        })
      })

      setIsInitialized(true)
    }
  }, [tables, isInitialized, setColumnRule])

  // NOT NULL 컬럼 검증 로직
  const validationResults = useMemo(() => {
    return tables
      .filter((t) => selectedTables.has(t.name))
      .map((t) => ({
        table: t,
        ...validateTable(t, generationTables as Record<string, TableGenerationConfig>)
      }))
  }, [tables, selectedTables, generationTables])

  // 선택된 테이블이 없으면 false
  const hasSelectedTables = selectedTables.size > 0

  // 각 테이블에 최소 1개 이상 생성 규칙 존재하는지 확인
  const hasAnyRule = validationResults.some((v) => {
    const config = generationTables[v.table.name]
    return config && Object.keys(config.columns).length > 0
  })

  // 모든 테이블이 NOT NULL 조건 통과했는지 확인
  const allPass = validationResults.every((v) => v.isReady)

  let warningMessage = ''
  if (!hasSelectedTables) {
    warningMessage = '⚠️ 테이블을 1개 이상 선택해주세요.'
  } else if (!hasAnyRule) {
    warningMessage = '⚠️ 선택된 테이블에 생성 방식이 지정된 컬럼이 없습니다.'
  } else if (!allPass) {
    warningMessage = '⚠️ 필수 컬럼(NOT NULL)의 생성 방식이 지정되지 않았습니다.'
  }

  const allReady = hasSelectedTables && hasAnyRule && allPass
  const hasMissing = !!warningMessage

  // 체크박스 토글
  const handleToggleTable = (tableId: string, checked: boolean): void => {
    const prev = useGenerationStore.getState().selectedTables
    const next = new Set(prev)
    checked ? next.add(tableId) : next.delete(tableId)
    setSelectedTables(next)
  }

  const handleGenerateData = (): void => {
    if (selectedTables.size === 0) return
    if (!allReady) return // 불완전한 테이블 있으면 차단

    const payload = Array.from(selectedTables).map((name) => {
      const t = tables.find((tbl) => tbl.name === name)!
      return { id: t.id, name: t.name }
    })

    navigate(`/main/select-method/${projectId}`, { state: { tables: payload } })
  }

  useEffect(() => {
    if (tables.length > 0) {
      if (!focusedTable) {
        setFocusedTable(tables[0])
      } else {
        const stillExists = tables.find((t) => t.id === focusedTable.id)

        if (stillExists) {
          setFocusedTable(stillExists)
        } else {
          setFocusedTable(tables[0])
        }
      }
    } else {
      setFocusedTable(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables])

  const handleColumnUpdate = (columnName: string, generation: string, setting: string): void => {
    if (!focusedTable) return

    const newColumnDetails = focusedTable.columnDetails.map((col) => {
      if (col.name === columnName) {
        return { ...col, generation, setting }
      }
      return col
    })

    setFocusedTable({
      ...focusedTable,
      columnDetails: newColumnDetails
    })
  }

  if (isLoading) {
    return <div>스키마 로딩 중...</div>
  }
  if (error) {
    return <div>오류: {error}</div>
  }

  return (
    <>
      <div className="dummy-view-container">
        <PageTitle title={title} description={description} />
        <div className="dummy-content-wrapper">
          <DBTableList
            tables={tables}
            focusedTableId={focusedTable?.id || ''}
            selectedTables={selectedTables}
            handleCheckboxChange={handleToggleTable}
            onTableSelect={(table) => setFocusedTable({ ...table })}
          />
          {focusedTable && (
            <DBTableDetail
              table={focusedTable}
              onColumnUpdate={handleColumnUpdate}
              onGenerateData={handleGenerateData}
              isAllReady={allReady}
              hasMissing={hasMissing}
              warningMessage={warningMessage}
            />
          )}
        </div>
      </div>

      <style>{`
        .dummy-view-container{
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content:center;
        }
        .dummy-content-wrapper {
          display: flex;
          flex-direction: row;
          width: 100%;
          margin-top: 32px;
          flex-grow: 1;
          min-height: 0;
         }
      `}</style>
    </>
  )
}

export default CreateDummyView
