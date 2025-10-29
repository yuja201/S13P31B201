import React from 'react'
import TableInfo from '@renderer/components/TableInfo'

interface Column {
  name: string
  type: string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  notNull?: boolean
  unique?: boolean
  check?: string
  autoIncrement?: boolean
  default?: string
  enum?: string[]
  domain?: string
}

interface Table {
  name: string
  rowCount: number
  columns: Column[]
}

interface TableInfoContainerProps {
  tables: Table[]
}

const TableInfoContainer: React.FC<TableInfoContainerProps> = ({ tables }) => {
  return (
    <>
      <style>
        {`
          .table-info-container-wrapper {
            display: flex;
            flex-direction: column;
          }

          .table-info-container-count {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1a1a1a;
          }

          .table-info-container-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
        `}
      </style>
      <div className="table-info-container-wrapper">
        <div className="table-info-container-count">테이블 {tables.length}개</div>
        <div className="table-info-container-list">
          {tables.map((table) => (
            <TableInfo key={table.name} table={table} />
          ))}
        </div>
      </div>
    </>
  )
}

export default TableInfoContainer
