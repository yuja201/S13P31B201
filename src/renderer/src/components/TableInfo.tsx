import React, { useState } from 'react'
import { MdChevronRight } from 'react-icons/md'
import { FaKey, FaLink } from 'react-icons/fa6'
import Label from '@renderer/components/Label'

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

interface TableInfoProps {
  table: Table
}

const TableInfo: React.FC<TableInfoProps> = ({ table }) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const toggleExpanded = (): void => {
    setIsExpanded((prev) => !prev)
  }

  const renderConstraints = (column: Column): React.ReactElement | null => {
    const constraints: React.ReactElement[] = []

    // PK, FK, NOT NULL, UNIQUE, CHECK, AUTO INCREMENT, DEFAULT, ENUM, DOMAIN
    if (column.isPrimaryKey) constraints.push(<Label key="pk" text="PK" />)
    if (column.isForeignKey) constraints.push(<Label key="fk" text="FK" />)
    if (column.notNull) constraints.push(<Label key="notnull" text="NOT NULL" />)
    if (column.unique) constraints.push(<Label key="unique" text="UNIQUE" />)
    if (column.check) constraints.push(<Label key="check" text={`CHECK: ${column.check}`} />)
    if (column.autoIncrement) constraints.push(<Label key="autoinc" text="AUTO INCREMENT" />)
    if (column.default)
      constraints.push(<Label key="default" text={`DEFAULT: ${column.default}`} />)
    if (column.enum) constraints.push(<Label key="enum" text={`ENUM: ${column.enum.join(', ')}`} />)
    if (column.domain) constraints.push(<Label key="domain" text={`DOMAIN: ${column.domain}`} />)

    return constraints.length > 0 ? (
      <div className="table-info-constraints">{constraints}</div>
    ) : null
  }

  return (
    <>
      <style>
        {`
          .table-info-container {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            overflow: hidden;
          }

          .table-info-header {
            display: flex;
            align-items: center;
            padding: 16px 20px;
            cursor: pointer;
            user-select: none;
            background: #fafafa;
            border-bottom: 1px solid #e5e5e5;
          }

          .table-info-header:hover {
            background: #f5f5f5;
          }

          .table-info-chevron {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            margin-right: 12px;
            transition: transform 0.2s ease;
          }

          .table-info-chevron.expanded {
            transform: rotate(90deg);
          }

          .table-info-name {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin-right: 12px;
          }

          .table-info-row-count {
            font-size: 14px;
            color: #666666;
          }

          .table-info-columns {
            padding: 0;
          }

          .table-info-column-row {
            display: flex;
            align-items: center;
            padding: 14px 20px;
            border-bottom: 1px solid #f0f0f0;
          }

          .table-info-column-row:last-child {
            border-bottom: none;
          }

          .table-info-column-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            margin-right: 12px;
          }

          .table-info-column-name {
            flex: 0 0 200px;
            font-size: 15px;
            color: #1a1a1a;
          }

          .table-info-column-type {
            flex: 0 0 200px;
            font-size: 15px;
            color: #666666;
            margin-right: 20px;
          }

          .table-info-constraints {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
          }

        `}
      </style>
      <div className="table-info-container">
        <div className="table-info-header" onClick={toggleExpanded}>
          <div className={`table-info-chevron ${isExpanded ? 'expanded' : ''}`}>
            <MdChevronRight size={20} color="#666666" />
          </div>
          <span className="table-info-name">{table.name}</span>
          <span className="table-info-row-count">{table.rowCount.toLocaleString()} rows</span>
        </div>

        {isExpanded && (
          <div className="table-info-columns">
            {table.columns.map((column) => (
              <div key={column.name} className="table-info-column-row">
                <div className="table-info-column-icon">
                  {column.isPrimaryKey && <FaKey size={20} color="#1a1a1a" />}
                  {column.isForeignKey && !column.isPrimaryKey && (
                    <FaLink size={20} color="#1a1a1a" />
                  )}
                </div>
                <div className="table-info-column-name">{column.name}</div>
                <div className="table-info-column-type">{column.type}</div>
                {renderConstraints(column)}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default TableInfo
