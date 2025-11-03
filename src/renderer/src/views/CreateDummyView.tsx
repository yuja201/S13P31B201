import React, { useEffect, useState, useMemo } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import DBTableList from '@renderer/components/DBTableList'
import DBTableDetail from '@renderer/components/DBTableDetail'
import { useSchemaStore } from '@renderer/stores/schemaStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import type { Table, Column } from '@main/database/types'

// 컬럼 상세 정보 타입
export type ColumnDetail = {
  name: string
  type: string
  constraints: string[]
  generation: string
  setting: string
}

// 테이블 전체 정보 타입
export type TableInfo = {
  id: string
  name: string
  columns: number
  rows: number
  columnDetails: ColumnDetail[]
}

// Store의 Column 타입을 View의 ColumnDetail 타입으로 변환
const convertColumn = (col: Column): ColumnDetail => {
  const constraints: string[] = []
  if (col.isPrimaryKey) constraints.push('PK')
  if (col.isForeignKey) constraints.push('FK')
  if (col.notNull) constraints.push('NOT NULL')
  if (col.unique) constraints.push('UNIQUE')
  if (col.autoIncrement) constraints.push('AUTO INCREMENT')
  if (col.default) constraints.push('DEFAULT')
  // TODO: 'CHECK', 'DOMAIN', 'ENUM' 등은 store의 Column 타입에 추가 필요

  return {
    name: col.name,
    type: col.type,
    constraints: constraints,
    generation: '',
    setting: ''
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
        columnDetails: table.columns.map(convertColumn)
      })
    )
  }, [schemasMap, selectedProject])

  const [focusedTable, setFocusedTable] = useState<TableInfo | null>(null)

  useEffect(() => {
    if (tables.length > 0 && !focusedTable) {
      setFocusedTable(tables[0])
    } else if (tables.length > 0 && focusedTable) {
      const stillExists = tables.find((t) => t.id === focusedTable.id)
      if (!stillExists) {
        setFocusedTable(tables[0])
      }
    } else if (tables.length === 0) {
      setFocusedTable(null)
    }
  }, [tables, focusedTable])

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
            onTableSelect={(table) => setFocusedTable(table)}
          />
          {focusedTable && <DBTableDetail table={focusedTable} />}
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
